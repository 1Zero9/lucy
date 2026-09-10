import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign in · LUCY" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");
  return (
    <main className="auth">
      <AuthForm mode="login" />
    </main>
  );
}
