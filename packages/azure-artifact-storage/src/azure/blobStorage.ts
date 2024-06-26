import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { encodeHash } from "../checksum";
import * as fs from "fs";
import * as stream from "stream";
import { createGunzip, createGzip } from "zlib";
import { createHash } from "crypto";
import { promisify } from "util";
import { dirname } from "path";
import { WritableStream } from "memory-streams";
import { AzureBlobStorageConfig } from "../config";

const pipelineAsync = promisify(stream.pipeline);

export const getArtifactPaths = async (
  containerClient: ContainerClient,
  prefix: string,
  abortSignal?: AbortSignal
): Promise<string[]> => {
  const paths = [];
  for await (const blob of containerClient.listBlobsFlat({
    prefix,
    abortSignal,
  })) {
    paths.push(blob.name);
  }
  return paths;
};

export const createContainerClient = (config: AzureBlobStorageConfig) =>
  createBlobServiceClient({
    accountName: config.accountName,
    storageKey: config.storageKey,
  }).getContainerClient(config.container);

export const getUserDelegationKey = (config: AzureBlobStorageConfig, startsOn: Date, expiresOn: Date) => {
  const blobClient = createBlobServiceClient(config);
  return blobClient.getUserDelegationKey(startsOn, expiresOn);
};

const createBlobServiceClient = (config: {
  accountName: string;
  storageKey?: string;
}) =>
  new BlobServiceClient(
    `https://${config.accountName}.blob.core.windows.net`,
    config.storageKey ? new StorageSharedKeyCredential(config.accountName, config.storageKey) : new DefaultAzureCredential()
  );

export const downloadToBuffer = async (
  containerClient: ContainerClient,
  blobName: string,
  gzip?: boolean
): Promise<Buffer> => {
  const memoryStream = new WritableStream();
  await downloadToStream(containerClient, blobName, memoryStream, gzip);
  const buffer = memoryStream.toBuffer();
  return buffer;
};

export const downloadToFile = async (
  containerClient: ContainerClient,
  blobName: string,
  path?: string,
  gzip?: boolean
): Promise<string> => {
  const downloadPath = path ?? blobName;
  await fs.promises.mkdir(dirname(downloadPath), { recursive: true });
  const downloadPathStream = fs.createWriteStream(downloadPath, {
    encoding: "utf8",
  });
  await downloadToStream(containerClient, blobName, downloadPathStream, gzip);
  return downloadPath;
};

export const uploadFile = async (
  containerClient: ContainerClient,
  blobName: string,
  filePath: string,
  gzip?: boolean
): Promise<void> => {
  const readable = fs.createReadStream(filePath);
  console.info(`Uploading ${blobName}`);
  await uploadStream(containerClient, blobName, readable, gzip);
  console.info(`Uploaded ${blobName}`);
};

const uploadStream = async (
  containerClient: ContainerClient,
  blobName: string,
  readable: stream.Readable,
  gzip?: boolean
): Promise<void> => {
  const blobClient = containerClient.getBlockBlobClient(blobName);
  const contentHashStream = createHash("md5");
  const encodingStream = gzip ? createGzip() : new stream.PassThrough();

  await Promise.all([
    pipelineAsync(readable, encodingStream),
    pipelineAsync(encodingStream, contentHashStream),
    blobClient.uploadStream(encodingStream),
  ]);
  const hash = new Uint8Array(contentHashStream.digest());
  await blobClient.setHTTPHeaders({
    blobContentMD5: hash,
    blobContentType: "application/json",
    blobContentEncoding: "gzip",
  });
};

const downloadToStream = async (
  containerClient: ContainerClient,
  blobName: string,
  writer: NodeJS.WritableStream,
  gzip?: boolean
): Promise<void> => {
  const blobClient = containerClient.getBlobClient(blobName);
  const encodingStream = gzip ? createGunzip() : new stream.PassThrough();
  const { contentMD5 } = await blobClient.getProperties();
  if (!contentMD5) {
    return Promise.reject(`MD5 hash does not exist for ${blobName}`);
  }
  const targetHash = encodeHash(contentMD5, "base64");
  const blob = await blobClient.download();
  if (!blob.readableStreamBody) {
    return Promise.reject(`No readableStreamBody for ${blobName}`);
  }
  const contentHashStream = createHash("md5");
  await Promise.all([
    pipelineAsync(blob.readableStreamBody, encodingStream, writer),
    pipelineAsync(blob.readableStreamBody, contentHashStream),
  ]);
  const contentHash = contentHashStream.digest("base64");
  if (contentHash !== targetHash) {
    return Promise.reject(
      `Checksum failed: \nTarget MD5: ${targetHash} \nContent MD5: ${contentHash}`
    );
  }
};
