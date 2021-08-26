import { getFriendlyAssetName } from "./getFriendlyAssetName";

test("getFriendlyAssetName with no chunks", () => {
  const asset = {
    name: "index.d.ts",
    chunks: [],
    chunkNames: [],
  };

  const friendlyAssetName = getFriendlyAssetName(asset);
  expect(friendlyAssetName).toBe("index.d.ts");

  // tslint:disable-next-line: no-any
  const asset2: any = {
    name: "foo.js",
  };
  expect(getFriendlyAssetName(asset2)).toBe("foo.js");
});
