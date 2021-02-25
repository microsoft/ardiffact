module.exports = {
  pipeline: {
    build: ["^build"],
    test: ["build"],
    lint: [],
  },
  npmClient: "yarn",
  cacheOptions: {
    environmentGlob: ["tsconfig.base.json"],
  },
};
