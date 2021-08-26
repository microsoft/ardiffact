## API Report File for "@microsoft/azure-artifact-storage"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public (undocumented)
export interface AzureBlobStorageConfig {
    // (undocumented)
    accountName: string;
    // (undocumented)
    container: string;
    // (undocumented)
    storageKey: string;
}

// @public (undocumented)
export function downloadArtifacts(config: AzureBlobStorageConfig, prefix: string, downloadDirectory?: string, filter?: string | string[], gzip?: boolean): Promise<{
    name: string;
    path?: string;
}[]>;

// @public (undocumented)
export function generateArtifactSasTokens(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[]): Promise<RemoteArtifact[]>;

// @public (undocumented)
export function getArtifacts(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[], gzip?: boolean): Promise<{
    name: string;
    artifact: Buffer;
}[]>;

// @public (undocumented)
export function listArtifacts(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[]): Promise<string[]>;

// @public (undocumented)
export interface RemoteArtifact {
    // (undocumented)
    name: string;
    // (undocumented)
    url: string;
}

// @public (undocumented)
export const uploadArtifacts: (dirPath: string, prefix: string, config: AzureBlobStorageConfig, gzip?: boolean | undefined) => Promise<void>;


// (No @packageDocumentation comment for this package)

```