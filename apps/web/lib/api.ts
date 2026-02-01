type ApiOptions = RequestInit & { json?: unknown };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message =
      (data as any)?.message || (data as any)?.error || "Request failed";
    const error = new Error(message);
    (error as any).status = response.status;
    throw error;
  }

  return data as T;
}
