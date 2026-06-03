import { useAuthStore } from "./authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

type ApiOptions = {
  method?: string;
  body?: unknown;
  /** When false, do not attach Bearer token */
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const useAuth = options.auth !== false;
  const token = useAuth ? useAuthStore.getState().token : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const PLACEHOLDER_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop";

export function productImageUrl(image?: string | string[] | null) {
  if (Array.isArray(image)) {
    const first = image[0]?.trim();
    return first || PLACEHOLDER_PRODUCT_IMAGE;
  }
  const trimmed = image?.trim();
  return trimmed ? trimmed : PLACEHOLDER_PRODUCT_IMAGE;
}

export function productPrimaryImage(product: { image?: string; images?: string[] }) {
  return productImageUrl(product.images?.length ? product.images : product.image);
}
