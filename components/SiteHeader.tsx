"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  Settings,
  ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import {
  type CategoryTreeItem,
  fetchCategoryTree,
  getCategoryIcon,
} from "@/lib/categories";

type NavKey = "home" | "products";

type SiteHeaderProps = {
  activeNav?: NavKey;
};

type CartSummaryResponse = {
  itemCount?: number;
};

export function SiteHeader({ activeNav }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchCategoryTree()
      .then((categories) => {
        if (cancelled) return;
        setCategoryTree(categories);
        setActiveCategorySlug((current) => current ?? categories[0]?.slug ?? null);
      })
      .catch(() => {
        if (!cancelled) setCategoryTree([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshCartCount = useCallback(async () => {
    if (!token || !user || user.role === "admin") {
      setCartCount(0);
      return;
    }
    try {
      const data = await apiRequest<CartSummaryResponse>("/cart", { method: "GET" });
      setCartCount(typeof data.itemCount === "number" ? data.itemCount : 0);
    } catch {
      setCartCount(0);
    }
  }, [token, user]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void Promise.resolve().then(() => {
      void refreshCartCount();
    });
  }, [hydrated, pathname, refreshCartCount]);

  useEffect(() => {
    function onCartUpdated() {
      void refreshCartCount();
    }
    window.addEventListener("cart-updated", onCartUpdated);
    return () => window.removeEventListener("cart-updated", onCartUpdated);
  }, [refreshCartCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/Auth/Login");
  };

  const showCart = Boolean(user && user.role !== "admin");
  const initials = (user?.username || user?.name || "?").slice(0, 1).toUpperCase();
  const activeCategory =
    categoryTree.find((category) => category.slug === activeCategorySlug) ?? categoryTree[0];

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="text-2xl font-bold text-violet-600">Buy</span>
            <span className="text-2xl font-bold text-gray-900">&</span>
            <span className="text-2xl font-bold text-violet-600">Sell</span>
          </Link>

          <div className="flex-1 max-w-xl hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                readOnly
                aria-readonly
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center pointer-events-none">
                <Search className="w-4 h-4 text-white" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {showCart && (
              <Link
                href="/cart"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 flex items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {!hydrated ? (
              <div className="h-10 w-24 rounded-lg bg-gray-100 animate-pulse" />
            ) : user && token ? (
              <div className="relative flex items-center gap-2" ref={menuRef}>
                <div className="hidden sm:flex flex-col items-end text-right leading-tight mr-1">
                  <span className="text-sm font-semibold text-slate-900 max-w-[140px] truncate">
                    {user.username}
                  </span>
                  {user.role === "admin" && (
                    <span className="text-[11px] font-medium uppercase tracking-wide text-violet-700">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 pl-1 pr-2 py-1 hover:bg-gray-50 transition-colors"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white shadow-sm">
                    {initials}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg shadow-violet-950/10 z-50"
                  >
                    <div className="sm:hidden px-3 py-2 border-b border-gray-50">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.username}</p>
                      {user.role === "admin" && (
                        <p className="text-xs font-medium text-violet-700 mt-0.5">Admin</p>
                      )}
                    </div>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-violet-700 hover:bg-violet-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpen(false);
                        toast("Settings coming soon.", { icon: "⚙️" });
                      }}
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      Settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/Auth/Login"
                className="px-4 sm:px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            className={`text-sm font-medium ${activeNav === "home" ? "text-violet-600" : "text-gray-600 hover:text-gray-900"}`}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`text-sm font-medium ${activeNav === "products" ? "text-violet-600" : "text-gray-600 hover:text-gray-900"}`}
          >
            Products
          </Link>
          <div
            ref={categoryMenuRef}
            className="relative hidden sm:block"
            onMouseEnter={() => {
              setCategoryMenuOpen(true);
              setActiveCategorySlug((current) => current ?? categoryTree[0]?.slug ?? null);
            }}
            onMouseLeave={() => setCategoryMenuOpen(false)}
            onBlur={(event) => {
              if (!categoryMenuRef.current?.contains(event.relatedTarget as Node | null)) {
                setCategoryMenuOpen(false);
              }
            }}
          >
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
              aria-expanded={categoryMenuOpen}
              aria-haspopup="menu"
              onClick={() => {
                setCategoryMenuOpen((open) => !open);
                setActiveCategorySlug((current) => current ?? categoryTree[0]?.slug ?? null);
              }}
              onFocus={() => {
                setCategoryMenuOpen(true);
                setActiveCategorySlug((current) => current ?? categoryTree[0]?.slug ?? null);
              }}
            >
              Categories
              <ChevronDown
                className={`w-4 h-4 transition-transform ${categoryMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {categoryMenuOpen && (
              <div className="absolute left-0 top-full z-50 w-[560px] pt-3">
                <div
                  role="menu"
                  className="grid grid-cols-[230px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-violet-950/10"
                >
                  <div className="border-r border-gray-100 bg-gray-50/70 p-2">
                    <Link
                      href="/products?shuffle=true"
                      role="menuitem"
                      className="mb-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white hover:text-violet-700"
                      onClick={() => setCategoryMenuOpen(false)}
                    >
                      All Products
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    {categoryTree.map((category) => {
                      const IconComponent = getCategoryIcon(category.icon);
                      const isActive = activeCategory?.slug === category.slug;
                      return (
                        <Link
                          key={category.slug}
                          href={`/products?main=${encodeURIComponent(category.slug)}`}
                          role="menuitem"
                          className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? "bg-white font-semibold text-violet-700 shadow-sm"
                              : "font-medium text-gray-700 hover:bg-white hover:text-gray-900"
                          }`}
                          onMouseEnter={() => setActiveCategorySlug(category.slug)}
                          onFocus={() => setActiveCategorySlug(category.slug)}
                          onClick={() => setCategoryMenuOpen(false)}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <IconComponent className="h-4 w-4 shrink-0 text-violet-500" />
                            <span className="truncate">{category.name}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="p-3">
                    {activeCategory ? (
                      <>
                        <div className="mb-2 flex items-center justify-between gap-3 px-2">
                          <p className="text-sm font-semibold text-gray-900">{activeCategory.name}</p>
                          <Link
                            href={`/products?main=${encodeURIComponent(activeCategory.slug)}`}
                            className="text-xs font-medium text-violet-600 hover:text-violet-700"
                            onClick={() => setCategoryMenuOpen(false)}
                          >
                            View all
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {activeCategory.subcategories.map((sub) => (
                            <Link
                              key={sub.slug}
                              href={`/products?main=${encodeURIComponent(activeCategory.slug)}&sub=${encodeURIComponent(sub.slug)}`}
                              role="menuitem"
                              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                              onClick={() => setCategoryMenuOpen(false)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="px-3 py-8 text-center text-sm text-gray-500">
                        Categories are loading.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-gray-400">Sell</span>
          <span className="hidden sm:inline text-sm font-medium text-gray-400">Deals</span>
        </div>
      </nav>
    </header>
  );
}
