import { isMatch } from "matcher";

export const matchesPattern = (
  filter: string | string[] | undefined,
  input: string
) => (filter ? isMatch(input, filter) : true);
