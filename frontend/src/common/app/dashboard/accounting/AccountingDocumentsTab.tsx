import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { AutoComplete, Modal, notification } from "antd";
import dayjs from "dayjs";
import { useApiStatic } from "../../../common/hooks/useApiHost";
import { useUser } from "../../../common/hooks/useUser";
import {
  AccountingService,
  type AccountingDocumentRow,
  type AccountingMetadata,
} from "../../../services/accounting.service";

type Attachment = { filename?: string; file_url?: string; thumb_url?: string };

type DocumentFormState = {
  doc_no: string;
  doc_type: string;
  doc_date: string;
  signed_date: string;
  due_date: string;
  partner_name: string;
  project_name: string;
  material_name: string;
  subtotal_amount: number;
  tax_amount: number;
  amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  currency: string;
  content: string;
  attachments: Attachment[];
};

const DOC_TYPE_LABEL: Record<string, string> = {
  BANG_BAO_GIA: "Bảng báo giá",
  HOP_DONG_KINH_TE: "Hợp đồng kinh tế",
  BB_TAM_UNG: "Biên bản tạm ứng",
  BB_NGHIEM_THU: "Biên bản nghiệm thu",
  DE_NGHI_THANH_TOAN: "Đề nghị thanh toán",
  THANH_LY_HOP_DONG: "Thanh lý hợp đồng",
  HOA_DON: "Hóa đơn",
  MAKET_DINH_KEM: "Maket đính kèm",
};

const DOC_STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  issued: "Đã phát hành",
  archived: "Lưu trữ",
  cancelled: "Đã hủy",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  partial: "Thanh toán một phần",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  cancelled: "Hủy thanh toán",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
  other: "Khác",
};

const emptyForm = (): DocumentFormState => ({
  doc_no: "",
  doc_type: "BANG_BAO_GIA",
  doc_date: dayjs().format("YYYY-MM-DD"),
  signed_date: "",
  due_date: "",
  partner_name: "",
  project_name: "",
  material_name: "",
  subtotal_amount: 0,
  tax_amount: 0,
  amount: 0,
  status: "draft",
  payment_status: "unpaid",
  payment_method: "cash",
  currency: "VND",
  content: "",
  attachments: [],
});

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

