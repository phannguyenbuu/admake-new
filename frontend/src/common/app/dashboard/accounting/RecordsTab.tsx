import React, { useState, useEffect, useRef } from "react";
import {
  FileTextOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  CloseOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { Modal, Tooltip, notification, Popconfirm, Upload, Spin, AutoComplete } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountingErpService } from "../../../services/accounting-erp.service";
import { useUser } from "../../../common/hooks/useUser";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecordItem {
  id: string;
  lead_id: number;
  sub_tab: string;
  name: string;
  file_type: string;
  folder: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Parse file to HTML ───────────────────────────────────────────────────────

async function parseFileToHtml(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return `<p><em>[File PDF: ${file.name}]</em></p><p>Nội dung PDF không thể đọc trực tiếp trên trình duyệt. Vui lòng nhập / paste nội dung vào đây.</p>`;
  }

  // ── .doc / .docx: ưu tiên gọi server để đọc được cả định dạng .doc cũ ──
  if (name.endsWith(".doc") || name.endsWith(".docx")) {
    try {
      const res = await AccountingErpService.convertDoc(file);
      const html = res.data?.html;
      if (html && html.trim() && res.data?.error !== "no_converter") {
        return html;
      }
    } catch (e) {
      console.warn("Server convertDoc failed, trying mammoth...", e);
    }

    // fallback: mammoth (chỉ chạy tốt với .docx)
    if (name.endsWith(".docx")) {
      try {
        const mammoth = await import("mammoth");
        const buffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (result.value) return result.value;
      } catch (e) {
        console.warn("Mammoth parse error:", e);
      }
    }

    return `<p><strong>File: ${file.name}</strong></p>
<p>⚠️ Không thể tự động trích xuất nội dung từ file <code>.doc</code> (định dạng cũ).</p>
<p>Vui lòng mở file trong Word, chọn <strong>Save As → .docx</strong> rồi upload lại, hoặc copy/paste nội dung vào đây.</p>`;
  }

  // ── text/plain ──────────────────────────────────────────────────────────
  try {
    const text = await file.text();
    return `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
  } catch {
    return `<p>[${file.name}]</p>`;
  }
}


// ─── Download HTML content as file ───────────────────────────────────────────

function downloadRecord(record: RecordItem) {
  const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"/>
<title>${record.name}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;line-height:1.7;}img{max-width:100%;}</style>
</head><body>${record.content}</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${record.name}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // Chỉ set HTML 1 lần khi mount hoặc khi value thay đổi từ bên ngoài (open mới)
  useEffect(() => {
    if (editorRef.current && !initializedRef.current) {
      editorRef.current.innerHTML = value;
      initializedRef.current = true;
    }
  });

  // Reset khi value bị clear (mở modal mới)
  useEffect(() => {
    if (editorRef.current && value === "<p></p>") {
      editorRef.current.innerHTML = value;
      initializedRef.current = false;
    }
  }, [value]);

  // Khi value từ edit target thay đổi (khác nhau)
  useEffect(() => {
    if (editorRef.current && value && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || "");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (ev) => {
          exec(
            "insertHTML",
            `<img src="${ev.target?.result}" style="max-width:100%;border-radius:4px;margin:4px 0;" />`
          );
        };
        reader.readAsDataURL(file);
        return;
      }
    }
    e.preventDefault();
    const html =
      e.clipboardData.getData("text/html") ||
      e.clipboardData.getData("text/plain");
    exec("insertHTML", html);
  };

  const insertImage = () => fileInputRef.current?.click();
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      exec(
        "insertHTML",
        `<img src="${ev.target?.result}" style="max-width:100%;border-radius:4px;margin:4px 0;" />`
      );
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toolbarBtns = [
    { title: "In đậm", icon: <BoldOutlined />, action: () => exec("bold") },
    { title: "In nghiêng", icon: <ItalicOutlined />, action: () => exec("italic") },
    { title: "Gạch chân", icon: <UnderlineOutlined />, action: () => exec("underline") },
    { title: "Danh sách số", icon: <OrderedListOutlined />, action: () => exec("insertOrderedList") },
    { title: "Danh sách chấm", icon: <UnorderedListOutlined />, action: () => exec("insertUnorderedList") },
    {
      title: "Chèn link",
      icon: <LinkOutlined />,
      action: () => { const u = prompt("URL:", "https://"); if (u) exec("createLink", u); },
    },
    { title: "Chèn ảnh", icon: <PictureOutlined />, action: insertImage },
  ];

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-3 py-2 flex-wrap">
        <select
          className="mr-2 text-xs border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-600"
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue="3"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <option key={s} value={String(s)}>
              {["8", "10", "12", "14", "18", "24", "36"][s - 1]}px
            </option>
          ))}
        </select>
        {toolbarBtns.map((btn, i) => (
          <Tooltip key={i} title={btn.title} mouseEnterDelay={0.5}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
              className="h-8 w-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200 text-sm transition-colors"
            >
              {btn.icon}
            </button>
          </Tooltip>
        ))}
        <Tooltip title="Màu chữ">
          <input
            type="color"
            className="h-6 w-6 rounded cursor-pointer border-0 ml-1"
            title="Màu chữ"
            onChange={(e) => exec("foreColor", e.target.value)}
          />
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        onPaste={handlePaste}
        className="min-h-[280px] p-4 text-sm text-slate-700 outline-none overflow-y-auto"
        style={{ lineHeight: 1.7 }}
      />
    </div>
  );
}

// ─── Sub-tab config ───────────────────────────────────────────────────────────

const recordTabs = [
  { key: "hop-dong", label: "Hợp đồng & Báo giá", icon: <FileProtectOutlined /> },
  { key: "nghiem-thu", label: "Nghiệm thu & Bàn giao", icon: <FileDoneOutlined /> },
  { key: "thanh-toan", label: "Thanh toán & Thanh lý", icon: <FileTextOutlined /> },
];

function tabIcon(subTab: string) {
  if (subTab === "hop-dong") return <FileProtectOutlined />;
  if (subTab === "nghiem-thu") return <FileDoneOutlined />;
  return <FileTextOutlined />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecordsTab() {
  const { userId, userLeadId, workspaces } = useUser();
  const leadId = userLeadId as number;
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState(recordTabs[0].key);
  const [searchTerm, setSearchTerm] = useState("");

  // Danh sách thư mục từ workspace thực tế
  const folderOptions = workspaces
    .filter((w) => !w.deletedAt)
    .map((w) => ({ value: w.name, label: w.name }));

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecordItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formFolder, setFormFolder] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState("doc");
  const [uploading, setUploading] = useState(false);
  const [viewRec, setViewRec] = useState<RecordItem | null>(null);
  // Force re-mount RichEditor khi mở modal mới
  const [editorKey, setEditorKey] = useState(0);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["accounting-records", leadId],
    queryFn: () =>
      AccountingErpService.listRecords(leadId).then(
        (r) => r.data?.data as RecordItem[]
      ),
    enabled: !!leadId,
  });

  const records: RecordItem[] = data || [];
  const filtered = records.filter(
    (r) =>
      r.sub_tab === activeSubTab &&
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["accounting-records", leadId] });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, any>) =>
      AccountingErpService.createRecord(payload),
    onSuccess: () => {
      notification.success({ message: "Đã tạo hồ sơ mới" });
      invalidate();
      setModalOpen(false);
    },
    onError: () => notification.error({ message: "Tạo hồ sơ thất bại" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) =>
      AccountingErpService.updateRecord(id, payload),
    onSuccess: () => {
      notification.success({ message: "Đã cập nhật hồ sơ" });
      invalidate();
      setModalOpen(false);
    },
    onError: () => notification.error({ message: "Cập nhật thất bại" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => AccountingErpService.deleteRecord(id),
    onSuccess: () => {
      notification.success({ message: "Đã xóa hồ sơ" });
      invalidate();
    },
    onError: () => notification.error({ message: "Xóa thất bại" }),
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditTarget(null);
    setFormName("");
    setFormFolder(folderOptions[0]?.value || "");
    setFormContent("<p></p>");
    setFormType("doc");
    setEditorKey((k) => k + 1);
    setModalOpen(true);
  };

  const openEdit = (rec: RecordItem) => {
    setEditTarget(rec);
    setFormName(rec.name);
    setFormFolder(rec.folder);
    setFormContent(rec.content || "<p></p>");
    setFormType(rec.file_type);
    setEditorKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      notification.error({ message: "Vui lòng nhập tên hồ sơ" });
      return;
    }
    const payload = {
      lead_id: leadId,
      sub_tab: activeSubTab,
      name: formName.trim(),
      file_type: formType,
      folder: formFolder.trim() || "Chưa phân loại",
      content: formContent,
      created_by: String(userId || ""),
      updated_by: String(userId || ""),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const html = await parseFileToHtml(file);
      const ext = file.name.split(".").pop()?.toLowerCase() || "doc";
      setFormName(file.name.replace(/\.[^/.]+$/, "").toUpperCase());
      setFormType(ext);
      setFormContent(html);
      setEditorKey((k) => k + 1);
      notification.success({ message: `Đã đọc file: ${file.name}` });
    } catch {
      notification.error({ message: "Không thể đọc file" });
    }
    setUploading(false);
    return false;
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-sm text-slate-500">
        Quản lý và phân loại các hồ sơ kế toán, bao gồm hợp đồng, báo giá, biên
        bản nghiệm thu và thanh lý.
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {recordTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeSubTab === tab.key
              ? "bg-teal-50 text-teal-600 shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Create */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm hồ sơ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
        >
          <PlusOutlined />
          Tạo hồ sơ mới
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spin />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Tên hồ sơ</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Thư mục nguồn</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setViewRec(record)}
                      >
                        <div className="h-8 w-8 rounded bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                          {tabIcon(record.sub_tab)}
                        </div>
                        <span className="hover:text-teal-600 transition-colors">
                          {record.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 uppercase">
                        {record.file_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{record.folder}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-teal-600">
                        <CheckCircleOutlined className="text-xs" />
                        <span className="text-xs font-medium">Sẵn sàng</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Download */}
                        <Tooltip title="Tải về">
                          <button
                            onClick={() => downloadRecord(record)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <DownloadOutlined className="text-xs" />
                          </button>
                        </Tooltip>

                        {/* Edit */}
                        <Tooltip title="Chỉnh sửa">
                          <button
                            onClick={() => openEdit(record)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                          >
                            <EditOutlined className="text-xs" />
                          </button>
                        </Tooltip>

                        {/* Delete */}
                        <Popconfirm
                          title="Xóa hồ sơ này?"
                          description="Hành động này không thể hoàn tác."
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => deleteMutation.mutate(record.id)}
                        >
                          <Tooltip title="Xóa">
                            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all">
                              <DeleteOutlined className="text-xs" />
                            </button>
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FileTextOutlined className="text-3xl text-slate-300" />
                      <span>
                        Chưa có hồ sơ nào. Nhấn{" "}
                        <strong className="text-teal-600">Tạo hồ sơ mới</strong>{" "}
                        để bắt đầu.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Create / Edit Modal ─────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={null}
        footer={null}
        width={860}
        centered
        destroyOnClose
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        {/* Gmail-style header */}
        <div className="flex items-center justify-between bg-slate-800 text-white px-5 py-3 rounded-t-lg">
          <span className="font-semibold text-sm">
            {editTarget
              ? `Chỉnh sửa: ${editTarget.name}`
              : "Tạo hồ sơ mới"}
          </span>
          <button
            onClick={() => setModalOpen(false)}
            className="hover:text-slate-300 text-lg"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Upload (chỉ khi tạo mới) */}
          {!editTarget && (
            <div className="border-b border-slate-100 pb-4">
              <Upload
                accept=".doc,.docx,.pdf,.txt"
                beforeUpload={(f) => { handleFileUpload(f); return false; }}
                showUploadList={false}
                maxCount={1}
              >
                <button
                  type="button"
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 px-4 py-2.5 text-sm text-slate-600 hover:text-teal-600 transition-all"
                >
                  <UploadOutlined />
                  {uploading
                    ? "Đang đọc file..."
                    : "Tải file doc / pdf lên (tự động đọc nội dung)"}
                </button>
              </Upload>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tên hồ sơ *
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: HỢP ĐỒNG THI CÔNG..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Thư mục <span className="text-slate-400">(chọn workspace hoặc nhập mới)</span>
              </label>
              <AutoComplete
                value={formFolder}
                onChange={(v) => setFormFolder(v)}
                options={folderOptions}
                placeholder="Chọn thư mục..."
                style={{ width: "100%" }}
                filterOption={(inputValue, option) =>
                  (option?.value as string)
                    ?.toLowerCase()
                    ?.includes(inputValue.toLowerCase()) ?? true
                }
                className="ant-input-compact"
              >
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  placeholder="Chọn thư mục..."
                />
              </AutoComplete>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Loại file
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
            >
              {["doc", "docx", "pdf", "xlsx", "xls", "txt", "other"].map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nội dung{" "}
              <span className="text-slate-400">(hỗ trợ paste ảnh)</span>
            </label>
            {/* key force re-mount để load content mới từ edit */}
            <RichEditor
              key={editorKey}
              value={formContent}
              onChange={setFormContent}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? "Đang lưu..." : editTarget ? "Cập nhật" : "Tạo hồ sơ"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── View Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={!!viewRec}
        onCancel={() => setViewRec(null)}
        title={
          <div className="flex items-center gap-2 text-slate-700">
            {viewRec && tabIcon(viewRec.sub_tab)}
            <span>{viewRec?.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 font-normal uppercase">
              {viewRec?.file_type}
            </span>
          </div>
        }
        footer={
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Cập nhật:{" "}
              {viewRec?.updatedAt
                ? new Date(viewRec.updatedAt).toLocaleString("vi-VN")
                : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => viewRec && downloadRecord(viewRec)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <DownloadOutlined /> Tải về
              </button>
              <button
                onClick={() => {
                  setViewRec(null);
                  if (viewRec) openEdit(viewRec);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <EditOutlined /> Chỉnh sửa
              </button>
              <button
                onClick={() => setViewRec(null)}
                className="rounded-lg bg-teal-500 text-white px-4 py-1.5 text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        }
        width={760}
        centered
      >
        <div
          className="overflow-y-auto text-sm text-slate-700"
          style={{ maxHeight: "60vh", lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: viewRec?.content || "" }}
        />
      </Modal>
    </div>
  );
}
