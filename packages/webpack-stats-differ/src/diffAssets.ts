import { Stats as WebpackStats } from "webpack";
import { areUnique, getDuplicates } from "./unique";
import { getFriendlyAsset } from "./getFriendlyAssetName";
import { matchesPattern } from "./matchesPattern";

const SIGNIFICANT_CHANGE_THRESHOLD: 30 = 30;

export type FileDiffResults = {
  withDifferences: FileDiffResultWithComparisonToolUrl[];
  newFiles: FileDiffResult[];
  // TODO(mapol): Probably needs some more stats?
  removedFiles: FileToDiffDescriptor[];
};

export interface FileToDiffDescriptor {
  name: string;
  baselinePath: string;
}

export interface FileDiffResult {
  name: string;
  diffStats: DiffStats;
  ownedBy?: string[];
}

export type FileDiffResultWithComparisonToolUrl = FileDiffResult & {
  comparisonToolUrl?: string;
};

export interface DiffStats {
  isChanged: boolean;
  newAssets: AssetStats[];
  removedAssets: AssetStats[];
  changedStats: ChangedStats;
  unchangedStats: AssetStats[];
}

interface ChangedStats {
  increased: AssetStats[];
  decreased: AssetStats[];
}

interface AssetStats {
  assetName: string;
  candidateAssetSize: number;
  baselineAssetSize: number;
  isSizeReduction: boolean;
  isSizeIncrease: boolean;
  isRemoved: boolean;
  isAdded: boolean;
  sizeDiff: number;
}
type WebpackAssetStats = Exclude<
  WebpackStats.ToJsonOutput["assets"],
  undefined
>;

export type WebpackAssetStat = WebpackAssetStats[0];
export type WebpackStatsJson = WebpackStats.ToJsonOutput;

export const diffAssets = (
  a: Pick<WebpackStatsJson, "assets">,
  b: Pick<WebpackStatsJson, "assets">,
  filter?: string | string[]
): DiffStats =>
  diffWebpackAssetCollections(a.assets ?? [], b.assets ?? [], filter);

const diffWebpackAssetCollections = (
  a: WebpackAssetStats,
  b: WebpackAssetStats,
  filter?: string | string[]
): DiffStats => {
  const [filteredA, filteredB] = [a, b].map((assets) =>
    assets
      .filter((asset) => matchesPattern(filter, asset.name))
      .map(transformAsset)
  );

  const [aNames, bNames] = [filteredA, filteredB].map((assets) =>
    assets.map((asset) => asset.name)
  );

  if (!(areUnique(aNames) && areUnique(bNames))) {
    const [dupA, dupB] = [aNames, bNames].map(getDuplicates);
    throw new Error(
      `\nDuplicate names in a: ${dupA}\nDuplicate names in b: ${dupB}`
    );
  }

  const pairs = pairUpAssetsByName(filteredA, filteredB);

  const assetDiff = pairs.map(diffWebpackAssets);
  const changedAssets = assetDiff.filter(
    (asset) => !asset.isAdded && !asset.isRemoved
  );
  const newAssetsStats = assetDiff.filter((asset) => asset.isAdded);
  const removedAssetsStats = assetDiff.filter((asset) => asset.isRemoved);
  const changedAssetsStats = {
    increased: changedAssets.filter((asset) => asset.isSizeIncrease),
    decreased: changedAssets.filter((asset) => asset.isSizeReduction),
  };
  const unchangedAssetsSets = changedAssets.filter(
    (asset) => asset.sizeDiff === 0
  );

  return {
    isChanged: !Boolean(
      newAssetsStats.length === 0 &&
        removedAssetsStats.length === 0 &&
        changedAssetsStats.increased.length === 0 &&
        changedAssetsStats.decreased.length === 0
    ),
    newAssets: newAssetsStats,
    removedAssets: removedAssetsStats,
    changedStats: changedAssetsStats,
    unchangedStats: unchangedAssetsSets,
  };
};

type Paired = {
  name: string;
  a?: WebpackAssetStat;
  b?: WebpackAssetStat;
};

const diffWebpackAssets = ({ name, a, b }: Paired): AssetStats => {
  const sizeA = a?.size ?? 0;
  const sizeB = b?.size ?? 0;
  const sizeDiff = sizeB - sizeA;
  const isSizeReduction = sizeDiff < 0;
  const isSizeIncrease = sizeDiff > 0;
  const isAssetRemoved = sizeB === 0;
  const isAssetAdded = sizeA === 0;
  return isSignificantDifference(sizeDiff)
    ? {
        assetName: name,
        sizeDiff,
        candidateAssetSize: sizeB,
        baselineAssetSize: sizeA,
        isSizeIncrease,
        isSizeReduction,
        isAdded: isAssetAdded,
        isRemoved: isAssetRemoved,
      }
    : {
        assetName: name,
        sizeDiff: 0,
        candidateAssetSize: sizeB,
        baselineAssetSize: sizeA,
        isSizeIncrease: false,
        isSizeReduction: false,
        isAdded: isAssetAdded,
        isRemoved: isAssetRemoved,
      };
};

const pairUpAssetsByName = (
  a: WebpackAssetStats,
  b: WebpackAssetStats
): Paired[] => {
  const [aMap, bMap] = [a, b].map(
    (assets) => new Map(assets.map((asset) => [asset.name, asset]))
  );
  const allNames = [
    ...new Set(a.map((x) => x.name).concat(b.map((x) => x.name))),
  ];
  return allNames.map((name) => ({
    name,
    a: aMap.get(name),
    b: bMap.get(name),
  }));
};

const transformAsset: (
  stat: WebpackAssetStat
) => WebpackAssetStat = getFriendlyAsset;

const isSignificantDifference = (sizeDiff: number) =>
  Math.abs(sizeDiff) > SIGNIFICANT_CHANGE_THRESHOLD;
