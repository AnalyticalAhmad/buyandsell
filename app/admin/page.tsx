"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAuthStore } from "@/lib/authStore";

export default function AdminPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace("/Auth/Login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [ready, token, user, router]);

  if (!ready || !token || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-[#888]">
        Loading dashboard...
      </div>
    );
  }

  return <AdminDashboard />;
}
