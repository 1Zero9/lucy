import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/sign-out-button";
import { ProfileForm } from "@/components/profile-form";

export const metadata = { title: "Settings · LUCY" };

export default async function SettingsPage() {
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
          <h1 style={{ margin: 0, fontSize: 22 }}>Settings</h1>
          <SignOutButton />
        </div>

        <section aria-label="Profile" style={{ marginBottom: 28 }}>
          <div className="settings-row">
            <span className="k">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="settings-row">
            <span className="k">Email verified</span>
            <span>{user.emailVerified ? "Yes" : "Not yet"}</span>
          </div>
        </section>

        <section aria-label="Profile details">
          <ProfileForm initialName={user.name} />
        </section>
      </main>
    </div>
  );
}
