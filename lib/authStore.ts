import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isVerified: boolean;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export function mapApiUser(raw: Record<string, unknown>): AuthUser {
  const id = String(raw.id ?? raw._id ?? "");
  return {
    id,
    name: String(raw.name ?? ""),
    username: String(raw.username ?? ""),
    email: String(raw.email ?? ""),
    role: raw.role === "admin" ? "admin" : "user",
    isVerified: Boolean(raw.isVerified),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "buyandsell-auth" }
  )
);
