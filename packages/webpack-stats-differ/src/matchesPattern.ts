import { isMatch } from "matcher";

export const matchesPattern = (
  filter: string | string[] | undefined,
  input: string
) => (filter ? isMatch(input, filter) : true);

export const suiteUxAssetNameRegex = /suiteux\.shell\.([\w\d\-\_]*)\.?[\w\d]*\.js$/i;