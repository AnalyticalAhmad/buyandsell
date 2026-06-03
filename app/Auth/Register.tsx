"use client";

import Link from "next/link";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShoppingCart,
  User,
  UserRound,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authRequest } from "./authApi";

type RegisterForm = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

const initialForm: RegisterForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const usernamePattern = /^[A-Za-z0-9_]+$/;

function normalizeForm(form: RegisterForm): RegisterForm {
  return {
    fullName: form.fullName.trim(),
    username: form.username.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password.trim(),
    confirmPassword: form.confirmPassword.trim(),
  };
}

function getPasswordStrength(password: string) {
  const trimmedPassword = password.trim();
  const score = [
    trimmedPassword.length >= 8,
    /[A-Z]/.test(trimmedPassword),
    /\d/.test(trimmedPassword),
    /[^A-Za-z0-9]/.test(trimmedPassword),
  ].filter(Boolean).length;

  if (!trimmedPassword) {
    return { label: "Password strength", color: "bg-gray-200", segments: 0 };
  }

  if (score <= 2) {
    return { label: "Weak password", color: "bg-red-500", segments: 1 };
  }

  if (score === 3) {
    return { label: "Medium password", color: "bg-amber-400", segments: 2 };
  }

  return { label: "Strong password", color: "bg-emerald-500", segments: 3 };
}

