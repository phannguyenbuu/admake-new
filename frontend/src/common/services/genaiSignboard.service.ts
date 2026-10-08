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
      // 7. Biển công ty mica trong suốt 4 ốc chân kính Inox (Ảnh Acrylic-Sign-Board-1.jpg)
      {
        id: "sample_acrylic_transparent",
        category: "mini",
        title: "Biển công ty mica trong suốt 4 ốc chân kính Inox (1.0m x 0.8m)",
        badge: "Biển công ty",
        image_url: "/signs/sign_acrylic_transparent.jpg",
        dimensions: { width: 1.0, height: 0.8, depth: 0.05 },
        description: "Tấm acrylic / mica trong suốt cao cấp dày 8mm mài bóng cạnh kim cương, bắt 4 ốc chân kính Inox 304 giữ cách tường 25mm, in UV mặt sau logo HealthWave sắc nét.",
        materials: { iron_type: "vuong_20", surface_type: "mica_2_3mm", has_led: false, has_sheet_backing: false },
        prompt: "Biển tên công ty chăm sóc sức khỏe HealthWave 1.0m x 0.8m tấm nền mica trong suốt bắt 4 ốc chân kính inox sáng loáng gắn tường sảnh hiện đại.",
        elements: [
          { name: "Tấm nền mica trong suốt dày 8mm", type: "box", position: [0, 0, 0.02], scale: [1.0, 0.8, 0.012], color: "#e2e8f0" },
          { name: "Ốc chân kính Inox góc trên trái", type: "cylinder", position: [-0.44, 0.34, 0.015], scale: [0.035, 0.035, 0.035], color: "#cbd5e1" },
          { name: "Ốc chân kính Inox góc trên phải", type: "cylinder", position: [0.44, 0.34, 0.015], scale: [0.035, 0.035, 0.035], color: "#cbd5e1" },
          { name: "Ốc chân kính Inox góc dưới trái", type: "cylinder", position: [-0.44, -0.34, 0.015], scale: [0.035, 0.035, 0.035], color: "#cbd5e1" },
          { name: "Ốc chân kính Inox góc dưới phải", type: "cylinder", position: [0.44, -0.34, 0.015], scale: [0.035, 0.035, 0.035], color: "#cbd5e1" },
          { name: "Logo mầm cây cam & xanh", type: "box", position: [0, 0.12, 0.03], scale: [0.32, 0.32, 0.01], color: "#ea580c" },
          { name: "Chữ thương hiệu HealthWave", type: "box", position: [0, -0.16, 0.03], scale: [0.65, 0.14, 0.01], color: "#0f172a" },
          { name: "Dòng slogan YOUR BUSINESS TAGLINE", type: "box", position: [0, -0.26, 0.03], scale: [0.55, 0.05, 0.008], color: "#475569" }
        ]
      },
      // 8. Hộp đèn mặt tiền chuỗi kem trà sữa Mixue (Ảnh images.jfif)
      {
        id: "sample_mixue_red_facade",
        category: "storefront",
        title: "Hộp đèn mặt tiền chuỗi kem trà sữa Mixue (6.5m x 1.4m)",
        badge: "Mặt tiền chuỗi",
        image_url: "/signs/sign_mixue_red_facade.jpg",
        dimensions: { width: 6.5, height: 1.4, depth: 0.25 },
        description: "Hộp đèn mặt tiền chuỗi kem trà sữa Mixue, mặt bạt 3M hoặc bạt không gân in UV màu đỏ tươi rực rỡ, chiếu sáng xuyên đèn LED mô đun siêu sáng bên trong, logo Người tuyết và chữ MIXUE phát sáng trắng.",
        materials: { iron_type: "vuong_25", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: true },
        prompt: "Bảng hiệu hộp đèn mặt tiền chuỗi kem trà sữa Mixue 6.5m x 1.4m màu đỏ rực rỡ ban đêm, logo Người tuyết đội vương miện cầm kem và chữ MIXUE sáng rực.",
        elements: [
          { name: "Khung xương sắt hộp 25x25", type: "box", position: [0, 0, -0.05], scale: [6.5, 1.4, 0.06], color: "#334155" },
          { name: "Hộp đèn mặt bạt đỏ rực phát sáng", type: "box", position: [0, 0, 0], scale: [6.5, 1.4, 0.22], color: "#dc2626" },
          { name: "Logo Người tuyết Mixue (Trái)", type: "box", position: [-2.0, 0, 0.12], scale: [0.9, 1.1, 0.02], color: "#ffffff" },
          { name: "Vương miện & Cây kem", type: "box", position: [-2.3, 0.2, 0.13], scale: [0.2, 0.5, 0.02], color: "#facc15" },
          { name: "Cụm chữ MIXUE nổi bật màu trắng", type: "box", position: [0.8, 0.18, 0.12], scale: [3.6, 0.65, 0.02], color: "#ffffff" },
          { name: "Dòng chữ SINCE 1997 ICE CREAM & TEA", type: "box", position: [0.8, -0.28, 0.12], scale: [3.4, 0.2, 0.015], color: "#ffffff" },
          { name: "Biển vẫy phụ bên hông", type: "box", position: [3.45, 0.1, 0.4], scale: [0.5, 0.9, 0.12], color: "#b91c1c" }
        ]
      },
      // 9. Hộp đèn đỏ mặt tiền kèm dàn 5 đèn rọi Gooseneck (Ảnh images (1).jfif)
      {
        id: "sample_lightbox_spotlights",
        category: "storefront",
        title: "Hộp đèn đỏ mặt tiền kèm dàn 5 đèn rọi Gooseneck (4.2m x 1.2m)",
        badge: "Hộp đèn + Đèn rọi",
        image_url: "/signs/sign_lightbox_spotlights.jpg",
        dimensions: { width: 4.2, height: 1.2, depth: 0.25 },
        description: "Hộp đèn mặt tiền ốp alu đỏ tươi kết hợp đèn LED bên trong, phía trên gắn dàn 5 cần đèn rọi spotlight kim loại uốn cong rọi thẳng vào bề mặt bảng hiệu tạo hiệu ứng kiến trúc cao cấp.",
        materials: { iron_type: "vuong_25", surface_type: "alu_3mm", has_led: true, has_sheet_backing: true },
        prompt: "Bảng hiệu hộp đèn màu đỏ tươi 4.2m x 1.2m gắn trên tường tôn xám đen sang trọng, phía trên có dàn 5 đèn rọi spotlight vươn ra chiếu sáng rực rỡ chữ Sign Board Mockup.",
        elements: [
          { name: "Nền tường ốp tôn xám than", type: "box", position: [0, 0, -0.1], scale: [5.2, 2.0, 0.05], color: "#1e293b" },
          { name: "Hộp đèn alu đỏ", type: "box", position: [0, 0, 0], scale: [4.2, 1.2, 0.22], color: "#dc2626" },
          { name: "Chữ Sign Board (Dòng 1)", type: "box", position: [-0.6, 0.22, 0.12], scale: [2.2, 0.35, 0.02], color: "#ffffff" },
          { name: "Chữ Mockup (Dòng 2)", type: "box", position: [-0.7, -0.15, 0.12], scale: [1.9, 0.32, 0.02], color: "#ffffff" },
          { name: "Đèn rọi 1", type: "box", position: [-1.6, 0.72, 0.15], scale: [0.08, 0.18, 0.3], color: "#0f172a" },
          { name: "Đèn rọi 2", type: "box", position: [-0.8, 0.72, 0.15], scale: [0.08, 0.18, 0.3], color: "#0f172a" },
          { name: "Đèn rọi 3", type: "box", position: [0.0, 0.72, 0.15], scale: [0.08, 0.18, 0.3], color: "#0f172a" },
          { name: "Đèn rọi 4", type: "box", position: [0.8, 0.72, 0.15], scale: [0.08, 0.18, 0.3], color: "#0f172a" },
          { name: "Đèn rọi 5", type: "box", position: [1.6, 0.72, 0.15], scale: [0.08, 0.18, 0.3], color: "#0f172a" }
        ]
      },
      // 10. Biển vẫy treo thanh giằng sắt nghệ thuật Châu Âu (Ảnh images (2).jfif)
      {
        id: "sample_blade_hanging_vintage",
        category: "mini",
        title: "Biển vẫy treo thanh giằng sắt nghệ thuật Châu Âu (0.7m x 0.9m)",
        badge: "Biển vẫy Vintage",
        image_url: "/signs/sign_blade_hanging_vintage.jpg",
        dimensions: { width: 0.7, height: 0.9, depth: 0.08 },
        description: "Biển vẫy phong cách cổ điển Châu Âu thả treo từ thanh sắt hộp ngang gắn vuông góc tường đá, mặt biển tấm kim loại/alu màu đen nhám hình chữ nhật đứng, chữ trắng tinh tế sang trọng.",
        materials: { iron_type: "vuong_20", surface_type: "alu_3mm", has_led: false, has_sheet_backing: false },
        prompt: "Biển vẫy treo tường thanh sắt ngang phong cách Châu Âu cổ điển 0.7m x 0.9m màu đen nhám mờ, chữ trắng Storefront SIGNS gắn trên mặt tiền phố cổ Paris.",
        elements: [
          { name: "Bát sắt gắn tường", type: "box", position: [-0.42, 0.48, 0], scale: [0.06, 0.25, 0.12], color: "#18181b" },
          { name: "Thanh treo sắt ngang chịu lực", type: "box", position: [0, 0.5, 0], scale: [0.85, 0.05, 0.05], color: "#18181b" },
          { name: "Móc treo thả biển (Trái)", type: "box", position: [-0.22, 0.42, 0], scale: [0.03, 0.12, 0.03], color: "#27272a" },
          { name: "Móc treo thả biển (Phải)", type: "box", position: [0.22, 0.42, 0], scale: [0.03, 0.12, 0.03], color: "#27272a" },
          { name: "Tấm biển đen nhám đứng", type: "box", position: [0, -0.08, 0], scale: [0.7, 0.9, 0.04], color: "#18181b" },
          { name: "Chữ Storefront SIGNS", type: "box", position: [0, -0.05, 0.025], scale: [0.55, 0.3, 0.01], color: "#f8fafc" },
          { name: "Logo tagline nhỏ phía dưới", type: "box", position: [0, -0.38, 0.025], scale: [0.3, 0.05, 0.008], color: "#94a3b8" }
        ]
      },
      // 11. Bảng hiệu chữ Inox vàng gương hắt chân hào quang LED nền xanh ngọc (Ảnh images (3).jfif)
      {
        id: "sample_halo_gold_green",
        category: "storefront",
        title: "Bảng hiệu chữ Inox vàng gương hắt chân hào quang LED nền xanh ngọc (2.8m x 1.4m)",
        badge: "LED Hào quang",
        image_url: "/signs/sign_halo_gold_green.jpg",
        dimensions: { width: 2.8, height: 1.4, depth: 0.15 },
        description: "Mặt bảng hiệu ốp tấm màu xanh ngọc / ngọc lục bảo mờ cao cấp, bộ chữ nổi nghệ thuật uốn inox vàng gương chân mica cháo hắt hào quang ánh sáng vàng ấm 3000K tỏa xung quanh chân chữ.",
        materials: { iron_type: "vuong_25", surface_type: "alu_guong_vang", has_led: true, has_sheet_backing: true },
        prompt: "Bảng hiệu chữ nổi inox mạ vàng gương 3D uốn cong mềm mại phát sáng hào quang LED vàng ấm tỏa quanh chân chữ trên nền xanh ngọc lục bảo sang trọng tuyệt đẹp.",
        elements: [
          { name: "Nền tấm bảng màu xanh ngọc", type: "box", position: [0, 0, 0], scale: [2.8, 1.4, 0.04], color: "#34d399" },
          { name: "Lớp hào quang LED vàng ấm hắt chân", type: "box", position: [0, 0.02, 0.025], scale: [2.3, 0.95, 0.015], color: "#fef08a" },
          { name: "Bộ chữ Inox vàng gương Skywow", type: "box", position: [0, 0.02, 0.06], scale: [2.15, 0.85, 0.05], color: "#eab308" },
          { name: "Biểu tượng ống kính vàng gương", type: "cylinder", position: [-0.1, 0.22, 0.08], scale: [0.15, 0.45, 0.15], color: "#ca8a04" }
        ]
      },
      // 12. Hộp đèn Alu phay xước khoét CNC lộng âm mica phát sáng (Ảnh images (4).jfif)
      {
        id: "sample_cnc_cutout_industrial",
        category: "mini",
        title: "Hộp đèn Alu phay xước khoét CNC lộng âm mica phát sáng (0.7m x 0.55m)",
        badge: "Alu CNC lộng âm",
        image_url: "/signs/sign_cnc_cutout_industrial.jpg",
        dimensions: { width: 0.7, height: 0.55, depth: 0.12 },
        description: "Hộp đèn kim loại phong cách công nghiệp (Industrial Vintage), vỏ alu xám đen phay xước khoét CNC chính xác logo THEGARA và thông tin giờ mở cửa, lót mica sữa trắng xuyên sáng từ dàn LED bên trong.",
        materials: { iron_type: "vuong_20", surface_type: "alu_3mm", has_led: true, has_sheet_backing: true },
        prompt: "Hộp đèn phong cách công nghiệp alu đen mờ phay xước khoét CNC lộng âm chữ THEGARA phát sáng trắng xuyên đèn LED trong đêm.",
        elements: [
          { name: "Thùng hộp đèn alu đen phay xước", type: "box", position: [0, 0, 0], scale: [0.7, 0.55, 0.12], color: "#27272a" },
          { name: "Cụm chữ THEGARA CNC lộng âm phát sáng", type: "box", position: [0, 0.1, 0.062], scale: [0.55, 0.15, 0.005], color: "#ffffff" },
          { name: "Dòng chữ CURATED GARMENTS & COLLECTIBLES", type: "box", position: [0, 0.02, 0.062], scale: [0.48, 0.04, 0.005], color: "#f1f5f9" },
          { name: "Thông tin giờ mở cửa TUES - SUN 11AM - 9PM", type: "box", position: [0, -0.14, 0.062], scale: [0.28, 0.08, 0.005], color: "#e2e8f0" }
        ]
      },
      // 13. Biển vẫy chữ nhật viền nhôm trắng mặt đỏ san hô (Ảnh images (5).jfif)
      {
        id: "sample_blade_coral_white",
        category: "mini",
        title: "Biển vẫy chữ nhật viền nhôm trắng mặt đỏ san hô (1.1m x 0.55m)",
        badge: "Biển vẫy hiện đại",
        image_url: "/signs/sign_blade_coral_white.jpg",
        dimensions: { width: 1.1, height: 0.55, depth: 0.15 },
        description: "Biển vẫy 2 mặt hộp đèn chữ nhật nằm ngang phong cách hiện đại, khung viền nhôm định hình sơn trắng sứ bo viền sang trọng, mặt mica màu đỏ san hô phát sáng 2 mặt, chân bát bát giữ hông tường/kính.",
        materials: { iron_type: "vuong_20", surface_type: "mica_2_3mm", has_led: true, has_sheet_backing: false },
        prompt: "Biển vẫy hộp đèn chữ nhật nằm ngang 1.1m x 0.55m viền nhôm trắng sữa tinh tế, mặt mica đỏ san hô sáng rực chữ SignBoard Storefront Mockup gắn mặt tiền phố hiện đại.",
        elements: [
          { name: "Bát gắn tường/kính chịu lực", type: "box", position: [-0.58, 0, 0], scale: [0.06, 0.35, 0.18], color: "#e2e8f0" },
          { name: "Khung viền nhôm định hình sơn trắng", type: "box", position: [0, 0, 0], scale: [1.12, 0.57, 0.15], color: "#ffffff" },
          { name: "Mặt mica đỏ san hô (Mặt trước)", type: "box", position: [0, 0, 0.076], scale: [1.08, 0.53, 0.01], color: "#f43f5e" },
          { name: "Mặt mica đỏ san hô (Mặt sau)", type: "box", position: [0, 0, -0.076], scale: [1.08, 0.53, 0.01], color: "#f43f5e" },
          { name: "Chữ SignBoard Storefront Mockup (Mặt trước)", type: "box", position: [0, 0.02, 0.082], scale: [0.75, 0.28, 0.01], color: "#ffffff" },
          { name: "Chữ SignBoard Storefront Mockup (Mặt sau)", type: "box", position: [0, 0.02, -0.082], scale: [0.75, 0.28, 0.01], color: "#ffffff" }
        ]
      },
      // 14. Hộp đèn mặt tiền màu cam đỏ gắn tường gạch hiện đại (Ảnh images (6).jfif)
      {
        id: "sample_facade_orange_brick",
        category: "storefront",
        title: "Hộp đèn mặt tiền màu cam đỏ gắn tường gạch hiện đại (2.6m x 0.95m)",
        badge: "Mặt tiền hộp đèn",
        image_url: "/signs/sign_facade_orange_brick.jpg",
        dimensions: { width: 2.6, height: 0.95, depth: 0.2 },
        description: "Hộp đèn mặt tiền chữ nhật nằm ngang trên nền tường gạch xám hiện đại, khung kim loại màu xám than sang trọng, bề mặt mica/bạt 3M màu cam đỏ phát sáng ấm áp, chữ trắng SignBoard Mockup nổi bật.",
        materials: { iron_type: "vuong_25", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: true },
        prompt: "Bảng hiệu hộp đèn mặt tiền nằm ngang màu cam đỏ rực rỡ 2.6m x 0.95m chữ trắng SignBoard Mockup gắn trên tường gạch xám hiện đại lúc hoàng hôn.",
        elements: [
          { name: "Nền tường gạch xám", type: "box", position: [0, 0, -0.12], scale: [3.4, 1.6, 0.05], color: "#78716c" },
          { name: "Khung hộp đèn xám than", type: "box", position: [0, 0, 0], scale: [2.64, 0.99, 0.2], color: "#292524" },
          { name: "Mặt hộp đèn màu cam đỏ phát sáng", type: "box", position: [0, 0, 0.102], scale: [2.58, 0.93, 0.01], color: "#f97316" },
          { name: "Bộ chữ SignBoard Mockup trắng nổi bật", type: "box", position: [0, 0, 0.115], scale: [1.8, 0.35, 0.02], color: "#ffffff" }
        ]
      },
      // 15. Billboard cao tốc 1 cột thép tròn giàn không gian (Ảnh 1.webp)
      {
        id: "sample_billboard_highway_green",
        category: "billboard",
        title: "Billboard cao tốc 1 cột thép tròn giàn không gian (14m x 7m cao 16m)",
        badge: "Billboard cao tốc",
        image_url: "/signs/sign_billboard_highway_green.jpg",
        dimensions: { width: 14.0, height: 7.0, depth: 1.2 },
        description: "Biển quảng cáo tấm lớn một cột trụ thép tròn D1200 sơn trắng chịu bão cấp 12, giàn không gian thép đan chéo đỡ sàn catwalk kỹ thuật, mặt bạt 3M hoặc màn hình LED xanh lá cây chroma key, có dàn 6 đèn pha LED 200W chiếu sáng đỉnh.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: false },
        prompt: "Billboard tấm lớn một cột trụ thép trắng tròn cao 16m kích thước 14m x 7m bên cạnh đường cao tốc trên cao, giàn không gian kim loại vững chắc.",
        elements: [
          { name: "Cột trụ thép tròn D1200", type: "cylinder", position: [0, -4.5, -0.3], scale: [1.2, 9.0, 1.2], color: "#f1f5f9" },
          { name: "Giàn không gian thép đỡ sàn", type: "box", position: [0, -0.2, -0.2], scale: [14.2, 0.8, 1.2], color: "#94a3b8" },
          { name: "Mặt bảng pano bạt 3M", type: "box", position: [0, 3.8, 0], scale: [14.0, 7.0, 0.05], color: "#22c55e" },
          { name: "Viền nẹp khung kim loại", type: "box", position: [0, 3.8, -0.05], scale: [14.3, 7.3, 0.2], color: "#e2e8f0" },
          { name: "Đèn pha 1", type: "box", position: [-5.0, 7.6, 0.4], scale: [0.2, 0.2, 0.4], color: "#334155" },
          { name: "Đèn pha 2", type: "box", position: [-3.0, 7.6, 0.4], scale: [0.2, 0.2, 0.4], color: "#334155" },
          { name: "Đèn pha 3", type: "box", position: [-1.0, 7.6, 0.4], scale: [0.2, 0.2, 0.4], color: "#334155" },
          { name: "Đèn pha 4", type: "box", position: [1.0, 7.6, 0.4], scale: [0.2, 0.2, 0.4], color: "#334155" },
          { name: "Đèn pha 5", type: "box", position: [3.0, 7.6, 0.4], scale: [0.2, 0.2, 0.4], color: "#334155" },
          { name: "Đèn pha 6", type: "box", position: [5.0, 7.6, 0.4], scale: [0.2, 0.2, 0.4], color: "#334155" }
        ]
      },
      // 16. Billboard cao tốc 2 cột trụ tròn giàn giằng thép (Ảnh blank-billboards-advertising-highway-blue-sky-85391792.webp)
      {
        id: "sample_billboard_double_pole_sky",
        category: "billboard",
        title: "Billboard cao tốc 2 cột trụ tròn giàn giằng thép (16m x 7.5m cao 15m)",
        badge: "Billboard 2 cột",
        image_url: "/signs/sign_billboard_double_pole_sky.jpg",
        dimensions: { width: 16.0, height: 7.5, depth: 1.4 },
        description: "Billboard tấm lớn 2 cột trụ thép tròn D1000 sơn trắng xanh chân đế bê tông, kết cấu giàn giằng thép hộp 2 đầu hồi và sàn thao tác đan chéo chịu gió lốc, mặt bạt trắng phẳng tuyệt đối.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: false },
        prompt: "Billboard tấm lớn hai cột trụ thép tròn đứng cạnh đường quốc lộ cao tốc trên nền trời xanh mây trắng trong lành.",
        elements: [
          { name: "Cột trụ trái D1000", type: "cylinder", position: [-4.5, -4.0, -0.2], scale: [1.0, 8.0, 1.0], color: "#0284c7" },
          { name: "Cột trụ phải D1000", type: "cylinder", position: [4.5, -4.0, -0.2], scale: [1.0, 8.0, 1.0], color: "#0284c7" },
          { name: "Giàn dầm thép ngang liên kết", type: "box", position: [0, -0.1, -0.2], scale: [16.2, 0.8, 1.4], color: "#1e293b" },
          { name: "Giàn giằng đầu hồi trái", type: "box", position: [-8.1, 4.0, -0.2], scale: [0.2, 7.5, 1.4], color: "#334155" },
          { name: "Mặt bảng pano trắng phẳng", type: "box", position: [0, 4.0, 0], scale: [16.0, 7.5, 0.05], color: "#ffffff" }
        ]
      },
      // 17. Billboard cổng vòm 2 cột trụ bắc qua cao tốc (Ảnh blank-highway-billboard-sign-in-an-outdoor-display-showing-a-road-CWWCJA.jpg)
      {
        id: "sample_billboard_highway_gantry",
        category: "billboard",
        title: "Billboard cổng vòm 2 cột trụ bắc qua cao tốc (15m x 5.5m cao 12m)",
        badge: "Cổng vòm cao tốc",
        image_url: "/signs/sign_billboard_highway_gantry.jpg",
        dimensions: { width: 15.0, height: 5.5, depth: 1.2 },
        description: "Kết cấu cổng vòm biển quảng cáo Pano bắc ngang qua toàn bộ mặt đường cao tốc (Overhead Highway Gantry), 2 cột trụ thép tròn 2 bên lề đường, dầm giàn không gian chịu lực vượt nhịp 15m, sàn thao tác bảo dưỡng.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: false },
        prompt: "Cổng pano quảng cáo kết cấu thép bắc ngang qua đường cao tốc xuyên đồng cỏ xanh, mặt bảng trắng tinh dưới bầu trời xanh ngắt.",
        elements: [
          { name: "Cột trụ biên trái", type: "cylinder", position: [-7.0, -3.0, 0], scale: [0.9, 6.5, 0.9], color: "#64748b" },
          { name: "Cột trụ biên phải", type: "cylinder", position: [7.0, -3.0, 0], scale: [0.9, 6.5, 0.9], color: "#64748b" },
          { name: "Dầm giàn thép ngang vượt nhịp", type: "box", position: [0, 0.2, 0], scale: [15.5, 0.6, 1.2], color: "#475569" },
          { name: "Mặt bảng pano ở giữa", type: "box", position: [0, 3.2, 0.1], scale: [15.0, 5.5, 0.05], color: "#ffffff" },
          { name: "Khung đỡ đỉnh", type: "box", position: [0, 6.1, 0], scale: [15.2, 0.3, 0.3], color: "#334155" }
        ]
      },
      // 18. Billboard Unipole 1 trụ thép mạ kẽm sàn thao tác (Ảnh highway-hoarding-board-500x500.webp)
      {
        id: "sample_billboard_hoarding_printer",
        category: "billboard",
        title: "Billboard Unipole 1 trụ thép mạ kẽm sàn thao tác (12m x 6m cao 14m)",
        badge: "Billboard Unipole",
        image_url: "/signs/sign_billboard_hoarding_printer.jpg",
        dimensions: { width: 12.0, height: 6.0, depth: 1.0 },
        description: "Billboard quảng cáo ngoài trời tấm lớn Unipole 1 trụ thép tròn D800 mạ kẽm nhúng nóng, sàn catwalk lan can an toàn bên dưới, mặt bạt in Hiflex/2 da khổ lớn in ấn thương hiệu Concept Design & Printer.",
        materials: { iron_type: "vuong_30", surface_type: "bat_2da", has_led: true, has_sheet_backing: false },
        prompt: "Billboard ngoài trời một trụ thép mạ kẽm tròn cao 14m kích thước 12m x 6m in nội dung quảng cáo in ấn rực rỡ dưới bầu trời xanh.",
        elements: [
          { name: "Trụ thép tròn mạ kẽm D800", type: "cylinder", position: [0, -4.0, -0.15], scale: [0.8, 8.0, 0.8], color: "#94a3b8" },
          { name: "Sàn catwalk lan can an toàn", type: "box", position: [0, -0.15, -0.15], scale: [12.4, 0.45, 1.0], color: "#475569" },
          { name: "Mặt bảng bạt in rực rỡ", type: "box", position: [0, 3.0, 0], scale: [12.0, 6.0, 0.05], color: "#ffffff" },
          { name: "Dải màu gradient quảng cáo", type: "box", position: [0, 1.2, 0.03], scale: [11.8, 2.2, 0.01], color: "#f97316" }
        ]
      },
      // 19. Billboard cao tốc ven sông kiến trúc hiện đại (Ảnh travel-advertising-billboard-on-highway-3d-rendering-mockup-T1MA74.jpg)
      {
        id: "sample_billboard_travel_modern",
        category: "billboard",
        title: "Billboard cao tốc ven sông kiến trúc hiện đại (14m x 6.5m cao 15m)",
        badge: "Kiến trúc hiện đại",
        image_url: "/signs/sign_billboard_travel_modern.jpg",
        dimensions: { width: 14.0, height: 6.5, depth: 1.2 },
        description: "Biển quảng cáo pano phong cách kiến trúc hiện đại bên tuyến đường cao tốc đô thị ven sông, một trụ thép tròn, giàn dầm vát chéo, mặt bạt 3M in hình ảnh du lịch Travel & Inspire Your Life sang trọng.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: false },
        prompt: "Photorealistic 3D architectural rendering of a high-end billboard on an urban waterfront highway, modern steel structure, crisp lighting.",
        elements: [
          { name: "Trụ thép tròn D1000", type: "cylinder", position: [-1.5, -4.5, -0.2], scale: [1.0, 9.0, 1.0], color: "#64748b" },
          { name: "Cụm giàn dầm vát chéo đỡ sàn", type: "box", position: [0, 0, -0.2], scale: [14.2, 0.8, 1.2], color: "#334155" },
          { name: "Mặt bảng pano du lịch", type: "box", position: [0, 3.5, 0], scale: [14.0, 6.5, 0.05], color: "#f8fafc" },
          { name: "Mảng hình ảnh du lịch biển xanh", type: "box", position: [2.5, 3.5, 0.03], scale: [8.5, 6.3, 0.01], color: "#0284c7" },
          { name: "Cột đèn chiếu sáng đô thị chân cầu", type: "box", position: [3.5, -1.5, 0.8], scale: [0.15, 3.0, 0.15], color: "#18181b" }
        ]
      },
      // 20. Billboard Unipole sườn đồi cao tốc (Ảnh images (14).jfif)
      {
        id: "sample_billboard_hillside_orange",
        category: "billboard",
        title: "Billboard Unipole sườn đồi cao tốc (12m x 5m cao 12m)",
        badge: "Sườn đồi cao tốc",
        image_url: "/signs/sign_billboard_hillside_orange.jpg",
        dimensions: { width: 12.0, height: 5.0, depth: 1.0 },
        description: "Biển quảng cáo tấm lớn một trụ thép sơn xanh dương lắp đặt tại sườn đồi đường cao tốc quanh co, kết cấu thép giàn đáy chịu gió núi, mặt pano bạt màu cam nổi bật từ xa.",
        materials: { iron_type: "vuong_30", surface_type: "bat_2da", has_led: true, has_sheet_backing: false },
        prompt: "Billboard Unipole tấm lớn một trụ thép tròn đứng bên sườn đồi cao tốc có xe chạy, mặt bảng màu cam rực rỡ.",
        elements: [
          { name: "Trụ thép tròn sơn xanh", type: "cylinder", position: [0, -3.5, -0.2], scale: [0.9, 7.0, 0.9], color: "#0369a1" },
          { name: "Giàn thép đáy chịu lực", type: "box", position: [0, 0, -0.2], scale: [12.2, 0.5, 1.0], color: "#475569" },
          { name: "Mặt bảng màu cam rực rỡ", type: "box", position: [0, 2.6, 0], scale: [12.0, 5.0, 0.05], color: "#ea580c" }
        ]
      },
      // 21. Billboard vuông dãy liên hoàn dải phân cách quốc lộ (Ảnh images (15).jfif)
      {
        id: "sample_billboard_square_series",
        category: "billboard",
        title: "Billboard vuông dãy liên hoàn dải phân cách quốc lộ (6m x 6m cao 10m)",
        badge: "Billboard vuông",
        image_url: "/signs/sign_billboard_square_series.jpg",
        dimensions: { width: 6.0, height: 6.0, depth: 0.8 },
        description: "Billboard quảng cáo ngoài trời khổ vuông 6m x 6m bố trí theo dãy liên hoàn dọc tuyến đường quốc lộ / đại lộ, trụ thép tròn đơn vững chắc, mặt ốp alu hoặc bạt căng khung vuông, 3 đèn pha rọi đỉnh.",
        materials: { iron_type: "vuong_25", surface_type: "alu_3mm", has_led: true, has_sheet_backing: true },
        prompt: "Dãy biển quảng cáo ngoài trời khổ vuông 6m x 6m một cột trụ tròn bố trí dọc dải phân cách đường cao tốc đại lộ dưới trời xanh.",
        elements: [
          { name: "Cột trụ tròn thép D600", type: "cylinder", position: [0, -3.0, -0.1], scale: [0.6, 6.0, 0.6], color: "#475569" },
          { name: "Khung viền bảng vuông", type: "box", position: [0, 1.8, 0], scale: [6.2, 6.2, 0.15], color: "#334155" },
          { name: "Mặt bảng quảng cáo trắng", type: "box", position: [0, 1.8, 0.08], scale: [5.8, 5.8, 0.02], color: "#ffffff" },
          { name: "Đèn pha 1", type: "box", position: [-1.8, 4.95, 0.3], scale: [0.15, 0.15, 0.35], color: "#18181b" },
          { name: "Đèn pha 2", type: "box", position: [0.0, 4.95, 0.3], scale: [0.15, 0.15, 0.35], color: "#18181b" },
          { name: "Đèn pha 3", type: "box", position: [1.8, 4.95, 0.3], scale: [0.15, 0.15, 0.35], color: "#18181b" }
        ]
      },
      // 22. Billboard siêu rộng 2 cột trụ tròn qua sông (Ảnh images (16).jfif)
      {
        id: "sample_billboard_superwide_double_pole",
        category: "billboard",
        title: "Billboard siêu rộng 2 cột trụ tròn qua sông (18m x 6m cao 18m)",
        badge: "Billboard siêu rộng",
        image_url: "/signs/sign_billboard_superwide_double_pole.jpg",
        dimensions: { width: 18.0, height: 6.0, depth: 1.5 },
        description: "Billboard quảng cáo tấm lớn siêu rộng 18m cao 18m hai cột trụ thép tròn D1200 bắc qua khúc sông ven đường cao tốc đô thị, kết cấu giàn thép không gian đan chéo dày dặn, mặt bạt đỏ rực JAYALAKSHMI, dàn 8 đèn pha rọi.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: false },
        prompt: "Billboard khổng lồ siêu rộng 18m hai cột trụ thép cao 18m màu đỏ rực rỡ đứng cạnh dòng sông và đường cao tốc trên cao.",
        elements: [
          { name: "Cột trụ tròn trái D1200", type: "cylinder", position: [-5.5, -6.0, -0.3], scale: [1.2, 12.0, 1.2], color: "#475569" },
          { name: "Cột trụ tròn phải D1200", type: "cylinder", position: [5.5, -6.0, -0.3], scale: [1.2, 12.0, 1.2], color: "#475569" },
          { name: "Giàn giằng không gian đan chéo", type: "box", position: [0, -0.3, -0.3], scale: [18.4, 0.9, 1.5], color: "#1e293b" },
          { name: "Mặt bảng pano đỏ rực 18m", type: "box", position: [0, 3.2, 0], scale: [18.0, 6.0, 0.05], color: "#dc2626" },
          { name: "Dòng chữ lớn JAYALAKSHMI trắng", type: "box", position: [0, 3.0, 0.03], scale: [14.0, 2.8, 0.02], color: "#ffffff" }
        ]
      },
      // 23. Cổng Pano giàn thép hộp vắt ngang cầu cao tốc (Ảnh images (17).jfif)
      {
        id: "sample_gantry_overhead_bridge",
        category: "billboard",
        title: "Cổng Pano giàn thép hộp vắt ngang cầu cao tốc (16m x 4.5m cao 10m)",
        badge: "Cổng vòm cầu cao tốc",
        image_url: "/signs/sign_gantry_overhead_bridge.jpg",
        dimensions: { width: 16.0, height: 4.5, depth: 0.8 },
        description: "Cổng bảng hiệu Pano quảng cáo khung giàn thép hộp chữ nhật vượt khẩu độ 16m vắt ngang qua cầu cạn cao tốc, 2 cột trụ thép tròn 2 bên lề cầu, mặt bạt in UV xuyên sáng 3M phẳng căng.",
        materials: { iron_type: "vuong_30", surface_type: "bat_3m_uv", has_led: true, has_sheet_backing: false },
        prompt: "Cổng chào pano quảng cáo khung thép vắt ngang qua cây cầu đường cao tốc thông thoáng hướng nhìn từ cabin xe ô tô.",
        elements: [
          { name: "Cột trụ thép tròn lề trái", type: "cylinder", position: [-7.8, -2.5, 0], scale: [0.7, 5.0, 0.7], color: "#94a3b8" },
          { name: "Cột trụ thép tròn lề phải", type: "cylinder", position: [7.8, -2.5, 0], scale: [0.7, 5.0, 0.7], color: "#94a3b8" },
          { name: "Khung dầm hộp chịu lực", type: "box", position: [0, 0.1, 0], scale: [16.2, 4.8, 0.4], color: "#cbd5e1" },
          { name: "Mặt bảng pano bạt 3M", type: "box", position: [0, 0.1, 0.05], scale: [15.6, 4.2, 0.02], color: "#38bdf8" }
        ]
      },
      // 24. Billboard Unipole 4 đèn pha rọi chân trời xanh (Ảnh images (7).jfif)
      {
        id: "sample_billboard_unipole_spotlights",
        category: "billboard",
        title: "Billboard Unipole 4 đèn pha rọi chân trời xanh (10m x 5m cao 12m)",
        badge: "Unipole 4 đèn pha",
        image_url: "/signs/sign_billboard_unipole_spotlights.jpg",
        dimensions: { width: 10.0, height: 5.0, depth: 1.0 },
        description: "Biển quảng cáo tấm lớn một cột trụ thép tròn Unipole truyền thống, giá đỡ kim loại vát chữ Y, dàn 4 cần đèn pha LED chiếu rọi từ trên cao, mặt bạt in quảng cáo trung tâm thương mại ABAD Food Court.",
        materials: { iron_type: "vuong_30", surface_type: "bat_2da", has_led: true, has_sheet_backing: false },
        prompt: "Billboard Unipole ngoài trời một cột trụ thép tròn cao 12m kích thước 10m x 5m có 4 cần đèn rọi vươn ra trên nền trời xanh mây trắng trong veo.",
        elements: [
          { name: "Cột trụ thép tròn D800", type: "cylinder", position: [0, -3.5, -0.2], scale: [0.8, 7.0, 0.8], color: "#64748b" },
          { name: "Chân đế dầm vát chữ Y", type: "box", position: [0, 0, -0.2], scale: [10.2, 0.6, 1.0], color: "#334155" },
          { name: "Mặt bảng pano", type: "box", position: [0, 2.7, 0], scale: [10.0, 5.0, 0.05], color: "#ffffff" },
          { name: "Mảng xanh lá cây thương hiệu", type: "box", position: [0, 2.3, 0.03], scale: [9.6, 2.4, 0.01], color: "#84cc16" },
          { name: "Đèn rọi 1", type: "box", position: [-3.6, 5.4, 0.4], scale: [0.15, 0.2, 0.4], color: "#18181b" },
          { name: "Đèn rọi 2", type: "box", position: [-1.2, 5.4, 0.4], scale: [0.15, 0.2, 0.4], color: "#18181b" },
          { name: "Đèn rọi 3", type: "box", position: [1.2, 5.4, 0.4], scale: [0.15, 0.2, 0.4], color: "#18181b" },
          { name: "Đèn rọi 4", type: "box", position: [3.6, 5.4, 0.4], scale: [0.15, 0.2, 0.4], color: "#18181b" }
        ]
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
