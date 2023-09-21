import { AdoContext, getBuildContextFromEnv } from "./adoContext";
import { getGitApi } from "./adoApi";
import { GitVersionType } from "azure-devops-node-api/interfaces/GitInterfaces";
import * as path from "path";

/**
 * Get the list of commits on baseline which have resulted in a change in the working directory
 * @param workingDirectory The directory to check for changes
 * @param adoContextOverride Override the ado context - by default ado context is read from environment variables
 */
export const getBaselineCommitsForAdo = async (
  workingDirectory?: string,
  adoContextOverride?: Partial<AdoContext>
) => {
  const buildContext = Object.assign(
    getBuildContextFromEnv(),
    adoContextOverride
  );

  const gitApi = await getGitApi(buildContext);

  if (!buildContext.repository) {
    throw new Error("Repository is undefined");
  }

  if (!buildContext.projectName) {
    throw new Error("Project name is undefined");
  }

  if (!buildContext.commitId) {
    throw new Error("Commit id is undefined");
  }

  // We calculate the tip of target branch
  const [targetBranchTip] = await gitApi.getCommits(
    buildContext.repository,
    {
      itemVersion: {
        version: buildContext.targetBranch,
        versionType: GitVersionType.Branch,
      },
    },
    buildContext.projectName
  );

  if (!targetBranchTip.commitId) {
    throw new Error(
      `Could not find target branch tip for branch ${buildContext.targetBranch}`
    );
  }

  // Calculate merge base between targetBranch tip and PR commit id
  const [mergeBase] = await gitApi.getMergeBases(
    buildContext.repository,
    targetBranchTip.commitId,
    buildContext.commitId,
    buildContext.projectName
  );

  // Using the merge base get the list of commit ids which have resulted in a change in working directory
  const commitsTouchingBaseline = await gitApi.getCommits(
    buildContext.repository,
    {
      itemPath: path.posix.join("/", workingDirectory || "."),
      itemVersion: {
        version: mergeBase.commitId,
        versionType: GitVersionType.Commit,
      },
      $top: 10,
    },
    buildContext.projectName
  );
  return commitsTouchingBaseline;
};
