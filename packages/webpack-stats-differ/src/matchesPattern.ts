import { isMatch } from "matcher";

export const matchesPattern = (
  filter: string | string[] | undefined,
  input: string
) => (filter ? isMatch(input, filter) : true);

export const hashRegex = /^.*[\/]|([_.][a-z0-9]{20})(?:\b)/g;
