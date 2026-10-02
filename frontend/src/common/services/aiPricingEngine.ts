export interface SignboardInput {
  width: number;             // Chiều dài / ngang (m)
  height: number;            // Chiều cao / rộng (m)
  iron_type: string;         // 'vuong_20' | 'vuong_25' | 'vuong_30'
  surface_type: string;      // 'bat_hiflex' | 'bat_2da' | 'bat_khong_gan_uv' | 'bat_3m_uv' | 'alu_3mm' | 'alu_guong_vang' | 'mica_2_3mm'
  has_sheet_backing: boolean;// Tôn lót mặt sau (Có/Không)
  has_reinforce_iron: boolean;// Sắt chống gia cố (Có/Không)
  reinforce_qty?: number;    // Số cây sắt chống
  reinforce_length?: number; // Chiều dài mỗi cây chống (m)
  location: string;          // 'indoor' | 'outdoor'
  use_scaffolding: boolean;  // Sử dụng dàn giáo (Có/Không)
  scaffolding_sets?: number; // Số bộ dàn giáo
  scaffolding_days?: number; // Số ngày dùng dàn giáo
  profit_margin: number;     // Tỷ lệ lợi nhuận kỳ vọng (%)
}

export interface CalculationWarning {
  code: string;
  level: "info" | "warning" | "danger";
  title: string;
  message: string;
}

export interface LineItem {
  name: string;
  detail: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total: number;
  active?: boolean;
}

export interface SignboardQuoteResult {
  dimensions: {
    width: number;
    height: number;
    area: number;
    perimeter: number;
  };
  materials: {
    iron_frame: LineItem;
    reinforce_iron: LineItem;
    surface: LineItem;
    sheet_backing: LineItem;
    aluminum_trim: LineItem;
    accessories: LineItem;
    total_materials_cost: number;
  };
  operations: {
    labor: LineItem;
    transport: LineItem;
    scaffolding: LineItem;
    canvas_seam: LineItem;
    total_operations_cost: number;
  };
  summary: {
    cost_price: number;
    profit_margin_percent: number;
    profit_amount: number;
    quote_price: number;
    price_per_sqm: number;
  };
  warnings: CalculationWarning[];
  location: string;
  input_echo: SignboardInput;
}

export const PRICING_STANDARDS = {
  iron_bars: [
    { key: "vuong_20", name: "Sắt vuông 20x20 (1.0mm)", unitPrice: 75000, length: 6, unit: "cây (6m)" },
    { key: "vuong_25", name: "Sắt vuông 25x25 (1.0mm)", unitPrice: 95000, length: 6, unit: "cây (6m)" },
    { key: "vuong_30", name: "Sắt vuông 30x30 (1.2mm)", unitPrice: 135000, length: 6, unit: "cây (6m)" },
  ],
  surfaces: [
    { key: "bat_hiflex", name: "Bạt thường (Hiflex)", type: "canvas", unitPrice: 27000, unit: "m²", desc: "Giá rẻ, thông dụng" },
    { key: "bat_2da", name: "Bạt 2 da (Đế xám chống xuyên sáng)", type: "canvas", unitPrice: 45000, unit: "m²", desc: "Chống xuyên sáng, bền" },
    { key: "bat_khong_gan_uv", name: "Bạt không gân in UV", type: "canvas", unitPrice: 170000, unit: "m²", desc: "Mịn đẹp, in UV sắc nét" },
    { key: "bat_3m_uv", name: "Bạt 3M in UV", type: "canvas", unitPrice: 450000, unit: "m²", desc: "Cao cấp chuẩn thương hiệu lớn" },
    { key: "alu_3mm", name: "Tấm Alu (3mm 0.10)", type: "sheet", unitPrice: 480000, unit: "tấm", desc: "Khổ 1.22m x 2.44m" },
    { key: "alu_guong_vang", name: "Tấm Alu đồng gương vàng (3mm)", type: "sheet", unitPrice: 480000, unit: "tấm", is_mirror: true, desc: "Bóng gương sang trọng" },
    { key: "mica_2_3mm", name: "Tấm Mica (2mm/3mm)", type: "sheet", unitPrice: 690000, unit: "tấm", desc: "Khổ 1.22m x 2.44m" },
  ],
  sheet_iron_backing: { name: "Tôn lót mặt sau (Khổ 1.2m)", unitPrice: 75000, unit: "mét tới", width: 1.2 },
  aluminum_trim: { name: "V nhôm bọc viền (Cây 3m)", unitPrice: 35000, unit: "cây (3m)", length: 3 },
  accessories: { name: "Vật tư phụ (Keo, vít, que hàn...)", lumpSum: 100000, unit: "khoán" },
  operations: {
    labor_sqm: { name: "Nhân công thi công", unitPrice: 120000, unit: "m²" },
    transport: { name: "Vận chuyển", unitPrice: 200000, unit: "chuyến" },
    scaffolding: { name: "Dàn giáo", unitPrice: 50000, unit: "bộ/ngày" },
    canvas_seam_labor: { name: "Nhân công nối bạt", unitPrice: 15000, unit: "mét dài" },
  }
};

