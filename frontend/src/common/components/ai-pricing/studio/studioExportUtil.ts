/**
 * studioExportUtil.ts - Tiện ích xuất file Excel và in/xuất PDF cho bảng dự toán bảng hiệu
 */

import { formatVND } from "../../../services/aiPricingEngine";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";

export interface PricingLineItem {
  id: string;
  name: string;
  detail: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  total: number;
  checked: boolean;
  isCustom?: boolean;
}

export interface ExportQuoteData {
  model3D: Signboard3DModel | null;
  items: PricingLineItem[];
  labor: {
    days: number;
    unitPrice: number;
    total: number;
  };
  transport: {
    km: number;
    unitPrice: number;
    total: number;
  };
  scrap: {
    percent: number;
    amount: number;
  };
  totalProductionCost: number;
}

function escapeHtml(s: string): string {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

/** 1. Xuất file Excel (.xls) chuẩn bảng tính */
export function exportStudioQuoteExcel(data: ExportQuoteData) {
  const { model3D, items, labor, transport, scrap, totalProductionCost } = data;
  const title = model3D?.name || "Bảng hiệu Admake";
  const w = model3D?.dimensions?.width || 0;
  const h = model3D?.dimensions?.height || 0;
  const d = model3D?.dimensions?.depth || 0.12;
  const area = (w * h).toFixed(2);
  const now = new Date().toLocaleString("vi-VN");

  const tableRows = items
    .map(
      (item, idx) => `
      <tr style="${!item.checked ? 'text-decoration: line-through; color: #94a3b8;' : ''}">
        <td style="text-align: center;">${idx + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.detail)}</td>
        <td style="text-align: center;">${escapeHtml(item.unit || "cái")}</td>
        <td style="text-align: right;">${item.unitPrice ? item.unitPrice : "-"}</td>
        <td style="text-align: center;">${item.checked ? 'Có' : 'Bỏ qua'}</td>
        <td style="text-align: right;">${item.checked ? item.total : 0}</td>
      </tr>`
    )
    .join("");

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 13px; }
        th { background-color: #00b4b6; color: #ffffff; font-weight: bold; text-align: center; }
        .header-title { font-size: 16px; font-weight: bold; color: #00b4b6; }
        .total-row { font-weight: bold; background-color: #f0fdfa; color: #0f766e; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="7" class="header-title">BẢNG DỰ TOÁN BẢNG HIỆU QUẢNG CÁO - ADMAKE</td></tr>
        <tr><td colspan="7">Công trình: <strong>${escapeHtml(title)}</strong></td></tr>
        <tr><td colspan="7">Kích thước: <strong>${w}m x ${h}m x ${d}m (Diện tích: ${area} m²)</strong></td></tr>
        <tr><td colspan="7">Thời gian xuất: ${now}</td></tr>
        <tr><td colspan="7"></td></tr>
        <tr>
          <th style="width: 40px;">STT</th>
          <th style="width: 220px;">Hạng mục thành phần</th>
          <th style="width: 260px;">Quy cách & Diễn giải</th>
          <th style="width: 80px;">ĐVT</th>
          <th style="width: 110px;">Đơn giá</th>
          <th style="width: 70px;">Sử dụng</th>
          <th style="width: 130px;">Thành tiền (VNĐ)</th>
        </tr>
        ${tableRows}
        <tr>
          <td colspan="6"><strong>Nhân công sản xuất & lắp đặt (${labor.days} công x ${formatVND(labor.unitPrice)}/công)</strong></td>
          <td style="text-align: right;">${labor.total}</td>
        </tr>
        <tr>
          <td colspan="6"><strong>Vận chuyển công trình (${transport.km} km x ${formatVND(transport.unitPrice)}/km)</strong></td>
          <td style="text-align: right;">${transport.total}</td>
        </tr>
        <tr>
          <td colspan="6"><strong>Hao hụt vật tư (${scrap.percent}%)</strong></td>
          <td style="text-align: right;">${scrap.amount}</td>
        </tr>
        <tr class="total-row">
          <td colspan="6" style="text-align: right; font-size: 14px;">TỔNG CỘNG GIÁ VỐN DỰ TOÁN:</td>
          <td style="text-align: right; font-size: 14px;">${totalProductionCost}</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DuToan_${title.replace(/\s+/g, "_")}_${Date.now()}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 2. In hoặc Xuất file PDF bằng cửa sổ xem trước chuẩn A4 */
export function exportStudioQuotePDF(data: ExportQuoteData) {
  const { model3D, items, labor, transport, scrap, totalProductionCost } = data;
  const title = model3D?.name || "Bảng hiệu Admake";
  const w = model3D?.dimensions?.width || 0;
  const h = model3D?.dimensions?.height || 0;
  const d = model3D?.dimensions?.depth || 0.12;
  const area = (w * h).toFixed(2);
  const now = new Date().toLocaleString("vi-VN");

  const tableRows = items
    .map(
      (item, idx) => `
      <tr style="${!item.checked ? 'text-decoration: line-through; color: #94a3b8;' : ''}">
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td>${escapeHtml(item.detail)}</td>
        <td style="text-align: center;">${escapeHtml(item.unit || "cái")}</td>
        <td style="text-align: right;">${item.unitPrice ? formatVND(item.unitPrice) : '-'}</td>
        <td style="text-align: right;">${item.checked ? formatVND(item.total) : '0 đ'}</td>
      </tr>`
    )
    .join("");

  const printHtml = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Dự Toán - ${escapeHtml(title)}</title>
    <style>
      @page { size: A4 portrait; margin: 15mm; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
      .header { border-bottom: 2px solid #00b4b6; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
      .title { font-size: 20px; font-weight: bold; color: #00b4b6; margin: 0 0 4px; }
      .sub { color: #64748b; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 20px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; }
      th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: left; }
      .r { text-align: right; }
      .c { text-align: center; }
      .total-box { background: #f0fdfa; border: 1px solid #99f6e4; padding: 12px 16px; border-radius: 8px; margin-top: 10px; }
      .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #0f766e; }
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">BẢNG DỰ TOÁN BẢNG HIỆU QUẢNG CÁO</div>
        <div class="sub">Hệ thống Thiết Kế & Báo Giá Tự Động Admake Studio</div>
      </div>
      <div style="text-align: right;" class="sub">
        <div>Ngày xuất: ${now}</div>
      </div>
    </div>

    <div><strong>Công trình:</strong> ${escapeHtml(title)}</div>
    <div><strong>Kích thước tổng thể:</strong> ${w}m × ${h}m × ${d}m (Diện tích mặt phẳng: <strong>${area} m²</strong>)</div>

    <table>
      <thead>
        <tr>
          <th class="c" style="width: 35px;">STT</th>
          <th style="width: 200px;">Hạng mục thành phần</th>
          <th>Quy cách & Diễn giải</th>
          <th class="c" style="width: 70px;">ĐVT</th>
          <th class="r" style="width: 100px;">Đơn giá</th>
          <th class="r" style="width: 120px;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        <tr>
          <td class="c">•</td>
          <td><strong>Nhân công sản xuất & lắp đặt</strong></td>
          <td colspan="3">${labor.days} công × ${formatVND(labor.unitPrice)}/công</td>
          <td class="r">${formatVND(labor.total)}</td>
        </tr>
        <tr>
          <td class="c">•</td>
          <td><strong>Vận chuyển công trình</strong></td>
          <td colspan="3">${transport.km} km × ${formatVND(transport.unitPrice)}/km</td>
          <td class="r">${formatVND(transport.total)}</td>
        </tr>
        <tr>
          <td class="c">•</td>
          <td><strong>Hao hụt vật tư (${scrap.percent}%)</strong></td>
          <td colspan="3">Hao hụt cắt gọt và khấu hao công trình</td>
          <td class="r">+${formatVND(scrap.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>TỔNG CỘNG GIÁ VỐN DỰ TOÁN:</span>
        <span>${formatVND(totalProductionCost)}</span>
      </div>
    </div>

    <script>
      window.onload = function() {
        window.print();
      };
    </script>
  </body>
  </html>`;

  const wnd = window.open("", "_blank", "width=920,height=750");
  if (!wnd) {
    window.print();
    return;
  }
  wnd.document.open();
  wnd.document.write(printHtml);
  wnd.document.close();
}
