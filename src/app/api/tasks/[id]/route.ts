import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getTask, updateTask, softDeleteTask, type TaskPatch } from "@/lib/db/tasks";
import { getModule } from "@/lib/db/modules";
import { getNote } from "@/lib/db/notes";
import {
  asObject,
  requiredString,
  optionalString,
  optionalDate,
  ValidationError
} from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const task = await getTask(getDb(), user.id, id);
  if (!task) return jsonError(404, "Task not found.");
  return Response.json({ task });
});

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const task = await getTask(db, user.id, id);
  if (!task) return jsonError(404, "Task not found.");

  const body = asObject(await readJsonBody(request));
  const patch: TaskPatch = {};

  if ("title" in body) patch.title = requiredString(body.title, { field: "Task", max: 300 });
  if ("detail" in body) patch.detail = optionalString(body.detail, { field: "Detail", max: 4000 });
  if ("dueAt" in body) patch.dueAt = optionalDate(body.dueAt, "Due date");
  if ("remindAt" in body) patch.remindAt = optionalDate(body.remindAt, "Reminder");
  if ("status" in body) {
    if (body.status !== "open" && body.status !== "done") {
      throw new ValidationError("status must be 'open' or 'done'.");
    }
    patch.status = body.status;
  }
  if ("moduleId" in body) {
    const moduleId = optionalString(body.moduleId, { field: "moduleId", max: 64 });
    if (moduleId) {
      const module = await getModule(db, user.id, moduleId);
      if (!module || module.workspace_id !== task.workspace_id) {
        return jsonError(400, "That module is not in this workspace.");
      }
    }
    patch.moduleId = moduleId;
  }
  if ("noteId" in body) {
    const noteId = optionalString(body.noteId, { field: "noteId", max: 64 });
    if (noteId) {
      const note = await getNote(db, user.id, noteId);
      if (!note || note.workspace_id !== task.workspace_id) {
        return jsonError(400, "That note is not in this workspace.");
      }
    }
    patch.noteId = noteId;
  }

  if (Object.keys(patch).length === 0) throw new ValidationError("Nothing to update.");

  const updated = await updateTask(db, user.id, id, patch);
  if (!updated) return jsonError(404, "Task not found.");
  return Response.json({ task: updated });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteTask(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Task not found.");
  return Response.json({ ok: true });
});