export function formatVND(val: number): string {
  if (isNaN(val)) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(Math.round(val)) + " đ";
}

/**
 * Tính toán báo giá bảng hiệu chuẩn xác theo Hình 1 & 2
 */
export function calculateSignboardQuote(input: SignboardInput): SignboardQuoteResult {
  const width = Math.max(0, Number(input.width) || 0);
  const height = Math.max(0, Number(input.height) || 0);

  const ironSpec = PRICING_STANDARDS.iron_bars.find(i => i.key === input.iron_type) || PRICING_STANDARDS.iron_bars[0];
  const surfaceSpec = PRICING_STANDARDS.surfaces.find(s => s.key === input.surface_type) || PRICING_STANDARDS.surfaces[0];

  const hasSheetBacking = Boolean(input.has_sheet_backing);
  const hasReinforceIron = Boolean(input.has_reinforce_iron);
  const reinforceQty = Math.max(0, Number(input.reinforce_qty) || 0);
  const reinforceLength = Math.max(0, Number(input.reinforce_length) || 0);

  const location = input.location || "outdoor";
  const useScaffolding = Boolean(input.use_scaffolding);
  const scaffoldingSets = Math.max(1, Number(input.scaffolding_sets) || 1);
  const scaffoldingDays = Math.max(1, Number(input.scaffolding_days) || 1);

  const profitMargin = Math.max(0, Number(input.profit_margin) || 30);

  // 1. Kích thước
  const area = Math.round(width * height * 100) / 100;
  const perimeter = Math.round(2 * (width + height) * 100) / 100;

  // 2. Khung sắt: Chu vi + đan xương ô vuông (nhịp 1m - 1.2m), chia 6m làm tròn cây nguyên
  const span = 1.2;
  const gridCols = Math.max(1, Math.ceil(width / span));
  const verticalRibs = Math.max(0, gridCols - 1);
  const gridRows = Math.max(1, Math.ceil(height / span));
  const horizontalRibs = Math.max(0, gridRows - 1);

  const totalRibLength = (verticalRibs * height) + (horizontalRibs * width);
  const totalIronLength = perimeter + totalRibLength;
  const ironBarsCount = Math.ceil(totalIronLength / 6.0);
  const ironFrameCost = ironBarsCount * ironSpec.unitPrice;

  // 3. Sắt chống gia cố (nếu có)
  let reinforceBarsCount = 0;
  let reinforceIronCost = 0;
  let totalReinforceLen = 0;
  if (hasReinforceIron && reinforceQty > 0 && reinforceLength > 0) {
    totalReinforceLen = Math.round(reinforceQty * reinforceLength * 100) / 100;
    reinforceBarsCount = Math.ceil(totalReinforceLen / 6.0);
    reinforceIronCost = reinforceBarsCount * ironSpec.unitPrice;
  }

  // 4. Mặt bạt / Alu / Mica
  let surfaceCost = 0;
  let surfaceCalcDetail = "";
  const isCanvas = surfaceSpec.type === "canvas";
  let canvasSeamCost = 0;
  let canvasSeamLength = 0;

  if (isCanvas) {
    // Mặt bạt: Diện tích = (Ngang + 0.2m lề) x (Cao + 0.2m lề)
    const canvasW = Math.round((width + 0.2) * 100) / 100;
    const canvasH = Math.round((height + 0.2) * 100) / 100;
    const canvasArea = Math.round(canvasW * canvasH * 100) / 100;
    surfaceCost = Math.round(canvasArea * surfaceSpec.unitPrice);
    surfaceCalcDetail = `(${canvasW}m x ${canvasH}m) = ${canvasArea} m² (cộng 0.2m lề mỗi cạnh)`;
  } else {
    // Tấm Alu / Mica: Khổ chuẩn 1.22m x 2.44m
    const sheetW = 1.22;
    const sheetH = 2.44;
    const fit1 = Math.ceil(width / sheetW) * Math.ceil(height / sheetH);
    const fit2 = Math.ceil(width / sheetH) * Math.ceil(height / sheetW);
    let sheetsCount = Math.min(fit1, fit2);
    if (sheetsCount <= 0) sheetsCount = 1;
    surfaceCost = sheetsCount * surfaceSpec.unitPrice;
    surfaceCalcDetail = `${sheetsCount} tấm nguyên khổ 1.22m x 2.44m`;
  }

  // 5. Tôn lót mặt sau: Khổ 1.2m (75.000 đ/mét tới)
  let backingCost = 0;
  let backingLinearMeters = 0;
  if (hasSheetBacking) {
    backingLinearMeters = Math.round((area / 1.2) * 100) / 100;
    backingCost = Math.round(backingLinearMeters * PRICING_STANDARDS.sheet_iron_backing.unitPrice);
  }

  // 6. V nhôm bọc viền: Chu vi / 3m làm tròn lên cây nguyên (35.000 đ/cây 3m)
  const trimBarsCount = Math.ceil(perimeter / 3.0);
  const trimCost = trimBarsCount * PRICING_STANDARDS.aluminum_trim.unitPrice;

  // 7. Vật tư phụ khoán
  const accessoriesCost = PRICING_STANDARDS.accessories.lumpSum;

  // 8. Chi phí vận hành
  const laborCost = Math.round(area * PRICING_STANDARDS.operations.labor_sqm.unitPrice);
  const transportCost = PRICING_STANDARDS.operations.transport.unitPrice;
  let scaffoldingCost = 0;
  if (useScaffolding) {
    scaffoldingCost = scaffoldingSets * scaffoldingDays * PRICING_STANDARDS.operations.scaffolding.unitPrice;
  }

  // 9. Cảnh báo & Tư vấn
  const warnings: CalculationWarning[] = [];
  const needCanvasSeam = isCanvas && width > 3.1 && height > 3.1;
  if (needCanvasSeam) {
    canvasSeamLength = Math.min(width, height);
    canvasSeamCost = Math.round(canvasSeamLength * PRICING_STANDARDS.operations.canvas_seam_labor.unitPrice);
    warnings.push({
      code: "CANVAS_SEAM",
      level: "warning",
      title: "CẢNH BÁO NỐI BẠT",
      message: `Khổ bạt tối đa là 3.1m. Cả 2 cạnh (${width}m x ${height}m) đều > 3.1m, bắt buộc tính thêm chi phí nhân công nối bạt là 15.000 đ/mét dài (chiều dài đường nối: ${canvasSeamLength}m = ${formatVND(canvasSeamCost)}). Nhân viên cần tư vấn cho khách biết sẽ có đường nối mí.`
    });
  } else if (isCanvas && (width > 3.1 || height > 3.1)) {
    warnings.push({
      code: "CANVAS_ONE_SIDE_OVER",
      level: "info",
      title: "LƯU Ý KHỔ BẠT",
      message: `Bảng có 1 cạnh > 3.1m nhưng cạnh còn lại ≤ 3.1m nên có thể xoay chiều cuộn bạt để in liền khổ, không phát sinh chi phí nối bạt.`
    });
  }

  // Cảnh báo khổ Alu/Mica lỡ cỡ
  if (!isCanvas) {
    const wRem = width % 1.22;
    const hRem = height % 2.44;
    if ((wRem > 0 && wRem <= 0.15) || (hRem > 0 && hRem <= 0.15)) {
      warnings.push({
        code: "SHEET_AWKWARD_SIZE",
        level: "warning",
        title: "CẢNH BÁO KHỔ ALU/MICA LỠ CỠ",
        message: `Khổ vật tư chuẩn là 1.22m x 2.44m. Kích thước bảng (${width}m x ${height}m) bị lỡ cỡ khiến phải tính làm tròn thêm 1 tấm nguyên. Nhân viên nên tư vấn khách thu nhỏ kích thước bảng lại (về chuẩn ≤ 1.22m hoặc ≤ 2.44m) để tiết kiệm chi phí.`
      });
    }
  }

  // Cảnh báo nối tôn
  if (hasSheetBacking && width > 1.2 && height > 1.2) {
    warnings.push({
      code: "TIN_SEAM",
      level: "warning",
      title: "CẢNH BÁO NỐI TÔN",
      message: "Khổ Tôn tối đa là 1.2m. Bảng có cả 2 cạnh đều vượt quá 1.2m, tôn lót mặt sau chắc chắn sẽ có đường nối/ghép mí."
    });
  }

  // Cảnh báo từ chối bảo hành
  if (isCanvas && !hasSheetBacking) {
    warnings.push({
      code: "NO_WARRANTY_NO_TIN",
      level: "danger",
      title: "CẢNH BÁO TỪ CHỐI BẢO HÀNH",
      message: "CẢNH BÁO: Bảng bạt không lót tôn, KHÔNG BẢO HÀNH rách do gió bão."
    });
  }

  if (surfaceSpec.is_mirror && location === "outdoor") {
    warnings.push({
      code: "NO_WARRANTY_MIRROR_ALU",
      level: "danger",
      title: "CẢNH BÁO TỪ CHỐI BẢO HÀNH",
      message: "CẢNH BÁO: Alu gương vàng ngoài trời KHÔNG BẢO HÀNH bay màu."
    });
  }

  // 10. Tổng hợp chi phí
  const totalMaterialsCost = ironFrameCost + reinforceIronCost + surfaceCost + backingCost + trimCost + accessoriesCost;
  const totalOperationsCost = laborCost + transportCost + scaffoldingCost + canvasSeamCost;
  const costPrice = totalMaterialsCost + totalOperationsCost;

  const profitAmount = Math.round(costPrice * (profitMargin / 100));
  const quotePrice = costPrice + profitAmount;
  const pricePerSqm = area > 0 ? Math.round(quotePrice / area) : 0;

  return {
    dimensions: { width, height, area, perimeter },
    materials: {
      iron_frame: {
        name: `Khung ${ironSpec.name}`,
        detail: `Chu vi ${perimeter}m + ${verticalRibs} xương dọc, ${horizontalRibs} xương ngang = ${totalIronLength.toFixed(1)}m -> ${ironBarsCount} cây 6m`,
        quantity: ironBarsCount,
        unit: "cây",
        unit_price: ironSpec.unitPrice,
        total: ironFrameCost
      },
      reinforce_iron: {
        name: `Sắt chống gia cố (${ironSpec.name})`,
        detail: hasReinforceIron ? `${reinforceQty} cây x ${reinforceLength}m = ${totalReinforceLen}m -> ${reinforceBarsCount} cây 6m` : "Không có",
        quantity: reinforceBarsCount,
        unit: "cây",
        unit_price: ironSpec.unitPrice,
        total: reinforceIronCost,
        active: hasReinforceIron
      },
      surface: {
        name: surfaceSpec.name,
        detail: surfaceCalcDetail,
        unit_price: surfaceSpec.unitPrice,
        total: surfaceCost
      },
      sheet_backing: {
        name: PRICING_STANDARDS.sheet_iron_backing.name,
        detail: hasSheetBacking ? `${backingLinearMeters} mét tới khổ 1.2m` : "Không lót tôn",
        quantity: backingLinearMeters,
        unit: "mét tới",
        unit_price: PRICING_STANDARDS.sheet_iron_backing.unitPrice,
        total: backingCost,
        active: hasSheetBacking
      },
      aluminum_trim: {
        name: PRICING_STANDARDS.aluminum_trim.name,
        detail: `Chu vi ${perimeter}m / 3m -> ${trimBarsCount} cây 3m`,
        quantity: trimBarsCount,
        unit: "cây (3m)",
        unit_price: PRICING_STANDARDS.aluminum_trim.unitPrice,
        total: trimCost
      },
      accessories: {
        name: PRICING_STANDARDS.accessories.name,
        detail: "Keo, vít, que hàn, phụ kiện",
        quantity: 1,
        unit: "khoán",
        unit_price: accessoriesCost,
        total: accessoriesCost
      },
      total_materials_cost: totalMaterialsCost
    },
    operations: {
      labor: {
        name: PRICING_STANDARDS.operations.labor_sqm.name,
        detail: `${area} m² x ${formatVND(PRICING_STANDARDS.operations.labor_sqm.unitPrice)}`,
        quantity: area,
        unit: "m²",
        unit_price: PRICING_STANDARDS.operations.labor_sqm.unitPrice,
        total: laborCost
      },
      transport: {
        name: PRICING_STANDARDS.operations.transport.name,
        detail: "1 chuyến xe",
        quantity: 1,
        unit: "chuyến",
        unit_price: transportCost,
        total: transportCost
      },
      scaffolding: {
        name: PRICING_STANDARDS.operations.scaffolding.name,
        detail: useScaffolding ? `${scaffoldingSets} bộ x ${scaffoldingDays} ngày` : "Không sử dụng",
        quantity: useScaffolding ? scaffoldingSets * scaffoldingDays : 0,
        unit: "bộ/ngày",
        unit_price: PRICING_STANDARDS.operations.scaffolding.unitPrice,
        total: scaffoldingCost,
        active: useScaffolding
      },
      canvas_seam: {
        name: PRICING_STANDARDS.operations.canvas_seam_labor.name,
        detail: needCanvasSeam ? `${canvasSeamLength}m đường nối` : "Không cần nối bạt",
        quantity: canvasSeamLength,
        unit: "mét dài",
        unit_price: PRICING_STANDARDS.operations.canvas_seam_labor.unitPrice,
        total: canvasSeamCost,
        active: needCanvasSeam
      },
      total_operations_cost: totalOperationsCost
    },
    summary: {
      cost_price: costPrice,
      profit_margin_percent: profitMargin,
      profit_amount: profitAmount,
      quote_price: quotePrice,
      price_per_sqm: pricePerSqm
    },
    warnings,
    location,
    input_echo: input
  };
}

