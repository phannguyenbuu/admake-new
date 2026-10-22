import {
  calculateSignboardQuote,
  generateAIPromptResponse,
  formatVND,
  type LineItem,
  type SignboardInput,
  type SignboardQuoteResult,
} from "../../../services/aiPricingEngine";

// Đơn giá LED hắt sáng (module + nguồn + dây) tính theo m² mặt bảng.
// LƯU Ý: giá giả định, cần xác nhận với bảng giá Admake trước khi dùng chính thức.
export const LED_PRICE_PER_SQM = 250000;

export interface StudioQuoteResult extends SignboardQuoteResult {
  led: LineItem;
}

export interface StudioQuoteParams {
  width: number;
  height: number;
  ironType: string;
  surfaceType: string;
  hasSheetBacking: boolean;
  hasLed: boolean;
  profitMargin: number;
}

function buildInput(p: StudioQuoteParams): SignboardInput {
  return {
    width: p.width,
    height: p.height,
    iron_type: p.ironType,
    surface_type: p.surfaceType,
    has_sheet_backing: p.hasSheetBacking,
    has_reinforce_iron: p.width >= 8,
    location: "outdoor",
    use_scaffolding: p.height >= 3,
    profit_margin: p.profitMargin,
  };
}

export function computeStudioQuote(p: StudioQuoteParams): StudioQuoteResult {
  const base = calculateSignboardQuote(buildInput(p));
  const area = base.dimensions.area;
  const ledCost = p.hasLed ? Math.round(area * LED_PRICE_PER_SQM) : 0;

  const led: LineItem = {
    name: "Đèn LED chiếu sáng",
    detail: p.hasLed ? `${area} m² x ${formatVND(LED_PRICE_PER_SQM)}/m²` : "Không sử dụng",
    quantity: p.hasLed ? area : 0,
    unit: "m²",
    unit_price: LED_PRICE_PER_SQM,
    total: ledCost,
    active: p.hasLed,
  };

  if (!ledCost) return { ...base, led };

  const totalMaterials = base.materials.total_materials_cost + ledCost;
  const costPrice = totalMaterials + base.operations.total_operations_cost;
  const margin = base.summary.profit_margin_percent;
  const profitAmount = Math.round(costPrice * (margin / 100));
  const quotePrice = costPrice + profitAmount;

  return {
    ...base,
    led,
    materials: { ...base.materials, total_materials_cost: totalMaterials },
    summary: {
      ...base.summary,
      cost_price: costPrice,
      profit_amount: profitAmount,
      quote_price: quotePrice,
      price_per_sqm: area > 0 ? Math.round(quotePrice / area) : 0,
    },
  };
}

export function buildZaloQuoteText(p: StudioQuoteParams, quote: StudioQuoteResult): string {
  const text = generateAIPromptResponse(buildInput(p), quote);
  if (!quote.led.active) return text;
  return `${text}\n- ${quote.led.name}: ${quote.led.detail} = ${formatVND(quote.led.total)}\n=> TỔNG BÁO GIÁ (đã gồm LED): ${formatVND(quote.summary.quote_price)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// In riêng bảng dự toán trong cửa sổ mới (không in cả trang ứng dụng).
export function printStudioQuote(title: string, quote: StudioQuoteResult): void {
  const rows: LineItem[] = [
    quote.materials.iron_frame,
    quote.materials.reinforce_iron,
    quote.materials.surface,
    quote.materials.sheet_backing,
    quote.materials.aluminum_trim,
    quote.materials.accessories,
    quote.led,
    quote.operations.labor,
    quote.operations.transport,
    quote.operations.scaffolding,
    quote.operations.canvas_seam,
  ].filter((r) => r && r.total > 0);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}h2{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
td,th{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#f1f5f9}.r{text-align:right}.t{font-weight:bold;background:#eff6ff}</style></head><body>
<h2>BẢNG DỰ TOÁN BẢNG HIỆU</h2><div>${escapeHtml(title)} — ${quote.dimensions.width}m x ${quote.dimensions.height}m (${quote.dimensions.area} m²)</div>
<table><tr><th>Hạng mục</th><th>Diễn giải</th><th class="r">Thành tiền</th></tr>
${rows.map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.detail || "")}</td><td class="r">${formatVND(r.total)}</td></tr>`).join("")}
<tr><td colspan="2">Giá vốn</td><td class="r">${formatVND(quote.summary.cost_price)}</td></tr>
<tr><td colspan="2">Lợi nhuận (${quote.summary.profit_margin_percent}%)</td><td class="r">${formatVND(quote.summary.profit_amount)}</td></tr>
<tr class="t"><td colspan="2">TỔNG BÁO GIÁ</td><td class="r">${formatVND(quote.summary.quote_price)}</td></tr></table>
<script>window.onload=function(){window.print();}</script></body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    window.print();
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
