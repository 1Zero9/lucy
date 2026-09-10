import { renderMarkdown } from "@/lib/markdown";

/**
 * Renders LUCY note Markdown. The HTML comes from {@link renderMarkdown}, which
 * is allowlist-only and escapes all input first — no raw HTML passthrough.
 */
export function Markdown({ source }: { source: string }) {
  const trimmed = source.trim();
  if (!trimmed) {
    return <p className="muted">Nothing to preview yet.</p>;
  }
  return (
    <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />
  );
}
