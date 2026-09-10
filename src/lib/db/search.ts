/**
 * Query-time search: owner + workspace scoped LIKE across the text-bearing
 * tables. No schema, no semantic/vector search (MASTER.md — "Start with normal
 * database search"). Each whitespace-separated term must match somewhere in the
 * row (AND); matching is case-insensitive.
 */

export type SearchHit = {
  type: "note" | "task" | "sticky" | "module" | "research" | "flashcard";
  id: string;
  title: string;
  snippet: string;
};

function terms(q: string): string[] {
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
}

function likeGroup(cols: string[], count: number): string {
  // One "(col LIKE ? OR col LIKE ? ...)" per term, all ANDed.
  const perTerm = `(${cols.map((c) => `LOWER(${c}) LIKE ?`).join(" OR ")})`;
  return Array.from({ length: count }, () => perTerm).join(" AND ");
}

function bindings(cols: string[], ts: string[]): string[] {
  const out: string[] = [];
  for (const t of ts) for (let i = 0; i < cols.length; i++) out.push(`%${t}%`);
  return out;
}

export async function search(
  db: D1Database,
  userId: string,
  workspaceId: string,
  query: string,
  perType = 8
): Promise<Record<SearchHit["type"], SearchHit[]>> {
  const ts = terms(query);
  const empty = {
    note: [],
    task: [],
    sticky: [],
    module: [],
    research: [],
    flashcard: []
  } as Record<SearchHit["type"], SearchHit[]>;
  if (ts.length === 0) return empty;

  const run = async (
    type: SearchHit["type"],
    table: string,
    cols: string[],
    titleExpr: string,
    snippetExpr: string,
    extraWhere = ""
  ): Promise<SearchHit[]> => {
    const { results } = await db
      .prepare(
        `SELECT id, ${titleExpr} AS title, ${snippetExpr} AS snippet
         FROM ${table}
         WHERE user_id = ? AND workspace_id = ? AND deleted_at IS NULL ${extraWhere}
           AND ${likeGroup(cols, ts.length)}
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .bind(userId, workspaceId, ...bindings(cols, ts), perType)
      .all<{ id: string; title: string; snippet: string }>();
    return results.map((r) => ({ type, id: r.id, title: r.title ?? "", snippet: r.snippet ?? "" }));
  };

  const [note, task, sticky, mod, research, flashcard] = await Promise.all([
    run("note", "notes", ["title", "content_text"], "title", "substr(content_text, 1, 160)"),
    run("task", "tasks", ["title", "detail"], "title", "COALESCE(detail, '')"),
    run("sticky", "stickies", ["body"], "substr(body, 1, 60)", "substr(body, 1, 160)"),
    run("module", "modules", ["name", "code", "description"], "name", "COALESCE(description, '')"),
    run(
      "research",
      "research_items",
      ["title", "url", "annotation"],
      "title",
      "COALESCE(url, substr(annotation, 1, 160))"
    ),
    run("flashcard", "flashcards", ["front", "back"], "front", "back")
  ]);

  return { note, task, sticky, module: mod, research, flashcard };
}
