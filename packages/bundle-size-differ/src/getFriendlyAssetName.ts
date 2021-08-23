import { identity } from "lodash/fp";
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
  const nameWithoutHash = removeHashFromName(name);
  if (nameWithoutHash !== name) {
    return nameWithoutHash;
  }

  // Try using the chunk names from the asset data instead.
  if (asset.chunkNames?.length) {
    return asset.chunkNames.join("+");
  } else if (asset.chunks?.length) {
    return asset.chunks.map((id) => id + "").join("+");
  }

  return name;
}

const hashRegex = /_([a-z0-9]{20})/;

// TODO(mapol): We need a better way to identify a hash inside a filename
// TODO(mapol): We need to make this function take into account the folder name. Once we do that we can remove the `ignoreDelveStringsFiles` function.
export const removeHashFromName = (name: string): string => {
  const fileParts = upath.parse(name);
  // We could have filenames like .d.ts or .js.map
  const splitBySecondDotPart = fileParts.name.split(".");
  const firstNamePart = splitBySecondDotPart[0];
  const secondDotPart = splitBySecondDotPart[1];
  // Remove hash
  const otherParts = firstNamePart.split("_");

  if (
    otherParts.length === 1 ||
    otherParts[otherParts.length - 1].length !== 20
  ) {
    // Search uses a hash in the secondDotPart e.g. search_init.min_7ba0dc2ea2246e82e8a5.js

    return (
      [
        otherParts.join("_"),
        secondDotPart && secondDotPart.replace(hashRegex, ""),
      ]
        .filter(identity)
        .join(".") + fileParts.ext
    );
  }

  return (
    [otherParts.slice(0, -1).join("_"), secondDotPart]
      .filter(identity)
      .join(".") + fileParts.ext
  );
};
