"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, Star } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";
import { SiteHeader } from "@/components/SiteHeader";
import { apiRequest, productPrimaryImage } from "@/lib/api";
import {
  type ApiProduct,
  type CategoryTreeItem,
  fetchCategoryTree,
  getCategoryColor,
  getCategoryIcon,
  groupProductsByMainCategory,
  shuffleProducts,
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

function ProductCard({
  product,
  href,
}: {
  product: { name: string; price: string; rating: number; reviews: number; image: string };
  href: string;
}) {
  return (
    <Link
      href={href}
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
            src={product.image}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform"
            unoptimized
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-lg font-semibold text-gray-900 mb-2">{product.price}</p>
        <StarRating rating={product.rating} reviews={product.reviews} />
      </div>
    </Link>
  );
}

function toCard(p: ApiProduct) {
  return {
    name: p.name,
    price: `$${p.price.toFixed(2)}`,
    rating: 4.6,
    reviews: 0,
    image: productPrimaryImage(p),
    href: `/product/${p._id}`,
  };
}

export default function Home() {
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<{ products: ApiProduct[] }>("/products", { method: "GET", auth: false }),
      fetchCategoryTree(),
    ])
      .then(([productsRes, categories]) => {
        setApiProducts(productsRes.products ?? []);
        setCategoryTree(categories);
      })
      .catch(() => {
        setApiProducts([]);
        setCategoryTree([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categorySections = useMemo(
    () => groupProductsByMainCategory(apiProducts, categoryTree),
    [apiProducts, categoryTree]
  );

  const discoverProducts = useMemo(() => {
    if (apiProducts.length === 0) return [];
    return shuffleProducts(apiProducts).slice(0, 4).map(toCard);
  }, [apiProducts]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader activeNav="home" />

      <main>
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-6 overflow-hidden">
              <div className="flex flex-col lg:flex-row items-center px-8 lg:px-16 py-12 lg:py-16">
                <div className="flex-1 text-center lg:text-left z-10">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                    Buy & Sell
                    <br />
                    Anything Instantly
                  </h1>
                  <p className="text-lg text-white/90 mb-8 max-w-md mx-auto lg:mx-0">
                    Join thousands of buyers & sellers in our trusted marketplace.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <Link
                      href="/products?shuffle=true"
                      className="px-8 py-3 bg-white text-violet-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      Start Buying
                    </Link>
                    <Link
                      href="/admin"
                      className="px-8 py-3 bg-white/20 text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-colors"
                    >
                      Start Selling
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">Shop By Categories</h2>
            <Link href="/products?shuffle=true" className="text-sm font-medium text-violet-600 hover:text-violet-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categoryTree.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              return (
                <Link
                  key={category.slug}
                  href={`/products?main=${encodeURIComponent(category.slug)}`}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div
                    className={`w-16 h-16 ${getCategoryColor(category.slug)} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="w-7 h-7 text-gray-700" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {loading ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500">
            Loading products…
          </section>
        ) : apiProducts.length === 0 ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-8 py-14 text-center">
              <p className="text-lg font-medium text-gray-800 mb-2">No products in the store yet</p>
              <p className="text-sm text-gray-500 mb-6">
                Admins can add inventory from the dashboard. Products will appear in their category
                sections automatically.
              </p>
              <Link
                href="/admin"
                className="inline-flex px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700"
              >
                Go to Admin Dashboard
              </Link>
            </div>
          </section>
        ) : (
          <>
            {discoverProducts.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-gray-900">Discover Products</h2>
                  <Link
                    href="/products?shuffle=true"
                    className="text-sm font-medium text-violet-600 hover:text-violet-700"
                  >
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {discoverProducts.map((item) => (
                    <ProductCard key={item.href} product={item} href={item.href} />
                  ))}
                </div>
              </section>
            )}

            {categorySections.map(({ main, products }) => (
              <section
                key={main.slug}
                id={`section-${main.slug}`}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24"
              >
                <div className="flex items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{main.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {products.length} product{products.length === 1 ? "" : "s"} in this category
                    </p>
                  </div>
                  <Link
                    href={`/products?main=${encodeURIComponent(main.slug)}`}
                    className="text-sm font-medium text-violet-600 hover:text-violet-700 whitespace-nowrap"
                  >
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.slice(0, 4).map((p) => {
                    const card = toCard(p);
                    return <ProductCard key={p._id} product={card} href={card.href} />;
                  })}
                </div>
              </section>
            ))}
          </>
        )}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between px-8 lg:px-12 py-10">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h2 className="text-2xl font-bold text-white mb-2">Sell Your Products</h2>
                <p className="text-gray-400">Reach thousands of buyers</p>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href="/admin"
                  className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Start Selling Now
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-1 mb-4">
                <span className="text-xl font-bold text-violet-600">Buy</span>
                <span className="text-xl font-bold text-gray-900">&</span>
                <span className="text-xl font-bold text-violet-600">Sell</span>
              </Link>
              <p className="text-sm text-gray-500 mb-4">The easiest way to buy and sell anything online.</p>
              <div className="flex items-center gap-3">
                <a href="#" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTwitter className="w-4 h-4 text-gray-600" />
                </a>
                <a href="#" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaFacebook className="w-4 h-4 text-gray-600" />
                </a>
                <a href="#" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaInstagram className="w-4 h-4 text-gray-600" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Shop</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/products?shuffle=true" className="text-sm text-gray-500 hover:text-gray-900">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900">
                    Categories
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Sell</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
                    Seller Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-12 pt-8 text-center">
            <p className="text-sm text-gray-500">© 2026 Buy&Sell. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
