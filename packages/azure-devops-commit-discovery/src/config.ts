type CandidateConfig = {
  connection: ConnectionConfig;
  project: string;
  repo: string;
  baseCommitId: string;
};

type ConnectionConfig = {
  account: string;
  token: string;
};

export { CandidateConfig };
