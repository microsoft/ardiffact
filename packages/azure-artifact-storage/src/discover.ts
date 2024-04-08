import { AzureBlobStorageConfig } from "./config";
import {
  createContainerClient,
  createStorageSharedKeyCredential,
  downloadToBuffer,
  downloadToFile,
  getArtifactPaths,
} from "./azure/blobStorage";
import { matchFilter } from "./filter";
import * as path from "path";
import {
  BlobSASPermissions,
  ContainerClient,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

/**
 * Azure Blob Storage artifacts interface
 */
export interface RemoteArtifact {
  name: string;
  url: string;
}

const TIMEOUT = 3_000;

/**
 * Returns a list blobs inside an Azure Blob Storage container
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} used to create an instance of a Storage client
 * @param prefix - Prefix for the blob name in Azure Blob Storage
 * @param filter - Globbing pattern to use to filter blobs
 * @returns - A list of blobs inside an Azure Blob Storage container
 * @public
 */
async function listArtifacts(
  config: AzureBlobStorageConfig,
  prefix: string,
  filter?: string | string[]
): Promise<string[]> {
  const containerClient = createContainerClient(config);
  return getTargetArtifactNames(containerClient, prefix, filter);
}

/**
 * Returns a list of {@link @microsoft/azure-artifact-storage#RemoteArtifact}
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} used to create an instance of a Storage client
 * @param prefix - Prefix for the blob name in Azure Blob Storage
 * @param filter - Globbing pattern to use to filter blobs
 * @returns - A list of {@link @microsoft/azure-artifact-storage#RemoteArtifact}
 * @public
 */
async function generateArtifactSasTokens(
  config: AzureBlobStorageConfig,
  prefix: string,
  filter?: string | string[]
): Promise<RemoteArtifact[]> {
  const containerClient = createContainerClient(config);
  const targetNames = await getTargetArtifactNames(
    containerClient,
    prefix,
    filter
  );

  const duration = 60 * 24 * 60 * 60 * 1000;
  const urls = await Promise.all(
    targetNames.map(
      async (name): Promise<RemoteArtifact> => ({
        name,
        url: [
          containerClient.getBlobClient(name).url,
          await generateBlobSASQueryParameters(
            {
              containerName: containerClient.containerName,
              blobName: name,
              permissions: BlobSASPermissions.parse("r"),
              expiresOn: new Date(Date.now() + duration),
            },
            createStorageSharedKeyCredential(config)
          ).toString(),
        ].join("?"),
      })
    )
  );
  return urls;
}

/**
 * Loads artifacts from Azure Blob Storage into memory
 * @param config - The {@link @microsoft/azure-artifact-storage#AzureBlobStorageConfig} used to create an instance of a Storage client
 * @param prefix - Prefix for the blob name in Azure Blob Storage
 * @param filter - Globbing pattern to use to filter blobs
 * @param gzip - Whether to decompress the artifacts
 * @returns List of artifacts as Buffer objects
 * @public
 */
async function getArtifacts(
  config: AzureBlobStorageConfig,
  prefix: string,
  filter?: string | string[],
  gzip?: boolean
): Promise<{ name: string; artifact: Buffer }[]> {
  const containerClient = createContainerClient(config);
  const targetNames = await getTargetArtifactNames(
    containerClient,
    prefix,
    filter
  );

  const artifacts = await Promise.all(
    targetNames.map(async (name) => {
      const blobContents = await downloadToBuffer(containerClient, name, gzip);
      return { name: name, artifact: blobContents };
    })
  );
  return artifacts;
};

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
async function downloadArtifacts(
  config: AzureBlobStorageConfig,
  prefix: string,
  downloadDirectory?: string,
  filter?: string | string[],
  gzip?: boolean
): Promise<{ name: string; path?: string }[]> {
  const containerClient = createContainerClient(config);
  const targetNames = await getTargetArtifactNames(
    containerClient,
    prefix,
    filter
  );
  const dir = downloadDirectory ?? process.cwd();

  const paths = await Promise.all(
    targetNames.map(async (name) => {
      const downloadPath = path.join(dir, path.basename(name));
      try {
        return {
          name,
          path: await downloadToFile(containerClient, name, downloadPath, gzip),
        };
      } catch (e: unknown) {
        console.error(`Could not download: ${name} to ${downloadPath}`);
        console.error(e);
        return { name, path: undefined };
      }
    })
  );
  return paths;
}

const getTargetArtifactNames = async (
  client: ContainerClient,
  prefix: string,
  filter?: string | string[]
): Promise<string[]> => {
  try {
    const blobNames = await getArtifactPaths(
      client,
      prefix,
      AbortSignal.timeout(TIMEOUT)
    );
    const targetNames = matchFilter(filter, blobNames);
    return targetNames;
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      console.error(e);
      throw new Error(`Fetching artifacts timed out`);
    }
    throw e;
  }
};

export {
  listArtifacts,
  generateArtifactSasTokens,
  getArtifacts,
  downloadArtifacts,
};
