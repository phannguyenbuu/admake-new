import React, { useState } from "react";
import { Modal, Input, Radio, Button } from "antd";
import { PrinterOutlined, DownloadOutlined, CloseOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  type SignboardQuoteResult,
  COMPANY_INFO,
  formatVND
} from "../../services/aiPricingEngine";

interface QuotationPdfModalProps {
  open: boolean;
  onCancel: () => void;
  quoteResult: SignboardQuoteResult;
}

export const QuotationPdfModal: React.FC<QuotationPdfModalProps> = ({
  open,
  onCancel,
  quoteResult
}) => {
  const { dimensions, materials, operations, summary, warnings } = quoteResult;

  const [customerName, setCustomerName] = useState("Quý Khách Hàng / Công ty");
  const [customerPhone, setCustomerPhone] = useState("");
  const [projectAddress, setProjectAddress] = useState("Tại công trình");
  const [vatRate, setVatRate] = useState<number>(0); // 0%, 8%, 10%

  const today = new Date();
  const quoteNumber = `BG-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateString = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  const subTotal = summary.quote_price;
  const vatAmount = Math.round(subTotal * (vatRate / 100));
  const grandTotal = subTotal + vatAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
      destroyOnClose
      styles={{
        body: { padding: 0, maxHeight: "90vh", overflowY: "auto" }
      }}
      className="quotation-pdf-modal"
    >
      {/* Action Bar (Ẩn khi in) */}
      <div className="bg-slate-800 text-white p-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 print:hidden shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300">Thuế VAT:</span>
          <Radio.Group
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            size="small"
            className="!bg-slate-700 !p-0.5 !rounded-lg"
          >
            <Radio.Button value={0} className="!text-xs">0%</Radio.Button>
            <Radio.Button value={8} className="!text-xs">8%</Radio.Button>
            <Radio.Button value={10} className="!text-xs">10%</Radio.Button>
          </Radio.Group>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none"
          >
            <PrinterOutlined className="text-sm" />
            <span>In Báo Giá / Lưu PDF</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all cursor-pointer border-none"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* DOCUMENT SHEET (Khổ A4 tiêu chuẩn) */}
      <div className="p-8 md:p-12 bg-white text-slate-800 print:p-0 print:m-0 font-sans leading-normal">
        {/* Header Công Ty */}
        <div className="flex items-start justify-between border-b-2 border-cyan-600 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              ADMAKE
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight m-0 uppercase">
                {COMPANY_INFO.name}
              </h1>
              <div className="text-xs font-bold text-cyan-700 mt-0.5 uppercase tracking-wider">
                {COMPANY_INFO.brand}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                <div>📍 {COMPANY_INFO.address}</div>
                <div>☎ Hotline: <b className="text-slate-700">{COMPANY_INFO.hotline}</b> - CSKH: {COMPANY_INFO.phone} | ✉ {COMPANY_INFO.email}</div>
                <div>🌐 Website: <b className="text-cyan-700">{COMPANY_INFO.website}</b> | MST: {COMPANY_INFO.tax_id}</div>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400 font-mono">Mã số báo giá:</div>
            <div className="text-xs font-bold font-mono text-slate-800">{quoteNumber}</div>
            <div className="text-[11px] text-slate-500 mt-1">{dateString}</div>
          </div>
        </div>

        {/* Tiêu đề Báo giá */}
        <div className="text-center my-6">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide m-0">
            BẢNG BÁO GIÁ THI CÔNG BẢNG HIỆU QUẢNG CÁO
          </h2>
          <span className="text-xs text-slate-500 italic block mt-1">
            (Hiệu lực báo giá: 15 ngày kể từ ngày lập)
          </span>
        </div>

        {/* Thông tin Khách hàng */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-slate-500 font-medium w-24 shrink-0">Kính gửi:</span>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="!text-xs !font-bold !bg-white !border-slate-200 print:!border-none print:!bg-transparent print:!p-0"
                placeholder="Nhập tên khách hàng / đơn vị"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium w-24 shrink-0">Số điện thoại:</span>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="!text-xs !bg-white !border-slate-200 print:!border-none print:!bg-transparent print:!p-0"
                placeholder="Số điện thoại liên hệ"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-slate-500 font-medium w-28 shrink-0">Địa điểm thi công:</span>
              <Input
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                className="!text-xs !bg-white !border-slate-200 print:!border-none print:!bg-transparent print:!p-0"
                placeholder="Địa chỉ công trình lắp đặt"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium w-28 shrink-0">Quy cách bảng:</span>
              <span className="font-bold text-slate-800">
                {dimensions.width}m (Dài) x {dimensions.height}m (Cao) = {dimensions.area} m²
              </span>
            </div>
          </div>
        </div>

        {/* Bảng chi tiết báo giá */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-cyan-50 text-slate-800 border-b border-slate-300">
                <th className="p-2.5 border border-slate-300 text-center w-10">STT</th>
                <th className="p-2.5 border border-slate-300 font-bold">Nội dung công việc & Quy cách vật tư</th>
                <th className="p-2.5 border border-slate-300 text-center w-16">ĐVT</th>
                <th className="p-2.5 border border-slate-300 text-center w-20">Khối lượng</th>
                <th className="p-2.5 border border-slate-300 text-right w-28">Đơn giá (VNĐ)</th>
                <th className="p-2.5 border border-slate-300 text-right w-32 font-bold">Thành tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2.5 border border-slate-300 text-center font-medium">1</td>
                <td className="p-2.5 border border-slate-300">
                  <div className="font-bold text-slate-900">
                    Sản xuất & Lắp đặt Bảng hiệu quảng cáo trọn gói
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <div>• Kích thước hoàn thiện: <b>{dimensions.width}m x {dimensions.height}m</b> (Diện tích: <b>{dimensions.area} m²</b>, Chu vi: {dimensions.perimeter}m).</div>
                    <div>• Chất liệu mặt: <b>{materials.surface.name}</b>.</div>
                    <div>• Kết cấu khung: <b>{materials.iron_frame.name}</b>, đan xương ô vuông chịu lực.</div>
                    <div>• Tôn lót mặt sau: <b>{materials.sheet_backing.active ? "Có lót tôn chống rách mặt sau" : "Không lót tôn"}</b>.</div>
                    <div>• Nẹp viền: <b>{materials.aluminum_trim.name}</b> bao quanh mặt bảng.</div>
                    {materials.reinforce_iron.active && (
                      <div>• Chân chống gia cố: <b>{materials.reinforce_iron.name} ({materials.reinforce_iron.detail})</b>.</div>
                    )}
                    <div>• Vật tư phụ: Vít nở, keo silicone, que hàn, phụ kiện gia cố trọn gói.</div>
                  </div>
                </td>
                <td className="p-2.5 border border-slate-300 text-center">m²</td>
                <td className="p-2.5 border border-slate-300 text-center font-bold">{dimensions.area}</td>
                <td className="p-2.5 border border-slate-300 text-right">{formatVND(summary.price_per_sqm)}</td>
                <td className="p-2.5 border border-slate-300 text-right font-bold text-slate-900">
                  {formatVND(summary.quote_price)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold border-t border-slate-300">
                <td colSpan={5} className="p-2.5 border border-slate-300 text-right">
                  Tổng giá trị trước thuế:
                </td>
                <td className="p-2.5 border border-slate-300 text-right font-bold text-slate-900">
                  {formatVND(subTotal)}
                </td>
              </tr>
              {vatRate > 0 && (
                <tr className="bg-slate-50 font-semibold border-t border-slate-300">
                  <td colSpan={5} className="p-2.5 border border-slate-300 text-right">
                    Thuế giá trị gia tăng (VAT {vatRate}%):
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right font-bold text-slate-900">
                    {formatVND(vatAmount)}
                  </td>
                </tr>
              )}
              <tr className="bg-cyan-50/70 font-black text-sm border-t-2 border-slate-400">
                <td colSpan={5} className="p-3 border border-slate-300 text-right uppercase text-slate-900">
                  TỔNG CỘNG THANH TOÁN:
                </td>
                <td className="p-3 border border-slate-300 text-right text-cyan-800 text-base">
                  {formatVND(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Điều khoản & Cam kết bảo hành */}
        <div className="border border-slate-200 rounded-xl p-4 text-[11px] leading-relaxed text-slate-600 mb-8 bg-slate-50/50">
          <div className="font-bold text-slate-800 uppercase mb-1 flex items-center gap-1">
            <CheckCircleOutlined className="text-cyan-600" /> Điều khoản thi công & Cam kết bảo hành:
          </div>
          <ul className="list-disc pl-4 space-y-0.5 m-0">
            <li>Đơn giá đã bao gồm toàn bộ nhân công thi công, xe vận chuyển và lắp đặt hoàn thiện tại công trình.</li>
            <li>Tiến độ thi công: Từ 02 - 04 ngày làm việc kể từ ngày chốt ma-két và nhận tạm ứng.</li>
            <li>Bảo hành kết cấu khung sắt và mặt biển trong vòng <b>12 tháng</b> kể từ ngày bàn giao nghiệm thu.</li>
            {warnings && warnings.filter(w => w.level === "danger").map((w, idx) => (
              <li key={idx} className="text-rose-700 font-bold">
                ⚠️ {w.message}
              </li>
            ))}
          </ul>
        </div>

        {/* Chữ ký hai bên */}
        <div className="grid grid-cols-2 text-center text-xs mt-6 pt-4 border-t border-slate-200">
          <div>
            <div className="font-bold text-slate-800 uppercase">ĐẠI DIỆN KHÁCH HÀNG</div>
            <div className="text-[11px] text-slate-400 italic mb-16">(Ký và ghi rõ họ tên)</div>
          </div>
          <div>
            <div className="font-bold text-slate-800 uppercase">ĐẠI DIỆN {COMPANY_INFO.name}</div>
            <div className="text-[11px] text-slate-400 italic mb-16">(Ký tên, đóng dấu)</div>
            <div className="font-bold text-slate-800 uppercase">{COMPANY_INFO.brand}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
