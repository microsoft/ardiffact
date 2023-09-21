const getOrgNameFromUri = (
  collectionUri: string | undefined
): string | undefined => {
  if (collectionUri && collectionUri.includes("visualstudio.com")) {
    return collectionUri.split(".")[0].split("//")[1];
  }
  return undefined;
};

const getBranchNameWithoutRefsHeads = (
  original: string | undefined
): string | undefined => {
  return original ? original.replace("refs/heads/", "") : original;
};

const getPrIdFromSourceBranch = (
  sourceBranch: string | undefined
): string | undefined => {
  const parts = sourceBranch?.split("/");
  if (parts && parts[1] === "pull" && parts[3] === "merge") {
    return parts[2];
  }
  return undefined;
};

export const getBuildContextFromEnv = () => {
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
};

export type AdoContext = ReturnType<typeof getBuildContextFromEnv>;
