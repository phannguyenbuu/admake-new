import type { IPage } from "../../../@types/common.type";
import React, { useMemo, useState } from "react";
import { Modal } from "antd";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteConfirm from "../../../components/DeleteConfirm";
import PayrollSummaryTab from "./PayrollSummaryTab";

const tabs = [
  { key: "bang-luong", label: "Bảng lương nhân sự" },
  { key: "tai-khoan", label: "Tài khoản kế toán" },
  { key: "chung-tu", label: "Chứng từ kế toán" },
  { key: "quy-tac", label: "Quy tắc chỉnh sửa & Kiểm soát dữ liệu" },
  { key: "kiem-tra", label: "Báo cáo kiểm tra" },
  { key: "tong-quan", label: "Thống kê tổng quan" },
];

type ManualRow = {
  id: number;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  status: string;
};

type ColumnConfig = {
  key: keyof Omit<ManualRow, "id">;
  label: string;
};

type ManualTabConfig = {
  key: string;
  title: string;
  addLabel: string;
  description: string;
  columns: ColumnConfig[];
};

const tabConfigs: Record<string, ManualTabConfig> = {
  "tai-khoan": {
    key: "tai-khoan",
    title: "Danh sách tài khoản kế toán",
    addLabel: "+ Thêm tài khoản",
    description: "Nhập liệu thủ công danh mục tài khoản và trạng thái sử dụng.",
    columns: [
      { key: "col1", label: "Mã/Tên tài khoản" },
      { key: "col2", label: "Phân loại" },
      { key: "col3", label: "Theo dõi chi tiết" },
      { key: "col4", label: "Ghi chú" },
      { key: "status", label: "Trạng thái" },
    ],
  },
  "chung-tu": {
    key: "chung-tu",
    title: "Danh sách chứng từ kế toán",
    addLabel: "+ Thêm chứng từ",
    description: "Nhập tay các chứng từ, số tiền và trạng thái xử lý.",
    columns: [
      { key: "col1", label: "Mã chứng từ" },
      { key: "col2", label: "Loại chứng từ" },
      { key: "col3", label: "Ngày chứng từ" },
      { key: "col4", label: "Số tiền / nội dung" },
      { key: "status", label: "Trạng thái" },
    ],
  },
  "quy-tac": {
    key: "quy-tac",
    title: "Danh sách quy tắc kiểm soát",
    addLabel: "+ Thêm quy tắc",
    description: "Quản lý các quy tắc kiểm soát dữ liệu nhập liệu thủ công.",
    columns: [
      { key: "col1", label: "Mã quy tắc" },
      { key: "col2", label: "Nhóm quy tắc" },
      { key: "col3", label: "Nội dung quy tắc" },
      { key: "col4", label: "Giá trị kiểm soát" },
      { key: "status", label: "Trạng thái" },
    ],
  },
  "kiem-tra": {
    key: "kiem-tra",
    title: "Danh sách lỗi cần kiểm tra",
    addLabel: "+ Thêm lỗi kiểm tra",
    description: "Ghi nhận lỗi nhập liệu và hướng xử lý theo từng kỳ.",
    columns: [
      { key: "col1", label: "Ngày ghi sổ" },
      { key: "col2", label: "Đối tượng" },
      { key: "col3", label: "Sổ/Báo cáo" },
      { key: "col4", label: "Mô tả lỗi / hướng xử lý" },
      { key: "status", label: "Trạng thái" },
    ],
  },
  "tong-quan": {
    key: "tong-quan",
    title: "Danh sách chỉ tiêu tổng quan",
    addLabel: "+ Thêm chỉ tiêu",
    description: "Nhập thủ công các chỉ tiêu để theo dõi tổng quan kế toán.",
    columns: [
      { key: "col1", label: "Tên chỉ tiêu" },
      { key: "col2", label: "Nhóm chỉ tiêu" },
      { key: "col3", label: "Kỳ áp dụng" },
      { key: "col4", label: "Giá trị" },
      { key: "status", label: "Trạng thái" },
    ],
  },
};

