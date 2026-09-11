"use client";

import {
  enqueue,
  queueCount,
  readCachedNote,
  readQueue,
  removeFromQueue,
  updateQueued,
  writeCachedNote,
  type CachedNote,
  type QueuedMutation
} from "./store";

export type SyncState = {
  online: boolean;
  pending: number;
  syncing: boolean;
  error: string | null;
  conflicts: string[];
};

type NoteShape = {
  id: string;
  title: string;
  content_text: string;
  updated_at: string;
};

let state: SyncState = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pending: 0,
  syncing: false,
  error: null,
  conflicts: []
};

const listeners = new Set<(s: SyncState) => void>();
let flushing = false;
let started = false;

function notify(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn(state);
}

export function getSyncState(): SyncState {
  return state;
}

export function subscribeSync(fn: (s: SyncState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function dismissConflict(noteId: string) {
  notify({ conflicts: state.conflicts.filter((id) => id !== noteId) });
}

/** The signed-in account the sync layer is currently scoped to. `null` means
 *  signed out — no queue/cache access happens until it's set. */
let currentAccountId: string | null = null;

export function getCurrentAccountId(): string | null {
  return currentAccountId;
}

/**
 * Point the sync layer at an account. Called once the session is known
 * (`initSync`) and again on every account change (sign-in/out without a full
 * page reload share this one JS module instance — UPGRADE.md §7 shared-
 * device isolation). Switching accounts resets transient state so a stale
 * conflict/error banner from the previous account can't linger, and
 * refreshes `pending` to that account's own queue depth.
 */
export async function setAccount(accountId: string | null): Promise<void> {
  if (accountId === currentAccountId) return;
  currentAccountId = accountId;
  state = { ...state, pending: 0, syncing: false, error: null, conflicts: [] };
  if (!accountId) {
    for (const fn of listeners) fn(state);
    return;
  }
  notify({ pending: await queueCount(accountId) });
  void flush();
}

/** Seed the local cache from a server-rendered note, unless local edits are pending. */
export async function seedNoteCache(note: NoteShape): Promise<CachedNote | null> {
  if (!currentAccountId) return null;
  const accountId = currentAccountId;
  const existing = await readCachedNote(note.id, accountId);
  if (existing?.dirty) return existing;
  const fresh: CachedNote = {
    id: note.id,
    title: note.title,
    text: note.content_text,
    serverUpdatedAt: note.updated_at,
    dirty: false,
    accountId
  };
  await writeCachedNote(fresh);
  return fresh;
}

/**
 * Local-first note write: update the cache immediately and queue a server sync.
 * Rapid successive edits to the same note collapse onto one queued mutation.
 */
export async function queueNoteUpdate(
  noteId: string,
  payload: { title: string; text: string },
  baseUpdatedAt: string
): Promise<void> {
  if (!currentAccountId) return;
  const accountId = currentAccountId;

  await writeCachedNote({
    id: noteId,
    title: payload.title,
    text: payload.text,
    serverUpdatedAt: baseUpdatedAt,
    dirty: true,
    accountId
  });

  const queue = await readQueue(accountId);
  const last = queue[queue.length - 1];
  if (last && last.kind === "note.update" && last.noteId === noteId && last.qid !== undefined) {
    await updateQueued({ ...last, payload });
  } else {
    await enqueue({
      kind: "note.update",
      noteId,
      payload,
      baseUpdatedAt,
      createdAt: Date.now(),
      attempts: 0,
      accountId
    });
  }

  notify({ pending: await queueCount(accountId) });
  void flush();
}

async function stillQueuedFor(noteId: string, accountId: string): Promise<boolean> {
  return (await readQueue(accountId)).some((m) => m.noteId === noteId);
}

/** After a note's write lands, later queued edits for it must rebase onto the new server time. */
async function rebase(noteId: string, newUpdatedAt: string, accountId: string) {
  for (const m of await readQueue(accountId)) {
    if (m.noteId === noteId && m.qid !== undefined) {
      await updateQueued({ ...m, baseUpdatedAt: newUpdatedAt });
    }
  }
}

/**
 * Save the losing edit as note history before the conflict branch replaces
 * the local copy with the server's. Returns whether it actually landed —
 * callers must not discard the local edit until this is confirmed
 * (UPGRADE.md §7: "conflict preservation is not confirmed").
 */
async function preserveAsHistory(noteId: string, payload: { title: string; text: string }): Promise<boolean> {
  try {
    const res = await fetch(`/api/notes/${noteId}/versions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: payload.title, text: payload.text, source: "import" })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function flush(): Promise<void> {
  if (flushing) return;
  if (!currentAccountId) return;
  const accountId = currentAccountId;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    notify({ online: false });
    return;
  }
  flushing = true;
  notify({ syncing: true, online: true });
  let error: string | null = null;

  try {
    while (true) {
      // Re-check on every iteration: a sign-out mid-flush must stop touching
      // this account's queue immediately rather than finishing the pass.
      if (currentAccountId !== accountId) break;

      const queue = await readQueue(accountId);
      const item = queue[0] as QueuedMutation | undefined;
      if (!item || item.qid === undefined) break;

      let res: Response;
      try {
        res = await fetch(`/api/notes/${item.noteId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...item.payload, ifUnmodifiedSince: item.baseUpdatedAt })
        });
      } catch {
        // Offline / network blip: leave the queue intact and try again later.
        notify({ online: false });
        break;
      }

      if (res.ok) {
        const { note } = (await res.json()) as { note: NoteShape };
        await removeFromQueue(item.qid);
        await rebase(item.noteId, note.updated_at, accountId);
        await writeCachedNote({
          id: note.id,
          title: note.title,
          text: note.content_text,
          serverUpdatedAt: note.updated_at,
          dirty: await stillQueuedFor(note.id, accountId),
          accountId
        });
      } else if (res.status === 409) {
        const { note: serverNote } = (await res.json()) as { note: NoteShape };
        const preserved = await preserveAsHistory(item.noteId, item.payload);
        if (!preserved) {
          // Don't touch the queue or overwrite the local edit until the
          // losing version is confirmed saved — retry this same item next
          // pass instead of silently adopting the server copy over it.
          error = "Couldn't confirm your last change was saved — retrying.";
          break;
        }
        await removeFromQueue(item.qid);
        await rebase(item.noteId, serverNote.updated_at, accountId);
        await writeCachedNote({
          id: serverNote.id,
          title: serverNote.title,
          text: serverNote.content_text,
          serverUpdatedAt: serverNote.updated_at,
          dirty: await stillQueuedFor(serverNote.id, accountId),
          accountId
        });
        if (!state.conflicts.includes(item.noteId)) {
          notify({ conflicts: [...state.conflicts, item.noteId] });
        }
      } else if (res.status === 401) {
        // Not signed in (any more) — keep the edit queued for when they are.
        error = "Sign in again to sync your changes.";
        break;
      } else if (res.status >= 500) {
        // Transient server-side failure — same payload may well succeed on
        // retry. Keep it queued (UPGRADE.md §7: "failed saves leave the
        // retry queue").
        error = "LUCY couldn't save your last change — retrying.";
        break;
      } else {
        // A genuinely terminal 4xx (bad request, ownership mismatch, the
        // note was deleted elsewhere, …): retrying the identical payload
        // won't help, so don't leave it stuck in the queue forever.
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        error = body.error ?? "Some changes could not be saved.";
        await removeFromQueue(item.qid);
      }
    }
  } finally {
    flushing = false;
    if (currentAccountId === accountId) {
      notify({ syncing: false, pending: await queueCount(accountId), error });
    }
  }
}

/**
 * Re-check the browser's own connectivity flag before each attempt. A prior
 * flush can have set `online: false` after a single failed request (a dropped
 * dev-server connection, a cold start); without this, that flag only clears on
 * a genuine `online` DOM event, which never fires if the browser was never
 * really offline — leaving the offline bar stuck.
 */
function resync() {
  if (typeof navigator !== "undefined" && navigator.onLine && !state.online) {
    notify({ online: true });
  }
  void flush();
}

/**
 * Wire up browser event listeners (once per page load) and scope the sync
 * layer to `accountId` (every call — safe/idempotent via `setAccount`, so
 * this can be called again whenever the signed-in account changes without a
 * full page reload, e.g. sign-out then a different sign-in in one tab).
 * `accountId` is `null` while signed out; no queue/cache access happens then.
 */
export function initSync(accountId: string | null) {
  if (typeof window === "undefined") return;
  void setAccount(accountId);
  if (started) return;
  started = true;
  const onOnline = () => {
    notify({ online: true });
    void flush();
  };
  const onOffline = () => notify({ online: false });
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resync();
  });
  window.addEventListener("focus", resync);
  window.setInterval(resync, 20000);
  resync();
}
