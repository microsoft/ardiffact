import { mkdirSync, writeFileSync } from "fs";
import * as path from "path";
import { performance } from "perf_hooks";
import type { Compiler, Stats, StatsModule } from "webpack";
import { gzipSync } from "zlib";

function filter<T extends object, F extends keyof T>(
  o: T,
  filter: readonly F[]
): Pick<T, F> {
  const result = {} as Partial<T>;
  filter.forEach((p) => {
    result[p] = o[p];
  });
  return result as Pick<T, F>;
}

export class BundleStatsPlugin {
  constructor(
    private appId: string,
    private outputFolder: string = "./",
    private variant: string = "default"
  ) {}
  public apply(compiler: Compiler): void {
    // compiler.hooks.afterCompile.tap(
    compiler.hooks.done.tap(
      "BundleStatsPlugin",
      // Constuct file paths for folder and file
      (stats: Stats) => {
        const start = performance.now();
        const bundleStatsFolder = path.join(
          compiler.outputPath,
          this.outputFolder,
          "bundle-stats"
        );
        const file = path.join(
          bundleStatsFolder,
          `${this.appId}_${this.variant}_bundle-stats.json`
        );
        mkdirSync(bundleStatsFolder, { recursive: true });

        const statsFilter = [
          "assets",
          "chunks",
          "modules",
          "errors",
          "warnings",
          "time",
          "builtAt",
          "outputPath",
        ] as const;

        const assetsFilter = ["name", "size", "chunks", "chunkNames"] as const;

        // modules are used by mixer 
        const modulesFilter = [
          "identifier", // Used by mixer
          "name", // Used by mixer. The names can probably be trimmed to serialize less data?
          "size", // Used by mixer
          "modules", // Used by mixer
          "issuerPath", // Used by mixer
          "id", // Used by mixer
          "chunks", // Used by mixer
          "reasons", // Used by mixer
          "usedExports", // Used by mixer
        ] as const;

        // issuers are used by mixer
        const issuersFilter = ["name"] as const;

        // reasons are used by mixer
        const reasonsFilter = [
          "type",
          "module",
          "moduleName",
          "userRequest",
          "loc",
        ] as const;

        // chunks are used by mixer
        const chunksFilter = [
          "entry",
          "size",
          "names",
          "id",
          "parents",
        ] as const;

        // We can pass speed up this code by passing some filters to .toJson()
        // object but we have to be careful that it does not impact the data that
        // we export.
        const toJsonOutput = stats.toJson({});

        const filteredStats = filter(toJsonOutput, statsFilter);

        function filterModule(module: StatsModule): any {
          const mod = filter(module, modulesFilter);
          const result = {
            ...mod,
            issuerPath: mod.issuerPath?.map((i) => filter(i, issuersFilter)),
            reasons: mod.reasons?.map((i) => filter(i, reasonsFilter)),
            modules: mod.modules?.map(filterModule),
          };
          return result;
        }
        const data = {
          ...filteredStats,
          assets: filteredStats.assets?.map((a) => filter(a, assetsFilter)),
          modules: filteredStats.modules?.map(filterModule),
          chunks: filteredStats.chunks?.map((a) => filter(a, chunksFilter)),
        };

        const serialized = JSON.stringify(data);
        const compressed = gzipSync(serialized);

        writeFileSync(path.resolve(compiler.outputPath, file), compressed);

        const end = performance.now();
        const duration = Math.round(end - start);
        console.log(`Webpack bundle stats plugin took ${duration} ms`);
      }
    );
  }
}