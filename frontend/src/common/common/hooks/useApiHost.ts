function normalizePathLikeUrl(value: string, fallback: string): string {
  const raw = (value || fallback).trim();
  if (!raw) return fallback;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

// src/hooks/useApiHost.ts
export function useApiHost(): string {
  return normalizePathLikeUrl(String(import.meta.env.VITE_APP_API_HOST || ""), "/api");
}

export function useApiSocket(): string {
  const raw = String(import.meta.env.VITE_APP_SOCKET || "").trim();
  if (!raw) return "";
  return normalizePathLikeUrl(raw, "");
}

export function useApiStatic(): string {
  return normalizePathLikeUrl(String(import.meta.env.VITE_APP_STATIC || ""), "/static");
}

export function useAdminIndex(): string {
  const apiHost = String(import.meta.env.VITE_APP_SOCKET || "");
  const key = apiHost.replace(/\/+$/, "").split("/").pop() || "";
  return key.startsWith("ad") ? `/${key}` : "";
}

