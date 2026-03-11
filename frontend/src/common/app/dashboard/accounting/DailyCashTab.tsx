import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { AutoComplete, Modal, notification } from "antd";
import dayjs from "dayjs";
import { useUser } from "../../../common/hooks/useUser";
import { AccountingService, type AccountingMetadata, type DailyCashRow } from "../../../services/accounting.service";

type CashFormState = {
  txn_date: string;
  voucher_no: string;
  direction: "income" | "expense";
  amount: number;
  description: string;
  counterparty_name: string;
  material_name: string;
  unit: string;
  quantity: number;
  status: string;
  payment_method: string;
  doc_ref: string;
  note: string;
};

const DEFAULT_CASH_STATUS = ["draft", "pending", "approved", "paid", "cancelled"];
const DEFAULT_PAYMENT_METHODS = ["cash", "bank_transfer", "card", "other"];

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
  other: "Khác",
};

const emptyForm = (): CashFormState => ({
  txn_date: dayjs().format("YYYY-MM-DD"),
  voucher_no: "",
  direction: "expense",
  amount: 0,
  description: "",
  counterparty_name: "",
  material_name: "",
  unit: "",
  quantity: 0,
  status: "draft",
  payment_method: "cash",
  doc_ref: "",
  note: "",
});

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  });

