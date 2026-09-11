import Link from "next/link";
import type { Module } from "@/lib/db/modules";
import { ModulesIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

/** Read-only module cards for the Home overview. */
export function ModuleGrid({ modules }: { modules: Module[] }) {
  if (modules.length === 0) {
    return (
      <EmptyState
        icon={<ModulesIcon size={22} />}
        title="No modules yet"
        body="Modules keep related notes, tasks and files together under a subject or topic."
        action={
          <Link className="btn" href="/modules" style={{ width: "auto", padding: "0 16px" }}>
            Create a module
          </Link>
        }
      />
    );
  }
  return (
    <div className="module-grid">
      {modules.map((m) => (
        <article className="module-card" key={m.id} style={{ borderLeftColor: m.colour }}>
          {m.code ? <span className="code">{m.code}</span> : null}
          <h3>{m.name}</h3>
          {m.description ? <p className="muted">{m.description}</p> : null}
        </article>
      ))}
    </div>
  );
}
