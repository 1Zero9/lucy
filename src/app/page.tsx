import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Page() {
  const user = await requireUser();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">LUCY</div>
        <nav className="nav" aria-label="Primary">
          <Link href="/">Home</Link>
          <a href="#">Modules</a>
          <a href="#">Notes</a>
          <a href="#">Tasks</a>
          <Link href="/settings">Settings</Link>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <span className="who">
            Signed in as <strong>{user.email}</strong>
          </span>
          <SignOutButton />
        </div>

        <section className="hero">
          <h1>Your learning workspace.</h1>
          <p>Capture. Organise. Learn. Succeed.</p>
        </section>

        <input className="search" aria-label="Search" placeholder="Search anything…" disabled />

        <section className="cards" aria-label="Getting started">
          <article className="card">
            <h2>Start a workspace</h2>
            <p>Create a home for any course, subject, qualification or learning project.</p>
          </article>
          <article className="card">
            <h2>Create a module</h2>
            <p>Keep related notes and resources together without complicated navigation.</p>
          </article>
          <article className="card">
            <h2>Write your first note</h2>
            <p>Fast, safe note-taking is the first core LUCY workflow.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
