import { concat } from "lodash";
import { FileDiffResultWithComparisonToolUrl } from "@ardiffact/bundle-size-differ";
import { compose, filter, first, identity, join, tail } from "lodash/fp";
import * as path from "path";

export interface ReportData {
  name: string;
  totalDiff: number;
  totalSize: number;
  assets: ReportAssetData[];
  comparisonToolUrl?: string;
}

export interface ReportAssetData {
  name: string;
  size: number;
  diff: number;
  isIncrease: boolean;
  isReduction: boolean;
  isAdded: boolean;
  isRemoved: boolean;
}

export const createReportData = ({
  name,
  diffStats,
  comparisonToolUrl,
}: FileDiffResultWithComparisonToolUrl): ReportData => {
  const largestDiffFirst = (a: { diff: number }, b: { diff: number }) =>
    b.diff - a.diff;

  const added = diffStats.newAssets
    .map((asset) => ({
      name: asset.assetName,
      size: asset.candidateAssetSize,
      diff: asset.sizeDiff,
      isIncrease: asset.isSizeIncrease,
      isReduction: asset.isSizeReduction,
      isAdded: true,
      isRemoved: false,
    }))
    .sort(largestDiffFirst);

  const changed = concat(
    diffStats.changedStats.increased,
    diffStats.changedStats.decreased
  )
    .map((asset) => ({
      name: asset.assetName,
      size: asset.candidateAssetSize,
      diff: asset.sizeDiff,
      isIncrease: asset.isSizeIncrease,
      isReduction: asset.isSizeReduction,
      isAdded: false,
      isRemoved: false,
    }))
    .sort(largestDiffFirst);

  const removed = diffStats.removedAssets
    .map((asset) => ({
      name: asset.assetName,
      size: asset.candidateAssetSize,
      diff: asset.sizeDiff,
      isIncrease: asset.isSizeIncrease,
      isReduction: asset.isSizeReduction,
      isAdded: false,
      isRemoved: true,
    }))
    .sort(largestDiffFirst);

  const unchanged = diffStats.unchangedStats.map((asset) => ({
    size: asset.candidateAssetSize,
    diff: asset.sizeDiff,
  }));

  const assets = concat(added, changed, removed);

  return {
    name: getAppName(name),
    assets,
    totalDiff: assets.reduce(
      (totalDiff, asset) => (totalDiff += asset.diff),
      0
    ),
    totalSize: unchanged
      .concat(assets)
      .reduce((totalSize, asset) => (totalSize += asset.size), 0),
    comparisonToolUrl,
  };
};

function uppercaseFirst(appName: string): string {
  const firstChar = first(appName);
  const allOthers = join("", tail(appName));
  return join("", [(firstChar || "").toLocaleUpperCase(), allOthers]);
}

/**
 *
 * @param filePath - path to webpack bundle stats file
 * @internal
 */
export function getAppName(filePath: string): string {
  const fileName = path.parse(filePath).name;
  const [appName, variant] = fileName.split("_");
  const variantToShow = variant !== "default" ? `(${variant})` : undefined;
  const joinWords = compose(join(" "), filter(identity));

  return joinWords([uppercaseFirst(appName), variantToShow]);
}
