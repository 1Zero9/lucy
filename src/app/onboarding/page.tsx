import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { countWorkspaces } from "@/lib/db/workspaces";
import { OnboardingForm } from "@/components/onboarding-form";

export const metadata = { title: "Welcome · LUCY" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if ((await countWorkspaces(getDb(), user.id)) > 0) redirect("/");

  return (
    <main className="auth">
      <div className="auth-card" style={{ width: "min(520px, 100%)" }}>
        <h1>Welcome to LUCY</h1>
        <p className="sub">
          A couple of questions so LUCY fits how <em>you</em> learn. Nothing here is fixed —
          you can rename or change all of it later.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
