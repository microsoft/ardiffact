import { createContainerClient, uploadFile } from "./azure/blobStorage";
import { AzureBlobStorageConfig } from "./config";
import * as fs from "fs";
import * as path from "path";

/**
 * Uploads files in a specified folder to Azure Blob Storage
 * @param dirPath - Directory path containing the artifacts to upload
 * @param prefix - Prefix to append to the file name which makes the blob name to be uploaded to Azure Blob Storage
 * @param config - The {@link @ardiffact/azure-artifact-storage#AzureBlobStorageConfig} object used to create an instance of a Storage client
 * @param gzip - Whether to compress the artifacts using Gzip
 * @returns
 * @public
 */
export async function uploadArtifacts (
  dirPath: string,
  prefix: string,
  config: AzureBlobStorageConfig,
  gzip?: boolean
): Promise<void> {
  prefix = prefix.trim();
  prefix = prefix.endsWith("/")
    ? prefix.substring(0, prefix.length - 1)
    : prefix;
  const client = createContainerClient(config);
  const files = await fs.promises.readdir(dirPath);
  await Promise.all(
    files.map((file) =>
      uploadFile(client, `${prefix}/${file}`, path.join(dirPath, file), gzip)
    )
  );
};
