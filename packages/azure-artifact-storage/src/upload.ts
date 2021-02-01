import { createContainerClient, uploadFile } from "./azure/blobStorage";
import { AzureBlobStorageConfig } from "./config";
import * as fs from "fs";
import * as path from "path";

export const uploadArtifacts = async (
  dirPath: string,
  prefix: string,
  config: AzureBlobStorageConfig
): Promise<void> => {
  prefix = prefix.trim();
  prefix = prefix.endsWith("/")
    ? prefix.substring(0, prefix.length - 1)
    : prefix;
  const client = createContainerClient(config);
  const files = await fs.promises.readdir(dirPath);
  await Promise.all(
    files.map((file) =>
      uploadFile(client, `${prefix}/${file}`, path.join(dirPath, file))
    )
  );
};
