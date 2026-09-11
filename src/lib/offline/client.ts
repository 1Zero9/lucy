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
  setAccount,
  getCurrentAccountId,
  type SyncState
} from "./sync";

import { readCachedNote, clearAccountData, type CachedNote } from "./store";

export function readCachedNoteFor(id: string, accountId: string): Promise<CachedNote | null> {
  return readCachedNote(id, accountId);
}

/** Clear everything cached/queued for one account — used by sign-out when
 *  the user chooses not to leave unsynced work on a shared device. */
export function clearOfflineDataFor(accountId: string): Promise<void> {
  return clearAccountData(accountId);
}
