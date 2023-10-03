# bundle-stats-webpack-plugin
A library for outputting bundle stats webpack plugin .

## Installation
Using npm:
```sh
npm install @microsoft/bundle-stats-webpack-plugin
```
Using Yarn:
```sh
yarn add @microsoft/bundle-stats-webpack-plugin
```

## Usage

```ts
import { BundleStatsPlugin } from "@microsoft/bundle-stats-webpack-plugin";

//webpack config
module.exports = {
  ...
  plugins: [
    new BundleStatsPlugin(
      "app-id-used-in-reports", // App id which is added to the bundle stats file name
      "./", // Output directory of the ${this.appId}_${this.variant}_bundle-stats.json file wrt to compilation output directory of webpack
      "bundle-variant" // Optional - Use this if your app has multiple bundle variants
    );
  ]
}
```