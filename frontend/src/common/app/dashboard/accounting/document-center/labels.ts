export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  QUOTE: "Báo giá",
  CONTRACT: "Hợp đồng khác",
  CONTRACT_LABOR: "Hợp đồng lao động",
  CONTRACT_ECONOMIC: "Hợp đồng kinh tế",
  CONTRACT_COOPERATION: "Hợp đồng hợp tác",
  CONTRACT_APPENDIX: "Phụ lục hợp đồng",
  ADVANCE_REQUEST: "Đề nghị tạm ứng",
  ADVANCE_PAYMENT: "Phiếu chi tạm ứng",
  ADVANCE_SETTLEMENT: "Quyết toán tạm ứng",
  ACCEPTANCE: "Biên bản nghiệm thu",
  HANDOVER: "Biên bản bàn giao",
  PAYMENT_REQUEST: "Đề nghị thanh toán",
  RECEIPT: "Phiếu thu",
  PAYMENT: "Phiếu chi",
  INVOICE_IN: "Hóa đơn đầu vào",
  INVOICE_OUT: "Hóa đơn đầu ra",
  LIQUIDATION: "Thanh lý",
  PURCHASE_ORDER: "Đơn mua hàng",
  DELIVERY_NOTE: "Phiếu giao hàng",
  OTHER: "Khác",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  submitted: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã thanh toán",
  invoiced: "Đã xuất hóa đơn",
  closed: "Đã đóng",
  cancelled: "Đã hủy",
};

export const DOCUMENT_STATUS_STYLES: Record<string, string> = {
  draft: "border-slate-200 text-slate-600 bg-white",
  submitted: "border-amber-200 text-amber-700 bg-amber-50",
  approved: "border-emerald-200 text-emerald-700 bg-emerald-50",
  paid: "border-cyan-200 text-cyan-700 bg-cyan-50",
  invoiced: "border-blue-200 text-blue-700 bg-blue-50",
  closed: "border-slate-300 text-slate-700 bg-slate-100",
  cancelled: "border-rose-200 text-rose-700 bg-rose-50",
};

export const DOCUMENT_TYPE_GROUPS = [
  {
    label: "Hợp đồng",
    options: ["CONTRACT_LABOR", "CONTRACT_ECONOMIC", "CONTRACT_COOPERATION", "CONTRACT"],
  },
];

export function getDocumentTypeLabel(type?: string | null) {
  if (!type) return "-";
  return DOCUMENT_TYPE_LABELS[type] || type;
}

export function getDocumentStatusLabel(status?: string | null) {
  if (!status) return "-";
  return DOCUMENT_STATUS_LABELS[status] || status;
}