const initialDataMap: Record<string, ManualRow[]> = {
  "tai-khoan": [
    { id: 1, col1: "1111 - Tiền mặt", col2: "Tài sản", col3: "Kho", col4: "Tài khoản con", status: "Active" },
    { id: 2, col1: "1121 - Tiền gửi ngân hàng", col2: "Tài sản", col3: "Ngân hàng", col4: "Theo dõi phát sinh", status: "Active" },
  ],
  "chung-tu": [
    { id: 1, col1: "CT0001", col2: "Chi", col3: "01/02/2026", col4: "10.000.000 đ", status: "Draft" },
    { id: 2, col1: "CT0002", col2: "Thu", col3: "02/02/2026", col4: "6.200.000 đ", status: "Posted" },
  ],
  "quy-tac": [
    { id: 1, col1: "RULE-01", col2: "Sửa dữ liệu", col3: "Không cho sửa chứng từ đã khóa", col4: "Mức khóa: theo tháng", status: "Bật" },
    { id: 2, col1: "RULE-02", col2: "Nhập liệu", col3: "Không cho tổng Nợ/Có lệch", col4: "Sai lệch cho phép: 0", status: "Bật" },
  ],
  "kiem-tra": [
    { id: 1, col1: "19/02/2026", col2: "Công ty ABC", col3: "Sổ nhật ký chung", col4: "Thiếu tài khoản đối ứng", status: "Chưa xử lý" },
    { id: 2, col1: "20/02/2026", col2: "Kho vật tư", col3: "Báo cáo tồn kho", col4: "Tồn kho âm cần đối chiếu", status: "Đang xử lý" },
  ],
  "tong-quan": [
    { id: 1, col1: "Tổng phát sinh Nợ", col2: "Phát sinh", col3: "02/2026", col4: "8.500.000.000 đ", status: "Đã chốt" },
    { id: 2, col1: "Tổng phải thu", col2: "Công nợ", col3: "02/2026", col4: "2.100.000.000 đ", status: "Theo dõi" },
  ],
};

type ManualTabTableProps = {
  config: ManualTabConfig;
  rows: ManualRow[];
  onRowsChange: React.Dispatch<React.SetStateAction<ManualRow[]>>;
};

