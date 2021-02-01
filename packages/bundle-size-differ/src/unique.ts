const areUnique = (elements: string[]): boolean =>
  elements.length === new Set(elements).size;

const getDuplicates = (elements: string[]): string[] =>
  [...new Set(elements)].filter(
    (unique) => elements.indexOf(unique) !== elements.lastIndexOf(unique)
  );

export { areUnique, getDuplicates };
