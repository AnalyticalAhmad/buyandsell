import { apiRequest } from "./api";

export type AdminProduct = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  images?: string[];
  stock: number;
  mainCategory?: string;
  subCategory?: string;
  category: string;
  createdAt?: string;
};

export type DashboardStats = {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  orderChange: number;
  productChange: number;
  userChange: number;
  revenueChange: number;
};

export async function fetchAdminStats() {
  const data = await apiRequest<{ stats: DashboardStats }>("/admin/stats");
  return data.stats;
}

export async function fetchAdminProducts() {
  const data = await apiRequest<{ products: AdminProduct[] }>("/admin/products");
  return data.products;
}

export async function createAdminProduct(body: {
  name: string;
  price: number;
  description?: string;
  stock: number;
  mainCategory: string;
  subCategory: string;
  images?: string[];
}) {
  return apiRequest<{ product: AdminProduct }>("/admin/products", {
    method: "POST",
    body,
  });
}

export async function updateAdminProduct(
  id: string,
  body: Partial<{
    name: string;
    price: number;
    description: string;
    stock: number;
    mainCategory: string;
    subCategory: string;
    images: string[];
  }>
) {
  return apiRequest<{ product: AdminProduct }>(`/admin/products/${id}`, {
    method: "PUT",
    body,
  });
}

export async function deleteAdminProduct(id: string) {
  return apiRequest<{ message: string }>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}
