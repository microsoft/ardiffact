# webpack-stats-differ
A library for generating a diff object between two sets of webpack bundle stat files.

## Installation
Using npm:
```sh
npm install @microsoft/webpack-stats-differ
```
Using Yarn:
```sh
yarn add @microsoft/webpack-stats-differ
```

## Usage
```typescript
import { diff, getFriendlyAssetName } from "@microsoft/webpack-stats-differ";
import * as path from "path";
import * as fs from "fs";

const baselineDir = path.resolve('/baseline');
const candidateDir = path.resolve('/candidate');
// Read the contents of your webpack-generated JSON file containing statistics about the compiled modules
const webPackStatsFile = fs.readFileSync('bundle-stats.json');

const diffResult = await diff(baselineDirUnzipped,candidateDir);
const name = getFriendlyAssetName(webPackStatsFile.asset);
```

# API

## diff() function

Calculates the diff between two sets of bundle stats.

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  baselineDir | string | Directory containing webpack stat files of the baseline |
|  candidateDir | string | Directory containing webpack stat files of the candidate |
|  fileFilter | string \| string\[\] | Optionally pass filter to omit certain files using [globby](https://github.com/sindresorhus/globby#usage) syntax |
|  filter | string \| string\[\] | Filter out certain assets for the bundle size calculation |
|  remoteArtifactManifests | { baseline: string \| [RemoteArtifact](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.remoteartifact.md)<!-- -->\[\]; candidate: string \| [RemoteArtifact](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.remoteartifact.md)<!-- -->\[\]; hostUrl: string; } | Either a path on disk to the serialized JSON manifest or the [RemoteArtifact](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.remoteartifact.md) list manifest object itself |

<b>Returns:</b>

Promise&lt;[FileDiffResults](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/webpack-stats-differ.filediffresults.md)<!-- -->&gt;

The diff object.

## getFriendlyAssetName() function

Returns a readable name of the asset.

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  asset | Pick&lt;Asset, "name" \| "chunkNames" \| "chunks"&gt; | webpack stats asset |

<b>Returns:</b>

string

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