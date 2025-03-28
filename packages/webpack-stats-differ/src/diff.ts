import {
  FileDiffResult,
  FileDiffResults,
  FileDiffResultWithComparisonToolUrl,
  FileToDiffDescriptor,
} from "./diffAssets";
import { Worker } from "worker_threads";
import { FilePair, pairFiles, pairRemoteArtifacts } from "./pairFiles";
import * as fs from "fs";
import * as os from "os";
import globby from "globby";
import { RemoteArtifact } from "@microsoft/azure-artifact-storage";
export {
  FileDiffResultWithComparisonToolUrl,
  FileDiffResults,
} from "./diffAssets";
import { generateComparisonAddress } from "./comparisonAddress";
import {
  GenerateDiffAsyncResult,
  GetFileDiffOptions,
  getFileDiffResult,
  processPairsInBatches,
} from "./generateDiffsAsync";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import { chain } from "stream-chain";
import { createReadStream } from "fs";

/**
 * Calculates the diff between two sets of bundle stats
 *
 * @param baselineDir - Directory containing webpack stat files of the baseline
 * @param candidateDir - Directory containing webpack stat files of the candidate
 * @param fileFilter - Optionally pass filter to omit certain files using {@link https://github.com/sindresorhus/globby#usage | globby} syntax
 * @param filter - Filter out certain assets for the bundle size calculation
 * @param remoteArtifactManifests - Either a path on disk to the serialized JSON manifest or the
 *                                  {@link @microsoft/azure-artifact-storage#RemoteArtifact} list manifest object itself
 * @returns The diff object
 *
 * @public
 */
export async function diff(
  baselineDir: string,
  candidateDir: string,
  fileFilter?: string | string[],
  filter?: string | string[],
  remoteArtifactManifests?: {
    baseline: string | RemoteArtifact[];
    candidate: string | RemoteArtifact[];
    hostUrl: string;
  },
  bundleStatsOwners?: Map<string, string[]> | undefined,
  useWorkers?: boolean
): Promise<FileDiffResults> {
  const [filesA, filesB] = await Promise.all(
    [baselineDir, candidateDir].map(
      async (dir) =>
        await globby(fileFilter ?? "*", {
          cwd: dir,
          absolute: true,
        })
    )
  );

  const paired = pairFiles(filesA, filesB, bundleStatsOwners);
  const diffs = await generateDiffs(paired, filter, useWorkers);
  if (remoteArtifactManifests) {
    const remoteArtifactA = instanceOfRemoteArtifact(
      remoteArtifactManifests.baseline
    )
      ? remoteArtifactManifests.baseline
      : await getRemoteArtifactsManifest(remoteArtifactManifests.baseline);

    const remoteArtifactB = instanceOfRemoteArtifact(
      remoteArtifactManifests.candidate
    )
      ? remoteArtifactManifests.candidate
      : await getRemoteArtifactsManifest(remoteArtifactManifests.candidate);
    const pairArtifacts = pairRemoteArtifacts(remoteArtifactA, remoteArtifactB);
    diffs.withDifferences = diffs.withDifferences.map((result) => {
      const pair = pairArtifacts.find((p) => p.name === result.name);
      return {
        ...result,
        comparisonToolUrl: generateComparisonAddress(
          pair?.baseline,
          pair?.candidate,
          remoteArtifactManifests.hostUrl
        ),
      };
    });
  }
  return diffs;
}

const generateDiffs = async (
  filePairs: FilePair[],
  filter?: string[] | string,
  useWorkers?: boolean
): Promise<FileDiffResults> => {
  let results: GenerateDiffAsyncResult[] = [];
  const numOfCpus = os.cpus().length;
  // Limit workers to prevent memory issues
  const numOfWorkers = useWorkers ? Math.min(8, Math.ceil(numOfCpus * 0.5)) : 1;
  const start = Date.now();
  
  if (numOfWorkers <= 1) {
    console.log(`Processing ${filePairs.length} bundle pairs in batches without workers`);
    results = await processPairsInBatches(filePairs, filter);
  } else {
    console.log(`Processing ${filePairs.length} bundle pairs in batches using ${numOfWorkers} workers`);
    
    // Split pairs into batches for each worker
    const batchesPerWorker = Math.ceil(filePairs.length / numOfWorkers);
    const workerBatches = Array.from({ length: numOfWorkers }, (_, i) => 
      filePairs.slice(i * batchesPerWorker, (i + 1) * batchesPerWorker)
    ).filter(batch => batch.length > 0);

    const diffWorker = async (workerPairs: FilePair[]) => {
      const worker = new Worker(`${__dirname}/generateDiffsAsync.js`);
      const workerResults: GenerateDiffAsyncResult[] = [];

      for (let i = 0; i < workerPairs.length; i += 10) {
        const batch = workerPairs.slice(i, i + 10);
        console.log(`Worker processing batch ${Math.floor(i/10) + 1} of ${Math.ceil(workerPairs.length/10)} (${batch.length} pairs)`);
        
        for (const pair of batch) {
          const generateDiffOptions: GetFileDiffOptions = { pair, filter };
          const result = await new Promise<GenerateDiffAsyncResult>((resolve) => {
            worker.once("message", (result: GenerateDiffAsyncResult) => {
              resolve(result);
            });
            worker.postMessage(generateDiffOptions);
          });
          workerResults.push(result);
        }
        
        // Small delay between batches to allow for GC
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      worker.terminate();
      return workerResults;
    };

    const workerResults = await Promise.all(workerBatches.map(diffWorker));
    results = workerResults.flat();
  }
  
  console.log(`Diffing done in ${Date.now() - start} ms`);
  return {
    withDifferences: results
      .filter((pairResult) => pairResult.type === "changed")
      .map(
        (pairResult) => pairResult.result as FileDiffResultWithComparisonToolUrl
      ),
    newFiles: results
      .filter((pairResult) => pairResult.type === "added")
      .map((pairResult) => pairResult.result as FileDiffResult),
    removedFiles: results
      .filter((pairResult) => pairResult.type === "removed")
      .map((pairResult) => pairResult.result as FileToDiffDescriptor),
  };
};

const getRemoteArtifactsManifest = async (
  filePath: string
): Promise<RemoteArtifact[]> => {
  return new Promise((resolve, reject) => {
    const artifacts: RemoteArtifact[] = [];
    const pipeline = chain([
      createReadStream(filePath, { encoding: "utf8" }),
      parser(),
      streamArray(),
    ]);

    pipeline.on("data", (data) => {
      artifacts.push(data.value);
    });

    pipeline.on("end", () => {
      resolve(artifacts);
    });

    pipeline.on("error", (err) => {
      reject(
        new Error(`Cannot parse remote artifact manifest ${filePath}: ${err}`)
      );
    });
  });
};

const instanceOfRemoteArtifact = (obj: any): obj is RemoteArtifact[] =>
  Array.isArray(obj) && obj.every((elem) => "name" in elem && "url" in elem);
