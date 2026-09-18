import { formatApiError } from "../utils";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

type ApiError = Record<string, unknown>;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = (await response.json()) as T | ApiError;
  if (!response.ok) {
    throw new Error(formatApiError(data as ApiError));
  }
  return data as T;
}
