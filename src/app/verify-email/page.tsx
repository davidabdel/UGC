"use client";

import Link from "next/link";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams?.email;
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--surface)] text-[color:var(--text)] px-6">
      <div className="glass-card max-w-md w-full !p-8 text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-white/80">
          We’ve sent a confirmation link to{" "}
          <strong>{email || "your email address"}</strong>. Click the link to
          activate your account.
        </p>
        <p className="mt-4 text-sm text-white/60">
          Didn’t receive it? Check spam or{" "}
          <Link className="text-[color:var(--brand-2)] underline" href="/login">
            try logging in
          </Link>{" "}
          to resend.
        </p>
      </div>
    </div>
  );
}
