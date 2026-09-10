import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getDrawing } from "@/lib/db/drawings";
import { getObject } from "@/lib/storage/attachments";

/** Private: session -> owner-scoped row -> stored key -> stream (SECURITY.md). */
export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const drawing = await getDrawing(getDb(), user.id, id, { includeDeleted: true });
  if (!drawing) return jsonError(404, "Drawing not found.");

  const object = await getObject(drawing.r2_key);
  if (!object) return jsonError(404, "Drawing contents are missing.");

  const headers = new Headers();
  headers.set("Content-Type", "image/png");
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
});
