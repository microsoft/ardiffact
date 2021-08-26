import { FileDiffResults } from "@microsoft/webpack-stats-differ";
import { createDetailedReport, createNoChangeReport } from "./createReport";
import { createReportData } from "./createReportData";

/**
<<<<<<< HEAD:packages/bundle-size-report/src/composeReport.ts
 * Generates a bundle size report from webpack bundle stats diff
 * @param bundleStatsResults - Diff results created by {@link @ardiffact/bundle-size-differ#FileDiffResults} object
 * @param minimumIncrease - number indicating the smallest increase in bytes that must be reported
=======
 *
 * @param bundleStatsResults - Diff results created by {@link @microsoft/webpack-stats-differ#FileDiffResults} object
>>>>>>> d19b976 (change package names and scopes):packages/webpack-stats-report/src/composeReport.ts
 * @returns markdown report
 */
export function createReport(bundleStatsResults: FileDiffResults, minimumIncrease: number = 0): string {
  return ["## Bundle size report"]
      .concat(createTheReports(bundleStatsResults, minimumIncrease))
    .join("\n\n");
}

const createTheReports = (bundleStatsResults: FileDiffResults, minimumIncrease: number): string[] => {
  const reportDataWithDifference = bundleStatsResults.withDifferences.map(
    createReportData
  );
  const reportDataNewFiles = bundleStatsResults.newFiles.map(createReportData);

  const withDifferences: string[] = [
    ...reportDataWithDifference.filter((row) => row.totalDiff !== 0),
    ...reportDataNewFiles.filter((row) => row.totalDiff !== 0),
  ].map(data => createDetailedReport(data, minimumIncrease));

  const withoutDifference: string = createNoChangeReport([
    ...reportDataWithDifference.filter((row) => row.totalDiff === 0),
    ...reportDataNewFiles.filter((row) => row.totalDiff === 0),
  ]);

  return [...withDifferences, withoutDifference];
};
