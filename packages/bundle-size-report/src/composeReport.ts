import { FileDiffResults } from "@ardiffact/bundle-size-differ";
import { createDetailedReport, createNoChangeReport } from "./createReport";
import { createReportData } from "./createReportData";

/**
 *
 * @param bundleStatsResults - Diff results created by {@link @ardiffact/bundle-size-differ#FileDiffResults} object
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
