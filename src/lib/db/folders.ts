import { newId, nowIso } from "./index";

export type Folder = {
  id: string;
  workspace_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, workspace_id, name, sort_order, created_at, updated_at";

export async function listFolders(
  db: D1Database,
  userId: string,
  workspaceId: string
): Promise<Folder[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM folders
       WHERE user_id = ? AND workspace_id = ? AND deleted_at IS NULL
       ORDER BY sort_order ASC, name COLLATE NOCASE ASC`
    )
    .bind(userId, workspaceId)
    .all<Folder>();
  return results;
}

export async function getFolder(
  db: D1Database,
  userId: string,
  id: string
): Promise<Folder | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM folders WHERE id = ? AND user_id = ? AND deleted_at IS NULL`)
    .bind(id, userId)
    .first<Folder>();
}

export async function createFolder(
  db: D1Database,
  userId: string,
  workspaceId: string,
  name: string
): Promise<Folder> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO folders (id, user_id, workspace_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, userId, workspaceId, name, ts, ts)
    .run();
  const created = await getFolder(db, userId, id);
  if (!created) throw new Error("folder insert did not persist");
  return created;
}

export async function renameFolder(
  db: D1Database,
  userId: string,
  id: string,
  name: string
): Promise<Folder | null> {
  const { meta } = await db
    .prepare(
      `UPDATE folders SET name = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(name, nowIso(), id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getFolder(db, userId, id);
}

/** Soft delete. Notes in the folder keep existing (folder_id set null by the FK). */
export async function softDeleteFolder(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE folders SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  if (meta.changes === 0) return false;
  // Detach notes from the now-deleted folder so they surface as "no folder".
  await db
    .prepare(`UPDATE notes SET folder_id = NULL WHERE folder_id = ? AND user_id = ?`)
    .bind(id, userId)
    .run();
  return true;
}
