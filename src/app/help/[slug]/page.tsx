import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { Markdown } from "@/components/markdown";
import { getHelpTopic, HELP_TOPICS } from "@/lib/help-content";

export function generateStaticParams() {
  return HELP_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const topic = getHelpTopic((await params).slug);
  return { title: topic ? `${topic.title} · Help · LUCY` : "Help · LUCY" };
}

export default async function HelpTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const topic = getHelpTopic((await params).slug);
  if (!topic) notFound();

  return (
    <AppShell active="help">
      <p style={{ marginTop: 0 }}>
        <Link className="linkish" href="/help">
          ← Help
        </Link>
      </p>
      <h1 className="page-title" style={{ marginBottom: 12 }}>
        {topic.title}
      </h1>
      <Markdown source={topic.body} />
    </AppShell>
  );
}
