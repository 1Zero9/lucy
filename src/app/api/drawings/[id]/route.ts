import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getDrawing, touchDrawing, softDeleteDrawing } from "@/lib/db/drawings";
import { putObject } from "@/lib/storage/attachments";
import { asObject, requiredString } from "@/lib/validation";
import { MAX_ATTACHMENT_BYTES } from "@/lib/storage/limits";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const drawing = await getDrawing(getDb(), user.id, id);
  if (!drawing) return jsonError(404, "Drawing not found.");
  return Response.json({ drawing });
});

/** JSON PATCH renames; a multipart PATCH replaces the PNG bytes (canvas save). */
export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const drawing = await getDrawing(db, user.id, id);
  if (!drawing) return jsonError(404, "Drawing not found.");

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "image/png") {
      return jsonError(415, "A PNG image is required.");
    }
    if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
      return jsonError(413, "That drawing is too large.");
    }
    await putObject(drawing.r2_key, await file.arrayBuffer(), "image/png");
    const updated = await touchDrawing(db, user.id, id, {
      width: Number(form.get("width")) || drawing.width,
      height: Number(form.get("height")) || drawing.height,
      ...(form.get("title") ? { title: String(form.get("title")).slice(0, 200) } : {})
    });
    return Response.json({ drawing: updated });
  }

  const body = asObject(await readJsonBody(request));
  const updated = await touchDrawing(db, user.id, id, {
    title: requiredString(body.title, { field: "Title", max: 200 })
  });
  return Response.json({ drawing: updated });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteDrawing(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Drawing not found.");
  return Response.json({ ok: true });
});
