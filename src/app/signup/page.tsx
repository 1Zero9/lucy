import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Create account · LUCY" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/");
  return (
    <main className="auth">
      <AuthForm mode="signup" />
    </main>
  );
}
