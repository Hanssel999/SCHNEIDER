import { formatApiError } from "../utils";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

type ApiError = Record<string, unknown>;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = localStorage.getItem("schneider_access_token");
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  const responseBody = await response.text();
  let data: T | ApiError;
  try {
    data = JSON.parse(responseBody) as T | ApiError;
  } catch {
    data = {
      detail: `Server returned ${response.status} ${response.statusText} instead of JSON.`,
    };
  }
  if (!response.ok) {
    if (response.status === 401 && accessToken && !path.includes("/signin/")) {
      localStorage.removeItem("schneider_access_token");
      localStorage.removeItem("schneider_refresh_token");
      localStorage.removeItem("schneider_user");
      window.location.replace("/signin");
      return new Promise<T>(() => undefined);
    }
    throw new Error(formatApiError(data as ApiError));
  }
  return data as T;
}
