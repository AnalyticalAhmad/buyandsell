"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { EyeOff, LockKeyhole, MailCheck, ShoppingCart } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { authRequest } from "./authApi";
import { mapApiUser, useAuthStore } from "@/lib/authStore";

type LoginResponse = {
  token: string;
  user: Record<string, unknown>;
};

export default function Login() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const identifier = emailOrUsername.trim().toLowerCase();
    if (!identifier || !password) {
      setError("Email/username and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await authRequest<LoginResponse>("/auth/login", {
        body: { emailOrUsername: identifier, password },
      });
      const authUser = mapApiUser(data.user);
      useAuthStore.getState().setAuth(data.token, authUser);
      router.push(authUser.role === "admin" ? "/admin" : "/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="absolute inset-x-0 top-0 h-[40vh] rounded-b-[45%] bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600" />

        <div className="relative w-full max-w-[430px] rounded-[10px] bg-white shadow-2xl shadow-violet-950/15">
          <div className="absolute left-1/2 top-0 flex h-[66px] w-[66px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[18px] bg-white shadow-md shadow-violet-950/10">
            <div className="relative">
              <ShoppingCart className="h-9 w-9 text-violet-700" strokeWidth={2.2} />
              <span className="absolute -right-1 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-[11px] font-bold text-amber-900">
                $
              </span>
            </div>
          </div>

          <form className="px-7 pb-8 pt-14 sm:px-8" onSubmit={handleSubmit} noValidate>
            <div className="mb-12 text-center">
              <h1 className="text-2xl font-bold text-gray-950">Welcome Back!</h1>
            </div>

            <div className="space-y-7">
              <label className="relative block">
                <MailCheck className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                <input
                  type="text"
                  name="emailOrUsername"
                  value={emailOrUsername}
                  onChange={(event) => {
                    setEmailOrUsername(event.target.value);
                    setError("");
                  }}
                  placeholder="Email/Username"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50/60 pl-11 pr-4 text-[15px] font-medium text-gray-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-200"
                />
              </label>

              <label className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50/60 pl-11 pr-12 text-[15px] font-medium text-gray-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-200"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 font-medium text-gray-900">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-4 w-4 rounded border-gray-300 text-violet-700 focus:ring-violet-500"
                />
                Remember Me
              </label>
              <Link href="/Auth/ForgotPassword" className="font-medium text-violet-800 hover:text-violet-950">
                Forgot Password?
              </Link>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 h-11 w-full rounded-lg bg-violet-700 text-[15px] font-semibold text-white shadow-md shadow-violet-700/25 transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              className="mt-3 flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-gray-400 bg-white text-[15px] font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </button>

            <p className="mt-4 text-center text-sm text-gray-900">
              Don&apos;t have an account?{" "}
              <Link href="/Auth/Register" className="font-medium text-violet-800 hover:text-violet-950">
                Register
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
