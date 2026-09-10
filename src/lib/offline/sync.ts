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

/** Seed the local cache from a server-rendered note, unless local edits are pending. */
export async function seedNoteCache(note: NoteShape): Promise<CachedNote> {
  const existing = await readCachedNote(note.id);
  if (existing?.dirty) return existing;
  const fresh: CachedNote = {
    id: note.id,
    title: note.title,
    text: note.content_text,
    serverUpdatedAt: note.updated_at,
    dirty: false
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
  await writeCachedNote({
    id: noteId,
    title: payload.title,
    text: payload.text,
    serverUpdatedAt: baseUpdatedAt,
    dirty: true
  });

  const queue = await readQueue();
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
      attempts: 0
    });
  }

  notify({ pending: await queueCount() });
  void flush();
}

async function stillQueuedFor(noteId: string): Promise<boolean> {
  return (await readQueue()).some((m) => m.noteId === noteId);
}

/** After a note's write lands, later queued edits for it must rebase onto the new server time. */
async function rebase(noteId: string, newUpdatedAt: string) {
  for (const m of await readQueue()) {
    if (m.noteId === noteId && m.qid !== undefined) {
      await updateQueued({ ...m, baseUpdatedAt: newUpdatedAt });
    }
  }
}

async function preserveAsHistory(noteId: string, payload: { title: string; text: string }) {
  await fetch(`/api/notes/${noteId}/versions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: payload.title, text: payload.text, source: "import" })
  }).catch(() => {});
}

export async function flush(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    notify({ online: false });
    return;
  }
  flushing = true;
  notify({ syncing: true, online: true });
  let error: string | null = null;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const queue = await readQueue();
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
        await rebase(item.noteId, note.updated_at);
        await writeCachedNote({
          id: note.id,
          title: note.title,
          text: note.content_text,
          serverUpdatedAt: note.updated_at,
          dirty: await stillQueuedFor(note.id)
        });
      } else if (res.status === 409) {
        const { note: serverNote } = (await res.json()) as { note: NoteShape };
        await preserveAsHistory(item.noteId, item.payload);
        await removeFromQueue(item.qid);
        await rebase(item.noteId, serverNote.updated_at);
        await writeCachedNote({
          id: serverNote.id,
          title: serverNote.title,
          text: serverNote.content_text,
          serverUpdatedAt: serverNote.updated_at,
          dirty: await stillQueuedFor(serverNote.id)
        });
        if (!state.conflicts.includes(item.noteId)) {
          notify({ conflicts: [...state.conflicts, item.noteId] });
        }
      } else if (res.status === 401) {
        error = "Sign in again to sync your changes.";
        break;
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        error = body.error ?? "Some changes could not be saved.";
        await removeFromQueue(item.qid);
      }
    }
  } finally {
    flushing = false;
    notify({ syncing: false, pending: await queueCount(), error });
  }
}

export function initSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  const onOnline = () => {
    notify({ online: true });
    void flush();
  };
  const onOffline = () => notify({ online: false });
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flush();
  });
  window.setInterval(() => void flush(), 20000);
  queueCount().then((pending) => notify({ pending }));
  void flush();
}
