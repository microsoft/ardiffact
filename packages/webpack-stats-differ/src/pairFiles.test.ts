import { FilePair, pairFiles } from "./pairFiles";

test("get file pairs", () => {
  const pathsA = ["a/stat_1.json", "a/stat_2.json", "a/stat_3.json"];
  const pathsB = ["b/stat_1.json", "b/stat_3.json"];
  const owners = {
    'stat_1.json': ['johndoe', 'janedoe'],
    'stat_3.json': ['johndoe', 'janedoe']
  };
  
  const ownersMap = new Map(Object.entries(owners));
  const pairs = pairFiles(pathsA, pathsB, ownersMap);

  const expected: FilePair[] = [
    {
      name: "stat_1.json",
      baseline: "a/stat_1.json",
      candidate: "b/stat_1.json",
      ownedBy: ['johndoe', 'janedoe']
    },
    {
      name: "stat_2.json",
      baseline: "a/stat_2.json",
      ownedBy: []
    },
    {
      name: "stat_3.json",
      baseline: "a/stat_3.json",
      candidate: "b/stat_3.json",
      ownedBy: ['johndoe', 'janedoe']
    },
  ];
  expect(pairs).toEqual(expect.arrayContaining(expected));
});
