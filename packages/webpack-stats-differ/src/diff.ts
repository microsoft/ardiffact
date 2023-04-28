import {
  diffAssets,
  FileDiffResult,
  FileDiffResults,
  FileToDiffDescriptor,
  WebpackStatsJson,
} from "./diffAssets";
import { FilePair, pairFiles, pairRemoteArtifacts } from "./pairFiles";
import * as fs from "fs";
import globby from "globby";
import { RemoteArtifact } from "@microsoft/azure-artifact-storage";
export {
  FileDiffResultWithComparisonToolUrl,
  FileDiffResults,
} from "./diffAssets";
import { generateComparisonAddress } from "./comparisonAddress";
import { customJsonParser } from "./customJsonParser";

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
  }
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
  const diffs = await generateDiffs(paired, filter);
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
  filter?: string[] | string
): Promise<FileDiffResults> => {
  const withDiffs: {
    base: string;
    candidate: string;
    name: string;
  }[] = new Array<{ base: string; candidate: string; name: string }>();
  const removedFiles: { removed: string; name: string }[] = new Array<{
    removed: string;
    name: string;
  }>();
  const newFiles: { newFile: string; name: string }[] = new Array<{
    newFile: string;
    name: string;
  }>();
  filePairs.forEach((pair) => {
    if (pair.baseline && pair.candidate) {
      withDiffs.push({
        base: pair.baseline,
        candidate: pair.candidate,
        name: pair.name,
      });
    } else if (pair.candidate) {
      newFiles.push({ newFile: pair.candidate, name: pair.name });
    } else if (pair.baseline) {
      removedFiles.push({ removed: pair.baseline, name: pair.name });
    }
  });
  const diffs = new Array<FileDiffResult>();
  for (const wd of withDiffs) {
    try {
      const [parsedBase, parsedCandidate] = await Promise.all(
        [wd.base, wd.candidate].map(getWebpackStatJSON)
      );
      diffs.push({
        diffStats: diffAssets(parsedBase, parsedCandidate, filter),
        name: wd.name,
      });
    } catch (e: unknown) {
      console.log(e);
    }
  }
  const added = new Array<FileDiffResult>();
  for (const nw of newFiles) {
    try {
      const parsedFile = await getWebpackStatJSON(nw.newFile);
      added.push({
        diffStats: diffAssets({ assets: [] }, parsedFile, filter),
        name: nw.name,
      });
    } catch (e: unknown) {
      console.log(e);
    }
  }
  const removed = removedFiles.map(
    (f): FileToDiffDescriptor => ({ name: f.name, baselinePath: f.removed })
  );
  return {
    withDifferences: diffs,
    removedFiles: removed,
    newFiles: added,
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

const getWebpackStatJSON = async (
  filePath: string
): Promise<WebpackStatsJson> => {
  try {
    const parsed: WebpackStatsJson = customJsonParser(filePath) as unknown as WebpackStatsJson;
    return parsed;
  } catch (e: unknown) {
    throw new Error(`Cannot parse webpack state file ${filePath}: ${e}`);
  }
};

const instanceOfRemoteArtifact = (obj: any): obj is RemoteArtifact[] =>
  Array.isArray(obj) && obj.every((elem) => "name" in elem && "url" in elem);
