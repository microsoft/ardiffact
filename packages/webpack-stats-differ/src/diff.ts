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
} from "./generateDiffsAsync";

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

  const paired = pairFiles(filesA, filesB);
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
  if (!useWorkers) {
    results = await Promise.all(
      filePairs.map((pair) => getFileDiffResult({ pair, filter }))
    );
  } else {
    const numOfCpus = os.cpus().length;
    const numOfWorkers = Math.ceil(numOfCpus * 0.75);
    let pairIndex = 0;
    const diffImageWorker = async () => {
      const worker = new Worker(`${__dirname}/generateDiffsAsync.js`);

      const generateDiffOptions: GetFileDiffOptions = {
        pair: null,
        filter,
      };

      while ((generateDiffOptions.pair = filePairs[pairIndex++])) {
        await new Promise((resolve) => {
          worker.once("message", (result: GenerateDiffAsyncResult) => {
            results.push(result);

            resolve(undefined);
          });

          worker.postMessage(generateDiffOptions);
        });
      }

      worker.terminate();
      return;
    };

    const buckets = new Array(numOfWorkers).fill(1);
    await Promise.all(buckets.map(diffImageWorker));
  }
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
  const data = await fs.promises.readFile(filePath, { encoding: "utf-8" });
  try {
    const parsed: RemoteArtifact[] = JSON.parse(data);
    return parsed;
  } catch (e: unknown) {
    throw new Error(`Cannot parse remote artifact manifest ${filePath}: ${e}`);
  }
};

const instanceOfRemoteArtifact = (obj: any): obj is RemoteArtifact[] =>
  Array.isArray(obj) && obj.every((elem) => "name" in elem && "url" in elem);
