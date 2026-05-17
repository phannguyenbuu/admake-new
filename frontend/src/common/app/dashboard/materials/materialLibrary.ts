/**
 * Thư viện dữ liệu mẫu ràng buộc cho từng loại vật tư.
 * Mỗi loại vật tư có: độ dày, màu sắc, chất liệu, đơn vị tính, địa điểm phổ biến.
 */

export interface MaterialSpec {
    thickness?: string[];   // Độ dày (mm, cm)
    color?: string[];       // Màu sắc
    material?: string[];    // Chất liệu / loại
    feature?: string[];     // Tính năng, thông số đặc biệt
    units: string[];        // Đơn vị tính (bắt buộc)
    locations?: string[];   // Địa điểm cất giữ phổ biến
}

/** Map từ keyword tên vật tư → spec ràng buộc */
const MATERIAL_LIBRARY: Record<string, MaterialSpec> = {
    // ── Nhóm Nhôm / Alu ──────────────────────────────────────────────────────
    alu: {
        thickness: ["0.5mm", "0.8mm", "1.0mm", "1.2mm", "1.5mm", "2.0mm", "2.5mm", "3.0mm"],
        color: ["Trắng (RAL9016)", "Đen (RAL9005)", "Vàng gold", "Bạc brushed", "Xám (RAL7016)", "Đỏ wine"],
        material: ["Alu phủ sơn tĩnh điện", "Alu nguyên chất", "Alu composite (ACM)", "Alu anodized"],
        feature: ["Chống oxy hóa", "Chống tia UV", "Nhẹ cao cấp", "Cứng cao"],
        units: ["tấm", "m²", "kg"],
        locations: ["Kho vật tư", "Bãi công trình", "Kho ngoài trời"],
    },

    // ── Nhóm Sắt / Thép ─────────────────────────────────────────────────────
    sắt: {
        thickness: ["1mm", "1.5mm", "2mm", "3mm", "4mm", "5mm", "6mm", "8mm", "10mm", "12mm"],
        color: ["Nguyên bản", "Sơn chống rỉ", "Mạ kẽm"],
        material: ["Sắt CT3", "Thép Q235", "Thép không gỉ 201", "Thép không gỉ 304", "Thép không gỉ 316", "Sắt hộp", "Sắt U", "Sắt I", "Sắt L"],
        feature: ["Chống rỉ", "Chịu nhiệt", "Cường độ cao"],
        units: ["cây", "kg", "tấn", "m"],
        locations: ["Kho kim loại", "Bãi ngoài trời", "Xưởng gia công"],
    },
    thép: {
        thickness: ["1mm", "2mm", "3mm", "4mm", "5mm", "6mm", "8mm", "10mm"],
        color: ["Nguyên bản", "Sơn epoxy", "Mạ kẽm nóng"],
        material: ["Thép cuộn CB240", "Thép CB300", "Thép D6", "Thép D8", "Thép D10", "Thép D12", "Thép D16", "Thép D20"],
        units: ["cây", "kg", "tấn"],
        locations: ["Kho sắt thép", "Bãi công trình"],
    },

    // ── Nhóm Ván / Gỗ ────────────────────────────────────────────────────────
    ván: {
        thickness: ["9mm", "12mm", "15mm", "18mm", "20mm", "25mm"],
        color: ["Vân gỗ sồi", "Vân gỗ óc chó", "Trắng", "Be kem", "Xám đen"],
        material: ["Ván MDF", "Ván HDF", "Ván MFC phủ melamine", "OSB", "Plywood", "Fiber cement", "Ván thông"],
        feature: ["Chống ẩm", "Chống cháy", "Chịu nước"],
        units: ["tấm", "m²", "m³"],
        locations: ["Kho gỗ khô", "Kho có mái che"],
    },

    // ── Nhóm Vít / Bu lông ────────────────────────────────────────────────────
    vít: {
        thickness: ["M4", "M5", "M6", "M8", "M10", "M12", "M16"],
        color: ["Mạ kẽm", "Inox", "Đen oxide"],
        material: ["Vít tự khoan", "Vít đầu chìm", "Bu lông lục giác", "Ốc vít", "Vít nở", "Đinh vít"],
        feature: ["Chống rỉ", "Cứng cao", "Tự khoan"],
        units: ["hộp", "túi", "cái", "kg", "bộ"],
        locations: ["Kho phụ kiện", "Tủ công cụ"],
    },

    // ── Nhóm Đá / Xi măng ────────────────────────────────────────────────────
    đá: {
        thickness: ["D4-D6", "D6-D10", "D10-D15", "D15-D20", "D20-D25"],
        color: ["Đá đen", "Đá xám", "Đá trắng", "Đá đỏ"],
        material: ["Đá 1×2 (xây móng)", "Đá mi sàng (nền)", "Đá 0.5×1", "Đá dăm"],
        units: ["m³", "khối", "tấn"],
        locations: ["Kho bãi ngoài trời", "Công trình"],
    },
    "xi măng": {
        color: ["Trắng", "Xám"],
        material: ["Xi măng PCB40", "Xi măng PC40", "Xi măng PC50", "Xi măng trắng"],
        units: ["bao", "tấn", "kg"],
        locations: ["Kho khô", "Kho có mái"],
    },

    // ── Nhóm Keo / Chất kết dính ────────────────────────────────────────────
    keo: {
        color: ["Trong suốt", "Trắng đục", "Đen"],
        material: ["Keo silicone", "Keo epoxy", "Keo PU", "Keo foam", "Keo tiếp xúc (xốp)", "Keo 502"],
        feature: ["Chịu nước", "Chịu nhiệt", "Đàn hồi tốt"],
        units: ["tuýp", "hộp", "thùng", "kg", "lít"],
        locations: ["Kho phụ kiện", "Kho hoá chất"],
    },

    // ── Nhóm Sơn ─────────────────────────────────────────────────────────────
    sơn: {
        color: ["Trắng", "Be", "Xám", "Đen", "Vàng", "Đỏ", "Xanh lá", "Xanh biển"],
        material: ["Sơn Dulux", "Sơn Jotun", "Sơn nước nội thất", "Sơn chống thấm", "Sơn epoxy sàn", "Sơn tĩnh điện"],
        feature: ["Chống thấm", "Chống rỉ", "Bóng cao", "Mờ"],
        units: ["thùng", "lít", "kg"],
        locations: ["Kho hoá chất", "Kho có mái"],
    },

    // ── Nhóm Gạch ───────────────────────────────────────────────────────────
    gạch: {
        thickness: ["200×400", "300×600", "400×400", "600×600", "800×800", "600×1200"],
        color: ["Trắng", "Gỗ nâu", "Xám", "Đen", "Xanh đậm"],
        material: ["Gạch ốp lát Viglacera", "Gạch prime", "Gạch granite", "Gạch ceramic", "Gạch thẻ"],
        units: ["m²", "hộp", "viên"],
        locations: ["Kho gạch", "Sân công trình"],
    },

    // ── Nhóm Dây điện / Ống ──────────────────────────────────────────────────
    dây: {
        thickness: ["1.5mm²", "2.5mm²", "4mm²", "6mm²", "10mm²", "16mm²"],
        color: ["Đỏ", "Đen", "Vàng-xanh (tiếp địa)", "Xanh lam", "Trắng"],
        material: ["Dây đơn CADIVI", "Dây đôi CADIVI", "Dây cáp ngầm", "Dây nhôm", "Dây CVV"],
        units: ["cuộn", "m", "kg"],
        locations: ["Kho điện", "Tủ vật tư điện"],
    },
    ống: {
        thickness: ["Ø20", "Ø25", "Ø32", "Ø42", "Ø50", "Ø60", "Ø75", "Ø90", "Ø110", "Ø160"],
        color: ["Cam (điện)", "Trắng (nước)", "Đen (HDPE)", "Xanh lá (tưới tiêu)"],
        material: ["Ống nhựa PVC", "Ống HDPE", "Ống PPR", "Ống inox", "Ống thép mạ kẽm", "Ống nhựa luồn dây điện"],
        units: ["cây", "m", "bộ"],
        locations: ["Kho vật liệu", "Kho ngoài trời"],
    },

    // ── Nhóm Kính ───────────────────────────────────────────────────────────
    kính: {
        thickness: ["3mm", "4mm", "5mm", "6mm", "8mm", "10mm", "12mm"],
        color: ["Kính trong", "Kính mờ", "Kính xanh lam", "Kính xanh lá", "Kính đen (dark grey)", "Kính bronze"],
        material: ["Kính cường lực", "Kính hộp", "Kính laminé", "Kính phản quang", "Kính float thông thường"],
        units: ["m²", "tấm"],
        locations: ["Kho kính", "Kho có mái"],
    },
};