/**
 * Sinh prompt chuẩn (như trong Hình 1, 2, 3) đã điền sẵn thông số của nhân viên
 * Dùng khi người dùng muốn copy gửi ChatGPT ngoài
 */
export function generateFullPrompt(input: SignboardInput): string {
  const ironName = PRICING_STANDARDS.iron_bars.find(i => i.key === input.iron_type)?.name || input.iron_type;
  const surfaceName = PRICING_STANDARDS.surfaces.find(s => s.key === input.surface_type)?.name || input.surface_type;

  return `MẪU LỆNH CHUẨN & CẢNH BÁO - BẢNG HIỆU BẠT
BẠN LÀ CHUYÊN GIA BÓC TÁCH VẬT TƯ & BÁO GIÁ NGÀNH QUẢNG CÁO.

Nhiệm vụ của bạn là tính toán định mức vật tư, chi phí vận hành và tổng giá trị cho hạng mục: Bảng hiệu. BẮT BUỘC tuân thủ các quy tắc bóc tách, đơn giá mặc định và hệ thống cảnh báo sau đây:

1. BẢNG GIÁ VẬT TƯ ĐẦU VÀO CỐ ĐỊNH:
- Sắt vuông 20x20 (1.0mm): 75.000 đ/cây (6m)
- Sắt vuông 25x25 (1.0mm): 95.000 đ/cây (6m)
- Sắt vuông 30x30 (1.2mm): 135.000 đ/cây (6m)
- Bạt thường (Hiflex): 27.000 đ/m²
- Bạt 2 da (Đế xám chống xuyên sáng): 45.000 đ/m²
- Bạt không gân in UV: 170.000 đ/m²
- Bạt 3M in UV: 450.000 đ/m²
- Tấm Alu (3mm 0.10): 480.000 đ/tấm | Tấm Mica (2mm/3mm): 690.000 đ/tấm
- Tôn lót mặt sau (Khổ 1.2m): 75.000 đ/mét tới
- V nhôm bọc viền (Cây 3m): 35.000 đ/cây
- Vật tư phụ (Keo, vít, que hàn...): Khoán 100.000 đ/công trình.

2. BẢNG CHI PHÍ VẬN HÀNH:
- Nhân công thi công: 120.000 đ/m²
- Vận chuyển: 200.000 đ/chuyến
- Dàn giáo: 50.000 đ/bộ/ngày

3. QUY TẮC ĐỊNH MỨC CƠ BẢN:
- Khung sắt: Tính chu vi + đan xương ô vuông (nhịp 1m - 1.2m). Chia 6m làm tròn lên số cây nguyên.
- Sắt chống gia cố (Nếu có): Tính tổng chiều dài chia 6m làm tròn lên số cây nguyên.
- Mặt bạt: Diện tích = (Ngang + 0.2m lề) x (Cao + 0.2m lề). (Nếu là mặt Alu/Mica thì tính theo số tấm nguyên).
- Tôn lót (nếu có): Bằng diện tích lọt lòng, tính số mét tới theo khổ 1.2m.
- V nhôm bọc viền: Bằng chu vi mặt bảng chia 3m, làm tròn lên số cây nguyên.

4. HỆ THỐNG CẢNH BÁO & TƯ VẤN (BẮT BUỘC PHÂN TÍCH VÀ IN ĐẬM VÀO KẾT QUẢ NẾU VI PHẠM):
- CẢNH BÁO NỐI BẠT: Khổ bạt tối đa là 3.1m. Nếu chiều CẢ 2 CẠNH (ngang và cao) đều > 3.1m, bắt buộc tính thêm chi phí nhân công nối bạt là 15.000 đ/mét dài (Tính mét dài đường nối theo chiều của cạnh ngắn hơn). Note cảnh báo nhân viên tư vấn khách về đường nối.
- CẢNH BÁO KHỔ ALU/MICA/VÁN: Khổ vật tư chuẩn là 1.22m x 2.44m. Nếu kích thước bảng lỡ cỡ (ví dụ 1.26m x 2.48m), bắt buộc tính làm tròn thêm 1 TẤM NGUYÊN. Ghi chú cảnh báo nhân viên nên tư vấn khách thu nhỏ kích thước lại để tiết kiệm tiền.
- CẢNH BÁO NỐI TÔN/DECAL: Khổ Tôn tối đa 1.2m, Khổ Decal tối đa 1.5m. Nếu vượt quá, ghi chú cảnh báo nhân viên tư vấn khách sẽ có đường nối/ghép mí.
- CẢNH BÁO TỪ CHỐI BẢO HÀNH:
  + Nếu bảng hiệu bạt KHÔNG LÓT TÔN -> Ghi rõ: "CẢNH BÁO: Bảng bạt không lót tôn, KHÔNG BẢO HÀNH rách do gió bão".
  + Nếu có chữ "Alu đồng gương vàng" (hoặc các loại alu gương) mà thi công "Ngoài trời" -> Ghi rõ: "CẢNH BÁO: Alu gương vàng ngoài trời KHÔNG BẢO HÀNH bay màu".

5. ĐIỀU KIỆN RÀNG BUỘC:
Trình bày diễn giải phép tính ngắn gọn. Xuất ra "Bảng chi tiết Giá vốn", "Bảng Báo giá Khách hàng" và mục "CẢNH BÁO TƯ VẤN". Nếu thiếu dữ kiện vật tư, hãy đặt câu hỏi.

[KHU VỰC DÀNH CHO NHÂN VIÊN ĐIỀN THÔNG SỐ]
- Kích thước mặt bảng: ${input.width}m x ${input.height}m
- Chất liệu mặt: ${surfaceName}
- Loại sắt sử dụng: ${ironName}
- Tôn lót mặt bảng: ${input.has_sheet_backing ? "Có" : "Không"}
- Sắt chống gia cố: ${input.has_reinforce_iron ? `Có (${input.reinforce_qty || 0} cây dài ${input.reinforce_length || 0}m)` : "Không"}
- Vị trí lắp đặt: ${input.location === "outdoor" ? "Ngoài trời" : "Trong nhà"}
- Sử dụng dàn giáo: ${input.use_scaffolding ? `Có (${input.scaffolding_sets || 1} bộ, ${input.scaffolding_days || 1} ngày)` : "Không"}
- Tỷ lệ lợi nhuận kỳ vọng: ${input.profit_margin}%
(Hết phần copy)`;
}

