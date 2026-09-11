import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { HELP_TOPICS } from "@/lib/help-content";

export const metadata = { title: "Help · LUCY" };

export default async function HelpPage() {
  await requireUser();

  return (
    <AppShell active="help">
      <div className="topbar">
        <h1 className="page-title">Help</h1>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Short guides to what LUCY does and how to get around it.
      </p>
      <ul className="note-list">
        {HELP_TOPICS.map((t) => (
          <li key={t.slug}>
            <Link href={`/help/${t.slug}`}>
              <span className="note-list-title">{t.title}</span>
              <span className="muted note-list-snippet">{t.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
