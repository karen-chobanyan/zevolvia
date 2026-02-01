import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const AUTH_REFRESH_SKIP = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/register-invite",
  "/auth/verify-email",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

const getPathname = (url?: string) => {
  if (!url) return "";
  const withoutHash = url.split("#")[0] ?? "";
  if (withoutHash.startsWith("http://") || withoutHash.startsWith("https://")) {
    const withoutOrigin = withoutHash.replace(/^https?:\/\/[^/]+/, "");
    return withoutOrigin.split("?")[0] || "/";
  }
  return withoutHash.split("?")[0] ?? "";
};

// --- Single-flight refresh control ---
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: AxiosResponse) => void;
  reject: (error: any) => void;
  config: AxiosRequestConfig & { _retry?: boolean };
}> = [];

function processQueue(error: any, response: AxiosResponse | null) {
  pendingQueue.forEach(async ({ resolve, reject, config }) => {
    if (error) reject(error);
    else resolve(await api(config));
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean; url?: string };

    const status = error.response?.status;
    if (!status || status !== 401) throw error;

    const pathname = getPathname(original?.url);
    if (AUTH_REFRESH_SKIP.has(pathname)) {
      throw error;
    }

    if (original?._retry) throw error;
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: original });
      });
    }

    isRefreshing = true;
    try {
      await api.post("/auth/refresh", null, {});

      processQueue(null, null as any);
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      try {
        await api.post("/auth/logout");
      } catch {}
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/auth/signin?next=${next}`;
      }
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