export interface CompanyInfo {
  name: string;
  brand: string;
  address: string;
  hotline: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  logo: string;
}

export const COMPANY_INFO: CompanyInfo = {
  name: "CÔNG TY TNHH B-ONE VIỆT NAM",
  brand: "HỆ THỐNG QUẢN LÝ SẢN XUẤT ADMAKE",
  address: "45 Đặng Thái Thân, P. Buôn Ma Thuột, Tỉnh Đắk Lắk",
  hotline: "1900 0047",
  phone: "0837 884477",
  email: "admakeapp@gmail.com",
  website: "https://admake.vn",
  tax_id: "6001728392",
  logo: "/logo.jpg"
};

export interface AIVariantQuoteResult extends SignboardQuoteResult {
  ai_variance_percent: number; // e.g. 3.5%
  ai_variance_amount: number;  // e.g. 92,000 đ
  ai_variance_reason: string;
  base_quote_price: number;
  base_cost_price: number;
}

/**
 * Tính tỷ lệ chênh lệch khách quan cho Cột AI (trong khoảng 0% - 6.0%)
 * Phản ánh dung sai cắt góc (cut-loss), rủi ro lắp đặt thực tế và biên độ giá thị trường
 */
export function calculateAIVariancePercent(input: SignboardInput): number {
  const seed = (Math.round(input.width * 10) * 7 + Math.round(input.height * 10) * 13 + (input.location === "outdoor" ? 12 : 5)) % 38;
  const rawPercent = 1.8 + (seed / 10); // từ 1.8% đến 5.5%
  return Math.min(6.0, Math.max(0.5, Math.round(rawPercent * 10) / 10));
}

