export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Content types LUCY will store. Kept deliberately small for a private learning
 * workspace: images, PDFs, plain text / markdown, and common office documents.
 */
export const ALLOWED_CONTENT_TYPES = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip"
]);

/** Types safe to render inline in the browser; everything else downloads. */
const INLINE_TYPES = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain"
]);

export function isImageType(type: string): boolean {
  return type.startsWith("image/") && type !== "image/svg+xml";
}

export function dispositionFor(type: string): "inline" | "attachment" {
  return INLINE_TYPES.has(type) ? "inline" : "attachment";
}

/** RFC 5987-safe filename for the Content-Disposition header. */
export function contentDisposition(type: string, filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `${dispositionFor(type)}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
