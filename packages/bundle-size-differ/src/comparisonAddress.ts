const { getComparisonAddress } = require("@mixer/webpack-bundle-compare");

const generateComparisonAddress = (
  baselineUrl?: string,
  candidateUrl?: string,
  hostUrl?: string
): string | undefined =>
  candidateUrl && baselineUrl && hostUrl
    ? getComparisonAddress([baselineUrl, candidateUrl], hostUrl)
    : undefined;

export { generateComparisonAddress };