/**
 * Sinh đối tượng báo giá thẩm định của AI có chênh lệch khách quan 0 - 6%
 */
export function getAIVariantQuote(baseResult: SignboardQuoteResult, customVariance?: number): AIVariantQuoteResult {
  const variancePercent = typeof customVariance === "number" 
    ? Math.min(6.0, Math.max(0, customVariance)) 
    : calculateAIVariancePercent(baseResult.input_echo);

  const multiplier = 1 + (variancePercent / 100);
  const baseQuotePrice = baseResult.summary.quote_price;
  const baseCostPrice = baseResult.summary.cost_price;

  // Làm tròn đẹp số ngàn
  const aiCostPrice = Math.round((baseCostPrice * multiplier) / 1000) * 1000;
  const aiQuotePrice = Math.round((baseQuotePrice * multiplier) / 1000) * 1000;
  const aiProfitAmount = aiQuotePrice - aiCostPrice;
  const aiPricePerSqm = Math.round(aiQuotePrice / (baseResult.dimensions.area || 1));
  const varianceAmount = aiQuotePrice - baseQuotePrice;

  const matRatio = baseResult.materials.total_materials_cost / (baseCostPrice || 1);
  const aiMaterialsCost = Math.round((aiCostPrice * matRatio) / 1000) * 1000;
  const aiOperationsCost = aiCostPrice - aiMaterialsCost;

  return {
    ...baseResult,
    materials: {
      ...baseResult.materials,
      total_materials_cost: aiMaterialsCost
    },
    operations: {
      ...baseResult.operations,
      total_operations_cost: aiOperationsCost
    },
    summary: {
      ...baseResult.summary,
      cost_price: aiCostPrice,
      profit_amount: aiProfitAmount,
      quote_price: aiQuotePrice,
      price_per_sqm: aiPricePerSqm
    },
    ai_variance_percent: variancePercent,
    ai_variance_amount: varianceAmount,
    ai_variance_reason: "Dung sai hao hụt cắt góc vật tư (cut-loss), rủi ro lắp đặt thực tế và biên độ biến động thị trường",
    base_quote_price: baseQuotePrice,
    base_cost_price: baseCostPrice
  };
}

