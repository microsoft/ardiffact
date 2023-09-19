# artifact-baseline-coordinator
A library for managing and coordinating baseline artifacts.

## Installation
Using npm:
```sh
npm install @microsoft/artifact-baseline-coordinator
```
Using Yarn:
```sh
yarn add @microsoft/artifact-baseline-coordinator
```

## Usage

The goal behind this library is to handle cases where candidate artifacts have a possibility
of being generated before baseline artifacts. It handles them by storing the information of candidates
which are pending on a particular baseline so that when the baseline is finished processing it can handle the
artifact diffing for these candidates.

```ts
/// config.ts
export const tableConfig = {
  accountName: 'storageAccount',
  storageKey: 'storageKeyPlaceholder',
  tableName: 'pendingBaselines'
}

/// candidate.ts
if (!baselineExists) {
  await insertPendingCandidateForBaseline(tableConfig, baselineCommitId, candidateCommitId);
}


/// baseline.ts
// after finishing baseline processing
const pendingCandidates = await getPendingCandidatesForBaseline(tableConfig, baselineCommitId);
for (const candidateId of pendingCandidates) {
  // process candidate diffing vs baseline
  // ...
  // after processing
  await markCandidateAsComplete(tableConfig, baselineCommitId, candidateCommitId);
}
```

There is also a utility function `getBaselineCommitsForAdo` which can handle getting the correct baseline commit id to to use in ADO pipelines for a specific `workingDirectory`.

## API

- getBaselineCommitsForAdo
  - Returns a list of git commits which are calculated from the merge base of target branch of the PR commit, and the PR commit and then finding a commit from the merge base which touches the `workingDirectory`.
  - It derives the information for `AdoContext` through the environment variables mentioned below. You can override all of them through the `adoContextOverride` parameter in the function.

```typescript
/*
  Defaults for AdoContext
  return {
    buildId: process.env.BUILD_BUILDID,
    commitId: process.env.BUILD_SOURCEVERSION,
    prId: getPrIdFromSourceBranch(process.env.BUILD_SOURCEBRANCH),
    projectName: process.env.SYSTEM_TEAMPROJECT,
    organization: getOrgNameFromUri(process.env.SYSTEM_COLLECTIONURI),
    repository: process.env.BUILD_REPOSITORY_NAME,
    accessToken: process.env.SYSTEM_ACCESSTOKEN,
    apiUrl: process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI,
    targetBranch: getBranchNameWithoutRefsHeads(
      process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    ),
    buildDefinitionId: process.env.SYSTEM_DEFINITIONID,
    sourceBranch: getBranchNameWithoutRefsHeads(process.env.BUILD_SOURCEBRANCH),
  };
*/

getBaselineCommitsForAdo: (workingDirectory?: string | undefined, adoContextOverride?: Partial<{
    buildId: string | undefined; 
    commitId: string | undefined;
    prId: string | undefined;
    projectName: string | undefined;
    organization: string | undefined;
    repository: string | undefined;
    accessToken: string | undefined;
    apiUrl: string | undefined;
    targetBranch: string | undefined;
    buildDefinitionId: string | undefined;
    sourceBranch: string | undefined;
}> | undefined) => Promise<import("azure-devops-node-api/interfaces/GitInterfaces").GitCommitRef[]>

```

Check Usage section
```ts
type BaselineTableConfig = {
    accountName: string;
    storageKey: string;
    tableName: string;
};

insertPendingCandidateForBaseline: (config: BaselineTableConfig, candidateId: string, baselineCommit: string, artifactType: string) => Promise<void>

getPendingCandidatesForBaseline: (config: BaselineTableConfig, baselineCommit: string) => Promise<string[]>

markCandidatesAsComplete: (config: BaselineTableConfig, candidateId: string, baselineCommit: string, artifactType: string) => Promise<void>
```

# Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

# License

MIT