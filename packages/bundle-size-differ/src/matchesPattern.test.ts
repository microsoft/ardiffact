import { matchesPattern } from "./matchesPattern";

test("test filter", () => {
  const names = ["bar.map", "bar.d.ts", "bar.js"];
  const filter = ["*", "!*.map", "!*.d.ts"];

  const matchResults = names.map((name) => matchesPattern(filter, name));
  expect(matchResults).toEqual([false, false, true]);
});
