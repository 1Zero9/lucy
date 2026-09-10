"use client";

/** Public surface of the offline layer for components. */
export {
  getSyncState,
  subscribeSync,
  dismissConflict,
  seedNoteCache,
  queueNoteUpdate,
  flush,
  initSync,
  type SyncState
} from "./sync";

import { readCachedNote, type CachedNote } from "./store";

export function readCachedNoteFor(id: string): Promise<CachedNote | null> {
  return readCachedNote(id);
}
