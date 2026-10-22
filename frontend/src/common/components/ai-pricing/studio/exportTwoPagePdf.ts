/**
 * exportTwoPagePdf.ts - Xuất bản in / PDF chuẩn A4 gồm 2 trang:
 * - Trang 1: Phối cảnh Render 4K (hoặc Snapshot 3D) kèm Logo và Text 2D (chuẩn tỉ lệ gốc, không méo hình)
 * - Trang 2: Bảng Báo Giá Chi Tiết & Dự Toán Kỹ Thuật (hỗ trợ cả Khổ Ngang - Landscape và Khổ Đứng - Portrait)
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { message } from "antd";
import { formatVND } from "../../../services/aiPricingEngine";
import type { OverlayLogo, OverlayTextItem, TwoPagePdfData } from "./overlayTypes";

function escapeHtml(s: string): string {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function makeRow(stt: any, name: string, detail: string, unit: string, qty: any, price: number, total: number) {
  return `<tr>
    <td style="text-align: center;">${stt}</td>
    <td><strong>${escapeHtml(name)}</strong></td>
    <td>${escapeHtml(detail)}</td>
    <td style="text-align: center;">${escapeHtml(unit)}</td>
    <td style="text-align: center;">${qty}</td>
    <td style="text-align: right; font-family: monospace;">${formatVND(price)}</td>
    <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatVND(total)}</td>
  </tr>`;
}

export async function exportTwoPageStudioPdf(data: TwoPagePdfData) {
  const {
    orientation = "landscape",
    renderImageUrl,
    logo,
    textItems,
    model3DName = "Biển Hiệu Quảng Cáo Cao Cấp",
    dimensions = { width: 3, height: 1.2, depth: 0.12 },
    quoteResult,
    profitMargin = 30,
  } = data;

  const isPortrait = orientation === "portrait";
  const now = new Date().toLocaleDateString("vi-VN");
  const area = (dimensions.width * dimensions.height).toFixed(2);

  // Kích thước chuẩn pixel của trang A4 tại 96 DPI
  const sheetW = isPortrait ? 794 : 1123;
  const sheetH = isPortrait ? 1123 : 794;
  const pdfW = isPortrait ? 210 : 297;
  const pdfH = isPortrait ? 297 : 210;

  // Lấy dữ liệu ghi đè & cấu hình từ localStorage
  let itemOverrides: Record<string, any> = {};
  let customItems: any[] = [];
  let laborDays = Math.max(2, Math.ceil(Number(area) / 10));
  let laborRate = 400000;
  let transportKm = 15;
  let transportRate = 15000;
  let scrapPercent = 5;

  try {
    itemOverrides = JSON.parse(localStorage.getItem("admake_pricing_item_overrides") || "{}");
    customItems = JSON.parse(localStorage.getItem("admake_custom_pricing_items") || "[]");
    laborDays = Number(localStorage.getItem("admake_quote_labor_days")) || laborDays;
    laborRate = Number(localStorage.getItem("admake_quote_labor_rate")) || 400000;
    transportKm = Number(localStorage.getItem("admake_quote_transport_km")) || 15;
    transportRate = Number(localStorage.getItem("admake_quote_transport_rate")) || 15000;
    scrapPercent = Number(localStorage.getItem("admake_scrap_percent")) || 5;
  } catch {}

  // Lọc text items cho từng trang
  const page1Texts = textItems.filter((t) => t.page === "render" || t.page === "both");
  const page2Texts = textItems.filter((t) => t.page === "quote" || t.page === "both");
  const showLogoPage1 = logo && (logo.page === "render" || logo.page === "both");
  const showLogoPage2 = logo && (logo.page === "quote" || logo.page === "both");

  // Đọc kích thước ảnh thật để render Trang 1 CHUẨN XÁC tỉ lệ (tránh bug kéo dãn của html2canvas)
  const containerW = sheetW;
  const containerH = sheetH - 64; // Trừ header 38px + footer 26px
  let finalImgW = containerW;
  let finalImgH = containerH;

  if (renderImageUrl) {
    await new Promise<void>((resolve) => {
      const probe = new Image();
      probe.onload = () => {
        const nw = probe.naturalWidth || 1920;
        const nh = probe.naturalHeight || 1080;
        const scale = Math.min(containerW / nw, containerH / nh);
        finalImgW = Math.round(nw * scale);
        finalImgH = Math.round(nh * scale);
        resolve();
      };
      probe.onerror = () => resolve();
      probe.src = renderImageUrl;
    });
  }

  // Render HTML overlay elements
  const renderOverlayHtml = (items: OverlayTextItem[]) =>
    items
      .map(
        (t) => `
      <div style="
        position: absolute;
        left: ${t.x}%;
        top: ${t.y}%;
        font-size: ${t.fontSize}px;
        font-weight: ${t.fontWeight};
        color: ${t.color};
        background: ${t.bgColor || "transparent"};
        padding: ${t.bgColor && t.bgColor !== "transparent" ? "4px 10px" : "0"};
        border-radius: ${t.borderRadius || 6}px;
        white-space: pre-wrap;
        max-width: 85%;
        line-height: 1.35;
        box-sizing: border-box;
      ">
        ${escapeHtml(t.text)}
      </div>`
      )
      .join("");

  // Chuẩn bị dữ liệu bảng báo giá trang 2
  let rawMaterials = 0;
  const quoteRows: string[] = [];
  let rowIdx = 1;

  if (quoteResult?.materials) {
    const m = quoteResult.materials;
    const surfName = m.surface?.name || "Mặt bảng Alu/Bạt";
    const surfPrice = itemOverrides["surface"]?.unitPrice ?? (m.surface?.unit_price || 0);
    const surfQty = itemOverrides["surface"]?.quantity ?? (m.surface?.quantity || Number(area) || 1);
    const surfTotal = surfPrice * surfQty;
    rawMaterials += surfTotal;
    quoteRows.push(makeRow(rowIdx++, surfName, m.surface?.detail || "Gia công mặt phẳng thẩm mỹ", "m²", surfQty, surfPrice, surfTotal));

    const ironName = m.iron_frame?.name || "Khung sắt chịu lực";
    const ironPrice = itemOverrides["iron_frame"]?.unitPrice ?? (m.iron_frame?.unit_price || 0);
    const ironQty = itemOverrides["iron_frame"]?.quantity ?? (m.iron_frame?.quantity || 1);
    const ironTotal = ironPrice * ironQty;
    rawMaterials += ironTotal;
    quoteRows.push(makeRow(rowIdx++, ironName, m.iron_frame?.detail || "Hàn khung xương mạ kẽm", "cây (6m)", ironQty, ironPrice, ironTotal));

    if (m.reinforce_iron?.active) {
      const rfPrice = itemOverrides["reinforce_iron"]?.unitPrice ?? (m.reinforce_iron.unit_price || 0);
      const rfQty = itemOverrides["reinforce_iron"]?.quantity ?? (m.reinforce_iron.quantity || 1);
      const rfTotal = rfPrice * rfQty;
      rawMaterials += rfTotal;
      quoteRows.push(makeRow(rowIdx++, m.reinforce_iron.name, m.reinforce_iron.detail, "cây", rfQty, rfPrice, rfTotal));
    }

    if (quoteResult.led?.active) {
      const ledPrice = itemOverrides["led"]?.unitPrice ?? (quoteResult.led.unit_price || quoteResult.led.total);
      const ledQty = itemOverrides["led"]?.quantity ?? 1;
      const ledTotal = ledPrice * ledQty;
      rawMaterials += ledTotal;
      quoteRows.push(makeRow(rowIdx++, quoteResult.led.name, quoteResult.led.detail || "Đèn LED hắt sáng cao cấp", "bộ", ledQty, ledPrice, ledTotal));
    }
  }

  // Thêm custom items
  customItems.forEach((ci: any) => {
    if (ci.checked !== false) {
      const cQty = itemOverrides[ci.id]?.quantity ?? (ci.quantity || 1);
      const cPrice = itemOverrides[ci.id]?.unitPrice ?? (ci.unitPrice || ci.total);
      const cTotal = cQty * cPrice;
      rawMaterials += cTotal;
      quoteRows.push(makeRow(rowIdx++, ci.name, ci.detail || "Hạng mục gia công theo yêu cầu", ci.unit || "cái", cQty, cPrice, cTotal));
    }
  });

  const laborTotal = laborDays * laborRate;
  const transportTotal = transportKm * transportRate;
  const scrapAmount = Math.round((rawMaterials * scrapPercent) / 100);
  const costPrice = rawMaterials + scrapAmount + laborTotal + transportTotal;
  const profitAmount = Math.round((costPrice * profitMargin) / 100);
  const quotePrice = costPrice + profitAmount;
  const vatAmount = Math.round(quotePrice * 0.08); // VAT 8%
  const grandTotal = quotePrice + vatAmount;

  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Ho-So-Thiet-Ke-Bao-Gia-${Date.now()}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #1e293b;
        background: #ffffff;
      }
      .page-sheet {
        position: relative;
        width: ${sheetW}px;
        height: ${sheetH}px;
        margin: 0;
        background: #ffffff;
        overflow: hidden;
        border: none;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      table { width: 100%; border-collapse: collapse; font-size: ${isPortrait ? "11px" : "10.5px"}; }
      th, td { border: 1px solid #cbd5e1; padding: ${isPortrait ? "5px 7px" : "4px 6px"}; }
      th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; }
    </style>
  </head>
  <body>
    <!-- ==================== TRANG 1: PHỐI CẢNH RENDER ==================== -->
    <div class="page-sheet">
      <!-- Header Trang 1 -->
      <div style="height: 38px; background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: #00b4b6; color: white; font-weight: 900; font-size: 11px; padding: 2px 6px; border-radius: 4px;">TRANG 1</span>
          <span style="font-weight: 800; font-size: 13px; letter-spacing: 0.5px;">HỒ SƠ PHỐI CẢNH KIẾN TRÚC & QUẢNG CÁO</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8;">
          Công trình: <strong>${escapeHtml(model3DName)}</strong> • Kích thước: <strong>${dimensions.width}m × ${dimensions.height}m</strong>
        </div>
      </div>

      <!-- Vùng Ảnh Render & Overlay Elements: Giữ nguyên tỉ lệ ảnh gốc, không méo -->
      <div style="position: relative; width: ${containerW}px; height: ${containerH}px; background: #020617; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        ${
          renderImageUrl
            ? `<img src="${renderImageUrl}" style="width: ${finalImgW}px; height: ${finalImgH}px; display: block; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />`
            : `<div style="color: #64748b; font-size: 16px; text-align: center;">Chưa có ảnh render. Vui lòng render tại AI Studio.</div>`
        }

        <!-- Logo Trang 1 -->
        ${
          showLogoPage1
            ? `<img src="${logo!.url}" style="position: absolute; left: ${logo!.x}%; top: ${logo!.y}%; width: ${logo!.width}%; max-height: 25%; object-fit: contain; pointer-events: none;" />`
            : ""
        }

        <!-- Text Annotations Trang 1 -->
        ${renderOverlayHtml(page1Texts)}
      </div>

      <!-- Footer Trang 1 -->
      <div style="height: 26px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 10px; color: #64748b; flex-shrink: 0;">
        <span>Đơn vị thiết kế: <strong>ADMAKE AI STUDIO</strong></span>
        <span>Bản quyền thiết kế © ADMAKE • Ngày xuất: ${now} (${isPortrait ? "Khổ Đứng" : "Khổ Nằm"})</span>
      </div>
    </div>

    <!-- ==================== TRANG 2: BẢNG BÁO GIÁ CHI TIẾT ==================== -->
    <div class="page-sheet" style="padding: ${isPortrait ? "20px 24px" : "12px 18px"};">
      <!-- Header Báo Giá Trang 2 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00b4b6; padding-bottom: 6px; margin-bottom: 8px; position: relative;">
        <div style="display: flex; gap: 12px; align-items: center;">
          ${
            showLogoPage2
              ? `<img src="${logo!.url}" style="max-height: 44px; max-width: 120px; object-fit: contain;" />`
              : `<div style="font-size: 22px; font-weight: 900; color: #00b4b6; letter-spacing: -0.5px;">ADMAKE</div>`
          }
          <div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase;">BẢNG DỰ TOÁN & BÁO GIÁ THI CÔNG BIỂN HIỆU</div>
            <div style="font-size: 10.5px; color: #64748b;">Công trình: <strong>${escapeHtml(model3DName)}</strong> • Kích thước: <strong>${dimensions.width}m × ${dimensions.height}m × ${dimensions.depth || 0.12}m (Diện tích: ${area} m²)</strong></div>
          </div>
        </div>
        <div style="text-align: right; font-size: 10.5px; color: #475569;">
          <div><span style="background: #00b4b6; color: white; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">TRANG 2</span></div>
          <div style="margin-top: 2px;">Ngày lập: <strong>${now}</strong></div>
        </div>
      </div>

      <!-- Text Annotations Trang 2 -->
      <div style="position: relative; width: 100%;">
        ${renderOverlayHtml(page2Texts)}
      </div>

      <!-- Bảng Hạng Mục & Đơn Giá -->
      <table style="margin-bottom: 6px;">
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">STT</th>
            <th style="width: ${isPortrait ? "170px" : "180px"};">Hạng mục thành phần</th>
            <th>Quy cách & Diễn giải kỹ thuật</th>
            <th style="width: 55px; text-align: center;">ĐVT</th>
            <th style="width: 45px; text-align: center;">SL</th>
            <th style="width: 85px; text-align: right;">Đơn giá</th>
            <th style="width: 105px; text-align: right;">Thành tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          ${quoteRows.join("")}
          <tr>
            <td style="text-align: center;">•</td>
            <td><strong>Nhân công sản xuất & lắp đặt</strong></td>
            <td>Thợ cơ khí hàn khung + thợ dán căng bề mặt + kỹ thuật treo gắn</td>
            <td style="text-align: center;">công</td>
            <td style="text-align: center;">${laborDays}</td>
            <td style="text-align: right; font-family: monospace;">${formatVND(laborRate)}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatVND(laborTotal)}</td>
          </tr>
          <tr>
            <td style="text-align: center;">•</td>
            <td><strong>Vận chuyển & phương tiện</strong></td>
            <td>Xe cẩu / xe tải chuyên dụng vận chuyển đến chân công trình</td>
            <td style="text-align: center;">km</td>
            <td style="text-align: center;">${transportKm}</td>
            <td style="text-align: right; font-family: monospace;">${formatVND(transportRate)}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatVND(transportTotal)}</td>
          </tr>
          <tr>
            <td style="text-align: center;">•</td>
            <td><strong>Hao hụt vật tư & khấu hao máy (${scrapPercent}%)</strong></td>
            <td colspan="4">Bao gồm cắt góc dư, hao mòn mũi dao CNC, que hàn, điện nước nhà xưởng</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">+${formatVND(scrapAmount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Khối Tổng Kết Tài Chính -->
      <div style="display: flex; flex-direction: ${isPortrait ? "row" : "row"}; gap: 10px; margin-bottom: 6px;">
        <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 10.5px; background: #f8fafc;">
          <div style="font-weight: 700; color: #334155; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">ĐIỀU KHOẢN THANH TOÁN & BẢO HÀNH</div>
          <div>• <strong>Tạm ứng:</strong> 50% ngay sau khi ký hợp đồng và duyệt mẫu phối cảnh (Trang 1).</div>
          <div>• <strong>Nghiệm thu:</strong> 50% còn lại sau khi lắp đặt hoàn thiện và bàn giao.</div>
          <div>• <strong>Bảo hành:</strong> 24 tháng kết cấu khung sắt, 12 tháng hệ thống nguồn LED.</div>
        </div>

        <div style="width: ${isPortrait ? "310px" : "330px"}; border: 1.5px solid #00b4b6; border-radius: 6px; padding: 6px 10px; background: #f0fdfa; font-size: 10.5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #475569;">
            <span>Giá vốn sản xuất (A):</span>
            <strong style="font-family: monospace;">${formatVND(costPrice)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #d97706;">
            <span>Lợi nhuận kỳ vọng (${profitMargin}%):</span>
            <strong style="font-family: monospace;">+${formatVND(profitAmount)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; border-top: 1px solid #99f6e4; padding-top: 2px; color: #0f766e; font-weight: 700;">
            <span>Tổng giá bán trước thuế:</span>
            <strong style="font-family: monospace;">${formatVND(quotePrice)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #64748b;">
            <span>Thuế GTGT (VAT 8%):</span>
            <strong style="font-family: monospace;">${formatVND(vatAmount)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1.5px solid #00b4b6; padding-top: 3px; font-size: 12.5px; font-weight: 900; color: #0f766e;">
            <span>TỔNG THANH TOÁN:</span>
            <span style="font-family: monospace; font-size: 13.5px;">${formatVND(grandTotal)}</span>
          </div>
        </div>
      </div>

      <!-- Khối Chữ Ký Đại Diện -->
      <div style="display: flex; justify-content: space-between; margin-top: auto; padding: 0 40px 10px; text-align: center; font-size: 10.5px;">
        <div>
          <div style="font-weight: 700; text-transform: uppercase; color: #334155;">ĐẠI DIỆN KHÁCH HÀNG</div>
          <div style="font-style: italic; color: #64748b; font-size: 9.5px;">(Ký và ghi rõ họ tên)</div>
          <div style="height: ${isPortrait ? "50px" : "36px"};"></div>
        </div>
        <div>
          <div style="font-weight: 700; text-transform: uppercase; color: #0f766e;">ĐẠI DIỆN CÔNG TY ADMAKE</div>
          <div style="font-style: italic; color: #64748b; font-size: 9.5px;">(Ký tên & đóng dấu)</div>
          <div style="height: ${isPortrait ? "50px" : "36px"};"></div>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  message.loading({ content: `Đang tạo file PDF 2 trang (${isPortrait ? "Khổ Đứng A4" : "Khổ Nằm A4"})...`, key: "export_pdf", duration: 0 });

  try {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-99999px";
    container.style.top = "0";
    container.style.width = `${sheetW}px`;
    container.style.zIndex = "-9999";
    container.innerHTML = html;
    document.body.appendChild(container);

    // Chờ tất cả hình ảnh trong container tải xong
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    // Đợi layout và phông chữ render hoàn tất
    await new Promise((r) => setTimeout(r, 250));

    const pageSheets = container.querySelectorAll<HTMLElement>(".page-sheet");
    if (!pageSheets || pageSheets.length === 0) {
      throw new Error("Không tìm thấy nội dung trang bản vẽ.");
    }

    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < pageSheets.length; i++) {
      const sheet = pageSheets[i];
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) {
        doc.addPage("a4", orientation);
      }

      // Khớp canvas chuẩn xác theo tỉ lệ PDF, tuyệt đối không bị co giãn méo hình
      const scale = Math.min(pdfW / canvas.width, pdfH / canvas.height);
      const drawW = canvas.width * scale;
      const drawH = canvas.height * scale;
      const offX = (pdfW - drawW) / 2;
      const offY = (pdfH - drawH) / 2;

      doc.addImage(imgData, "JPEG", offX, offY, drawW, drawH);
    }

    // Đặt tên file và kích hoạt tải trực tiếp về máy người dùng
    const cleanName = (model3DName || "Bien_Hieu")
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, "_")
      .replace(/_+/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    const orientationTag = isPortrait ? "Dung" : "Nam";
    const filename = `Bao_Gia_${cleanName}_${orientationTag}_${dateStr}.pdf`;

    doc.save(filename);

    document.body.removeChild(container);
    message.success({ content: `✨ Đã tải xuống file PDF: ${filename}`, key: "export_pdf", duration: 3 });
  } catch (err: any) {
    console.error("Lỗi khi tạo file PDF:", err);
    message.error({ content: "Lỗi xuất PDF: " + (err?.message || "Không thể tạo file"), key: "export_pdf", duration: 4 });
  }
}
