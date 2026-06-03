"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, Heart, Star, ChevronRight, ChevronLeft } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";
import { SiteHeader } from "@/components/SiteHeader";
import { apiRequest, productPrimaryImage } from "@/lib/api";
import {
  type ApiProduct,
  type CategoryTreeItem,
  fetchCategoryTree,
  findMainCategory,
} from "@/lib/categories";

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">({reviews})</span>
    </div>
  );
}

function ProductCard({ product }: { product: ApiProduct }) {
  const img = productPrimaryImage(product);
  return (
    <Link
      href={`/product/${product._id}`}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-lg transition-shadow block h-full"
    >
      <div className="relative p-4 bg-gray-50">
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors z-10"
        >
          <Heart className="w-4 h-4 text-gray-400" />
        </button>
        <div className="relative aspect-square">
          <Image
            src={img}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform"
            unoptimized
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-violet-600 mb-1">{product.category}</p>
        <p className="text-lg font-semibold text-gray-900 mb-2">${product.price.toFixed(2)}</p>
        <StarRating rating={4.5} reviews={0} />
      </div>
    </Link>
  );
}

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const mainFilter = searchParams.get("main");
  const subFilter = searchParams.get("sub");
  const shuffleMode = searchParams.get("shuffle") === "true";

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMain, setExpandedMain] = useState<string | null>(mainFilter);

  useEffect(() => {
    if (mainFilter) setExpandedMain(mainFilter);
  }, [mainFilter]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams();
      if (mainFilter) params.set("main", mainFilter);
      if (subFilter) params.set("sub", subFilter);
      if (!mainFilter && !subFilter) params.set("shuffle", "true");

      const q = params.toString() ? `?${params.toString()}` : "";
      setLoading(true);
      try {
        const [productsRes, categories] = await Promise.all([
          apiRequest<{ products: ApiProduct[] }>(`/products${q}`, { method: "GET", auth: false }),
          fetchCategoryTree(),
        ]);
        if (!cancelled) {
          setProducts(productsRes.products ?? []);
          setCategoryTree(categories);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setCategoryTree([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mainFilter, subFilter, shuffleMode]);

  const pageTitle = useMemo(() => {
    if (subFilter && mainFilter) {
      const main = findMainCategory(categoryTree, mainFilter);
      const sub = main?.subcategories.find((s) => s.slug === subFilter);
      if (sub) return sub.name;
    }
    if (mainFilter) {
      return findMainCategory(categoryTree, mainFilter)?.name || "Products";
    }
    if (shuffleMode) return "All Products";
    return "All Products";
  }, [mainFilter, subFilter, shuffleMode, categoryTree]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader activeNav="products" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>Products</span>
            </div>
          </div>
          <div className="hidden sm:block text-sm text-gray-500">
            {loading ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="mb-6 hidden lg:block">
              <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  readOnly
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-violet-600 rounded flex items-center justify-center pointer-events-none">
                  <Search className="w-3 h-3 text-white" />
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 lg:p-0 lg:border-0 lg:bg-transparent">
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <ul className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                <li>
                  <Link
                    href="/products?shuffle=true"
                    className={`flex items-center justify-between w-full text-sm py-2 px-2 rounded transition-colors ${
                      !mainFilter && !subFilter
                        ? "text-violet-600 bg-violet-50 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Products
                  </Link>
                </li>
                {categoryTree.map((main) => {
                  const isExpanded = expandedMain === main.slug;
                  const mainActive = mainFilter === main.slug && !subFilter;
                  return (
                    <li key={main.slug}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedMain(isExpanded ? null : main.slug)}
                          className="p-1 text-gray-400 hover:text-gray-700"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>
                        <Link
                          href={`/products?main=${encodeURIComponent(main.slug)}`}
                          className={`flex-1 text-sm py-2 px-2 rounded transition-colors ${
                            mainActive
                              ? "text-violet-600 bg-violet-50 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {main.name}
                        </Link>
                      </div>
                      {isExpanded && (
                        <ul className="ml-6 mt-1 space-y-0.5 border-l border-gray-100 pl-2">
                          {main.subcategories.map((sub) => {
                            const subActive =
                              mainFilter === main.slug && subFilter === sub.slug;
                            return (
                              <li key={sub.slug}>
                                <Link
                                  href={`/products?main=${encodeURIComponent(main.slug)}&sub=${encodeURIComponent(sub.slug)}`}
                                  className={`block text-sm py-1.5 px-2 rounded transition-colors ${
                                    subActive
                                      ? "text-violet-600 bg-violet-50 font-medium"
                                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                  }`}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-gray-500 py-12 text-center">Loading products…</p>
            ) : products.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl">
                <p className="text-gray-600 mb-2">No products in this category yet.</p>
                <p className="text-sm text-gray-500 mb-4">
                  Try another category or browse all products.
                </p>
                <Link
                  href="/products?shuffle=true"
                  className="inline-flex text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Buy&Sell. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
