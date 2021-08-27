# webpack-stats-report
A library for generating a markdown report for a bundle stats diff.

## Installation
Using npm:
```sh
npm install @microsoft/webpack-stats-report
```
Using Yarn:
```sh
yarn add @microsoft/webpack-stats-report
```

## Usage
```typescript
import { createReport, getAppName } from "@microsoft/webpack-stats-report";
import { diff } from "@microsoft/webpack-stats-differ";
import * as path from "path";
import * as fs from "fs";

const baselineDir = path.resolve('/baseline');
const candidateDir = path.resolve('/candidate');

const diffResult = await diff(baselineDirUnzipped,candidateDir);

const report = createReport(diffResult);
const appName = getAppName(path.resolve('myAwesomeApp_default.json'));
```
# API

## createReport() function

Generates a bundle size report from webpack bundle stats diff

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  bundleStatsResults | [FileDiffResults](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/webpack-stats-differ.filediffresults.md) | Diff results created by [FileDiffResults](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/webpack-stats-differ.filediffresults.md) object |
|  minimumIncrease | number | number indicating the smallest increase in bytes that must be reported |

<b>Returns:</b>

string

markdown report

## getAppName() function

Returns the app name from webpack bundle stats filepath

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  filePath | string | path to webpack bundle stats file |

<b>Returns:</b>

string

- App name from stat filepath  


# Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

# License

MIT