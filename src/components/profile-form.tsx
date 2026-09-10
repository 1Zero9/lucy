"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const dirty = name.trim() !== initialName && name.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setStatus("saving");
    const { error } = await authClient.updateUser({ name: name.trim() });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  return (
    <form className="field" onSubmit={onSubmit} style={{ maxWidth: 400 }}>
      <label htmlFor="displayName">Display name</label>
      <input
        id="displayName"
        name="displayName"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setStatus("idle");
        }}
      />
      <button className="btn" type="submit" disabled={!dirty || status === "saving"} style={{ marginTop: 8 }}>
        {status === "saving" ? "Saving…" : "Save name"}
      </button>
      {status === "saved" ? <span className="k">Saved.</span> : null}
      {status === "error" ? <span className="form-error">Could not save. Try again.</span> : null}
    </form>
  );
}
