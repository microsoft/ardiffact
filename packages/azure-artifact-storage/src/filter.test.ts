import { matchFilter } from "./filter";

test("filter artifacts", () => {
  const artifacts = [
    "path/to/BundleStats/foo_bundle-stats.json",
    "path/to/BundleStats/bar_bundle-stats.json",
    "path/to/BundleStats/baz_default_bundle-stats.json",
  ];

  const filter = "**/bar_bundle-stats.json";
  expect(matchFilter(filter, artifacts)).toStrictEqual([
    "path/to/BundleStats/bar_bundle-stats.json",
  ]);
});

test("filter artifacts negation", () => {
  const artifacts = [
    "path/to/BundleStats/foo_bundle-stats.json",
    "path/to/BundleStats/bar_bundle-stats.json",
    "path/to/BundleStats/baz_default_bundle-stats.json",
  ];

  const filter = ["**", "!**/bar_bundle-stats.json"];
  expect(matchFilter(filter, artifacts)).toStrictEqual([
    "path/to/BundleStats/foo_bundle-stats.json",
    "path/to/BundleStats/baz_default_bundle-stats.json",
  ]);
});
