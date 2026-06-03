"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Lock, Minus, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { SiteHeader } from "@/components/SiteHeader";
import { apiRequest, productPrimaryImage } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

type PopulatedProduct = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  stock: number;
  category: string;
};

type CartLine = {
  product: PopulatedProduct | string;
  quantity: number;
  price: number;
};

type CartResponse = {
  cart: { items: CartLine[] };
  totalPrice: number;
  itemCount: number;
};

function productId(line: CartLine): string {
  if (typeof line.product === "string") {
    return line.product;
  }
  return line.product._id;
}

function productDoc(line: CartLine): PopulatedProduct | null {
  if (typeof line.product === "string") {
    return null;
  }
  return line.product;
}

export default function CartPage() {
  const { token, user } = useAuthStore();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    await Promise.resolve();
    if (!token || !user || user.role === "admin") {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest<CartResponse>("/cart", { method: "GET" });
      setLines(data.cart?.items ?? []);
      setTotalPrice(data.totalPrice ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load cart.");
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    // Data fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadCart defers setState after await
    void loadCart();
  }, [loadCart]);

  const updateQty = async (productId: string, quantity: number) => {
    try {
      const data = await apiRequest<CartResponse>(`/cart/${productId}`, {
        method: "PUT",
        body: { quantity },
      });
      setLines(data.cart?.items ?? []);
      setTotalPrice(data.totalPrice ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const removeLine = async (productId: string) => {
    try {
      const data = await apiRequest<CartResponse>(`/cart/${productId}`, { method: "DELETE" });
      setLines(data.cart?.items ?? []);
      setTotalPrice(data.totalPrice ?? 0);
      toast.success("Removed from cart.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed.");
    }
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Sign in to view your cart</h1>
          <p className="text-gray-600 mb-8">You need a buyer account to use the cart.</p>
          <Link href="/Auth/Login" className="inline-flex px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Cart is for buyers</h1>
          <p className="text-gray-600 mb-8">
            Admin accounts manage the store. Use a regular user account to shop and add items to the cart.
          </p>
          <Link href="/products" className="text-violet-700 font-semibold hover:text-violet-900">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">My Cart</h1>
            <nav className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-slate-800">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 shrink-0" />
              <span className="text-violet-700 font-medium">My Cart</span>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => toast("Checkout coming soon.", { icon: "🔒" })}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-700 transition-colors"
          >
            <Lock className="w-4 h-4" />
            Secure Checkout
          </button>
        </div>

        <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/80 border border-slate-100/80 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading cart…</div>
          ) : lines.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">Your cart is empty.</p>
              <Link href="/products" className="text-violet-700 font-semibold hover:text-violet-900">
                Continue shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_100px_140px_100px_48px] gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span>Product</span>
                <span className="text-right">Price</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>

              <ul className="divide-y divide-slate-100">
                {lines.map((line) => {
                  const p = productDoc(line);
                  const pid = productId(line);
                  const name = p?.name ?? "Product";
                  const desc = p?.description?.slice(0, 80) ?? "";
                  const img = productPrimaryImage(p || {});
                  const unit = line.price;
                  const sub = unit * line.quantity;
                  const inStock = p ? p.stock >= line.quantity : true;

                  return (
                    <li
                      key={pid}
                      className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px_140px_100px_48px] gap-4 px-4 sm:px-6 py-5 items-center"
                    >
                      <div className="flex gap-4 min-w-0">
                        <div className="relative h-20 w-20 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                          <Image src={img} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <Link href={`/product/${pid}`} className="font-semibold text-slate-900 hover:text-violet-700 truncate">
                            {name}
                          </Link>
                          {desc ? <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{desc}</p> : null}
                          <p className={`text-sm font-medium mt-1 ${inStock ? "text-emerald-600" : "text-red-600"}`}>
                            {inStock ? "In Stock" : "Low / out of stock"}
                          </p>
                        </div>
                      </div>

                      <div className="text-slate-900 font-semibold sm:text-right">${unit.toFixed(2)}</div>

                      <div className="flex justify-start sm:justify-center">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/90 px-1">
                          <button
                            type="button"
                            className="p-2 rounded-full hover:bg-white transition-colors disabled:opacity-40"
                            disabled={line.quantity <= 1}
                            aria-label="Decrease quantity"
                            onClick={() => void updateQty(pid, line.quantity - 1)}
                          >
                            <Minus className="w-4 h-4 text-slate-700" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900">{line.quantity}</span>
                          <button
                            type="button"
                            className="p-2 rounded-full hover:bg-white transition-colors disabled:opacity-40"
                            disabled={p != null && line.quantity >= p.stock}
                            aria-label="Increase quantity"
                            onClick={() => void updateQty(pid, line.quantity + 1)}
                          >
                            <Plus className="w-4 h-4 text-slate-700" />
                          </button>
                        </div>
                      </div>

                      <div className="text-slate-900 font-semibold sm:text-right">${sub.toFixed(2)}</div>

                      <div className="flex sm:justify-end">
                        <button
                          type="button"
                          aria-label="Remove item"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => void removeLine(pid)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex justify-end border-t border-slate-100 px-6 py-5 bg-slate-50/50">
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order total</p>
                  <p className="text-2xl font-bold text-slate-900">${totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
