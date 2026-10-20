import axios from "axios";
import { useApiHost } from "../common/hooks/useApiHost";
import { formatVND, type SignboardQuoteResult } from "./aiPricingEngine";
import { DEFAULT_SIGNBOARD_HINTS } from "./genaiSignboardHints";

export const GENAI_REMOTE_URL = "https://genai.toolxprint.com";

export interface Mesh3DElement {
  name: string;
  /** box/cylinder/sphere: mẫu cũ (position/scale). prism/text/line: hình học thật từ trình đọc Ruby. */
  type: "box" | "cylinder" | "sphere" | "prism" | "text" | "line";
  position?: [number, number, number];
  scale?: [number, number, number];
  /** prism/text: đa giác đáy (m, trục Y hướng lên). line: 2 điểm đầu-cuối. */
  base?: [number, number, number][];
  /** prism/text: vector đùn từ đáy lên mặt trên. */
  extrude?: [number, number, number];
  text?: string;
  opacity?: number;
  flat?: boolean;
  color: string;
}

export interface StructuralComponent {
  stt?: number;
  name: string;
  dimensions?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  total?: number;
  detail?: string;
  material?: string;
}

export interface Signboard3DModel {
  name: string;
  category: "mini" | "storefront" | "billboard";
  category_label: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  elements: Mesh3DElement[];
  materials_spec: {
    iron_type: string;
    surface_type: string;
    has_led: boolean;
    has_sheet_backing: boolean;
    lettering_type?: string;
  };
  components?: StructuralComponent[];
  logistics?: {
    labor_days?: number;
    labor_rate?: number;
    transport_km?: number;
    transport_rate?: number;
    scrap_percent?: number;
    shipping_weight_kg?: number;
    shipping_weight_text?: string;
    package_dimensions?: string;
    recommended_vehicle?: string;
  };
  render_prompt: string;
  quotation?: SignboardQuoteResult;
  /** "ruby_interpreter" khi dựng từ mã Ruby thật. */
  source?: string;
  warnings?: string[];
}

export interface SignboardHint {
  id: string;
  category: "mini" | "storefront" | "billboard";
  title: string;
  badge: string;
  image_url?: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  description: string;
  materials: {
    iron_type: string;
    surface_type: string;
    has_led: boolean;
    has_sheet_backing: boolean;
  };
  prompt: string;
  elements?: Mesh3DElement[];
}

export interface GenAIJob {
  id: string;
  type: "create" | "edit_full" | "edit_inpaint";
  prompt: string;
  style: string;
  aspect_ratio: string;
  status: "queued" | "assigned" | "processing" | "completed" | "failed";
  progress: number;
  current_step: string;
  result_image_url?: string;
  filename?: string;
  error?: string;
  logs?: string[];
  created_at?: string;
}

export interface InpaintPin {
  order: number;
  xFormatted: string; // e.g. "45%"
  yFormatted: string; // e.g. "60%"
  text: string;
}

class GenAISignboardService {
  private getApiUrl(endpoint: string): string {
    return `${useApiHost().replace(/\/+$/, "")}/ai${endpoint}`;
  }

  // 1. Kiểm tra trạng thái kết nối GenAI Bridge
  async getStatus() {
    try {
      const res = await axios.get(this.getApiUrl("/genai/status"), { timeout: 6000 });
      return res.data;
    } catch {
      const fallback = await axios.get(`${GENAI_REMOTE_URL}/api/status`, { timeout: 6000 });
      return fallback.data;
    }
  }

  // 2. Lấy danh sách Mẫu thiết kế chuyên dụng (bao gồm 6 mẫu thực tế từ ảnh chụp)
  async getSignboardHints(): Promise<SignboardHint[]> {
    try {
      const res = await axios.get(this.getApiUrl("/3d/hints"), { timeout: 6000 });
      if (res.data?.hints && res.data.hints.length > 0) return res.data.hints;
    } catch (e) {
      console.warn("Failed to fetch hints from backend, using default list", e);
    }

    return DEFAULT_SIGNBOARD_HINTS;
  }