export default function DailyCashTab() {
  const { userLeadId, userId } = useUser();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [rows, setRows] = useState<DailyCashRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<DailyCashRow | null>(null);
  const [form, setForm] = useState<CashFormState>(emptyForm());
  const [materialOptions, setMaterialOptions] = useState<{ value: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>(DEFAULT_CASH_STATUS);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<string[]>(DEFAULT_PAYMENT_METHODS);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [summary, setSummary] = useState({
    income_total: 0,
    expense_total: 0,
    net_total: 0,
  });
  const deferredKeyword = useDeferredValue(keyword);

  const fromDate = useMemo(() => dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"), [month]);
  const toDate = useMemo(() => dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"), [month]);

  const fetchMetadata = async () => {
    try {
      const res = await AccountingService.getMetadata();
      const data = (res.data || {}) as AccountingMetadata;
      if (Array.isArray(data.cash_status) && data.cash_status.length) {
        setStatusOptions(data.cash_status);
      }
      if (Array.isArray(data.payment_methods) && data.payment_methods.length) {
        setPaymentMethodOptions(data.payment_methods);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRows = async () => {
    if (!userLeadId) return;
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        lead: userLeadId,
        from_date: fromDate,
        to_date: toDate,
        page: 1,
        limit: 300,
      };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterDirection !== "all") params.direction = filterDirection;
      if (filterPaymentMethod !== "all") params.payment_method = filterPaymentMethod;
      if (deferredKeyword.trim()) params.search = deferredKeyword.trim();

      const res = await AccountingService.getDailyCash(params);
      setRows((res.data?.data || []) as DailyCashRow[]);
      setSummary(
        res.data?.summary || {
          income_total: 0,
          expense_total: 0,
          net_total: 0,
        }
      );
    } catch (error) {
      console.error(error);
      notification.error({ message: "Không tải được danh sách thu chi" });
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
    fetchRows();
  }, [userLeadId, fromDate, toDate, filterStatus, filterDirection, filterPaymentMethod, deferredKeyword]);

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpenModal(true);
  };

  const openEditModal = (row: DailyCashRow) => {
    setEditing(row);
    setForm({
      txn_date: row.txn_date ? dayjs(row.txn_date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      voucher_no: row.voucher_no || "",
      direction: row.direction || "expense",
      amount: Number(row.amount || 0),
      description: row.description || "",
      counterparty_name: row.counterparty_name || "",
      material_name: row.material_name || "",
      unit: row.unit || "",
      quantity: Number(row.quantity || 0),
      status: row.status || "draft",
      payment_method: row.payment_method || "cash",
      doc_ref: row.doc_ref || "",
      note: row.note || "",
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!userLeadId) return;
    if (!form.txn_date || Number(form.amount || 0) <= 0) {
      notification.warning({ message: "Vui lòng nhập ngày và số tiền hợp lệ" });
      return;
    }
    const payload = {
      lead_id: userLeadId,
      user_id: userId || null,
      txn_date: form.txn_date,
      voucher_no: form.voucher_no.trim() || undefined,
      direction: form.direction,
      amount: Number(form.amount || 0),
      description: form.description.trim(),
      counterparty_name: form.counterparty_name.trim(),
      material_name: form.material_name.trim(),
      unit: form.unit.trim(),
      quantity: Number(form.quantity || 0),
      status: form.status,
      payment_method: form.payment_method,
      doc_ref: form.doc_ref.trim(),
      note: form.note.trim(),
    };

    try {
      if (editing?.id) {
        await AccountingService.updateDailyCash(editing.id, payload);
        notification.success({ message: "Đã cập nhật thu chi" });
      } else {
        await AccountingService.createDailyCash(payload);
        notification.success({ message: "Đã thêm thu chi" });
      }
      setOpenModal(false);
      await fetchRows();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.description || "Không lưu được thu chi";
      notification.error({ message: msg });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await AccountingService.deleteDailyCash(id);
      notification.success({ message: "Đã xóa dữ liệu" });
      await fetchRows();
    } catch (error) {
      console.error(error);
      notification.error({ message: "Không xóa được dữ liệu" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-slate-500">
        Quản lý thu chi theo ngày với mã phiếu, đối tác, phương thức thanh toán và đối chiếu chứng từ.
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
          <span>Loại</span>
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">Tất cả</option>
            <option value="income">Thu</option>
            <option value="expense">Chi</option>
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
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status] || status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Thanh toán</span>
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">Tất cả</option>
            {paymentMethodOptions.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABEL[method] || method}
              </option>
            ))}
          </select>
        </div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm mã phiếu, đối tác, nội dung, vật tư..."
          className="border border-slate-200 rounded-lg px-3 py-2 bg-white min-w-[280px]"
        />
        <button
          type="button"
          onClick={openCreateModal}
          className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold"
        >
          + Thêm phiếu thu chi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs text-emerald-700">Tổng thu</div>
          <div className="text-sm font-semibold text-emerald-700">{formatMoney(summary.income_total)} đ</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          <div className="text-xs text-rose-700">Tổng chi</div>
          <div className="text-sm font-semibold text-rose-700">{formatMoney(summary.expense_total)} đ</div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
          <div className="text-xs text-teal-700">Dòng tiền thuần</div>
          <div className="text-sm font-semibold text-teal-700">{formatMoney(summary.net_total)} đ</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="text-slate-500 text-xs border-b bg-slate-50">
              <th className="py-3 px-3">Mã phiếu</th>
              <th className="py-3 px-3">Ngày</th>
              <th className="py-3 px-3">Loại</th>
              <th className="py-3 px-3">Số tiền</th>
              <th className="py-3 px-3">Đối tác</th>
              <th className="py-3 px-3">Nội dung</th>
              <th className="py-3 px-3">Vật tư</th>
              <th className="py-3 px-3">PT thanh toán</th>
              <th className="py-3 px-3">Ref chứng từ</th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-8 px-3 text-center text-slate-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 px-3 text-center text-slate-500">
                  Chưa có dữ liệu thu chi.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-slate-700 font-medium">{row.voucher_no || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{dayjs(row.txn_date).format("DD/MM/YYYY")}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        row.direction === "income"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {row.direction === "income" ? "Thu" : "Chi"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-semibold">{formatMoney(row.amount)} đ</td>
                  <td className="py-3 px-3 text-slate-600">{row.counterparty_name || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.description || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{row.material_name || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">
                    {PAYMENT_METHOD_LABEL[row.payment_method || ""] || row.payment_method || "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{row.doc_ref || "-"}</td>
                  <td className="py-3 px-3 text-slate-600">{STATUS_LABEL[row.status || ""] || row.status || "-"}</td>
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
        title={editing ? "Cập nhật phiếu thu chi" : "Tạo phiếu thu chi mới"}
        open={openModal}
        onOk={handleSave}
        onCancel={() => setOpenModal(false)}
        okText={editing ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        width={760}
      >
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">
              Mã phiếu (để trống để tự sinh)
              <input
                value={form.voucher_no}
                onChange={(e) => setForm((prev) => ({ ...prev, voucher_no: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Ngày
              <input
                type="date"
                value={form.txn_date}
                onChange={(e) => setForm((prev) => ({ ...prev, txn_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">
              Loại
              <select
                value={form.direction}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    direction: e.target.value as "income" | "expense",
                  }))
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
              >
                <option value="income">Thu</option>
                <option value="expense">Chi</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Số tiền
              <input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">
              Đối tác
              <input
                value={form.counterparty_name}
                onChange={(e) => setForm((prev) => ({ ...prev, counterparty_name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Ref chứng từ
              <input
                value={form.doc_ref}
                onChange={(e) => setForm((prev) => ({ ...prev, doc_ref: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
              />
            </label>
          </div>

          <label className="text-sm text-slate-600">
            Nội dung
            <input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">
              Vật tư
              <AutoComplete
                value={form.material_name}
                options={materialOptions}
                onSearch={fetchMaterialSuggest}
                onChange={(value) => setForm((prev) => ({ ...prev, material_name: value }))}
                placeholder="Gõ tên vật tư để gợi ý: ván, alu, mica..."
                className="w-full mt-1"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm text-slate-600">
                Số lượng
                <input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value || 0) }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                />
              </label>
              <label className="text-sm text-slate-600">
                Đơn vị
                <input
                  value={form.unit}
                  onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">
              Phương thức thanh toán
              <select
                value={form.payment_method}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
              >
                {paymentMethodOptions.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m] || m}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Trạng thái
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-white"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status] || status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm text-slate-600">
            Ghi chú
            <textarea
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 min-h-[80px]"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
