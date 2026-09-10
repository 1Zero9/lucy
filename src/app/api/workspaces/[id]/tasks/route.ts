import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { getModule } from "@/lib/db/modules";
import { getNote } from "@/lib/db/notes";
import { listTasks, createTask, type TaskListOpts, type TaskStatus } from "@/lib/db/tasks";
import { asObject, requiredString, optionalString, optionalDate } from "@/lib/validation";

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const q = new URL(request.url).searchParams;
  const opts: TaskListOpts = { deleted: q.get("deleted") === "1" };
  const status = q.get("status");
  if (status === "open" || status === "done") opts.status = status as TaskStatus;
  if (q.get("noteId")) opts.noteId = q.get("noteId") as string;

  return Response.json({ tasks: await listTasks(db, user.id, workspaceId, opts) });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const body = asObject(await readJsonBody(request));

  const moduleId = optionalString(body.moduleId, { field: "moduleId", max: 64 });
  if (moduleId) {
    const module = await getModule(db, user.id, moduleId);
    if (!module || module.workspace_id !== workspaceId) {
      return jsonError(400, "That module is not in this workspace.");
    }
  }
  const noteId = optionalString(body.noteId, { field: "noteId", max: 64 });
  if (noteId) {
    const note = await getNote(db, user.id, noteId);
    if (!note || note.workspace_id !== workspaceId) {
      return jsonError(400, "That note is not in this workspace.");
    }
  }

  const task = await createTask(db, user.id, {
    workspaceId,
    title: requiredString(body.title, { field: "Task", max: 300 }),
    detail: optionalString(body.detail, { field: "Detail", max: 4000 }),
    dueAt: optionalDate(body.dueAt, "Due date"),
    remindAt: optionalDate(body.remindAt, "Reminder"),
    moduleId,
    noteId
  });
  return Response.json({ task }, { status: 201 });
});
