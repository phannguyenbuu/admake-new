/**
 * materialsCatalog.ts - Danh mục vật liệu phong phú kết hợp Admake Material Lab & Vật liệu Bảng hiệu
 */

import * as THREE from "three";
import type { SignboardMaterialOption } from "./editorTypes";
import { MATERIAL_PRESETS } from "../../dashboard/material-lab/materialsData";

export const SIGNBOARD_MATERIALS: SignboardMaterialOption[] = [
  // --- 1. TẤM ỐP NHÔM NHỰA (ALU ALCOREST) ---
  {
    id: "alu_silver",
    name: "Alu Ghi Bạc (EV2001)",
    category: "alu",
    category_vn: "Mặt dựng Alu",
    description: "Alu Alcorest ánh kim nhũ bạc, độ bóng vừa phải, chống chọi thời tiết ngoài trời.",
    color: "#cbd5e1",
    roughness: 0.35,
    metalness: 0.65,
    clearcoat: 0.3,
    badge: "Phổ biến nhất"
  },
  {
    id: "alu_black_matte",
    name: "Alu Đen Nhám (EV2010)",
    category: "alu",
    category_vn: "Mặt dựng Alu",
    description: "Alu màu đen mờ hiện đại, tạo chiều sâu tương phản mạnh cho chữ nổi LED.",
    color: "#1e293b",
    roughness: 0.55,
    metalness: 0.15,
    badge: "Hiện đại"
  },
  {
    id: "alu_gold_mirror",
    name: "Alu Gương Vàng (EV2028)",
    category: "alu",
    category_vn: "Mặt dựng Alu",
    description: "Alu tráng gương màu vàng kim phản chiếu bóng bẩy sang trọng cho Spa, Thẩm mỹ viện.",
    color: "#f59e0b",
    roughness: 0.08,
    metalness: 0.95,
    clearcoat: 1.0,
    badge: "Sang trọng"
  },
  {
    id: "alu_red",
    name: "Alu Đỏ Cờ (EV2005)",
    category: "alu",
    category_vn: "Mặt dựng Alu",
    description: "Alu màu đỏ rực rỡ bắt mắt, chuyên dùng cho cửa hàng tiện lợi, siêu thị, nhà thuốc.",
    color: "#dc2626",
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.5
  },
  {
    id: "alu_white",
    name: "Alu Trắng Sứ (EV2002)",
    category: "alu",
    category_vn: "Mặt dựng Alu",
    description: "Alu màu trắng sứ tinh khiết, sạch sẽ, phản xạ ánh sáng tốt.",
    color: "#f8fafc",
    roughness: 0.25,
    metalness: 0.1,
    clearcoat: 0.4
  },
  {
    id: "alu_wood",
    name: "Alu Vân Gỗ Nâu (EV2023)",
    category: "alu",
    category_vn: "Mặt dựng Alu",
    description: "Alu phủ hoạ tiết vân gỗ sồi ấm cúng cho quán cafe, nhà hàng phong cách mộc.",
    color: "#78350f",
    roughness: 0.6,
    metalness: 0.05,
    textureUrl: "/api/ai/maps/file?path=%23Wood/009.JPG",
  },

  // --- 2. INOX & KIM LOẠI CHỮ NỔI CAO CẤP ---
  {
    id: "inox_gold_mirror",
    name: "Inox Vàng Gương 304 (24K Gold Mirror)",
    category: "inox",
    category_vn: "Inox Chữ Nổi",
    description: "Inox 304 tráng gương vàng óng 24k phản chiếu như gương soi, đẳng cấp số 1.",
    color: "#f5c542",
    roughness: 0.03,
    metalness: 0.98,
    clearcoat: 1.0,
    badge: "Gương 24K"
  },
  {
    id: "inox_admake_blue",
    name: "Inox Xanh Gương ADMAKE (#00B4B6)",
    category: "inox",
    category_vn: "Inox Chữ Nổi",
    description: "Inox 304 tráng gương mạ titan màu xanh ngọc nhận diện ADMAKE sang trọng.",
    color: "#00b4b6",
    roughness: 0.04,
    metalness: 0.96,
    clearcoat: 1.0,
    badge: "Chuẩn ADMAKE"
  },
  {
    id: "inox_white_hairline",
    name: "Inox Trắng Xước Hairline",
    category: "inox",
    category_vn: "Inox Chữ Nổi",
    description: "Inox trắng ánh kim xước sọc mờ tinh xảo phong cách Châu Âu.",
    color: "#e2e8f0",
    roughness: 0.22,
    metalness: 0.92,
    badge: "Tinh xảo"
  },
  {
    id: "inox_black_titan",
    name: "Inox Đen Titan",
    category: "inox",
    category_vn: "Inox Chữ Nổi",
    description: "Inox phủ mạ titan đen tuyền bóng mờ, huyền bí và sang trọng.",
    color: "#0f172a",
    roughness: 0.15,
    metalness: 0.95,
    clearcoat: 0.8
  },
  {
    id: "inox_copper",
    name: "Đồng Thau / Inox Đồng Xước",
    category: "inox",
    category_vn: "Inox Chữ Nổi",
    description: "Đồng nguyên chất hoặc inox mạ đồng cổ điển hoàng gia.",
    color: "#b45309",
    roughness: 0.18,
    metalness: 0.9
  },

  // --- 3. MICA & ACRYLIC ĐÀI LOAN ---
  {
    id: "mica_admake_teal",
    name: "Mica Xanh ADMAKE (#00B4B6)",
    category: "mica",
    category_vn: "Mica Chữ Hộp",
    description: "Mica bóng màu xanh ngọc ADMAKE chuẩn nhận diện thương hiệu sản xuất.",
    color: "#00b4b6",
    roughness: 0.1,
    metalness: 0.05,
    clearcoat: 0.95,
    badge: "Chuẩn ADMAKE"
  },
  {
    id: "mica_red",
    name: "Mica Đài Loan Đỏ Chochen",
    category: "mica",
    category_vn: "Mica Chữ Hộp",
    description: "Mica màu đỏ tươi dày 3mm, độ bóng cao, cho ánh sáng LED xuyên qua rực rỡ.",
    color: "#ef4444",
    roughness: 0.1,
    metalness: 0.05,
    clearcoat: 0.9
  },
  {
    id: "mica_white_milk",
    name: "Mica Trắng Sữa Tán Quang",
    category: "mica",
    category_vn: "Mica Chữ Hộp",
    description: "Mica trắng đục chuyên dụng tán đều ánh sáng đèn LED không bị lộ điểm sáng.",
    color: "#ffffff",
    roughness: 0.15,
    metalness: 0.02,
    clearcoat: 0.8,
    transmission: 0.45,
    badge: "Chuyên LED"
  },
  {
    id: "mica_yellow",
    name: "Mica Vàng Chanh",
    category: "mica",
    category_vn: "Mica Chữ Hộp",
    description: "Mica vàng chói chang thu hút ánh nhìn ban ngày lẫn ban đêm.",
    color: "#eab308",
    roughness: 0.12,
    metalness: 0.02,
    clearcoat: 0.85
  },
  {
    id: "mica_blue",
    name: "Mica Xanh Coban",
    category: "mica",
    category_vn: "Mica Chữ Hộp",
    description: "Mica xanh dương đậm đà, sang trọng cho phòng khám, ngân hàng.",
    color: "#2563eb",
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 0.85
  },
  {
    id: "mica_clear",
    name: "Mica Trong Suốt (Kính Acrylic)",
    category: "mica",
    category_vn: "Mica Trong Suốt",
    description: "Mica trong như thuỷ tinh, nhẹ và chống vỡ, làm biển công ty gắn ốc chân kính.",
    color: "#e0f2fe",
    roughness: 0.04,
    metalness: 0.0,
    clearcoat: 1.0,
    transmission: 0.92,
    ior: 1.49,
    badge: "Trong suốt"
  },

  // --- 4. KHUNG SẮT & CƠ KHÍ CHỊU LỰC ---
  {
    id: "iron_galvanized",
    name: "Sắt Hộp Mạ Kẽm Chống Rỉ",
    category: "iron",
    category_vn: "Khung Sắt Kết Cấu",
    description: "Thép hộp mạ kẽm vân hoa xám sáng, kết cấu chịu gió bão ngoài trời.",
    color: "#94a3b8",
    roughness: 0.45,
    metalness: 0.85,
    badge: "Khung chính"
  },
  {
    id: "iron_black_powder",
    name: "Sắt Sơn Tĩnh Điện Đen Sần",
    category: "iron",
    category_vn: "Khung Sắt Kết Cấu",
    description: "Sắt sơn tĩnh điện bề mặt sần cát hạt mịn cao cấp chống oxy hoá.",
    color: "#334155",
    roughness: 0.7,
    metalness: 0.35
  },
  {
    id: "iron_red_primer",
    name: "Sắt Quét Sơn Chống Rỉ Đỏ",
    category: "iron",
    category_vn: "Khung Sắt Kết Cấu",
    description: "Lớp sơn lót chống rỉ gốc alkyd màu nâu đỏ truyền thống.",
    color: "#991b1b",
    roughness: 0.65,
    metalness: 0.15
  },
  {
    id: "aluminum_profile",
    name: "Nhôm Định Hình Nhũ Bạc",
    category: "iron",
    category_vn: "Khung Nhôm Định Hình",
    description: "Khung nhôm hộp định hình nẹp viền biển quảng cáo hộp đèn siêu mỏng.",
    color: "#e2e8f0",
    roughness: 0.3,
    metalness: 0.75
  },

  // --- 5. BẠT QUẢNG CÁO & PANO ---
  {
    id: "bat_hiflex",
    name: "Bạt Hiflex Thường 3.2zem",
    category: "bat",
    category_vn: "Mặt Biển Bạt",
    description: "Bạt PVC sợi vải dệt gân mờ màu trắng sữa, giá thành tiết kiệm.",
    color: "#f1f5f9",
    roughness: 0.85,
    metalness: 0.02
  },
  {
    id: "bat_uv_smooth",
    name: "Bạt Không Gân In Mực UV",
    category: "bat",
    category_vn: "Mặt Biển Bạt",
    description: "Bạt bề mặt phẳng láng mịn, in mực UV sắc nét, độ bền màu 3-5 năm.",
    color: "#ffffff",
    roughness: 0.45,
    metalness: 0.05,
    badge: "In UV nét"
  },
  {
    id: "bat_3m_usa",
    name: "Bạt 3M Panagraphics USA",
    category: "bat",
    category_vn: "Mặt Biển Bạt",
    description: "Bạt 3M nhập khẩu Mỹ cao cấp, chuẩn màu nhận diện ngân hàng (Vietcombank, MB).",
    color: "#0284c7",
    roughness: 0.35,
    metalness: 0.05,
    badge: "Chuẩn Ngân hàng"
  },

  // --- 6. HỆ THỐNG ĐÈN CHIẾU SÁNG & NEON ---
  {
    id: "led_warm_3000k",
    name: "Đèn LED Vàng Ấm (3000K Glow)",
    category: "led",
    category_vn: "Đèn LED Chiếu Sáng",
    description: "Ánh sáng vàng ấm cúng, sang trọng chiếu hắt chân chữ hoặc đèn pha rọi biển.",
    color: "#f59e0b",
    roughness: 0.2,
    metalness: 0.1,
    glow: true,
    emissiveIntensity: 2.2,
    badge: "Tự phát sáng"
  },
  {
    id: "led_white_6500k",
    name: "Đèn LED Trắng Tinh Khiết (6500K)",
    category: "led",
    category_vn: "Đèn LED Chiếu Sáng",
    description: "Ánh sáng trắng sáng rực rỡ bên trong chữ mica hắt mặt.",
    color: "#ffffff",
    roughness: 0.15,
    metalness: 0.1,
    glow: true,
    emissiveIntensity: 2.5,
    badge: "Tự phát sáng"
  },
  {
    id: "neon_red_sign",
    name: "Dây Neon Sign Đỏ U-Flex",
    category: "led",
    category_vn: "Đèn LED Chiếu Sáng",
    description: "Đèn dẻo silicone phát sáng neon đỏ nổi bật quán cafe, bar, trà sữa.",
    color: "#ef4444",
    roughness: 0.2,
    metalness: 0.05,
    glow: true,
    emissiveIntensity: 3.0,
    badge: "Neon Sign"
  },

  // --- 7. VẬT LIỆU KIẾN TRÚC & NGOẠI THẤT PBR ---
  ...MATERIAL_PRESETS.slice(0, 16).map((p) => {
    let textureUrl: string | undefined = undefined;
    if (p.id.includes("wood") || p.id.includes("walnut") || p.id.includes("parquet")) {
      textureUrl = "/api/ai/maps/file?path=%23Wood/023s.jpg";
    } else if (p.id.includes("granite") || p.id.includes("stone")) {
      textureUrl = "/api/ai/maps/file?path=%23Marble/1667402422_6c26146675_b.jpg";
    } else if (p.id.includes("concrete")) {
      textureUrl = "/api/ai/maps/file?path=(CONCRETE 11) granite wall smooth dirt pillar texture.jpg";
    } else if (p.id.includes("brick")) {
      textureUrl = "/textures/brick_natural.webp";
    } else if (p.id.includes("corten") || p.id.includes("rust")) {
      textureUrl = "/textures/metal_rust.webp";
    }

    return {
      id: `lumion_${p.id}`,
      name: p.name,
      category: "lumion" as const,
      category_vn: "Vật liệu Kiến Trúc PBR",
      description: p.description,
      color: p.color,
      roughness: 0.3,
      metalness: p.id.includes("metal") || p.id.includes("carbon") ? 0.8 : 0.1,
      badge: p.tags[0],
      textureUrl,
    };
  })
];

