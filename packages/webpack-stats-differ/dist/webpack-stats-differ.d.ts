/**
 * A library for generating a diff object between two sets of webpack bundle stat files
 * @packageDocumentation
 */

import { RemoteArtifact } from '@microsoft/azure-artifact-storage';
import { Stats } from 'webpack';

declare type Asset = Exclude<Stats.ToJsonOutput["assets"], undefined>[number];

declare interface AssetStats {
    assetName: string;
    candidateAssetSize: number;
    baselineAssetSize: number;
    isSizeReduction: boolean;
    isSizeIncrease: boolean;
    isRemoved: boolean;
    isAdded: boolean;
    sizeDiff: number;
}

declare interface ChangedStats {
    increased: AssetStats[];
    decreased: AssetStats[];
}

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
export declare function diff(baselineDir: string, candidateDir: string, fileFilter?: string | string[], filter?: string | string[], remoteArtifactManifests?: {
    baseline: string | RemoteArtifact[];
    candidate: string | RemoteArtifact[];
    hostUrl: string;
}): Promise<FileDiffResults>;

declare interface DiffStats {
    isChanged: boolean;
    newAssets: AssetStats[];
    removedAssets: AssetStats[];
    changedStats: ChangedStats;
    unchangedStats: AssetStats[];
}

declare interface FileDiffResult {
    name: string;
    diffStats: DiffStats;
}

export declare type FileDiffResults = {
    withDifferences: FileDiffResultWithComparisonToolUrl[];
    newFiles: FileDiffResult[];
    removedFiles: FileToDiffDescriptor[];
};

export declare type FileDiffResultWithComparisonToolUrl = FileDiffResult & {
    comparisonToolUrl?: string;
};

declare interface FileToDiffDescriptor {
    name: string;
    baselinePath: string;
}

/** Returns a readable name of the asset
 *
 * @param asset - webpack stats asset
 * @internal
 */
export declare function getFriendlyAssetName(asset: Pick<Asset, "name" | "chunkNames" | "chunks">): string;

export { }
