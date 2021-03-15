import { FileDiffResults } from "@ardiffact/bundle-size-differ";
import { createDetailedReport, createNoChangeReport } from "./createReport";
import { createReportData } from "./createReportData";

/**
 *
 * @param bundleStatsResults - Diff results created by {@link @ardiffact/bundle-size-differ#FileDiffResults} object
 * @returns markdown report
 */
export function createReport(bundleStatsResults: FileDiffResults): string {
  return ["## Bundle size report"]
    .concat(createTheReports(bundleStatsResults))
    .join("\n\n");
}

const createTheReports = (bundleStatsResults: FileDiffResults): string[] => {
  const reportDataWithDifference = bundleStatsResults.withDifferences.map(
    createReportData
  );
  const reportDataNewFiles = bundleStatsResults.newFiles.map(createReportData);

  const withDifferences: string[] = [
    ...reportDataWithDifference.filter((row) => row.totalDiff !== 0),
    ...reportDataNewFiles.filter((row) => row.totalDiff !== 0),
  ].map(createDetailedReport);

  const withoutDifference: string = createNoChangeReport([
    ...reportDataWithDifference.filter((row) => row.totalDiff === 0),
    ...reportDataNewFiles.filter((row) => row.totalDiff === 0),
  ]);

  return [...withDifferences, withoutDifference];
};
