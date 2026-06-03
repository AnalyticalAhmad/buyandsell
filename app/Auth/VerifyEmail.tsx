"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { authRequest } from "./authApi";

const otpBoxes = Array.from({ length: 6 }, (_, index) => index);

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const flow = searchParams.get("flow") === "reset" ? "reset" : "register";
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const maskedEmail = email ? email.replace(/^(.{2}).*(@.*)$/, "$1***$2") : "[user's masked email]";
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDigitChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = value;
    setDigits(nextDigits);
    setError("");

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const otp = digits.join("");
    if (!email) {
      setError("Email is missing. Please start the flow again.");
      return;
    }

    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (flow === "reset") {
        await authRequest("/auth/verify-reset-otp", {
          body: { email, otp },
        });
        router.push(`/Auth/SetNewPassword?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
        return;
      }

      await authRequest("/auth/verify-email", {
        body: { email, otp },
      });
      router.push("/Auth/Login");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "OTP verification failed.");
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

          <form className="px-6 pb-8 pt-0 sm:px-7" onSubmit={handleSubmit} noValidate>
            <div className="mb-6 text-center">
              <div className="mx-auto -mt-4 mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-white">
                <MailCheck className="h-12 w-12 text-gray-950" strokeWidth={1.6} />
              </div>
              <h1 className="text-2xl font-bold text-gray-950">Verify Your Email</h1>
              <p className="mx-auto mt-2 max-w-[335px] text-base leading-5 text-gray-900">
                We sent a code to {maskedEmail}. Enter it below.
              </p>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {otpBoxes.map((box) => (
                <input
                  key={box}
                  ref={(element) => {
                    inputRefs.current[box] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digits[box]}
                  onChange={handleDigitChange(box)}
                  aria-label={`OTP digit ${box + 1}`}
                  className={`aspect-[0.86] w-full rounded-lg border bg-gray-50/60 text-center text-xl font-semibold text-gray-950 outline-none transition focus:bg-white focus:ring-2 ${
                    error
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-violet-500 focus:ring-violet-200"
                  }`}
                />
              ))}
            </div>

            {error && <p className="mt-3 text-center text-xs font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-violet-700 text-[15px] font-semibold text-white shadow-md shadow-violet-700/25 transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </button>

            <p className="mt-5 text-center text-sm leading-5 text-gray-900">
              Didn&apos;t receive a code?{" "}
              <Link
                href={flow === "reset" ? "/Auth/ForgotPassword" : "/Auth/Register"}
                className="font-medium text-violet-800 hover:text-violet-950"
              >
                Resend OTP
              </Link>
              <br />
              <span className="text-gray-700">Countdown: 00:10:00</span>
            </p>

            <p className="mt-3 text-center text-sm">
              <Link
                href={flow === "reset" ? "/Auth/ForgotPassword" : "/Auth/Register"}
                className="font-medium text-gray-950 hover:text-violet-800"
              >
                Back
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
