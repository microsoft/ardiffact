export type DigestEncoding = "base64";
export type HashAlgorithm = "md5";

export const encodeHash = (hash: Uint8Array, encoding: DigestEncoding) =>
  Buffer.from(hash).toString(encoding);
