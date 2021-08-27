# azure-artifact-storage
A library for interacting with Azure Blob Storage

## Installation
Using npm:
```sh
npm install @microsoft/azure-artifact-storage
```
Using Yarn:
```sh
yarn add @microsoft/azure-artifact-storage
```

## Usage
```typescript
    import {
    downloadArtifacts,
    generateArtifactSasTokens,
    listArtifacts,
    uploadArtifacts,
    getArtifacts
    } from "@microsoft/azure-artifact-storage";

    // Pass accountName, storageKey and container from environment variables
    const storageConfig = {
        accountName: `<accountName>`,
        storageKey: `<storageKey>`,
        container: `<container>`,
    };
    const baselineDir = path.resolve('/baseline');
    const candidateDir = path.resolve('/candidate');

    await uploadArtifacts(
        baselineDir,
        'myAwesomeApp/',
        storageConfig
    );

    await downloadArtifacts(
            storageConfig,
            'myAwesomeApp/'
        );

    await getArtifacts(
            storageConfig,
            'myAwesomeApp/'
        );

    const candidateRemotes = await generateArtifactSasTokens(
            storageConfig,
            'myAwesomeApp/'
        );
    await listArtifacts(
            storageConfig,
            'myAwesomeApp/'
            )
```

## API

|  Function | Description |
|  --- | --- |
|  [downloadArtifacts(config, prefix, downloadDirectory, filter, gzip)](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.downloadartifacts.md) | Downloads artifacts from Azure Blob Storage container to the local file system |
|  [generateArtifactSasTokens(config, prefix, filter)](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.generateartifactsastokens.md) | Returns a list of [RemoteArtifact](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.remoteartifact.md) |
|  [getArtifacts(config, prefix, filter, gzip)](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.getartifacts.md) | Loads artifacts from Azure Blob Storage into memory |
|  [listArtifacts(config, prefix, filter)](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.listartifacts.md) | Returns a list blobs inside an Azure Blob Storage container |
|  [uploadArtifacts(dirPath, prefix, config, gzip)](https://github.com/microsoft/ardiffact/blob/68e27505a9f7f97334592676bbd43b827f53c552/docs/azure-artifact-storage.uploadartifacts.md) | Uploads files in a specified folder to Azure Blob Storage |

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