/**
 * Configuration interface used to create an instance of a Storage client
 */
export interface AzureBlobStorageConfig {
  accountName: string;
  storageKey: string;
  container: string;
}