function validateRegisterForm(form: RegisterForm): RegisterErrors {
  const values = normalizeForm(form);
  const nextErrors: RegisterErrors = {};

  if (!values.fullName) {
    nextErrors.fullName = "Full name is required.";
  } else if (values.fullName.length < 3) {
    nextErrors.fullName = "Full name must be at least 3 characters.";
  } else if (/^\d+$/.test(values.fullName)) {
    nextErrors.fullName = "Full name cannot contain only numbers.";
  } else if (/\s{2,}/.test(values.fullName)) {
    nextErrors.fullName = "Full name cannot contain multiple spaces.";
  }

  if (!values.username) {
    nextErrors.username = "Username is required.";
  } else if (values.username.length < 3 || values.username.length > 15) {
    nextErrors.username = "Username must be 3 to 15 characters.";
  } else if (/\s/.test(values.username)) {
    nextErrors.username = "Username cannot contain spaces.";
  } else if (!usernamePattern.test(values.username)) {
    nextErrors.username = "Username can only use letters, numbers, and underscore.";
  }

  if (!values.email) {
    nextErrors.email = "Email is required.";
  } else if (!emailPattern.test(values.email)) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    nextErrors.password = "Password is required.";
  } else if (
    values.password.length < 8 ||
    !/[A-Z]/.test(values.password) ||
    !/\d/.test(values.password) ||
    !/[^A-Za-z0-9]/.test(values.password)
  ) {
    nextErrors.password =
      "Password must be at least 8 characters and include uppercase, number, and special character.";
  }

  if (!values.confirmPassword) {
    nextErrors.confirmPassword = "Confirm password is required.";
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = "Passwords do not match.";
  }

  return nextErrors;
}

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleChange =
    (field: keyof RegisterForm) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = field === "email" ? event.target.value.toLowerCase() : event.target.value;
      const nextForm = { ...form, [field]: value };

      setForm(nextForm);
      setErrors((currentErrors) => {
        if (!currentErrors[field] && field !== "password") {
          return currentErrors;
        }

        const nextErrors = validateRegisterForm(nextForm);
        const updatedErrors = { ...currentErrors };

        if (!nextErrors[field]) {
          delete updatedErrors[field];
        } else if (currentErrors[field]) {
          updatedErrors[field] = nextErrors[field];
        }

        if (field === "password" || field === "confirmPassword") {
          if (!nextErrors.confirmPassword) {
            delete updatedErrors.confirmPassword;
          } else if (currentErrors.confirmPassword) {
            updatedErrors.confirmPassword = nextErrors.confirmPassword;
          }
        }

        return updatedErrors;
      });
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");

    const normalizedForm = normalizeForm(form);
    const nextErrors = validateRegisterForm(normalizedForm);

    setForm(normalizedForm);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await authRequest("/auth/register", {
        body: {
          name: normalizedForm.fullName,
          username: normalizedForm.username,
          email: normalizedForm.email,
          password: normalizedForm.password,
        },
      });
      router.push(`/Auth/VerifyEmail?flow=register&email=${encodeURIComponent(normalizedForm.email)}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="absolute inset-x-0 top-0 h-[42vh] rounded-b-[45%] bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600" />

        <div className="relative w-full max-w-[430px] rounded-[20px] bg-white shadow-2xl shadow-violet-950/20">
          <div className="h-[54px] rounded-t-[20px] bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600" />

          <div className="absolute left-1/2 top-[31px] flex h-[72px] w-[72px] -translate-x-1/2 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-purple-700/30">
            <ShoppingCart className="h-10 w-10 text-white" strokeWidth={2.2} />
          </div>

          <form className="px-7 pb-7 pt-14 sm:px-8" onSubmit={handleSubmit} noValidate>
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-bold text-gray-950">Create Account</h1>
              <p className="mt-1 text-base text-gray-700">Join our marketplace.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="relative block">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    placeholder="Full Name"
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    className={`h-11 w-full rounded-lg border bg-gray-50/60 pl-11 pr-4 text-[15px] font-medium text-gray-950 outline-none transition focus:bg-white focus:ring-2 ${
                      errors.fullName
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-violet-500 focus:ring-violet-200"
                    }`}
                  />
                </label>
                {errors.fullName && (
                  <p id="fullName-error" className="mt-1 text-xs font-medium text-red-600">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="relative block">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange("username")}
                    placeholder="Username"
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby={errors.username ? "username-error" : undefined}
                    className={`h-11 w-full rounded-lg border bg-gray-50/60 pl-11 pr-4 text-[15px] font-medium text-gray-950 outline-none transition focus:bg-white focus:ring-2 ${
                      errors.username
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-violet-500 focus:ring-violet-200"
                    }`}
                  />
                </label>
                {errors.username && (
                  <p id="username-error" className="mt-1 text-xs font-medium text-red-600">
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="relative block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="Email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`h-11 w-full rounded-lg border bg-gray-50/60 pl-11 pr-4 text-[15px] font-medium text-gray-950 outline-none transition focus:bg-white focus:ring-2 ${
                      errors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-violet-500 focus:ring-violet-200"
                    }`}
                  />
                </label>
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs font-medium text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="Password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error password-strength" : "password-strength"}
                    className={`h-11 w-full rounded-lg border bg-gray-50/60 pl-11 pr-20 text-[15px] font-medium text-gray-950 outline-none transition focus:bg-white focus:ring-2 ${
                      errors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-violet-500 focus:ring-violet-200"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-11 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Password hidden"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                </label>
                <div className="mt-2 grid h-1 grid-cols-3 gap-1 overflow-hidden rounded-full bg-gray-200">
                  {[1, 2, 3].map((segment) => (
                    <span
                      key={segment}
                      className={`rounded-full ${
                        passwordStrength.segments >= segment ? passwordStrength.color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p
                  id="password-strength"
                  className={`mt-1 text-xs font-semibold ${
                    passwordStrength.segments === 1
                      ? "text-red-600"
                      : passwordStrength.segments === 2
                        ? "text-amber-600"
                        : passwordStrength.segments === 3
                          ? "text-emerald-600"
                          : "text-gray-700"
                  }`}
                >
                  {passwordStrength.label}
                </p>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs font-medium text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-800" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    placeholder="Confirm Password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    className={`h-11 w-full rounded-lg border bg-gray-50/60 pl-11 pr-12 text-[15px] font-medium text-gray-950 outline-none transition focus:bg-white focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-violet-500 focus:ring-violet-200"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                </label>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="mt-1 text-xs font-medium text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {serverError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 h-11 w-full rounded-lg bg-violet-700 text-[15px] font-semibold text-white shadow-md shadow-violet-700/25 transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>

            <button
              type="button"
              className="mt-3 flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-gray-400 bg-white text-[15px] font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </button>

            <p className="mt-4 text-center text-sm text-gray-900">
              Already have an account?{" "}
              <Link href="/Auth/Login" className="font-medium text-violet-800 hover:text-violet-950">
                Login
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
