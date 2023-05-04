import { Stats } from "webpack";
import { WebpackAssetStat } from "./diffAssets";
import * as upath from "upath";

export type Asset = Exclude<Stats.ToJsonOutput["assets"], undefined>[number];

export const getFriendlyAsset = (
  asset: WebpackAssetStat
): WebpackAssetStat => ({
  ...asset,
  name: getFriendlyAssetName(asset),
});

/** Returns a readable name of the asset
 *
 * @param asset - webpack stats asset
 * @public
 */
export function getFriendlyAssetName(
  asset: Pick<Asset, "name" | "chunkNames" | "chunks">
): string {
  // First try removing the hash manually from the file name.
  const name = asset.name;
  const modifiedFileName = cleanFileName(name);
  if (modifiedFileName !== name) {
    return modifiedFileName;
  }

  // Try using the chunk names from the asset data instead.
  if (asset.chunkNames?.length) {
    return asset.chunkNames.join("+");
  } else if (asset.chunks?.length) {
    return asset.chunks.map((id) => id + "").join("+");
  }

  return name;
}

const removeHashFromName = (name: string): string => {
  return name.replace(/([_.][a-z0-9]{20})(?:\b)/, "");
};

const cleanFileName = (name: string): string => {
  const fileParts = upath.parse(name);
  const baseName = fileParts.name;
  return removeHashFromName(baseName) + fileParts.ext;
};