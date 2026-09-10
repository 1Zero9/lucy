import { env } from "cloudflare:workers";

/** The R2 bucket for private user files (docs/ARCHITECTURE.md — FILES binding). */
export function getFiles(): R2Bucket {
  return env.FILES;
}

/** Storage key for an attachment. Derived from ids; authority is always the D1 row. */
export function attachmentKey(userId: string, attachmentId: string): string {
  return `att/${userId}/${attachmentId}`;
}

/** Storage key for a drawing's PNG. Same rule: authority is the D1 row. */
export function drawingKey(userId: string, drawingId: string): string {
  return `draw/${userId}/${drawingId}`;
}

export async function putObject(
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  await getFiles().put(key, body, {
    httpMetadata: { contentType }
  });
}

export function getObject(key: string): Promise<R2ObjectBody | null> {
  return getFiles().get(key);
}

export async function deleteObject(key: string): Promise<void> {
  await getFiles().delete(key);
}
