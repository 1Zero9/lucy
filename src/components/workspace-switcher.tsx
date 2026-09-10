"use client";

import { useRef } from "react";
import { switchWorkspaceAction } from "@/app/actions";

type Item = { id: string; name: string };

export function WorkspaceSwitcher({
  workspaces,
  activeId
}: {
  workspaces: Item[];
  activeId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  if (workspaces.length < 2) return null;

  return (
    <form ref={formRef} action={switchWorkspaceAction} className="switcher">
      <label htmlFor="ws-switch" className="muted" style={{ fontSize: 13 }}>
        Workspace
      </label>
      <select
        id="ws-switch"
        name="workspaceId"
        defaultValue={activeId}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </form>
  );
}
