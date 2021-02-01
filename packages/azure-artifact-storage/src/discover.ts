import { AzureBlobStorageConfig, Config } from "./config";
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
import { AbortController } from "@azure/abort-controller";

export interface RemoteArtifact {
  name: string;
  url: string;
}

const TIMEOUT = 3 * 1000;

const listArtifacts = async (
  config: AzureBlobStorageConfig,
  prefix: string,
  filter?: string | string[]
): Promise<string[]> => {
  const containerClient = createContainerClient(config);
  return getTargetArtifactNames(containerClient, prefix, filter);
};

const generateArtifactSasTokens = async (
  config: AzureBlobStorageConfig,
  prefix: string,
  filter?: string | string[]
): Promise<RemoteArtifact[]> => {
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
};

const getArtifacts = async (
  config: Config
): Promise<{ name: string; artifact: Buffer }[]> => {
  const containerClient = createContainerClient(config.azureBlobStorage);
  const targetNames = await getTargetArtifactNames(
    containerClient,
    config.prefix,
    config.filter
  );

  const artifacts = await Promise.all(
    targetNames.map(async (name) => {
      const blobContents = await downloadToBuffer(containerClient, name);
      return { name: name, artifact: blobContents };
    })
  );
  return artifacts;
};

const downloadArtifacts = async (config: Config): Promise<void> => {
  const containerClient = createContainerClient(config.azureBlobStorage);
  const targetNames = await getTargetArtifactNames(
    containerClient,
    config.prefix,
    config.filter
  );
  const downloadDirectory = config.downloadDirectory ?? process.cwd();

  await Promise.all(
    targetNames.map(async (name) => {
      await fetchContents(
        containerClient,
        name,
        path.join(downloadDirectory, path.basename(name))
      );
    })
  );
};

const getTargetArtifactNames = async (
  client: ContainerClient,
  prefix: string,
  filter?: string | string[]
): Promise<string[]> => {
  try {
    const blobNames = await getArtifactPaths(
      client,
      prefix,
      AbortController.timeout(TIMEOUT)
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

const fetchContents = async (
  client: ContainerClient,
  name: string,
  path: string
): Promise<void> => {
  try {
    console.info(`Downloading ${name}`);
    await downloadToFile(client, name, path);
    console.info(`Downloaded ${name}`);
  } catch (e: unknown) {
    console.error(`Could not download ${name}`);
    if (e instanceof Error) {
      console.error(e.name);
      console.error(e.message);
      console.error(e.stack);
    } else {
      console.error(e);
    }
  }
};

export {
  listArtifacts,
  generateArtifactSasTokens,
  getArtifacts,
  downloadArtifacts,
};
