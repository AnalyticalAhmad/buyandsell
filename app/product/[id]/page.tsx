"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";
import { SiteHeader } from "@/components/SiteHeader";
import { apiRequest, productImageUrl, productPrimaryImage } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

type Product = {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  stock: number;
  mainCategory?: string;
  subCategory?: string;
  category: string;
};

type ProductsResponse = { products: Product[] };

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] ?? "" : "";

  const { token, user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    await Promise.resolve();
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiRequest<{ product: Product }>(`/products/${id}`, {
        method: "GET",
        auth: false,
      });
      setProduct(res.product);
      setQuantity(1);
      const rel = await apiRequest<ProductsResponse>(
        res.product.subCategory
          ? `/products?main=${encodeURIComponent(res.product.mainCategory || "")}&sub=${encodeURIComponent(res.product.subCategory)}&exclude=${encodeURIComponent(id)}`
          : res.product.mainCategory
            ? `/products?main=${encodeURIComponent(res.product.mainCategory)}&exclude=${encodeURIComponent(id)}`
            : `/products?category=${encodeURIComponent(res.product.category)}&exclude=${encodeURIComponent(id)}`,
        { method: "GET", auth: false }
      );
      setRelated((rel.products ?? []).slice(0, 4));
    } catch {
      setProduct(null);
      setRelated([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load defers setState after await
    void load();
  }, [load]);

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }
    if (!token || !user) {
      toast.error("Please sign in to add items to your cart.");
      router.push("/Auth/Login");
      return;
    }
    if (user.role === "admin") {
      toast.error("Admins manage the store. Use a buyer account to add items to the cart.");
      return;
    }
    try {
      setAdding(true);
      await apiRequest("/cart/add", {
        method: "POST",
        body: { productId: product._id, quantity },
      });
      toast.success("Added to cart.");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to cart.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader activeNav="products" />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center text-gray-500">Loading product…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader activeNav="products" />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-600 mb-6">
            {id ? "This product may have been removed or the link is invalid." : "Missing product id."}
          </p>
          <Link href="/products" className="text-violet-600 font-medium hover:text-violet-700">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = productPrimaryImage(product);
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader activeNav="products" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link href="/products" className="hover:text-gray-900">
            Products
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-violet-600 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-14">
          <div className="relative aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
            <Image src={mainImage} alt={product.name} fill className="object-contain p-8" unoptimized />
          </div>

          <div>
            <p className="text-sm font-medium text-violet-600 mb-2">{product.category}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-gray-900 mb-2">${product.price.toFixed(2)}</p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-500">Availability:</span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${inStock ? "text-emerald-600" : "text-red-600"}`}>
                <Check className="w-4 h-4" />
                {inStock ? `In stock (${product.stock})` : "Out of stock"}
              </span>
            </div>

            {product.description ? (
              <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
            ) : null}

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-1">
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-white transition-colors disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="min-w-[2.5rem] text-center font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-white transition-colors disabled:opacity-40"
                  disabled={!inStock || quantity >= product.stock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={!inStock || adding}
                onClick={() => void handleAddToCart()}
                className="flex-1 px-6 py-3.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? "Adding…" : "Add to Cart"}
              </button>
              <button
                type="button"
                onClick={() => toast("Checkout coming soon.", { icon: "🛒" })}
                className="flex-1 px-6 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Buy Now
              </button>
            </div>

            {user?.role === "admin" && (
              <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                You are signed in as an admin. Buyer accounts can add products to the cart.
              </p>
            )}

            <button
              type="button"
              className="mt-6 flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors"
              onClick={() => toast("Wishlist coming soon.")}
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">Add to Wishlist</span>
            </button>
          </div>
        </div>

        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">More in {product.category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link
                  key={p._id}
                  href={`/product/${p._id}`}
                  className="rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-50">
                    <Image src={productPrimaryImage(p)} alt={p.name} fill className="object-contain p-4" unoptimized />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 text-sm line-clamp-2">{p.name}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">${p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-lg font-bold text-violet-600">Buy</span>
              <span className="text-lg font-bold text-gray-900">&</span>
              <span className="text-lg font-bold text-violet-600">Sell</span>
            </Link>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Twitter">
                <FaTwitter className="w-4 h-4 text-gray-600" />
              </a>
              <a href="#" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Facebook">
                <FaFacebook className="w-4 h-4 text-gray-600" />
              </a>
              <a href="#" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Instagram">
                <FaInstagram className="w-4 h-4 text-gray-600" />
              </a>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">© {new Date().getFullYear()} Buy&Sell. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
