module.exports = {
  pipeline: {
    build: ["^build"],
    test: ["build"],
    lint: [],
    docs: ["build"],
  },
  npmClient: "yarn",
  cacheOptions: {
    environmentGlob: ["tsconfig.base.json"],
  },
};
