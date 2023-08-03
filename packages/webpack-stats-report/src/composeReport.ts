import { FileDiffResults } from "@microsoft/webpack-stats-differ";
import { createDetailedReport, createNoChangeReport } from "./createReport";
import { createReportData } from "./createReportData";

/**
 * Generates a bundle size report from webpack bundle stats diff
 * @param bundleStatsResults - Diff results created by {@link @microsoft/webpack-stats-differ#FileDiffResults} object
 * @param minimumIncrease - number indicating the smallest increase in bytes that must be reported
 * @returns markdown report
 */
export function createReport(bundleStatsResults: FileDiffResults, minimumIncrease: number = 0, atMentionThreshold: number = 0): string {
  return ["## Bundle size report"]
      .concat(createTheReports(bundleStatsResults, minimumIncrease, atMentionThreshold))
    .join("\n\n");
}

const createTheReports = (bundleStatsResults: FileDiffResults, minimumIncrease: number, atMentionThreshold: number): string[] => {
  const reportDataWithDifference = bundleStatsResults.withDifferences.map(
    createReportData
  );
  const reportDataNewFiles = bundleStatsResults.newFiles.map(createReportData);

  const withDifferences: string[] = [
    ...reportDataWithDifference.filter((row) => row.totalDiff !== 0),
    ...reportDataNewFiles.filter((row) => row.totalDiff !== 0),
  ].map(data => createDetailedReport(data, minimumIncrease, atMentionThreshold));

  const withoutDifference: string = createNoChangeReport([
    ...reportDataWithDifference.filter((row) => row.totalDiff === 0),
    ...reportDataNewFiles.filter((row) => row.totalDiff === 0),
  ]);

  return [...withDifferences, withoutDifference];
};
