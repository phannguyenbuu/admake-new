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

  // 2. Lấy danh sách Hint chuyên dụng quảng cáo (từ bảng nhỏ đến billboard)
  async getSignboardHints(): Promise<SignboardHint[]> {
    try {
      const res = await axios.get(this.getApiUrl("/3d/hints"), { timeout: 6000 });
      if (res.data?.hints) return res.data.hints;
    } catch (e) {
      console.warn("Failed to fetch hints from backend, using default list", e);
    }

    return [
      {
        id: "mini_vaccum_circle",
        category: "mini",
        title: "Biển vẫy Mica hút nổi tròn (D80cm)",
        badge: "Bảng nhỏ",
        dimensions: { width: 0.8, height: 0.8, depth: 0.15 },
        description: "Biển vẫy tròn 2 mặt mica Đài Loan hút nổi 3D, viền nhôm định hình sơn đen nhám, chân sắt uốn chữ L gắn tường, đèn LED đúc chống nước siêu sáng.",
        materials: { iron_type: "vuong_20", surface_type: "bat_khong_gan_uv", has_led: true, has_sheet_backing: false },
        prompt: "Biển vẫy tròn mica hút nổi D80cm 2 mặt sáng bóng, viền nhôm đen sang trọng gắn tường mặt tiền quán cafe hiện đại."
      },
      {
        id: "mini_slim_lightbox",
        category: "mini",
        title: "Hộp đèn siêu mỏng nắp hít (0.6m x 1.2m)",
        badge: "Bảng nhỏ",
        dimensions: { width: 0.6, height: 1.2, depth: 0.04 },
        description: "Hộp đèn siêu mỏng dày 2.8cm, khung nhôm nắp hít nam châm cao cấp, mặt mica trong suốt dẫn sáng đều, tranh in Backlit film độ nét cao, đèn LED thanh viền cạnh.",
        materials: { iron_type: "vuong_20", surface_type: "mica_2_3mm", has_led: true, has_sheet_backing: false },
        prompt: "Hộp đèn siêu mỏng nắp hít sang trọng kích thước 0.6m x 1.2m hiển thị menu đồ uống cho quán trà sữa/spa."
      },
      {
        id: "mini_inox_gold_office",
        category: "mini",
        title: "Biển công ty Inox vàng gương ăn mòn (0.4m x 0.6m)",
        badge: "Bảng nhỏ",
        dimensions: { width: 0.6, height: 0.4, depth: 0.03 },
        description: "Biển tên công ty Inox 304 mạ vàng gương ăn mòn chìm tinh xảo sơn màu sắc nét, vát cạnh 45 độ, đệm formex hoặc mica phía sau.",
        materials: { iron_type: "vuong_20", surface_type: "alu_guong_vang", has_led: false, has_sheet_backing: false },
        prompt: "Biển công ty inox vàng gương 304 vát cạnh sáng bóng 0.4m x 0.6m gắn cửa văn phòng cao cấp."
      },
      {
        id: "store_alu_mica_led",
        category: "storefront",
        title: "Mặt tiền Alu 3mm chữ nổi Mica LED sáng mặt (6m x 2.5m)",
        badge: "Mặt tiền",
        dimensions: { width: 6.0, height: 2.5, depth: 0.25 },
        description: "Bảng hiệu mặt tiền ốp Alu Alcorest 3mm 0.10 ngoài trời, khung sắt hộp 25x25 đan ô nhịp 1.2m, chữ nổi Mica Đài Loan uốn chân viền formex, gắn LED cụm 3 bóng siêu sáng.",
        materials: { iron_type: "vuong_25", surface_type: "alu_3mm", has_led: true, has_sheet_backing: true },
        prompt: "Mặt tiền cửa hàng showroom 6m x 2.5m ốp alu xám đen cao cấp, chữ nổi mica màu trắng cam phát sáng LED rực rỡ buổi tối."
      },
      {
        id: "store_3m_uv_lightbox",
        category: "storefront",
        title: "Hộp đèn Bạt 3M in UV cao cấp không gân (8m x 2.8m)",
        badge: "Mặt tiền",
        dimensions: { width: 8.0, height: 2.8, depth: 0.3 },
        description: "Bảng hiệu hộp đèn bạt 3M nhập khẩu in UV sắc nét, không lộ gân khi chiếu sáng, khung sắt hộp 30x30 mã kẽm dày 1.2mm, bố trí hệ thống đèn LED module rọi đều chống chóa.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: true },
        prompt: "Bảng hiệu hộp đèn bạt 3M in UV khổ lớn 8m x 2.8m phẳng mịn không gân cho ngân hàng hoặc chuỗi bán lẻ hiện đại."
      },
      {
        id: "store_inox_gold_wood",
        category: "storefront",
        title: "Mặt dựng Lam sóng giả gỗ + Chữ Inox vàng gương hắt chân (7m x 3m)",
        badge: "Mặt tiền",
        dimensions: { width: 7.0, height: 3.0, depth: 0.3 },
        description: "Mặt tiền ốp thanh lam sóng composite giả gỗ ngoài trời chống nước chống cháy, bộ chữ nổi Inox 304 vàng gương sáng bóng hắt chân đèn LED vàng ấm 3000K sang trọng.",
        materials: { iron_type: "vuong_30", surface_type: "alu_guong_vang", has_led: true, has_sheet_backing: true },
        prompt: "Mặt tiền nhà hàng sang trọng 7m x 3m ốp lam sóng gỗ ấm áp, chữ nổi inox vàng gương hắt ánh sáng chân vàng ấm lung linh."
      },
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