// ─── Exported helpers ─────────────────────────────────────────────────────────

/** Normalize tên vật tư để so khớp */
function normalizeKey(name: string): string {
    return name.toLowerCase().trim().normalize("NFC");
}

/** Tìm spec theo tên vật tư (fuzzy match đầu từ) */
export function getMaterialSpec(materialName: string): MaterialSpec | null {
    const key = normalizeKey(materialName);
    if (!key) return null;
    // Exact match trước
    if (MATERIAL_LIBRARY[key]) return MATERIAL_LIBRARY[key];
    // Prefix match
    for (const k of Object.keys(MATERIAL_LIBRARY)) {
        if (key.startsWith(k) || k.startsWith(key)) {
            return MATERIAL_LIBRARY[k];
        }
    }
    return null;
}

/** Trả về tất cả đơn vị tính phổ biến khi không có spec */
export const DEFAULT_UNITS = [
    "cái", "bộ", "kg", "g", "tấn",
    "m", "m²", "m³", "cm", "mm",
    "cuộn", "tấm", "cây", "lít", "thùng",
    "hộp", "túi", "bao", "gói",
];

/** Danh sách tên vật tư phổ biến để autocomplete */
export const COMMON_MATERIAL_NAMES = Object.keys(MATERIAL_LIBRARY);
