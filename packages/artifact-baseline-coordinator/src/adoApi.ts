import { AdoContext } from "./adoContext";
import { getHandlerFromToken, WebApi } from "azure-devops-node-api";

export const getGitApi = (adoContext: AdoContext) => {
  if (adoContext.accessToken === undefined || adoContext.apiUrl === undefined) {
    throw new Error("Access token or apiUrl is undefined");
  }
  const handler = getHandlerFromToken(adoContext.accessToken);
  const connection = new WebApi(adoContext.apiUrl, handler, {
    allowRetries: true,
    maxRetries: 3
  });
  return connection.getGitApi();
};
