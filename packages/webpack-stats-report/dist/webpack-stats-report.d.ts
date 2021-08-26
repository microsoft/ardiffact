/**
 * A library for generating a markdown report for a bundle stats diff
 * @packageDocumentation
 */

import { FileDiffResults } from '@microsoft/webpack-stats-differ';

/**
 *
 * @param bundleStatsResults - Diff results created by {@link @microsoft/webpack-stats-differ#FileDiffResults} object
 * @returns markdown report
 */
export declare function createReport(bundleStatsResults: FileDiffResults, minimumIncrease?: number): string;

/**
 *
 * @param filePath - path to webpack bundle stats file
 * @internal
 */
export declare function getAppName(filePath: string): string;

export { }
