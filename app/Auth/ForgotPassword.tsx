"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { authRequest } from "./authApi";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);

    if (!normalizedEmail) {
      setError("Email address is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authRequest("/auth/forgot-password", {
        body: { email: normalizedEmail },
      });
      router.push(`/Auth/VerifyEmail?flow=reset&email=${encodeURIComponent(normalizedEmail)}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send reset OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="absolute inset-x-0 top-0 h-[38vh] bg-white" />

        <div className="relative w-full max-w-[430px] rounded-[10px] bg-white shadow-2xl shadow-gray-900/10">
          <div className="h-[42px] rounded-t-[10px] bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600" />

          <form className="px-7 pb-12 pt-7 sm:px-8" onSubmit={handleSubmit} noValidate>
            <div className="mb-7 text-center">
              <KeyRound className="mx-auto mb-6 h-11 w-11 text-gray-950" strokeWidth={1.8} />
              <h1 className="text-2xl font-bold text-gray-950">Reset Your Password</h1>
              <p className="mx-auto mt-2 max-w-[320px] text-base leading-5 text-gray-900">
                Enter your email to receive a password reset OTP.
              </p>
            </div>

            <label className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value.toLowerCase());
                  setError("");
                }}
                placeholder="Email Address"
                aria-invalid={Boolean(error)}
                className={`h-11 w-full rounded-lg border bg-gray-50/60 pl-11 pr-4 text-[15px] font-medium text-gray-950 outline-none transition focus:bg-white focus:ring-2 ${
                  error
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-violet-500 focus:ring-violet-200"
                }`}
              />
            </label>
            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-violet-700 text-[15px] font-semibold text-white shadow-md shadow-violet-700/25 transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isSubmitting ? "Sending OTP..." : "Send Reset OTP"}
            </button>

            <p className="mt-6 text-center text-sm">
              <Link href="/Auth/Login" className="font-medium text-gray-950 hover:text-violet-800">
                Back to Login
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
