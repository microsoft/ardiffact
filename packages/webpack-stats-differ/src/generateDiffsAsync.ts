import { isMainThread, parentPort } from "worker_threads";
import type {
  FileDiffResultWithComparisonToolUrl,
  FileDiffResult,
  FileToDiffDescriptor,
  WebpackStatsJson,
} from "./diffAssets";
import { diffAssets } from "./diffAssets";
import { FilePair } from "./pairFiles";
import * as fs from "fs";
import { createReadStream } from "fs";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamObject } from "stream-json/streamers/StreamObject";

export const getWebpackStatJSON = async (
  filePath: string
): Promise<WebpackStatsJson> => {
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch (e) {
    throw new Error(`Cannot access webpack stats file at ${filePath}: ${e}`);
  }

  // Always use streaming approach for webpack stats files since they can be very large
  return new Promise<WebpackStatsJson>((resolve, reject) => {
    const result: WebpackStatsJson = {} as WebpackStatsJson;

    const pipeline = chain([
      createReadStream(filePath, { encoding: "utf8" }),
      parser(),
      streamObject(),
    ]);

    pipeline.on("data", ({ key, value }) => {
      result[key] = value;
    });

    pipeline.on("end", () => {
      resolve(result);
    });

    pipeline.on("error", (err) => {
      reject(
        new Error(`Error streaming webpack stats file ${filePath}: ${err}`)
      );
    });
  });
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
          ownedBy: pair.ownedBy,
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
        ownedBy: pair.ownedBy,
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

// Add batch processing utilities
const BATCH_SIZE = 10; // Process 10 pairs at a time
const MAX_WORKERS = 8; // Limit number of workers to prevent memory issues

export const processBatch = async (
  pairs: FilePair[],
  filter?: string | string[]
): Promise<GenerateDiffAsyncResult[]> => {
  const results: GenerateDiffAsyncResult[] = [];
  for (const pair of pairs) {
    const result = await getFileDiffResult({ pair, filter });
    results.push(result);
  }
  return results;
};

export const processPairsInBatches = async (
  pairs: FilePair[],
  filter?: string | string[]
): Promise<GenerateDiffAsyncResult[]> => {
  const results: GenerateDiffAsyncResult[] = [];
  
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(pairs.length/BATCH_SIZE)} (${batch.length} pairs)`);
    const batchResults = await processBatch(batch, filter);
    results.push(...batchResults);
    
    // Force garbage collection between batches if available
    if (global.gc) {
      global.gc();
    }
  }
  
  return results;
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