export default function AccountingDocumentsTab() {
  const { userLeadId } = useUser();
  const apiStatic = useApiStatic();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [rows, setRows] = useState<AccountingDocumentRow[]>([]);
  const [docTypes, setDocTypes] = useState<string[]>(Object.keys(DOC_TYPE_LABEL));
  const [docStatuses, setDocStatuses] = useState<string[]>(["draft", "pending", "approved", "issued", "archived"]);
  const [paymentStatuses, setPaymentStatuses] = useState<string[]>(["unpaid", "partial", "paid", "overdue"]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["cash", "bank_transfer", "card", "other"]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDocType, setFilterDocType] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<AccountingDocumentRow | null>(null);
  const [form, setForm] = useState<DocumentFormState>(emptyForm());
  const [materialOptions, setMaterialOptions] = useState<{ value: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState({
    total_amount: 0,
    by_status: [] as { status: string; amount: number }[],
  });
  const deferredKeyword = useDeferredValue(keyword);

  const fromDate = useMemo(() => dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"), [month]);
  const toDate = useMemo(() => dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"), [month]);

  const fetchMetadata = async () => {
    try {
      const res = await AccountingService.getMetadata();
      const data = (res.data || {}) as AccountingMetadata;
      if (Array.isArray(data.document_types) && data.document_types.length) setDocTypes(data.document_types);
      if (Array.isArray(data.document_status) && data.document_status.length) setDocStatuses(data.document_status);
      if (Array.isArray(data.payment_status) && data.payment_status.length) setPaymentStatuses(data.payment_status);
      if (Array.isArray(data.payment_methods) && data.payment_methods.length) setPaymentMethods(data.payment_methods);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDocuments = async () => {
    if (!userLeadId) return;
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        lead: userLeadId,
        from_date: fromDate,
        to_date: toDate,
        page: 1,
        limit: 400,
      };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterDocType !== "all") params.doc_type = filterDocType;
      if (filterPaymentStatus !== "all") params.payment_status = filterPaymentStatus;
      if (deferredKeyword.trim()) params.search = deferredKeyword.trim();

      const res = await AccountingService.getDocuments(params);
      setRows((res.data?.data || []) as AccountingDocumentRow[]);
      setSummary(
        res.data?.summary || {
          total_amount: 0,
          by_status: [],
        }
      );
    } catch (error) {
      console.error(error);
      notification.error({ message: "Không tải được chứng từ" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterialSuggest = async (q: string) => {
    if (!userLeadId) return;
    try {
      const res = await AccountingService.getMaterialSuggest({
        lead: userLeadId,
        q,
        limit: 12,
      });
      setMaterialOptions((res.data?.data || []) as { value: string }[]);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [userLeadId, fromDate, toDate, filterStatus, filterDocType, filterPaymentStatus, deferredKeyword]);

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpenModal(true);
  };

  const openEditModal = (row: AccountingDocumentRow) => {
    setEditing(row);
    setForm({
      doc_no: row.doc_no || "",
      doc_type: row.doc_type || "BANG_BAO_GIA",
      doc_date: row.doc_date ? dayjs(row.doc_date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      signed_date: row.signed_date ? dayjs(row.signed_date).format("YYYY-MM-DD") : "",
      due_date: row.due_date ? dayjs(row.due_date).format("YYYY-MM-DD") : "",
      partner_name: row.partner_name || "",
      project_name: row.project_name || "",
      material_name: row.material_name || "",
      subtotal_amount: Number(row.subtotal_amount || 0),
      tax_amount: Number(row.tax_amount || 0),
      amount: Number(row.amount || 0),
      status: row.status || "draft",
      payment_status: row.payment_status || "unpaid",
      payment_method: row.payment_method || "cash",
      currency: row.currency || "VND",
      content: row.content || "",
      attachments: (row.attachments || []) as Attachment[],
    });
    setOpenModal(true);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await AccountingService.uploadAttachment(fd);
        uploaded.push(res.data || {});
      }
      setForm((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...uploaded],
      }));
      notification.success({ message: `Đã tải lên ${uploaded.length} tệp` });
    } catch (error) {
      console.error(error);
      notification.error({ message: "Không upload được tệp" });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async () => {
    if (!userLeadId) return;
    if (!form.doc_type || !form.doc_date) {
      notification.warning({ message: "Vui lòng nhập loại và ngày chứng từ" });
      return;
    }
    const totalAmount = Number(form.amount || form.subtotal_amount + form.tax_amount || 0);
    const payload = {
      lead_id: userLeadId,
      doc_no: form.doc_no.trim() || undefined,
      doc_type: form.doc_type,
      doc_date: form.doc_date,
      signed_date: form.signed_date || null,
      due_date: form.due_date || null,
      partner_name: form.partner_name.trim(),
      project_name: form.project_name.trim(),
      material_name: form.material_name.trim(),
      subtotal_amount: Number(form.subtotal_amount || 0),
      tax_amount: Number(form.tax_amount || 0),
      amount: totalAmount,
      status: form.status,
      payment_status: form.payment_status,
      payment_method: form.payment_method,
      currency: form.currency.trim() || "VND",
      content: form.content.trim(),
      attachments: form.attachments || [],
    };

    try {
      if (editing?.id) {
        await AccountingService.updateDocument(editing.id, payload);
        notification.success({ message: "Đã cập nhật chứng từ" });
      } else {
        await AccountingService.createDocument(payload);
        notification.success({ message: "Đã thêm chứng từ" });
      }
      setOpenModal(false);
      await fetchDocuments();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.description || "Không lưu được chứng từ";
      notification.error({ message: msg });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await AccountingService.deleteDocument(id);
      notification.success({ message: "Đã xóa chứng từ" });
      await fetchDocuments();
    } catch (error) {
      console.error(error);
      notification.error({ message: "Không xóa được chứng từ" });
    }
  };

  const resolveFileLink = (fileUrl?: string) => {
    if (!fileUrl) return "#";
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
    const base = (apiStatic || "").replace(/\/+$/, "");
    if (!base) return `/static/${fileUrl}`;
    return `${base}/${fileUrl}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-slate-500">
        Quản lý kho chứng từ kế toán theo chuẩn: số chứng từ, trạng thái duyệt, trạng thái thanh toán và tệp lưu trữ.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Tháng</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Loại chứng từ</span>
          <select
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">Tất cả</option>
            {docTypes.map((type) => (
              <option key={type} value={type}>
                {DOC_TYPE_LABEL[type] || type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Trạng thái</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">Tất cả</option>
            {docStatuses.map((status) => (
              <option key={status} value={status}>
                {DOC_STATUS_LABEL[status] || status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>TT thanh toán</span>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">Tất cả</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_LABEL[status] || status}
              </option>
            ))}
          </select>
        </div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm số CT, đối tác, công trình, vật tư..."
          className="border border-slate-200 rounded-lg px-3 py-2 bg-white min-w-[300px]"
        />
        <button
          type="button"
          onClick={openCreateModal}
          className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold"
        >
          + Thêm chứng từ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
          <div className="text-xs text-teal-700">Tổng giá trị chứng từ</div>
          <div className="text-sm font-semibold text-teal-700">{formatMoney(summary.total_amount)} đ</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500 mb-1">Theo trạng thái</div>
          <div className="flex flex-wrap gap-2">
            {(summary.by_status || []).map((item) => (
              <span key={item.status} className="px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-600">
                {(DOC_STATUS_LABEL[item.status] || item.status) + ": " + formatMoney(item.amount) + " đ"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="text-slate-500 text-xs border-b bg-slate-50">
              <th className="py-3 px-3">Số CT</th>
              <th className="py-3 px-3">Loại</th>
              <th className="py-3 px-3">Ngày CT</th>
              <th className="py-3 px-3">Đối tác</th>
              <th className="py-3 px-3">Công trình</th>
              <th className="py-3 px-3">Vật tư</th>
              <th className="py-3 px-3">Tạm tính</th>
              <th className="py-3 px-3">Thuế</th>
              <th className="py-3 px-3">Tổng tiền</th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 px-3">TT thanh toán</th>
              <th className="py-3 px-3">PT thanh toán</th>
              <th className="py-3 px-3">Tệp</th>
              <th className="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={14} className="py-8 px-3 text-center text-slate-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 px-3 text-center text-slate-500">
                  Chưa có chứng từ.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-slate-700 font-medium">{row.doc_no || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{DOC_TYPE_LABEL[row.doc_type] || row.doc_type}</td>
                  <td className="py-3 px-3 text-slate-600">{dayjs(row.doc_date).format("DD/MM/YYYY")}</td>
                  <td className="py-3 px-3 text-slate-600">{row.partner_name || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.project_name || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.material_name || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{formatMoney(Number(row.subtotal_amount || 0))} đ</td>
                  <td className="py-3 px-3 text-slate-600">{formatMoney(Number(row.tax_amount || 0))} đ</td>
                  <td className="py-3 px-3 text-slate-700 font-semibold">{formatMoney(Number(row.amount || 0))} đ</td>
                  <td className="py-3 px-3 text-slate-600">{DOC_STATUS_LABEL[row.status || ""] || row.status || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">
                    {PAYMENT_STATUS_LABEL[row.payment_status || ""] || row.payment_status || "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {PAYMENT_METHOD_LABEL[row.payment_method || ""] || row.payment_method || "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{(row.attachments || []).length}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Sửa"
                        aria-label="Sửa"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        onClick={() => openEditModal(row)}
                      >
                        <EditOutlined />
                      </button>
                      <button
                        type="button"
                        title="Xóa"
                        aria-label="Xóa"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                        onClick={() => handleDelete(row.id)}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? "Cập nhật chứng từ" : "Tạo chứng từ mới"}
        open={openModal}
        onOk={handleSave}
        onCancel={() => setOpenModal(false)}
        okText={editing ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        width={860}
      >
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">
              Số chứng từ (để trống để tự sinh)
              <input
                value={form.doc_no}
                onChange={(e) => setForm((prev) => ({ ...prev, doc_no: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Loại chứng từ
              <select
                value={form.doc_type}
                onChange={(e) => setForm((prev) => ({ ...prev, doc_type: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
              >
                {docTypes.map((type) => (
                  <option key={type} value={type}>
                    {DOC_TYPE_LABEL[type] || type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="text-sm text-slate-600">
              Ngày chứng từ
              <input
                type="date"
                value={form.doc_date}
                onChange={(e) => setForm((prev) => ({ ...prev, doc_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Ngày ký
              <input
                type="date"
                value={form.signed_date}
                onChange={(e) => setForm((prev) => ({ ...prev, signed_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Hạn thanh toán
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">
              Đối tác
              <input
                value={form.partner_name}
                onChange={(e) => setForm((prev) => ({ ...prev, partner_name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Công trình
              <input
                value={form.project_name}
                onChange={(e) => setForm((prev) => ({ ...prev, project_name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
          </div>

          <label className="text-sm text-slate-600">
            Vật tư
            <AutoComplete
              value={form.material_name}
              options={materialOptions}
              onSearch={fetchMaterialSuggest}
              onChange={(value) => setForm((prev) => ({ ...prev, material_name: value }))}
              placeholder="Gõ để gợi ý: ván, alu, mica..."
              className="w-full mt-1"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <label className="text-sm text-slate-600">
              Tạm tính
              <input
                type="number"
                min={0}
                value={form.subtotal_amount}
                onChange={(e) => setForm((prev) => ({ ...prev, subtotal_amount: Number(e.target.value || 0) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Thuế
              <input
                type="number"
                min={0}
                value={form.tax_amount}
                onChange={(e) => setForm((prev) => ({ ...prev, tax_amount: Number(e.target.value || 0) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Tổng tiền
              <input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Tiền tệ
              <input
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="text-sm text-slate-600">
              Trạng thái chứng từ
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
              >
                {docStatuses.map((status) => (
                  <option key={status} value={status}>
                    {DOC_STATUS_LABEL[status] || status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Trạng thái thanh toán
              <select
                value={form.payment_status}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
              >
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABEL[status] || status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Phương thức thanh toán
              <select
                value={form.payment_method}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABEL[method] || method}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm text-slate-600">
            Nội dung
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 min-h-[100px]"
            />
          </label>

          <div className="text-sm text-slate-600">
            Tệp đính kèm
            <div className="mt-1 flex items-center gap-2">
              <input
                type="file"
                multiple
                onChange={(e) => handleUploadFiles(e.target.files)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
              <span className="text-xs text-slate-500">{uploading ? "Đang upload..." : ""}</span>
            </div>
          </div>

          {(form.attachments || []).length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-2">Danh sách tệp</div>
              <div className="flex flex-col gap-2">
                {form.attachments.map((file, index) => (
                  <div key={`${file.file_url || file.filename || "file"}-${index}`} className="flex items-center justify-between gap-2">
                    <a
                      href={resolveFileLink(file.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-teal-600 underline truncate"
                    >
                      {file.filename || file.file_url || `File ${index + 1}`}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="px-2 py-1 text-xs rounded-md border border-rose-200 text-rose-600"
                    >
                      Bỏ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
