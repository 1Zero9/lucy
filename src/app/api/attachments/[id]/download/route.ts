import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getAttachment } from "@/lib/db/attachments";
import { getObject } from "@/lib/storage/attachments";
import { contentDisposition } from "@/lib/storage/limits";

/**
 * Private download. The session identifies the user; the attachment row is
 * loaded owner-scoped; only then is the trusted `r2_key` used to fetch bytes.
 * A client-supplied key is never trusted (docs/SECURITY.md).
 */
export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const attachment = await getAttachment(getDb(), user.id, id);
  if (!attachment) return jsonError(404, "File not found.");

  const object = await getObject(attachment.r2_key);
  if (!object) return jsonError(404, "File contents are missing.");

  const headers = new Headers();
  headers.set("Content-Type", attachment.content_type);
  headers.set("Content-Length", String(attachment.size_bytes));
  headers.set("Content-Disposition", contentDisposition(attachment.content_type, attachment.filename));
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
});