  // 3. Phân tích yêu cầu và sinh mô hình 3D bằng Gemini API
  async generate3DModel(params: {
    prompt: string;
    hint_id?: string;
    dimensions?: { width: number; height: number; depth: number };
    materials?: any;
  }): Promise<Signboard3DModel> {
    const res = await axios.post(this.getApiUrl("/3d/generate"), params, { timeout: 45000 });
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.error || "Không thể khởi tạo mô hình 3D từ Gemini API");
    }
    return res.data.data;
  }

  // 4. Tạo Job render phối cảnh bằng GenAI Toolxprint Bridge
  async createRenderJob(params: {
    prompt: string;
    style?: string;
    aspect_ratio?: string;
    new_chat?: boolean;
  }): Promise<GenAIJob> {
    try {
      const res = await axios.post(this.getApiUrl("/genai/jobs/create"), params, { timeout: 25000 });
      return res.data;
    } catch {
      const fallback = await axios.post(`${GENAI_REMOTE_URL}/api/jobs/create`, params, { timeout: 25000 });
      return fallback.data;
    }
  }

  // 5. Chỉnh sửa toàn bộ ảnh bằng GenAI
  async editFullRenderJob(params: {
    prompt: string;
    reference_images: string[];
    style?: string;
    aspect_ratio?: string;
    new_chat?: boolean;
  }): Promise<GenAIJob> {
    try {
      const res = await axios.post(this.getApiUrl("/genai/jobs/edit-full"), params, { timeout: 25000 });
      return res.data;
    } catch {
      const fallback = await axios.post(`${GENAI_REMOTE_URL}/api/jobs/edit-full`, params, { timeout: 25000 });
      return fallback.data;
    }
  }

  // 6. Chỉnh sửa cục bộ (Inpaint với pins tọa độ) bằng GenAI
  async editInpaintRenderJob(params: {
    prompt: string;
    reference_images: string[];
    pins: InpaintPin[];
    preserve_surroundings?: boolean;
    style?: string;
    aspect_ratio?: string;
    new_chat?: boolean;
  }): Promise<GenAIJob> {
    try {
      const res = await axios.post(this.getApiUrl("/genai/jobs/edit-inpaint"), params, { timeout: 25000 });
      return res.data;
    } catch {
      const fallback = await axios.post(`${GENAI_REMOTE_URL}/api/jobs/edit-inpaint`, params, { timeout: 25000 });
      return fallback.data;
    }
  }

  private sanitizeJob(job: GenAIJob): GenAIJob {
    if (!job) return job;
    const clean = (text?: string | null) => {
      if (!text) return "";
      let s = String(text);
      return s.replace(/openai|[_\-\s]?chat\s*-?\s*gpt(?:-[a-z0-9.]+)?/gi, " AI").replace(/\s{2,}/g, " ").trim();
    };
    if (job.current_step) job.current_step = clean(job.current_step);
    if (job.error) job.error = clean(job.error);
    return job;
  }

  // 7. Polling trạng thái job đến khi hoàn tất
  async pollJobStatus(jobId: string): Promise<GenAIJob> {
    try {
      const res = await axios.get(this.getApiUrl(`/genai/jobs/${jobId}`), { timeout: 10000 });
      return this.sanitizeJob(res.data);
    } catch {
      const fallback = await axios.get(`${GENAI_REMOTE_URL}/api/jobs/${jobId}`, { timeout: 10000 });
      return this.sanitizeJob(fallback.data);
    }
  }

  // 8. Đợi hoàn tất job với callback cập nhật tiến trình
  // - Chịu được lỗi mạng tạm thời khi gọi GenAI bên ngoài (tối đa maxConsecutiveErrors lần liên tiếp)
  // - Hủy được qua AbortSignal (khi đóng Studio / unmount)
  async waitForJob(
    jobId: string,
    onProgress?: (job: GenAIJob) => void,
    timeoutMs: number = 180000,
    signal?: AbortSignal,
    maxConsecutiveErrors: number = 6
  ): Promise<GenAIJob> {
    const startTime = Date.now();
    let consecutiveErrors = 0;
    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(t);
          reject(new DOMException("Aborted", "AbortError"));
        };
        const t = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, ms);
        signal?.addEventListener("abort", onAbort, { once: true });
      });

    while (Date.now() - startTime < timeoutMs) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      let job: GenAIJob | null = null;
      try {
        job = await this.pollJobStatus(jobId);
        consecutiveErrors = 0;
      } catch (err) {
        consecutiveErrors += 1;
        console.warn(`[GenAI] Lỗi polling job ${jobId} (${consecutiveErrors}/${maxConsecutiveErrors})`, err);
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error("Mất kết nối tới GenAI Worker quá nhiều lần, vui lòng thử lại");
        }
      }

      if (job) {
        if (onProgress) onProgress(job);
        if (job.status === "completed") {
          return job;
        }
        if (job.status === "failed") {
          throw new Error(job.error || (job as any).current_step || "Tác vụ render GenAI bị thất bại");
        }
      }

      await sleep(consecutiveErrors > 0 ? 3000 : 2000);
    }
    throw new Error("Quá thời gian chờ phản hồi từ GenAI Worker");
  }
}

export const genAISignboardService = new GenAISignboardService();
