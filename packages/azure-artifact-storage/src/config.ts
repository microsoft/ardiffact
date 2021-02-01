export interface Config {
  downloadDirectory?: string;
  filter?: string | string[];
  prefix: string;
  azureBlobStorage: AzureBlobStorageConfig;
}

export interface AzureBlobStorageConfig {
  accountName: string;
  storageKey: string;
  container: string;
}
