"use client";

import { useActionState } from "react";
import { createWorkspaceAction, type ActionState } from "@/app/actions";

const initial: ActionState = {};

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspaceAction, initial);

  return (
    <form action={formAction} className="field" style={{ maxWidth: 420 }}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <label htmlFor="ws-name">Workspace name</label>
      <input id="ws-name" name="name" required placeholder="e.g. Data Science MSc" />
      <label htmlFor="ws-purpose" style={{ marginTop: 8 }}>
        Purpose (optional)
      </label>
      <input id="ws-purpose" name="purpose" placeholder="What is it for?" />
      <button className="btn" type="submit" disabled={pending} style={{ marginTop: 10 }}>
        {pending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}
