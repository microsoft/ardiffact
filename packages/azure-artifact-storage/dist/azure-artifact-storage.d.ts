/// <reference types="node" />

/**
 * Configuration interface used to create an instance of a Storage client
 */
export declare interface AzureBlobStorageConfig {
    accountName: string;
    storageKey: string;
    container: string;
}

/**
 * Downloads artifacts from Azure Blob Storage container to the local file system
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} used to create an instance of a Storage client
 * @param prefix - Prefix for the blob name in Azure Blob Storage
 * @param downloadDirectory - Local directory to download artifacts to
 * @param filter - Globbing pattern to use to filter blobs
 * @param gzip - Whether to decompress the artifacts
 * @returns - List of names and paths to downloaded artifacts
 * @public
 */
export declare function downloadArtifacts(config: AzureBlobStorageConfig, prefix: string, downloadDirectory?: string, filter?: string | string[], gzip?: boolean): Promise<{
    name: string;
    path?: string;
}[]>;

/**
 * Returns a list of {@link @microsoft/azure-artifact-storage#RemoteArtifact}
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} used to create an instance of a Storage client
 * @param prefix - Prefix for the blob name in Azure Blob Storage
 * @param filter - Globbing pattern to use to filter blobs
 * @returns - A list of {@link @microsoft/azure-artifact-storage#RemoteArtifact}
 * @public
 */
export declare function generateArtifactSasTokens(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[]): Promise<RemoteArtifact[]>;

/**
 * Loads artifacts from Azure Blob Storage into memory
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} used to create an instance of a Storage client
 * @param prefix - Prefix for the blob name in Azure Blob Storage
 * @param filter - Globbing pattern to use to filter blobs
 * @param gzip - Whether to decompress the artifacts
 * @returns List of artifacts as Buffer objects
 * @public
 */
export declare function getArtifacts(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[], gzip?: boolean): Promise<{
    name: string;
    artifact: Buffer;
}[]>;

/**
 * Returns a list blobs inside an Azure Blob Storage container
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} used to create an instance of a Storage client
 * @param prefix - Prefix for the blob name in Azure Blob Storage
 * @param filter - Globbing pattern to use to filter blobs
 * @returns - A list of blobs inside an Azure Blob Storage container
 * @public
 */
export declare function listArtifacts(config: AzureBlobStorageConfig, prefix: string, filter?: string | string[]): Promise<string[]>;

/**
 * Azure Blob Storage artifacts interface
 */
export declare interface RemoteArtifact {
    name: string;
    url: string;
}

/**
 * Uploads files in a specified folder to Azure Blob Storage
 * @param dirPath - Directory path containing the artifacts to upload
 * @param prefix - Prefix to append to the file name which makes the blob name to be uploaded to Azure Blob Storage
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} object used to create an instance of a Storage client
 * @param gzip - Whether to compress the artifacts using Gzip
 * @returns void
 * @public
 */
export declare function uploadArtifacts(dirPath: string, prefix: string, config: AzureBlobStorageConfig, gzip?: boolean): Promise<void>;

export { }