const ManualTabTable: React.FC<ManualTabTableProps> = ({ config, rows, onRowsChange }) => {
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Omit<ManualRow, "id">>({
    col1: "",
    col2: "",
    col3: "",
    col4: "",
    status: "",
  });

  const modalTitle = editingId ? "Cập nhật bản ghi" : "Tạo bản ghi mới";

  const submitDisabled = useMemo(() => {
    return !draft.col1.trim() || !draft.status.trim();
  }, [draft.col1, draft.status]);

  const resetModal = () => {
    setOpenModal(false);
    setEditingId(null);
    setDraft({ col1: "", col2: "", col3: "", col4: "", status: "" });
  };

  const handleCreate = () => {
    setEditingId(null);
    setDraft({ col1: "", col2: "", col3: "", col4: "", status: "Active" });
    setOpenModal(true);
  };

  const handleEdit = (row: ManualRow) => {
    setEditingId(row.id);
    setDraft({
      col1: row.col1,
      col2: row.col2,
      col3: row.col3,
      col4: row.col4,
      status: row.status,
    });
    setOpenModal(true);
  };

  const handleSave = () => {
    if (submitDisabled) return;

    if (editingId) {
      onRowsChange((prev) =>
        prev.map((row) => (row.id === editingId ? { ...row, ...draft } : row)),
      );
    } else {
      const nextId = rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
      onRowsChange((prev) => [...prev, { id: nextId, ...draft }]);
    }

    resetModal();
  };

  const handleDelete = (id: string | number | undefined) => {
    const numberId = Number(id);
    if (Number.isNaN(numberId)) return;
    onRowsChange((prev) => prev.filter((row) => row.id !== numberId));
  };

  const labels = config.columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = column.label;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <p className="text-sm text-slate-500">{config.description}</p>
        <button
          onClick={handleCreate}
          className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold"
        >
          {config.addLabel}
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-xs border-b">
              <th className="py-3 px-3">STT</th>
              {config.columns.map((column) => (
                <th key={column.key} className="py-3 px-3">
                  {column.label}
                </th>
              ))}
              <th className="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-3 px-3 text-slate-700">{index + 1}</td>
                {config.columns.map((column) => (
                  <td key={`${row.id}-${column.key}`} className="py-3 px-3 text-slate-700">
                    {row[column.key]}
                  </td>
                ))}
                <td className="py-3 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(row)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                      title="Sửa"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </button>
                    <DeleteConfirm
                      text="bản ghi này"
                      elId={row.id}
                      onDelete={handleDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 px-3 text-center text-slate-500" colSpan={config.columns.length + 2}>
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={modalTitle}
        open={openModal}
        onOk={handleSave}
        onCancel={resetModal}
        okText={editingId ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        okButtonProps={{ disabled: submitDisabled }}
      >
        <div className="grid grid-cols-1 gap-3 pt-2">
          <label className="text-sm text-slate-600">
            {labels.col1}
            <input
              value={draft.col1}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, col1: event.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
            />
          </label>
          <label className="text-sm text-slate-600">
            {labels.col2}
            <input
              value={draft.col2}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, col2: event.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
            />
          </label>
          <label className="text-sm text-slate-600">
            {labels.col3}
            <input
              value={draft.col3}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, col3: event.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
            />
          </label>
          <label className="text-sm text-slate-600">
            {labels.col4}
            <input
              value={draft.col4}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, col4: event.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
            />
          </label>
          <label className="text-sm text-slate-600">
            {labels.status}
            <input
              value={draft.status}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, status: event.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
};

const AccountingDashboard: IPage["Component"] = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  const [accountRows, setAccountRows] = useState<ManualRow[]>(initialDataMap["tai-khoan"]);
  const [voucherRows, setVoucherRows] = useState<ManualRow[]>(initialDataMap["chung-tu"]);
  const [ruleRows, setRuleRows] = useState<ManualRow[]>(initialDataMap["quy-tac"]);
  const [reportRows, setReportRows] = useState<ManualRow[]>(initialDataMap["kiem-tra"]);
  const [overviewRows, setOverviewRows] = useState<ManualRow[]>(initialDataMap["tong-quan"]);

  const manualTabData: Record<string, [ManualRow[], React.Dispatch<React.SetStateAction<ManualRow[]>>]> = {
    "tai-khoan": [accountRows, setAccountRows],
    "chung-tu": [voucherRows, setVoucherRows],
    "quy-tac": [ruleRows, setRuleRows],
    "kiem-tra": [reportRows, setReportRows],
    "tong-quan": [overviewRows, setOverviewRows],
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <section className="bg-white/90 rounded-2xl shadow-md border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-teal-600">Nhập liệu kế toán</h2>
            <div className="text-sm text-slate-500">
              Các tab bên dưới hỗ trợ thêm, sửa, xóa dữ liệu thủ công bằng modal.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 ${
                activeTab === tab.key
                  ? "bg-teal-50 text-teal-600 border-teal-200"
                  : "bg-white text-slate-500 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "bang-luong" && <PayrollSummaryTab />}

        {activeTab !== "bang-luong" && tabConfigs[activeTab] && (
          <ManualTabTable
            config={tabConfigs[activeTab]}
            rows={manualTabData[activeTab][0]}
            onRowsChange={manualTabData[activeTab][1]}
          />
        )}
      </section>
    </div>
  );
};

export default AccountingDashboard;
