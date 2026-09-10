"use client";

import { useEffect, useState } from "react";
import { getSyncState, initSync, flush, subscribeSync, type SyncState } from "@/lib/offline/client";

export function OfflineBar() {
  const [s, setS] = useState<SyncState>(getSyncState());

  useEffect(() => {
    initSync();
    const unsub = subscribeSync(setS);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return unsub;
  }, []);

  const show = !s.online || s.pending > 0 || s.error !== null;
  if (!show) return null;

  let message: string;
  if (s.error) message = s.error;
  else if (!s.online) message = "You’re offline. Changes are saved on this device and will sync when you reconnect.";
  else message = "Syncing changes…";

  return (
    <div className={`offline-bar${s.error ? " is-error" : !s.online ? " is-offline" : ""}`} role="status">
      <span>{message}</span>
      {s.error ? (
        <button type="button" className="linkish" onClick={() => void flush()}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
