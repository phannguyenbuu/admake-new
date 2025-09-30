// src/hooks/useApiHost.ts
export function useApiHost(): string {
  // Lấy biến môi trường, fallback về chuỗi rỗng nếu không có
  const apiHost = import.meta.env.VITE_APP_API_HOST || "";
  return apiHost;
}


export function useApiSocket(): string {
  // Lấy biến môi trường, fallback về chuỗi rỗng nếu không có
  const apiHost = import.meta.env.VITE_APP_SOCKET || "";
  return apiHost;
}

export function useApiStatic(): string {
  // Lấy biến môi trường, fallback về chuỗi rỗng nếu không có
  const apiHost = import.meta.env.VITE_APP_STATIC || "";
  return apiHost;
}
