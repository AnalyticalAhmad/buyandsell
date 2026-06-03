const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

type ApiOptions = {
  method?: string;
  body?: Record<string, unknown>;
};

export async function authRequest<T>(path: string, options: ApiOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}
