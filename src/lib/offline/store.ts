/**
 * IndexedDB-backed local store for offline-first note editing (MASTER.md §4).
 * Browser only — every export is a no-op / empty result when there is no
 * `indexedDB` (SSR, tests).
 *
 * Object stores:
 *   noteCache     keyPath "id"  — last known note content, with a `dirty` flag
 *                                 when there are local edits not yet confirmed
 *   mutationQueue keyPath "qid" (autoIncrement) — pending writes, FIFO
 *   meta          keyPath "k"   — misc (unused for now)
 */

const DB_NAME = "lucy";
const DB_VERSION = 1;

export type CachedNote = {
  id: string;
  title: string;
  text: string;
  /** The server `updated_at` this cache entry is based on. */
  serverUpdatedAt: string;
  /** True while local edits have not been confirmed synced. */
  dirty: boolean;
  /**
   * Signed-in account this entry belongs to. Note ids are globally unique, so
   * this is defense-in-depth rather than the primary isolation key — but see
   * `QueuedMutation.accountId`, where it's load-bearing (UPGRADE.md §7:
   * shared-device isolation).
   */
  accountId: string;
};

export type QueuedMutation = {
  qid?: number;
  kind: "note.update";
  noteId: string;
  payload: { title: string; text: string };
  /** Server `updated_at` the edit was made against, for conflict detection. */
  baseUpdatedAt: string;
  createdAt: number;
  attempts: number;
  /** Signed-in account this edit belongs to — a second account on the same
   *  device/browser must never see or flush another account's queue. */
  accountId: string;
};

function hasIdb(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("noteCache")) {
        db.createObjectStore("noteCache", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("mutationQueue")) {
        db.createObjectStore("mutationQueue", { keyPath: "qid", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "k" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// --- note cache -------------------------------------------------------------

export async function readCachedNote(id: string, accountId: string): Promise<CachedNote | null> {
  if (!hasIdb()) return null;
  try {
    const found = (await tx<CachedNote | undefined>("noteCache", "readonly", (s) => s.get(id))) ?? null;
    // A cached entry from a different account (shared device, account switch)
    // is treated as absent rather than returned.
    if (found && found.accountId !== accountId) return null;
    return found;
  } catch {
    return null;
  }
}

export async function writeCachedNote(note: CachedNote): Promise<void> {
  if (!hasIdb()) return;
  try {
    await tx("noteCache", "readwrite", (s) => s.put(note));
  } catch {
    /* best effort */
  }
}

// --- mutation queue -------------------------------------------------------

export async function enqueue(m: Omit<QueuedMutation, "qid">): Promise<void> {
  if (!hasIdb()) return;
  try {
    await tx("mutationQueue", "readwrite", (s) => s.add(m));
  } catch {
    /* best effort */
  }
}

export async function readQueue(accountId: string): Promise<QueuedMutation[]> {
  if (!hasIdb()) return [];
  try {
    const all = await tx<QueuedMutation[]>("mutationQueue", "readonly", (s) => s.getAll());
    return all.filter((m) => m.accountId === accountId).sort((a, b) => (a.qid ?? 0) - (b.qid ?? 0));
  } catch {
    return [];
  }
}

export async function removeFromQueue(qid: number): Promise<void> {
  if (!hasIdb()) return;
  try {
    await tx("mutationQueue", "readwrite", (s) => s.delete(qid));
  } catch {
    /* best effort */
  }
}

export async function updateQueued(m: QueuedMutation): Promise<void> {
  if (!hasIdb() || m.qid === undefined) return;
  try {
    await tx("mutationQueue", "readwrite", (s) => s.put(m));
  } catch {
    /* best effort */
  }
}

export async function queueCount(accountId: string): Promise<number> {
  return (await readQueue(accountId)).length;
}

/**
 * Every queued mutation and cached note belonging to a specific account —
 * used to give shared-device sign-out a real choice (sync now, or leave the
 * work in place for that account's next sign-in) instead of silently
 * discarding or silently leaking it to whoever signs in next.
 */
export async function clearAccountData(accountId: string): Promise<void> {
  if (!hasIdb()) return;
  try {
    const queue = await readQueue(accountId);
    for (const m of queue) {
      if (m.qid !== undefined) await tx("mutationQueue", "readwrite", (s) => s.delete(m.qid!));
    }
    const notes = await tx<CachedNote[]>("noteCache", "readonly", (s) => s.getAll());
    for (const n of notes.filter((c) => c.accountId === accountId)) {
      await tx("noteCache", "readwrite", (s) => s.delete(n.id));
    }
  } catch {
    /* best effort */
  }
}