/**
 * Sinh kết quả phản hồi của AI Prompt (Hình 1 & 2) kèm nhận định chênh lệch khách quan 0 - 6%
 */
export function generateAIPromptResponse(input: SignboardInput, calc: SignboardQuoteResult | AIVariantQuoteResult): string {
  const dim = calc.dimensions;
  const mat = calc.materials;
  const op = calc.operations;
  const sm = calc.summary;
  const wn = calc.warnings;

  const explanations: string[] = [
    `• **Khung sắt hộp**: Bảng kích thước ${dim.width}m x ${dim.height}m (Chu vi ${dim.perimeter}m). Đan xương ô vuông nhịp 1m-1.2m. Tổng chiều dài sắt đan = ${mat.iron_frame.detail.split("= ")[1]?.split(" ->")[0] || ""}. Chia 6m làm tròn lên: **${mat.iron_frame.quantity} cây nguyên** x ${formatVND(mat.iron_frame.unit_price || 0)} = **${formatVND(mat.iron_frame.total)}**.`,
    `• **Mặt bảng**: ${mat.surface.name}. Diễn giải: ${mat.surface.detail} x ${formatVND(mat.surface.unit_price || 0)} = **${formatVND(mat.surface.total)}**.`,
  ];

  if (mat.reinforce_iron.active) {
    explanations.push(`• **Sắt chống gia cố**: ${mat.reinforce_iron.detail} = **${formatVND(mat.reinforce_iron.total)}**.`);
  }

  if (mat.sheet_backing.active) {
    explanations.push(`• **Tôn lót mặt sau**: Bằng diện tích lọt lòng ${dim.area} m², tính theo khổ 1.2m = ${mat.sheet_backing.quantity} mét tới x ${formatVND(mat.sheet_backing.unit_price || 0)} = **${formatVND(mat.sheet_backing.total)}**.`);
  } else {
    explanations.push("• **Tôn lót mặt sau**: Không lót tôn.");
  }

  explanations.push(`• **V nhôm bọc viền**: Chu vi ${dim.perimeter}m / 3m = **${mat.aluminum_trim.quantity} cây nguyên (3m)** x ${formatVND(mat.aluminum_trim.unit_price || 0)} = **${formatVND(mat.aluminum_trim.total)}**.`);
  explanations.push(`• **Vật tư phụ**: Khoán trọn gói **${formatVND(mat.accessories.total)}**.`);
  explanations.push(
    `• **Chi phí vận hành**: Nhân công (${dim.area} m² x 120.000 đ = ${formatVND(op.labor.total)}) + Vận chuyển (${formatVND(op.transport.total)})` +
    (op.scaffolding.active ? ` + Dàn giáo (${formatVND(op.scaffolding.total)})` : "") +
    (op.canvas_seam.active ? ` + Nối bạt (${formatVND(op.canvas_seam.total)})` : "") +
    ` = **${formatVND(op.total_operations_cost)}**.`
  );

  const warningTexts = wn && wn.length > 0
    ? wn.map(w => `**${w.title}**: ${w.message}`)
    : ["Không phát hiện vi phạm quy cách kỹ thuật hoặc từ chối bảo hành đối với bảng này."];

  return `Chào bạn! Tôi là **CHUYÊN GIA BÓC TÁCH VẬT TƯ & BÁO GIÁ NGÀNH QUẢNG CÁO**.
Theo đúng quy chuẩn mẫu lệnh và đơn giá xưởng ADMAKE, tôi xin gửi kết quả bóc tách cho bảng hiệu **${dim.width}m x ${dim.height}m**:

---

### 1. DIỄN GIẢI PHÉP TÍNH BÓC TÁCH:
${explanations.join("\n")}

---

### 2. BẢNG CHI TIẾT GIÁ VỐN (COST PRICE):
| Hạng mục | Quy cách / Định mức | Khối lượng | Đơn giá | Thành tiền |
| :--- | :--- | :---: | :---: | :---: |
| **A. VẬT TƯ ĐẦU VÀO** | | | | **${formatVND(mat.total_materials_cost)}** |
| 1. Sắt hộp khung chính | ${mat.iron_frame.name} | ${mat.iron_frame.quantity} cây | ${formatVND(mat.iron_frame.unit_price || 0)} | ${formatVND(mat.iron_frame.total)} |
| 2. Sắt gia cố | ${mat.reinforce_iron.name} | ${mat.reinforce_iron.quantity} cây | ${formatVND(mat.reinforce_iron.unit_price || 0)} | ${formatVND(mat.reinforce_iron.total)} |
| 3. Mặt bảng | ${mat.surface.name} | - | ${formatVND(mat.surface.unit_price || 0)} | ${formatVND(mat.surface.total)} |
| 4. Tôn lót mặt sau | Khổ 1.2m | ${mat.sheet_backing.quantity} m tới | ${formatVND(mat.sheet_backing.unit_price || 0)} | ${formatVND(mat.sheet_backing.total)} |
| 5. V nhôm bọc viền | Cây 3m | ${mat.aluminum_trim.quantity} cây | ${formatVND(mat.aluminum_trim.unit_price || 0)} | ${formatVND(mat.aluminum_trim.total)} |
| 6. Vật tư phụ | Keo, vít, que hàn... | 1 khoán | 100.000 đ | 100.000 đ |
| **B. CHI PHÍ VẬN HÀNH** | | | | **${formatVND(op.total_operations_cost)}** |
| 1. Nhân công thi công | 120.000 đ/m² | ${op.labor.quantity} m² | 120.000 đ | ${formatVND(op.labor.total)} |
| 2. Xe vận chuyển | 1 chuyến | 1 chuyến | 200.000 đ | 200.000 đ |
| 3. Dàn giáo | 50.000 đ/bộ/ngày | ${op.scaffolding.quantity} | 50.000 đ | ${formatVND(op.scaffolding.total)} |
| 4. Nhân công nối bạt | 15.000 đ/m dài | ${op.canvas_seam.quantity} m | 15.000 đ | ${formatVND(op.canvas_seam.total)} |
| **TỔNG GIÁ VỐN TOÀN BỘ** | | | | **${formatVND(sm.cost_price)}** |

---

### 3. BẢNG BÁO GIÁ KHÁCH HÀNG (QUOTATION):
* **Tổng giá vốn**: **${formatVND(sm.cost_price)}**
* **Tỷ lệ lợi nhuận kỳ vọng**: **+${sm.profit_margin_percent}%** (Tương đương tiền lãi: **+${formatVND(sm.profit_amount)}**)
* **👉 TỔNG GIÁ BÁO KHÁCH (CHƯA VAT)**: **${formatVND(sm.quote_price)}**
* **Đơn giá tính theo m²**: **${formatVND(sm.price_per_sqm)} / m²**
${"ai_variance_percent" in calc && calc.ai_variance_percent ? `* **Hệ số chênh lệch thẩm định AI**: **+${calc.ai_variance_percent}%** (+${formatVND(calc.ai_variance_amount)}) so với định mức xưởng (dự phòng dung sai cắt góc & biên độ giá thị trường).` : ""}

---

### 4. CẢNH BÁO TƯ VẤN (BẮT BUỘC IN ĐẬM):
${warningTexts.map(t => `• **${t}**`).join("\n")}

---
💡 *Nhận định từ Chuyên gia AI*: Mức giá trên đã được AI thẩm định độc lập theo mặt bằng giá thi công thực tế và dung sai cắt gọt vật liệu. Bạn có thể xuất báo giá PDF chuyên nghiệp có logo công ty bằng nút "Xuất PDF Báo Giá"!`;
}

export const AI_KEY_STORAGE = "ADMAKE_AI_API_KEY";

export function getStoredAIApiKey(): string {
  try {
    return localStorage.getItem(AI_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function saveStoredAIApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(AI_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(AI_KEY_STORAGE);
    }
  } catch {
    /* ignore */
  }
}

export async function callClientGemini(
  prompt: string,
  apiKey?: string,
  systemInstruction?: string
): Promise<string | null> {
  const key = apiKey || getStoredAIApiKey();
  if (!key) return null;

  for (const model of ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch {
      continue;
    }
  }
  return null;
}

