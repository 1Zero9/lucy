import type { Module } from "@/lib/db/modules";

/** Read-only module cards for the Home overview. */
export function ModuleGrid({ modules }: { modules: Module[] }) {
  if (modules.length === 0) {
    return <div className="empty">No modules yet.</div>;
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
