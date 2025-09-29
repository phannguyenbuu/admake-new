// src/hooks/useApiHost.ts
export function useApiHost(): string {
  // Lấy biến môi trường, fallback về chuỗi rỗng nếu không có
  const apiHost = import.meta.env.VITE_APP_API_HOST || "";
  return apiHost;
}
