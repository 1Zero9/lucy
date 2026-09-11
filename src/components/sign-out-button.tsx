"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/client";
import { flush, getSyncState, setAccount } from "@/lib/offline/client";

export function SignOutButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);

    // Give any unsynced edit one last chance to reach the server before
    // asking — most "pending work" turns out to be a few seconds of
    // network lag, not a real offline stretch.
    if (getSyncState().pending > 0) await flush();

    const pending = getSyncState().pending;
    if (pending > 0) {
      const email = session?.user?.email ?? "your account";
      const ok = window.confirm(
        `You have ${pending} change${pending === 1 ? "" : "s"} not yet synced. ` +
          `They'll stay saved on this device and sync next time you sign in as ${email}. ` +
          `Sign out anyway?`
      );
      if (!ok) {
        setBusy(false);
        return;
      }
    }

    await signOut();
    // Detach the sync layer from this account so its in-memory state (and
    // any UI still mounted during the redirect) can't keep showing this
    // account's pending/conflict state to whoever uses the device next.
    await setAccount(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn-plain" type="button" onClick={onClick} disabled={busy}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
