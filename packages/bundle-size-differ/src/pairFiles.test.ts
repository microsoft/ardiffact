import { FilePair, pairFiles } from "./pairFiles";

test("getFilePairs", () => {
  const pathsA = ["a/stat_1.json", "a/stat_2.json", "a/stat_3.json"];
  const pathsB = ["b/stat_1.json", "b/stat_3.json"];
  const pairs = pairFiles(pathsA, pathsB);

  const expected: FilePair[] = [
    {
      name: "stat_1.json",
      baseline: "a/stat_1.json",
      candidate: "b/stat_1.json",
    },
    {
      name: "stat_2.json",
      baseline: "a/stat_2.json",
    },
    {
      name: "stat_3.json",
      baseline: "a/stat_3.json",
      candidate: "b/stat_3.json",
    },
  ];
  expect(pairs).toEqual(expect.arrayContaining(expected));
});