const textureLoader = new THREE.TextureLoader();

/** Tạo Three.js Material từ cấu hình SignboardMaterialOption */
export function createEditorMaterial(mat: SignboardMaterialOption, wireframe: boolean = false): THREE.Material {
  const baseColor = new THREE.Color(mat.color);

  let mapTexture: THREE.Texture | null = null;
  if (mat.textureUrl) {
    mapTexture = textureLoader.load(mat.textureUrl, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      const rep = mat.mapRepeat || [2, 2];
      tex.repeat.set(rep[0], rep[1]);
      tex.needsUpdate = true;
    });
    mapTexture.colorSpace = THREE.SRGBColorSpace;
  }

  if (mat.transmission && mat.transmission > 0.5) {
    // Kính / Mica trong suốt cao cấp
    return new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: mat.roughness,
      metalness: mat.metalness,
      transmission: mat.transmission,
      ior: mat.ior || 1.5,
      transparent: true,
      opacity: 0.6,
      wireframe,
      side: THREE.DoubleSide,
      map: mapTexture,
    });
  }

  // Inox tráng gương 304, kim loại bóng bẩy cao cấp (MeshPhysicalMaterial)
  if (mat.category === "inox" || (mat.metalness > 0.8 && (mat.clearcoat || 0) > 0.4)) {
    return new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: Math.max(0.02, mat.roughness),
      metalness: Math.min(1.0, mat.metalness),
      clearcoat: mat.clearcoat ?? 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.98,
      envMapIntensity: 2.2,
      wireframe,
      side: THREE.DoubleSide,
      map: mapTexture,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: mat.roughness,
    metalness: mat.metalness,
    wireframe,
    side: THREE.DoubleSide,
    emissive: mat.glow ? baseColor : new THREE.Color("#000000"),
    emissiveIntensity: mat.glow ? (mat.emissiveIntensity || 1.5) : 0,
    map: mapTexture,
  });
}
