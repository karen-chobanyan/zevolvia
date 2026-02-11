type ApiOptions = RequestInit & { json?: unknown; _retry?: boolean };

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const AUTH_REFRESH_SKIP = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register-invite",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

const getPathname = (url: string) => {
  const withoutHash = url.split("#")[0] ?? "";
  if (withoutHash.startsWith("http://") || withoutHash.startsWith("https://")) {
    const withoutOrigin = withoutHash.replace(/^https?:\/\/[^/]+/, "");
    return withoutOrigin.split("?")[0] || "/";
  }
  return withoutHash.split("?")[0] ?? "";
};

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshSession() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Refresh failed");
    }
  })();

  try {
    await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const { json, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    credentials: "include",
    body: json ? JSON.stringify(json) : rest.body,
  });

  if (response.status === 401 && !options._retry && !AUTH_REFRESH_SKIP.has(getPathname(path))) {
    try {
      await refreshSession();
      return apiFetch<T>(path, { ...options, _retry: true });
    } catch (error) {
      (error as any).status = 401;
      throw error;
    }
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = (data as any)?.message || (data as any)?.error || "Request failed";
    const error = new Error(message);
    (error as any).status = response.status;
    throw error;
  }

  return data as T;
}
