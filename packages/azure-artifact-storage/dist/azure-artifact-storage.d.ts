/// <reference types="node" />

export declare interface AzureBlobStorageConfig {
    accountName: string;
    storageKey: string;
    container: string;
}

export declare function downloadArtifacts(config: AzureBlobStorageConfig, prefix: string, downloadDirectory?: string, filter?: string | string[], gzip?: boolean): Promise<{
    name: string;
    path?: string;
}[]>;

export declare function generateArtifactSasTokens(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[]): Promise<RemoteArtifact[]>;

export declare function getArtifacts(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[], gzip?: boolean): Promise<{
    name: string;
    artifact: Buffer;
}[]>;

export declare function listArtifacts(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[]): Promise<string[]>;

export declare interface RemoteArtifact {
    name: string;
    url: string;
}

export declare const uploadArtifacts: (dirPath: string, prefix: string, config: AzureBlobStorageConfig, gzip?: boolean | undefined) => Promise<void>;

export { }
