import * as fs from "fs";
import { basename } from "path";
import { RemoteArtifact } from "@microsoft/azure-artifact-storage";
export const getFileNames = (dirPath: string) => fs.promises.readdir(dirPath);

export const pairFiles = (pathsA: string[], pathsB: string[]): FilePair[] => {
  const [aMap, bMap] = [pathsA, pathsB].map(
    (paths) => new Map(paths.map((p) => [basename(p), p]))
  );
  const allFilesNames = [
    ...new Set(pathsA.concat(pathsB).map((p) => basename(p))),
  ];
  return allFilesNames.map(
    (name): FilePair => ({ name, baseline: aMap.get(name), candidate: bMap.get(name) })
  );
};

export const pairRemoteArtifacts = (
  a: RemoteArtifact[],
  b: RemoteArtifact[]
): FilePair[] => {
  const [aMap, bMap] = [a, b].map(
    (ra) => new Map(ra.map((p) => [basename(p.name), p.url]))
  );
  const allFilesNames = [...new Set(a.concat(b).map((p) => basename(p.name)))];
  return allFilesNames.map(
    (name): FilePair => ({ name, baseline: aMap.get(name), candidate: bMap.get(name) })
  );
};

type Path = string;

export type FilePair = {
  name: string;
  baseline?: Path;
  candidate?: Path;
};
