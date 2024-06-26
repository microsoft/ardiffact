import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";
import { DefaultAzureCredential, ChainedTokenCredential, AzurePipelinesCredential } from "@azure/identity";
import { BaselineTableConfig } from "./types";

const getCredentialProvider = () => {
  const clientId = process.env.AZURESUBSCRIPTION_CLIENT_ID;
  const tenantId = process.env.AZURESUBSCRIPTION_TENANT_ID;
  const serviceConnectionId = process.env.AZURESUBSCRIPTION_SERVICE_CONNECTION_ID;
  const systemAccessToken = process.env.SYSTEM_ACCESSTOKEN;
  if (clientId && tenantId && serviceConnectionId && systemAccessToken) {
    return new ChainedTokenCredential(new AzurePipelinesCredential(
      tenantId,
      clientId,
      serviceConnectionId,
      systemAccessToken,
    ), new DefaultAzureCredential());
  } else {
    return new DefaultAzureCredential();
  }
};


const getTableClient = async (config: BaselineTableConfig) => {
  const { accountName, storageKey, tableName } = config;
  let tableClient;
  if (storageKey) {
    tableClient = new TableClient(
      `https://${accountName}.table.core.windows.net`,
      tableName,
      new AzureNamedKeyCredential(accountName, storageKey)
    )
  }
  else if (process.env.USE_DEV_STORAGE) {
    tableClient = TableClient.fromConnectionString(
      "UseDevelopmentStorage=true",
      tableName
    );
  } else {
    tableClient = new TableClient(
      `https://${accountName}.table.core.windows.net`,
      tableName,
      getCredentialProvider()
    )
  }
  await tableClient.createTable();
  return tableClient;
};

type TableEntity = {
  partitionKey: string; // = baselineId
  rowKey: string; // = candidateId
  isPending: boolean;
};

export const getPendingCandidatesForBaseline = async (
  config: BaselineTableConfig,
  baselineId: string
): Promise<string[]> => {
  const tableClient = await getTableClient(config);
  const entities = tableClient.listEntities<TableEntity>({
    queryOptions: {
      filter: `PartitionKey eq '${baselineId}'`,
    },
  });
  const pendingCandidates = [];
  for await (const entity of entities) {
    if (entity.partitionKey === baselineId && entity.isPending) {
      pendingCandidates.push(entity);
    }
  }
  return pendingCandidates.map(({ rowKey }) => rowKey);
};

const checkIfCandidateAlreadyExists = async (
  tableClient: TableClient,
  baselineId: string,
  candidateId: string
) => {
  try {
    await tableClient.getEntity<TableEntity>(baselineId, candidateId);
    return true;
  } catch (e) {
    return false;
  }
};

export const insertPendingCandidateForBaseline = async (
  config: BaselineTableConfig,
  baselineId: string,
  candidateId: string
) => {
  const tableClient = await getTableClient(config);
  const candidateExists = await checkIfCandidateAlreadyExists(
    tableClient,
    baselineId,
    candidateId
  );
  if (candidateExists) {
    return;
  }
  await tableClient.createEntity<TableEntity>({
    partitionKey: baselineId,
    rowKey: candidateId,
    isPending: true,
  });
};

export const markCandidateAsComplete = async (
  config: BaselineTableConfig,
  baselineId: string,
  candidateId: string
) => {
  const tableClient = await getTableClient(config);
  const entity = await tableClient.getEntity<TableEntity>(
    baselineId,
    candidateId
  );
  await tableClient.updateEntity({
    ...entity,
    isPending: false,
  });
};
