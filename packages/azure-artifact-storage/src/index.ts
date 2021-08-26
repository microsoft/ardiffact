/**
 * A library for interacting with Azure Blob Storage
 * @packageDocumentation
 */
export { AzureBlobStorageConfig } from "./config";
export { RemoteArtifact } from "./discover";
export {
  getArtifacts,
  downloadArtifacts,
  listArtifacts,
  generateArtifactSasTokens,
} from "./discover";
export { uploadArtifacts } from "./upload";
