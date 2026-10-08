import axios from "axios";
import { formatVND, type SignboardQuoteResult } from "./aiPricingEngine";

export const GENAI_REMOTE_URL = "https://genai.toolxprint.com";

export interface Mesh3DElement {
  name: string;
  type: "box" | "cylinder" | "sphere";
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
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
  render_prompt: string;
  quotation?: SignboardQuoteResult;
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
    return `/api/ai${endpoint}`;
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

    return [
      // 1. Biển vẫy hộp đèn gắn tường 2 mặt (Ảnh images (8).jfif)
      {
        id: "sample_blade_yellow",
        category: "mini",
        title: "Biển vẫy hộp đèn gắn tường 2 mặt (1.2m x 0.5m)",
        badge: "Biển vẫy",
        image_url: "/signs/sign_blade_yellow.jpg",
        dimensions: { width: 1.2, height: 0.5, depth: 0.16 },
        description: "Biển vẫy chữ nhật 2 mặt nhô ra ngoài tường, khung nhôm định hình sơn đen nhám, mặt mica vàng nghệ xuyên sáng rực rỡ, chữ nổi đen bóng, chân bát sắt chữ L chịu lực gắn tường.",
        materials: { iron_type: "vuong_20", surface_type: "mica_2_3mm", has_led: true, has_sheet_backing: false },
        prompt: "Biển vẫy hộp đèn chữ nhật gắn tường 2 mặt phát sáng màu vàng rực rỡ kích thước 1.2m x 0.5m, khung nhôm đen sang trọng, chữ đen BEAUTIFUL SIGNBOARD gắn mặt tiền shop.",
        elements: [
          { name: "Chân bát sắt chữ L gắn tường", type: "box", position: [-0.62, 0, 0], scale: [0.05, 0.4, 0.2], color: "#18181b" },
          { name: "Thanh giằng chịu lực", type: "box", position: [-0.56, 0, 0], scale: [0.12, 0.08, 0.08], color: "#27272a" },
          { name: "Khung viền nhôm đen bao quanh", type: "box", position: [0.05, 0, 0], scale: [1.22, 0.52, 0.16], color: "#18181b" },
          { name: "Mặt mica vàng phát sáng (Mặt trước)", type: "box", position: [0.05, 0, 0.082], scale: [1.18, 0.48, 0.01], color: "#facc15" },
          { name: "Mặt mica vàng phát sáng (Mặt sau)", type: "box", position: [0.05, 0, -0.082], scale: [1.18, 0.48, 0.01], color: "#facc15" },
          { name: "Bộ chữ nổi SIGNBOARD (Mặt trước)", type: "box", position: [0.05, 0.04, 0.09], scale: [0.85, 0.18, 0.015], color: "#09090b" },
          { name: "Bộ chữ nổi SIGNBOARD (Mặt sau)", type: "box", position: [0.05, 0.04, -0.09], scale: [0.85, 0.18, 0.015], color: "#09090b" },
          { name: "Dòng chữ phụ EASY EDIT MOCKUP", type: "box", position: [0.05, -0.12, 0.09], scale: [0.65, 0.07, 0.01], color: "#18181b" }
        ]
      },
      // 2. Hộp đèn mặt tiền nằm ngang gắn dựng lam gỗ (Ảnh images (9).jfif)
      {
        id: "sample_facade_wood",
        category: "storefront",
        title: "Hộp đèn mặt tiền nằm ngang gắn dựng lam gỗ (3.2m x 1.1m)",
        badge: "Mặt tiền",
        image_url: "/signs/sign_facade_wood.jpg",
        dimensions: { width: 3.2, height: 1.1, depth: 0.22 },
        description: "Hộp đèn mặt tiền nằm ngang bố trí trên nền lam gỗ ngoài trời sang trọng, khung viền nhôm định hình mạ đồng tối, mặt bạt 3M hoặc mica vàng chanh chiếu sáng LED đều mặt, chữ nổi đen & đỏ.",
        materials: { iron_type: "vuong_25", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: true },
        prompt: "Bảng hiệu hộp đèn mặt tiền nằm ngang 3.2m x 1.1m phát sáng vàng chanh chữ nổi SIGNBOARD gắn trên nền lam gỗ tự nhiên sang trọng phía trên cửa showroom.",
        elements: [
          { name: "Vách ốp lam gỗ nền tường", type: "box", position: [0, 0, -0.15], scale: [4.0, 1.8, 0.04], color: "#92400e" },
          { name: "Khung viền nhôm nẹp hộp đèn", type: "box", position: [0, 0, 0], scale: [3.24, 1.14, 0.22], color: "#292524" },
          { name: "Mặt hộp đèn vàng chanh phát sáng", type: "box", position: [0, 0, 0.112], scale: [3.18, 1.08, 0.01], color: "#eab308" },
          { name: "Chữ SIGN màu đen nổi bật", type: "box", position: [-0.7, 0.05, 0.125], scale: [1.1, 0.42, 0.02], color: "#0f172a" },
          { name: "Chữ O màu đỏ thương hiệu", type: "cylinder", position: [0.0, 0.05, 0.125], scale: [0.45, 0.02, 0.45], color: "#dc2626" },
          { name: "Chữ BOARD màu đen tiếp nối", type: "box", position: [0.75, 0.05, 0.125], scale: [1.15, 0.42, 0.02], color: "#0f172a" },
          { name: "Tiêu đề nhỏ PSD MOCKUP phía trên", type: "box", position: [0, 0.35, 0.12], scale: [0.8, 0.08, 0.01], color: "#334155" }
        ]
      },
      // 3. Mặt tiền chuỗi ốp alu đen + Chữ 3D LED + Mái che (Ảnh images (10).jfif)
      {
        id: "sample_starbucks_awning",
        category: "storefront",
        title: "Mặt tiền chuỗi ốp alu đen + Chữ 3D LED + Mái che (8.5m x 2.0m)",
        badge: "Mặt tiền chuỗi",
        image_url: "/signs/sign_starbucks_awning.jpg",
        dimensions: { width: 8.5, height: 2.0, depth: 0.35 },
        description: "Mặt dựng alu Alcorest màu xám đen ngoài trời, bộ chữ nổi 3D lớn màu trắng sữa uốn nổi phát sáng mặt, kết hợp mái che vòm bạt xanh lá đậm in thương hiệu cho quán cafe / nhà hàng.",
        materials: { iron_type: "vuong_30", surface_type: "alu_3mm", has_led: true, has_sheet_backing: true },
        prompt: "Mặt tiền thương hiệu cafe chuỗi 8.5m x 2.0m ốp alu đen nhám cao cấp, chữ nổi 3D màu trắng sữa phát sáng LED rực rỡ, kèm mái che vòm di động xanh lục phong cách châu Âu.",
        elements: [
          { name: "Khung xương sắt hộp 30x30", type: "box", position: [0, 0, -0.05], scale: [8.5, 2.0, 0.06], color: "#334155" },
          { name: "Tấm ốp Alu Alcorest đen nhám ngoài trời", type: "box", position: [0, 0, 0], scale: [8.5, 2.0, 0.02], color: "#1e293b" },
          { name: "Bộ chữ nổi STARBUCKS COFFEE 3D phát sáng", type: "box", position: [0, 0.25, 0.12], scale: [6.8, 0.75, 0.18], color: "#f8fafc" },
          { name: "Mái che vòm di động màu xanh (Trái)", type: "box", position: [-2.3, -1.0, 0.55], scale: [3.6, 0.6, 1.1], color: "#14532d" },
          { name: "Mái che vòm di động màu xanh (Phải)", type: "box", position: [2.3, -1.0, 0.55], scale: [3.6, 0.6, 1.1], color: "#14532d" },
          { name: "Dải chữ thương hiệu STARBUCKS viền mái", type: "box", position: [-2.3, -1.2, 1.05], scale: [2.8, 0.18, 0.02], color: "#ffffff" }
        ]
      },
      // 4. Biển công ty / Spa Dental cao cấp 4 ốc chân kính Inox (Ảnh images (11).jfif)
      {
        id: "sample_spa_gold_plaque",
        category: "mini",
        title: "Biển công ty / Spa Dental cao cấp 4 ốc chân kính Inox (0.8m x 0.6m)",
        badge: "Biển nhỏ",
        image_url: "/signs/sign_spa_gold_plaque.jpg",
        dimensions: { width: 0.8, height: 0.6, depth: 0.05 },
        description: "Biển công ty / nha khoa spa sang trọng tấm nền mica đen mờ, 4 ốc chân kính inox 304 giữ cách tường 2cm, logo hoa sen và bộ chữ nổi Inox mạ vàng gương 3D sắc nét.",
        materials: { iron_type: "vuong_20", surface_type: "alu_guong_vang", has_led: false, has_sheet_backing: false },
        prompt: "Biển tên công ty Dental Spa 0.8m x 0.6m tấm nền mica đen mờ, 4 ốc chân kính inox sáng loáng, logo hoa sen và chữ nổi inox vàng gương 3D cao cấp gắn sảnh tiếp tân.",
        elements: [
          { name: "Tấm nền mica đen mờ vát góc", type: "box", position: [0, 0, 0.02], scale: [0.8, 0.6, 0.012], color: "#18181b" },
          { name: "Ốc chân kính Inox góc trên trái", type: "cylinder", position: [-0.35, 0.25, 0.015], scale: [0.03, 0.03, 0.03], color: "#e2e8f0" },
          { name: "Ốc chân kính Inox góc trên phải", type: "cylinder", position: [0.35, 0.25, 0.015], scale: [0.03, 0.03, 0.03], color: "#e2e8f0" },
          { name: "Ốc chân kính Inox góc dưới trái", type: "cylinder", position: [-0.35, -0.25, 0.015], scale: [0.03, 0.03, 0.03], color: "#e2e8f0" },
          { name: "Ốc chân kính Inox góc dưới phải", type: "cylinder", position: [0.35, -0.25, 0.015], scale: [0.03, 0.03, 0.03], color: "#e2e8f0" },
          { name: "Logo hoa sen 3D Inox vàng gương", type: "box", position: [0, 0.12, 0.035], scale: [0.26, 0.24, 0.02], color: "#fbbf24" },
          { name: "Bộ chữ nổi AHIMSA 3D Inox vàng gương", type: "box", position: [0, -0.07, 0.035], scale: [0.55, 0.14, 0.02], color: "#f59e0b" },
          { name: "Dòng chữ phụ DENTAL SPA", type: "box", position: [0, -0.18, 0.03], scale: [0.32, 0.05, 0.01], color: "#d97706" }
        ]
      },
      // 5. Bảng hiệu 3D LED sáng mặt & hắt hào quang chân chữ (Ảnh images (12).jfif)
      {
        id: "sample_3d_led_dual_glow",
        category: "storefront",
        title: "Bảng hiệu 3D LED sáng mặt & hắt hào quang chân chữ (4.5m x 1.2m)",
        badge: "Mặt tiền LED",
        image_url: "/signs/sign_3d_led_dual_glow.jpg",
        dimensions: { width: 4.5, height: 1.2, depth: 0.22 },
        description: "Bảng hiệu shop thời trang boutique ngoài trời ban đêm, nền alu đen tuyền, bộ chữ 3D SIGNAGE ánh sáng kép siêu nổi bật (mặt mica sáng trắng lạnh + hắt hào quang chân chữ halo-lit viền alu).",
        materials: { iron_type: "vuong_25", surface_type: "alu_3mm", has_led: true, has_sheet_backing: true },
        prompt: "Bảng hiệu mặt tiền shop thời trang cao cấp ban đêm 4.5m x 1.2m ốp alu đen tuyền, chữ nổi 3D SIGNAGE ánh sáng trắng kép LED sáng mặt và tỏa hào quang chân chữ cực kỳ nổi bật.",
        elements: [
          { name: "Khung sắt chịu lực 25x25", type: "box", position: [0, 0, -0.04], scale: [4.5, 1.2, 0.05], color: "#27272a" },
          { name: "Mặt ốp Alu ngoài trời đen tuyền", type: "box", position: [0, 0, 0], scale: [4.5, 1.2, 0.02], color: "#09090b" },
          { name: "Lớp hào quang LED hắt chân (Halo backlight)", type: "box", position: [0, 0.05, 0.025], scale: [3.7, 0.65, 0.015], color: "#38bdf8" },
          { name: "Bộ chữ nổi 3D SIGNAGE phát sáng mặt trắng", type: "box", position: [0, 0.05, 0.08], scale: [3.5, 0.55, 0.09], color: "#ffffff" },
          { name: "Mép nẹp viền bảo vệ mặt bảng", type: "box", position: [0, 0.59, 0.02], scale: [4.52, 0.04, 0.05], color: "#18181b" }
        ]
      },
      // 6. Bộ chữ nổi 3D dán trực tiếp vách lễ tân văn phòng (Ảnh images (13).jfif)
      {
        id: "sample_office_backdrop",
        category: "storefront",
        title: "Bộ chữ nổi 3D dán trực tiếp vách lễ tân văn phòng (3.0m x 1.2m)",
        badge: "Nội thất văn phòng",
        image_url: "/signs/sign_office_backdrop.jpg",
        dimensions: { width: 3.0, height: 1.2, depth: 0.08 },
        description: "Logo biểu tượng chữ X và bộ chữ nổi 3D gắn trực tiếp lên tường vách lễ tân văn phòng công nghệ, phối hai tông màu xám than sang trọng và xanh cyan công nghệ hiện đại.",
        materials: { iron_type: "vuong_20", surface_type: "alu_3mm", has_led: false, has_sheet_backing: false },
        prompt: "Bộ chữ nổi 3D gắn trực tiếp lên vách tường lễ tân văn phòng công nghệ 3.0m x 1.2m, logo và chữ mica dày 15mm phối hai màu xám than sang trọng và xanh cyan hiện đại.",
        elements: [
          { name: "Vách tường văn phòng lễ tân màu sáng", type: "box", position: [0, 0, -0.02], scale: [3.8, 1.8, 0.04], color: "#f1f5f9" },
          { name: "Biểu tượng Logo chữ X màu xanh cyan", type: "box", position: [-1.0, 0.15, 0.035], scale: [0.35, 0.35, 0.04], color: "#0284c7" },
          { name: "Cụm chữ 3D big switch màu xám than", type: "box", position: [0.15, 0.15, 0.035], scale: [1.8, 0.38, 0.04], color: "#334155" },
          { name: "Cụm chữ 3D networks màu xanh cyan", type: "box", position: [0.15, -0.22, 0.03], scale: [1.6, 0.26, 0.035], color: "#0ea5e9" },
          { name: "Chân đệm nổi 15mm tạo bóng đổ", type: "box", position: [0.15, 0, 0.005], scale: [2.2, 0.7, 0.015], color: "#cbd5e1" }
        ]
      },
      // Các mẫu bổ sung khác
      {
        id: "pano_wall_interchange",
        category: "billboard",
        title: "Pano ốp tường góc ngã tư lớn (12m x 6m)",
        badge: "Pano lớn",
        dimensions: { width: 12.0, height: 6.0, depth: 0.4 },
        description: "Pano quảng cáo tấm lớn 72m2 ốp mặt hông tòa nhà góc ngã tư giao lộ, khung giàn sắt hộp đan kép 30x30 và V4 gia cố chịu gió mạnh, bạt 2 da xám chống xuyên sáng, dàn 6 đèn pha LED 100W vươn ra ngoài.",
        materials: { iron_type: "vuong_30", surface_type: "bat_2da", has_led: true, has_sheet_backing: false },
        prompt: "Pano tấm lớn 12m x 6m ốp hông tòa nhà ngã tư đông đúc, căng bạt phẳng tuyệt đối, đèn pha chiếu sáng rực rỡ nhìn từ xa."
      },
      {
        id: "billboard_giant_pillar",
        category: "billboard",
        title: "Billboard Cột thép tròn khổng lồ cao tốc (15m x 8m cao 18m)",
        badge: "Billboard khổng lồ",
        dimensions: { width: 15.0, height: 8.0, depth: 1.5 },
        description: "Biển quảng cáo tấm lớn một cột trụ thép tròn D1000 dày 14mm, kết cấu giàn không gian 2 mặt 120m2/mặt, móng bê tông đúc chịu bão cấp 12, sàn thao tác kiểm tra an toàn, 10 đèn pha LED 200W.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: false },
        prompt: "Billboard khổng lồ một cột trụ thép cao 18m kích thước bảng 15m x 8m bên cạnh tuyến đường cao tốc thông thoáng."
      }
    ];
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

  // 7. Polling trạng thái job đến khi hoàn tất
  async pollJobStatus(jobId: string): Promise<GenAIJob> {
    try {
      const res = await axios.get(this.getApiUrl(`/genai/jobs/${jobId}`), { timeout: 10000 });
      return res.data;
    } catch {
      const fallback = await axios.get(`${GENAI_REMOTE_URL}/api/jobs/${jobId}`, { timeout: 10000 });
      return fallback.data;
    }
  }

  // 8. Đợi hoàn tất job với callback cập nhật tiến trình
  async waitForJob(
    jobId: string,
    onProgress?: (job: GenAIJob) => void,
    timeoutMs: number = 180000
  ): Promise<GenAIJob> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const job = await this.pollJobStatus(jobId);
      if (onProgress) onProgress(job);

      if (job.status === "completed") {
        return job;
      }
      if (job.status === "failed") {
        throw new Error(job.error || "Tác vụ render GenAI bị thất bại");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("Quá thời gian chờ phản hồi từ GenAI Worker");
  }
}

export const genAISignboardService = new GenAISignboardService();
