import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata = { title: "Reset password · LUCY" };

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="auth">
      <ResetPasswordForm token={token} />
    </main>
  );
}
