import type { SignSampleItem } from "./types";

// Thay mọi biến thể "ChatGPT" / "chat gpt" / "OpenAI" / "GPT-4o" bằng nhãn trung tính trước khi hiển thị.
const BRAND_RE = /openai|[_\-\s]?chat\s*-?\s*gpt(?:-[a-z0-9.]+)?/gi;

export function sanitizeBrand(text: string | null | undefined, replacement = " AI"): string {
  if (!text) return "";
  let s = String(text);
  return s.replace(BRAND_RE, replacement).replace(/\s{2,}/g, " ").trim();
}

// Tên file chỉ dùng để hiển thị (URL thật vẫn giữ nguyên để không vỡ đường dẫn tải).
export function sanitizeFilename(name: string | null | undefined): string {
  if (!name) return "";
  return String(name).replace(BRAND_RE, "");
}

export function sanitizeSample(sample: SignSampleItem): SignSampleItem {
  return {
    ...sample,
    title: sanitizeBrand(sample.title),
    description: sanitizeBrand(sample.description),
    badge: sanitizeBrand(sample.badge),
    prompt: sanitizeBrand(sample.prompt),
    rb_filename: sanitizeFilename(sample.rb_filename),
    ruby_code: sample.ruby_code ? sample.ruby_code.replace(BRAND_RE, " AI") : sample.ruby_code,
  };
}

export function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (typeof err === "object" && err !== null && ((err as any).name === "CanceledError" || (err as any).code === "ERR_CANCELED"))
  );
}

// Rút thông điệp lỗi từ axios / Error / string, đã lọc thương hiệu.
export function getErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  const raw =
    anyErr?.response?.data?.error ||
    anyErr?.response?.data?.message ||
    (anyErr?.code === "ECONNABORTED" ? "Máy chủ AI phản hồi quá lâu (timeout)" : "") ||
    (anyErr?.message === "Network Error" ? "Không kết nối được tới máy chủ AI" : "") ||
    anyErr?.message ||
    (typeof err === "string" ? err : "");
  return sanitizeBrand(raw) || fallback;
}

// Ảnh tĩnh có tên chứa khoảng trắng / ngoặc cần encode để không 404.
export function encodeStaticPath(prefix: string, filename: string): string {
  return `${prefix}${encodeURIComponent(filename)}`;
}
