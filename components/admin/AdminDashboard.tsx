"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Box,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  DollarSign,
  Pencil,
  Search,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { productPrimaryImage } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import {
  type AdminProduct,
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  fetchAdminStats,
  updateAdminProduct,
} from "@/lib/adminApi";
import { AdminSidebar } from "./AdminSidebar";
import {
  fetchCategoryTree,
  findMainCategory,
  type CategoryTreeItem,
} from "@/lib/categories";

const PAGE_SIZE = 5;

function stockStatus(stock: number) {
  return stock <= 10
    ? { label: "Low Stock", className: "bg-[#3d2a10] text-[#f59e0b]" }
    : { label: "In Stock", className: "bg-[#0f2e1f] text-[#22c55e]" };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

function formatCount(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function AdminDashboard() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
  const [form, setForm] = useState({
    name: "",
    mainCategory: "",
    subCategory: "",
    price: "",
    stock: "",
    description: "",
    images: [] as string[],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedMain = useMemo(
    () => findMainCategory(categoryTree, form.mainCategory),
    [categoryTree, form.mainCategory]
  );

  const loadData = useCallback(async () => {
    try {
      const [productList, dashboardStats, categories] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminStats(),
        fetchCategoryTree(),
      ]);
      setCategoryTree(categories);
      setProducts(productList);
      setStats({
        totalOrders: dashboardStats.totalOrders,
        totalProducts: dashboardStats.totalProducts,
        totalUsers: dashboardStats.totalUsers,
        totalRevenue: dashboardStats.totalRevenue,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.mainCategory || "").toLowerCase().includes(q) ||
        (p.subCategory || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function resetForm() {
    setForm({
      name: "",
      mainCategory: "",
      subCategory: "",
      price: "",
      stock: "",
      description: "",
      images: [],
    });
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files?.length) return;
    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    try {
      const urls = await Promise.all(readers);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch {
      toast.error("Could not read image file.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.mainCategory || !form.subCategory || !form.price || !form.stock) {
      toast.error("Fill in name, main category, sub category, price, and stock.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        mainCategory: form.mainCategory,
        subCategory: form.subCategory,
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description.trim(),
        images: form.images,
      };
      if (editingId) {
        await updateAdminProduct(editingId, body);
        toast.success("Product updated.");
      } else {
        await createAdminProduct(body);
        toast.success("Product added.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(product: AdminProduct) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      mainCategory: product.mainCategory || "",
      subCategory: product.subCategory || "",
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || "",
      images: product.images?.length ? product.images : product.image ? [product.image] : [],
    });
    document.getElementById("add-product")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAdminProduct(id);
      toast.success("Product deleted.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const statCards = [
    {
      label: "Total Orders",
      value: "0",
      change: "coming soon",
      icon: ShoppingBag,
      iconBg: "bg-[#3d2f0a]",
      iconColor: "text-[#d4a017]",
    },
    {
      label: "Total Products",
      value: formatCount(stats.totalProducts),
      change: "+8% from last month",
      icon: Box,
      iconBg: "bg-[#2a1a3d]",
      iconColor: "text-[#a855f7]",
    },
    {
      label: "Total Users",
      value: formatCount(stats.totalUsers || 1245),
      change: "+20% from last month",
      icon: Users,
      iconBg: "bg-[#0f2440]",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Total Revenue",
      value: "0",
      change: "coming soon",
      icon: DollarSign,
      iconBg: "bg-[#0f2e1f]",
      iconColor: "text-[#22c55e]",
    },
  ];

  const displayName = "Ahmad";

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <AdminSidebar />

      <div className="ml-[240px] min-h-screen">
        <header className="sticky top-0 z-30 border-b border-[#1f1f1f] bg-[#0b0b0b]/95 px-8 py-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {displayName} 👋
              </h1>
              <p className="mt-1 text-sm text-[#888]">
                Here&apos;s what&apos;s happening with your store today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search anything..."
                  className="h-10 w-[220px] rounded-lg border border-[#252525] bg-[#151515] pl-9 pr-3 text-sm text-white placeholder:text-[#555] focus:border-[#d4a017]/50 focus:outline-none lg:w-[280px]"
                />
              </div>
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#252525] bg-[#151515] text-[#a3a3a3] hover:text-white"
                onClick={() => toast("Notifications coming soon.")}
              >
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d4a017] text-[10px] font-bold text-[#0b0b0b]">
                  3
                </span>
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a017] text-sm font-bold text-[#0b0b0b]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-6 px-8 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-[#252525] bg-[#151515] p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-[#888]">{card.label}</p>
                      <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                      <p className="mt-2 text-xs text-[#22c55e]">{card.change}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.iconBg}`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
            <section
              id="products"
              className="rounded-xl border border-[#252525] bg-[#151515] p-5"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Recent Products</h2>
                <button
                  type="button"
                  onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-lg border border-[#d4a017] px-4 py-1.5 text-sm font-medium text-[#d4a017] transition-colors hover:bg-[#d4a017]/10"
                >
                  View All Products
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#252525] text-[#888]">
                      <th className="pb-3 pr-4 font-medium">Product</th>
                      <th className="pb-3 pr-4 font-medium">Category</th>
                      <th className="pb-3 pr-4 font-medium">Price</th>
                      <th className="pb-3 pr-4 font-medium">Stock</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#666]">
                          Loading products...
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#666]">
                          No products yet. Add your first product using the form.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((product) => {
                        const status = stockStatus(product.stock);
                        const img = productPrimaryImage(product);
                        return (
                          <tr key={product._id} className="border-b border-[#1f1f1f]">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#0b0b0b]">
                                  <Image
                                    src={img}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-white">{product.name}</p>
                                  <p className="text-xs text-[#666]">
                                    {product.description || product.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-[#a3a3a3]">
                              <span className="block text-white/90">{product.category}</span>
                              {product.mainCategory && (
                                <span className="text-xs text-[#666]">
                                  {findMainCategory(categoryTree, product.mainCategory)?.name ||
                                    product.mainCategory}
                                </span>
                              )}
                            </td>
                            <td className="py-4 pr-4 font-medium text-white">
                              {formatPrice(product.price)}
                            </td>
                            <td className="py-4 pr-4 text-[#a3a3a3]">{product.stock}</td>
                            <td className="py-4 pr-4">
                              <span
                                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(product)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#333] bg-[#1f1f1f] text-[#a3a3a3] hover:text-white"
                                  aria-label="Edit product"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(product._id, product.name)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#4a1515] bg-[#2a1010] text-[#ef4444] hover:bg-[#3a1515]"
                                  aria-label="Delete product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filtered.length > PAGE_SIZE && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888] hover:bg-[#1f1f1f] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                        page === n
                          ? "bg-[#d4a017] font-semibold text-[#0b0b0b]"
                          : "text-[#888] hover:bg-[#1f1f1f]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888] hover:bg-[#1f1f1f] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>

            <section
              id="add-product"
              className="rounded-xl border border-[#252525] bg-[#151515] p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[#888] hover:text-white"
                    aria-label="Cancel edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-[#888]">Product Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter product name"
                    className="w-full rounded-lg border border-[#252525] bg-[#0b0b0b] px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:border-[#d4a017]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#888]">Main Category</label>
                  <select
                    value={form.mainCategory}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        mainCategory: e.target.value,
                        subCategory: "",
                      }))
                    }
                    className="w-full rounded-lg border border-[#252525] bg-[#0b0b0b] px-3 py-2.5 text-sm text-white focus:border-[#d4a017]/50 focus:outline-none"
                  >
                    <option value="">Select main category</option>
                    {categoryTree.map((main) => (
                      <option key={main.slug} value={main.slug}>
                        {main.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#888]">Sub Category</label>
                  <select
                    value={form.subCategory}
                    onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))}
                    disabled={!form.mainCategory}
                    className="w-full rounded-lg border border-[#252525] bg-[#0b0b0b] px-3 py-2.5 text-sm text-white focus:border-[#d4a017]/50 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {form.mainCategory ? "Select sub category" : "Choose main category first"}
                    </option>
                    {selectedMain?.subcategories.map((sub) => (
                      <option key={sub.slug} value={sub.slug}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#888]">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="Enter price"
                    className="w-full rounded-lg border border-[#252525] bg-[#0b0b0b] px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:border-[#d4a017]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#888]">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="Enter stock quantity"
                    className="w-full rounded-lg border border-[#252525] bg-[#0b0b0b] px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:border-[#d4a017]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#888]">Description (optional)</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Short description"
                    className="w-full rounded-lg border border-[#252525] bg-[#0b0b0b] px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:border-[#d4a017]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#888]">Product Images</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => void handleImageFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#333] bg-[#0b0b0b] px-4 py-8 text-sm text-[#666] transition-colors hover:border-[#d4a017]/40 hover:text-[#888]"
                  >
                    <CloudUpload className="h-6 w-6 text-[#555]" />
                    Click to upload images
                  </button>
                  {form.images.length > 0 && (
                    <p className="mt-2 text-xs text-[#22c55e]">
                      {form.images.length} image{form.images.length > 1 ? "s" : ""} ready
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#d4a017] py-3 text-sm font-semibold text-[#0b0b0b] transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>

    </div>
  );
}
