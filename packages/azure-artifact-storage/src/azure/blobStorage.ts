import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { encodeHash } from "../checksum";
import * as fs from "fs";
import { pipeline, Readable } from "stream";
import { createGunzip, createGzip } from "zlib";
import { createHash } from "crypto";
import { promisify } from "util";
import { dirname } from "path";
import { WritableStream, ReadableStream } from "memory-streams";
import { AzureBlobStorageConfig } from "../config";

const pipelineAsync = promisify(pipeline);

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

const createBlobServiceClient = (config: {
  accountName: string;
  storageKey: string;
}) =>
  new BlobServiceClient(
    `https://${config.accountName}.blob.core.windows.net`,
    createStorageSharedKeyCredential(config)
  );

export const createStorageSharedKeyCredential = (config: {
  accountName: string;
  storageKey: string;
}) => new StorageSharedKeyCredential(config.accountName, config.storageKey);

export const downloadToBuffer = async (
  containerClient: ContainerClient,
  blobName: string
): Promise<Buffer> => {
  const memoryStream = new WritableStream();
  await downloadToStream(containerClient, blobName, memoryStream);
  const buffer = memoryStream.toBuffer();
  return buffer;
};

export const downloadToFile = async (
  containerClient: ContainerClient,
  blobName: string,
  path?: string
): Promise<void> => {
  const downloadPath = path ?? blobName;
  await fs.promises.mkdir(dirname(downloadPath), { recursive: true });
  const downloadPathStream = fs.createWriteStream(downloadPath, {
    encoding: "utf8",
  });
  await downloadToStream(containerClient, blobName, downloadPathStream);
};

export const uploadBuffer = async (
  containerClient: ContainerClient,
  blobName: string,
  data: Buffer
): Promise<void> => {
  const readable = ReadableStream.from(data);
  await uploadStream(containerClient, blobName, readable);
};

export const uploadFile = async (
  containerClient: ContainerClient,
  blobName: string,
  filePath: string
): Promise<void> => {
  const readable = fs.createReadStream(filePath);
  console.info(`Uploading ${blobName}`);
  await uploadStream(containerClient, blobName, readable);
  console.info(`Uploaded ${blobName}`)
};

const uploadStream = async (
  containerClient: ContainerClient,
  blobName: string,
  readable: Readable
): Promise<void> => {
  const blobClient = containerClient.getBlockBlobClient(blobName);
  const contentHashStream = createHash("md5");
  const gzipStream = createGzip();

  await Promise.all([
    pipelineAsync(readable, gzipStream),
    pipelineAsync(gzipStream, contentHashStream),
    blobClient.uploadStream(gzipStream),
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
  stream: NodeJS.WritableStream
): Promise<void> => {
  const blobClient = containerClient.getBlobClient(blobName);
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
    pipelineAsync(blob.readableStreamBody, createGunzip(), stream),
    pipelineAsync(blob.readableStreamBody, contentHashStream),
  ]);
  const contentHash = contentHashStream.digest("base64");
  if (contentHash !== targetHash) {
    return Promise.reject(
      `Checksum failed: \nTarget MD5: ${targetHash} \nContent MD5: ${contentHash}`
    );
  }
};
