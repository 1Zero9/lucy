import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = { title: "Reset password · LUCY" };

export default async function ForgotPasswordPage() {
  if (await getSessionUser()) redirect("/");
  return (
    <main className="auth">
      <ForgotPasswordForm />
    </main>
  );
}
