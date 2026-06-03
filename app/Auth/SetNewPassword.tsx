"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, RefreshCw } from "lucide-react";
import { authRequest } from "./authApi";

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function SetNewPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const otp = searchParams.get("otp") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const password = newPassword.trim();
    const confirmedPassword = confirmPassword.trim();

    if (!email || !otp) {
      setError("Reset session is missing. Please request a new OTP.");
      return;
    }

    if (!passwordPattern.test(password)) {
      setError("Password must be at least 8 characters and include uppercase, number, and special character.");
      return;
    }

    if (password !== confirmedPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authRequest("/auth/reset-password", {
        body: { email, otp, password },
      });
      router.push("/Auth/Login");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update password.");
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

          <form className="px-7 pb-8 pt-0 sm:px-8" onSubmit={handleSubmit} noValidate>
            <div className="mb-7 text-center">
              <div className="relative mx-auto -mt-5 mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white">
                <RefreshCw className="h-12 w-12 text-gray-950" strokeWidth={1.6} />
                <LockKeyhole className="absolute h-5 w-5 text-gray-950" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-gray-950">Set New Password</h1>
              <p className="mt-1 text-base text-gray-900">Create a strong new password.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="New Password"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50/60 pl-11 pr-20 text-[15px] font-medium text-gray-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-200"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    onClick={() => setShowNewPassword((visible) => !visible)}
                    className="absolute right-11 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide new password" : "Password hidden"}
                    onClick={() => setShowNewPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                </label>
                <div className="mt-3 grid h-1 grid-cols-[0.34fr_0.34fr_0.32fr] gap-1 overflow-hidden rounded-full bg-gray-200">
                  <span className="rounded-full bg-emerald-500" />
                  <span className="rounded-full bg-emerald-500" />
                  <span className="rounded-full bg-gray-200" />
                </div>
              </div>

              <label className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmNewPassword"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Confirm New Password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50/60 pl-11 pr-20 text-[15px] font-medium text-gray-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-200"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-11 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Password hidden"}
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </label>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-violet-700 text-[15px] font-semibold text-white shadow-md shadow-violet-700/25 transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
