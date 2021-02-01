import multimatch from "multimatch";

export const matchFilter = (
  filter: string | string[] | undefined,
  artifacts: string[]
): string[] => (filter ? multimatch(artifacts, filter) : artifacts);
