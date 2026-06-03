"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Crown,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  ShoppingCart,
  ShoppingBag,
  Star,
  Tags,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/authStore";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin#products", icon: Package },
  { label: "Add Product", href: "/admin#add-product", icon: PlusCircle },
  { label: "Orders", href: "/admin#orders", icon: ShoppingBag, soon: true },
  { label: "Users", href: "/admin#users", icon: Users, soon: true },
  { label: "Categories", href: "/admin#categories", icon: Tags, soon: true },
  { label: "Reviews", href: "/admin#reviews", icon: Star, soon: true },
  { label: "Settings", href: "/admin#settings", icon: Settings, soon: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    function syncActiveHash() {
      setActiveHash(window.location.hash);
    }

    syncActiveHash();
    window.addEventListener("hashchange", syncActiveHash);
    return () => window.removeEventListener("hashchange", syncActiveHash);
  }, []);

  function handleNavClick(e: React.MouseEvent, soon?: boolean) {
    if (soon) {
      e.preventDefault();
      toast("Coming soon.", { icon: "🛠️" });
      return;
    }

    const href = e.currentTarget.getAttribute("href") || "";
    const hash = href.includes("#") ? `#${href.split("#")[1]}` : "";
    setActiveHash(hash);
  }

  function handleLogout() {
    logout();
    toast.success("Logged out.");
    router.push("/Auth/Login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col overflow-y-auto overscroll-contain border-r border-[#1f1f1f] bg-[#0b0b0b]">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4a017]/15">
          <ShoppingCart className="h-5 w-5 text-[#d4a017]" strokeWidth={2.2} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">Buy&Sell</span>
      </div>

      <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#666]">Main</p>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const itemHash = item.href.includes("#") ? `#${item.href.split("#")[1]}` : "";
          const isActive =
            pathname === "/admin" &&
            (item.href === "/admin" ? activeHash === "" : activeHash === itemHash);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.soon)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-l-2 border-[#d4a017] bg-[#d4a017]/10 pl-[10px] text-white"
                  : "border-l-2 border-transparent text-[#a3a3a3] hover:bg-[#151515] hover:text-white"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-[#d4a017]" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-4 pb-5">
        <div className="rounded-xl border border-[#252525] bg-[#151515] px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <Crown className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a017]" />
            <p className="text-xs leading-relaxed text-[#888]">
              You are logged in as{" "}
              <span className="font-semibold text-[#d4a017]">Admin</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[#a3a3a3] transition-colors hover:bg-[#151515] hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
