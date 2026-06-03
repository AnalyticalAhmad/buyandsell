import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShopVerse Admin",
  description: "ShopVerse admin dashboard",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-theme">{children}</div>;
}
