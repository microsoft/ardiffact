/**
 * A library for generating a markdown report for a bundle stats diff
 * @packageDocumentation
 */

import { FileDiffResults } from '@microsoft/webpack-stats-differ';

/**
 * Generates a bundle size report from webpack bundle stats diff
 * @param bundleStatsResults - Diff results created by {@link @microsoft/webpack-stats-differ#FileDiffResults} object
 * @param minimumIncrease - number indicating the smallest increase in bytes that must be reported
 * @returns markdown report
 */
export declare function createReport(bundleStatsResults: FileDiffResults, minimumIncrease?: number): string;

/**
 * Returns the app name from webpack bundle stats filepath
 * @param filePath - path to webpack bundle stats file
 * @returns - App name from stat filepath
 * @public
 */
export declare function getAppName(filePath: string): string;

export { }
