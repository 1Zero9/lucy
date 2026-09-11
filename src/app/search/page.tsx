import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { search, type SearchHit } from "@/lib/db/search";
import { AppShell } from "@/components/app-shell";

export const metadata = { title: "Search · LUCY" };

const HREF: Record<SearchHit["type"], (id: string) => string> = {
  note: (id) => `/notes/${id}`,
  task: () => "/tasks",
  sticky: () => "/stickies",
  module: () => "/modules",
  research: () => "/research",
  flashcard: () => "/flashcards"
};

const GROUP_LABEL: Record<SearchHit["type"], string> = {
  note: "Notes",
  task: "Tasks",
  sticky: "Stickies",
  module: "Modules",
  research: "Research",
  flashcard: "Flashcards"
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const q = (await searchParams).q?.trim() ?? "";
  const results = q ? await search(getDb(), user.id, active.id, q) : null;
  const total = results
    ? Object.values(results).reduce((n, list) => n + list.length, 0)
    : 0;

  return (
    <AppShell active="search">
      <div className="topbar">
        <div>
          <h1 className="page-title">Search</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
      </div>

      <form action="/search" className="inline-form" style={{ marginBottom: 20 }}>
        <input
          name="q"
          defaultValue={q}
          autoFocus
          aria-label="Search"
          placeholder="Search notes, tasks, modules, research…"
          style={{ minWidth: "min(480px, 100%)" }}
        />
        <button className="btn" type="submit">
          Search
        </button>
      </form>

      {!q ? (
        <p className="muted">Type something to search this workspace.</p>
      ) : total === 0 ? (
        <div className="empty">No matches for “{q}”.</div>
      ) : (
        (Object.keys(GROUP_LABEL) as SearchHit["type"][]).map((type) => {
          const list = results?.[type] ?? [];
          if (list.length === 0) return null;
          return (
            <section key={type} className="task-group">
              <div className="section-head">
                <h2>
                  {GROUP_LABEL[type]} <span className="muted">({list.length})</span>
                </h2>
              </div>
              <ul className="note-list">
                {list.map((hit) => (
                  <li key={`${type}-${hit.id}`}>
                    <Link href={HREF[type](hit.id)}>
                      <span className="note-list-title">{hit.title || "Untitled"}</span>
                      {hit.snippet ? (
                        <span className="muted note-list-snippet">{hit.snippet}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </AppShell>
  );
}
