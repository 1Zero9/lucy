import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { ProfileForm } from "@/components/profile-form";

export const metadata = { title: "Settings · LUCY" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AppShell active="settings">
      <div className="topbar">
        <h1 className="page-title">Settings</h1>
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
    </AppShell>
  );
}
