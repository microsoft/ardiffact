import { isMainThread, parentPort } from "worker_threads";
import type {
  FileDiffResultWithComparisonToolUrl,
  FileDiffResult,
  FileToDiffDescriptor,
  WebpackStatsJson,
} from "./diffAssets";
import { diffAssets } from "./diffAssets";
import { FilePair } from "./pairFiles";
import { customJsonParser } from "./customJsonParser";

const getWebpackStatJSON = async (
  filePath: string
): Promise<WebpackStatsJson> => {
  try {
    const parsed: WebpackStatsJson = (customJsonParser(
      filePath
    ) as unknown) as WebpackStatsJson;
    return parsed;
  } catch (e: unknown) {
    throw new Error(`Cannot parse webpack state file ${filePath}: ${e}`);
  }
};

export type GetFileDiffOptions = {
  pair: FilePair | null;
  filter?: string | string[];
};

export type GenerateDiffAsyncResult =
  | {
      type: "changed";
      result: FileDiffResultWithComparisonToolUrl;
    }
  | {
      type: "added";
      result: FileDiffResult;
    }
  | {
      type: "removed";
      result: FileToDiffDescriptor;
    }
  | {
      type: "error";
      result: string;
    };

export const getFileDiffResult = async ({
  pair,
  filter,
}: GetFileDiffOptions): Promise<GenerateDiffAsyncResult> => {
  if (!pair) {
    return {
      type: "error",
      result: "baseline and candidate not found",
    };
  }
  if (pair.baseline && pair.candidate) {
    try {
      const [parsedBase, parsedCandidate] = await Promise.all(
        [pair.baseline, pair.candidate].map(getWebpackStatJSON)
      );
      const diffResult = diffAssets(parsedBase, parsedCandidate, filter);
      return {
        type: "changed",
        result: {
          name: pair.name,
          diffStats: diffResult,
          ownedBy: pair.ownedBy
        },
      };
    } catch (e) {
      return {
        type: "error",
        result: e && typeof e.toString === "function" ? e.toString() : "",
      };
    }
  } else if (pair.candidate) {
    const parsedFile = await getWebpackStatJSON(pair.candidate);
    return {
      type: "added",
      result: {
        name: pair.name,
        diffStats: diffAssets({ assets: [] }, parsedFile, filter),
        ownedBy: pair.ownedBy
      },
    };
  } else if (pair.baseline) {
    return {
      type: "removed",
      result: { name: pair.name, baselinePath: pair.baseline },
    };
  } else {
    return {
      type: "error",
      result: "baseline and candidate not found",
    };
  }
};

if (!isMainThread) {
  (async () => {
    return new Promise(() => {
      // No resolve in worker thread: The parent thread will postMessage and terminate the worker thread
      parentPort?.on("message", async (data: GetFileDiffOptions) => {
        const diffResult = await getFileDiffResult(data);
        parentPort?.postMessage(diffResult);
      });
    });
  })();
}
