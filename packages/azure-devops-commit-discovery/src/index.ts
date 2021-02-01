import { getHandlerFromToken, WebApi } from "azure-devops-node-api";
import {
  PullRequestStatus,
  GitPullRequest,
} from "azure-devops-node-api/interfaces/GitInterfaces";
import { CandidateConfig } from "./config";

type Result = {
  pullRequestId: number;
  mergeCommit: string;
};

const getCandidates = async ({
  connection,
  project,
  repo,
  baseCommitId,
}: CandidateConfig): Promise<Result[]> => {
  const gitApi = await createConnection(
    connection.account,
    connection.token
  ).getGitApi();

  const pullRequests = await gitApi.getPullRequests(
    repo,
    { status: PullRequestStatus.Active },
    project,
    undefined,
    undefined,
    10000
  );

  const candidates = pullRequests.filter(
    (pr) => pr.lastMergeTargetCommit?.commitId === baseCommitId
  );

  const results = candidates.map(pullRequestToResult);
  return results;
};

const createConnection = (account: string, token: string): WebApi =>
  new WebApi(
    `https://dev.azure.com/${account}`,
    getHandlerFromToken(token, true)
  );

const pullRequestToResult = (pr: GitPullRequest): Result => {
  if (!(pr.pullRequestId && pr.lastMergeCommit?.commitId)) {
    throw new Error(`PR has no id or last merge commit id`);
  }
  return {
    pullRequestId: pr.pullRequestId,
    mergeCommit: pr.lastMergeCommit.commitId,
  };
};

export { getCandidates, Result };
