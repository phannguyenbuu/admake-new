import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { notification, Select, ConfigProvider } from "antd";
import { Trash2, Plus, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTaskContext } from "../../../../common/hooks/useTask";
import type { TaskMaterialItem } from "../../../../@types/work-space.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import { useUser } from "../../../../common/hooks/useUser";
import { InventoryService, type InventoryItem } from "../../../../services/inventory.service";
import axiosClient from "../../../../services/axiosClient";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const EMPTY_ROW = (): TaskMaterialItem => ({
    id: uid(),
    ten: "",
    quy_cach: "",
    so_luong: "",
    dia_diem: "",
});

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SelectMaterialOption {
    label: string;
    ten: string;
    quy_cach: string;
    dia_diem: string;
    unit: string;
}

interface SuggestSelectProps {
    value: string;
    onChange: (opt: SelectMaterialOption | null) => void;
    options: SelectMaterialOption[];
    placeholder: string;
    className?: string;
}

function SuggestSelect({ value, onChange, options, placeholder }: SuggestSelectProps) {
    const selectedOption = options.find(o => o.label === value);

    const handleSelect = (val: string) => {
        const opt = options.find(o => o.label === val);
        if (opt) onChange(opt);
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Select: {
                        controlHeight: 34,
                        colorBorder: '#e2e8f0',
                        activeBorderColor: '#22d3ee',
                        hoverBorderColor: '#cbd5e1',
                    },
                },
            }}
        >
            <Select
                showSearch
                value={selectedOption ? selectedOption.label : undefined}
                onChange={handleSelect}
                placeholder={placeholder}
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                    ((option?.selectLabel as string) ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={options.map((s, idx) => ({
                    value: s.label,
                    selectLabel: s.label,
                    label: (
                        <div key={idx} className="flex flex-col py-0.5 w-full">
                            <span className="font-medium text-[13px] leading-tight text-slate-800">{s.ten}</span>
                            <span className="text-[11px] text-slate-400 mt-0.5">{s.quy_cach ? `${s.quy_cach} • ` : ''}{s.dia_diem}</span>
                        </div>
                    )
                }))}
                optionLabelProp="selectLabel"
                className="w-full text-sm font-sans"
            />
        </ConfigProvider>
    );
}

// ─── Materials Grid Tab ───────────────────────────────────────────────────────
function MaterialsGrid() {
    const { taskDetail } = useTaskContext();
    const { userLeadId } = useUser();

    // Fetch Inventory Library
    const { data: resItems } = useQuery({
        queryKey: ["inventory-items", userLeadId],
        enabled: userLeadId > 0,
        queryFn: async () => (await InventoryService.listItems({ lead: userLeadId, limit: 1000 })).data?.data as InventoryItem[],
    });

    const libraryOptions = useMemo<SelectMaterialOption[]>(() => {
        const items = resItems || [];
        return items.flatMap(item => {
            const specs: any[] = (item as any).spec_rows || [];
            if (specs.filter(s => s.spec || s.color).length === 0) {
                return [{
                    label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
                    ten: item.name,
                    quy_cach: item.unit || "",
                    dia_diem: item.default_warehouse_name || "Kho VTU",
                    unit: item.unit || ""
                }];
            }
            return specs.filter(s => s.spec || s.color).map(spec => {
                const specStr = [spec.color, spec.spec].filter(Boolean).join(" - ");
                const labelStr = `${item.name} - ${specStr}`;
                return {
                    label: `${labelStr}${item.code ? ` (${item.code})` : ''}`,
                    ten: labelStr,
                    quy_cach: specStr || item.unit || "",
                    dia_diem: item.default_warehouse_name || "Kho VTU",
                    unit: spec.unit || item.unit || ""
                };
            });
        });
    }, [resItems]);

    const initRows = (): TaskMaterialItem[] => {
        const saved = (taskDetail?.materials ?? []) as TaskMaterialItem[];
        return saved.length > 0 ? saved : [EMPTY_ROW()];
    };

    const [rows, setRows] = useState<TaskMaterialItem[]>(initRows);
    const [saving, setSaving] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { setRows(initRows()); }, [taskDetail?.id]);

    // ── Auto-save ────────────────────────────────────────────────────────────
    const saveToServer = useCallback(async (data: TaskMaterialItem[]) => {
        if (!taskDetail?.id) return;
        const payload = data.filter((r) => r.ten || r.so_luong);
        setSaving(true);
        try {
            await axiosClient.put(`/task/${taskDetail.id}`, { materials: payload });
        } catch {
            notification.error({ message: "Lỗi lưu vật liệu" });
        } finally {
            setSaving(false);
        }
    }, [taskDetail?.id]);

    const scheduleAutoSave = (data: TaskMaterialItem[]) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveToServer(data), 800);
    };

    // ── Row handlers ─────────────────────────────────────────────────────────
    const handleChange = (rowId: string, field: keyof Omit<TaskMaterialItem, "id">, value: string) => {
        setRows((prev) => {
            const next = prev.map((r) => r.id === rowId ? { ...r, [field]: value } : r);
            scheduleAutoSave(next);
            return next;
        });
    };

    const handleSelectMaterial = (rowId: string, opt: SelectMaterialOption | null) => {
        if (!opt) return;
        setRows((prev) => {
            const next = prev.map(r => r.id === rowId ? {
                ...r,
                ten: opt.ten,
                quy_cach: opt.quy_cach,
                dia_diem: opt.dia_diem
            } : r);
            scheduleAutoSave(next);
            return next;
        });
    };

    const handleAddRow = () => {
        setRows((prev) => {
            const next = [...prev, EMPTY_ROW()];
            scheduleAutoSave(next);
            return next;
        });
    };

    const handleDeleteRow = (rowId: string) => {
        setRows((prev) => {
            const next = prev.filter((r) => r.id !== rowId);
            const result = next.length > 0 ? next : [EMPTY_ROW()];
            scheduleAutoSave(result);
            return result;
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
        if (e.key === "Tab" && !e.shiftKey && colIdx === 2 && rowIdx === rows.length - 1) {
            e.preventDefault();
            handleAddRow();
        }
        if (e.key === "Enter") { e.preventDefault(); handleAddRow(); }
    };

    // ── Column widths ─────────────────────────────────────────────────────────
    const COL_W = ["minmax(0, 4fr)", "minmax(0, 3fr)", "minmax(0, 2fr)", "minmax(0, 2fr)", "32px"];

    return (
        <div className="py-2">
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: COL_W.join(" "), gap: 4, marginBottom: 4 }}>
                {["Từ thư viện vật tư", "Quy cách", "Số lượng", "Phân bổ", ""].map((label) => (
                    <div key={label} className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1 bg-slate-100 rounded">
                        {label}
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-1">
                {rows.map((row, rowIdx) => {
                    const inputCls = `
                        text-sm border border-slate-200 rounded px-2 py-1.5
                        focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200
                        bg-white hover:border-slate-300 transition-colors w-full
                    `;
                    const readOnlyCls = `
                        text-sm border border-slate-100 rounded px-2 py-1.5
                        bg-slate-50 text-slate-500 w-full cursor-not-allowed
                    `;

                    return (
                        <div key={row.id} style={{ display: "grid", gridTemplateColumns: COL_W.join(" "), gap: 4 }}>
                            {/* Tên / Combobox */}
                            <SuggestSelect
                                value={row.ten}
                                onChange={(opt) => handleSelectMaterial(row.id, opt)}
                                options={libraryOptions}
                                placeholder="🔍 Chọn vật liệu..."
                                className={inputCls}
                            />

                            {/* Quy cách (Read-only) */}
                            <input
                                readOnly
                                value={row.quy_cach}
                                placeholder="Tự động..."
                                className={readOnlyCls}
                                title="Lấy tự động từ thư viện"
                            />

                            {/* Số lượng + đơn vị */}
                            <input
                                type="number"
                                step="any"
                                min="0"
                                value={row.so_luong}
                                onChange={(e) => handleChange(row.id, "so_luong", e.target.value)}
                                placeholder="VD: 5.5"
                                className={inputCls}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, 2)}
                            />

                            {/* Địa điểm (Read-only) */}
                            <input
                                readOnly
                                value={row.dia_diem}
                                placeholder="Kho..."
                                className={readOnlyCls}
                                title="Lấy tự động từ thư viện"
                            />

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="flex items-center justify-center w-8 h-8 rounded hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-colors"
                                title="Xoá dòng"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pb-4">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 font-medium border border-dashed border-cyan-300 rounded-lg px-3 py-1.5 hover:bg-cyan-50 transition-colors"
                >
                    <Plus size={13} />
                    Thêm dòng
                </button>
                <span className="text-xs text-slate-400">
                    {saving
                        ? "Đang lưu..."
                        : rows.filter((r) => r.ten || r.so_luong).length > 0
                            ? `${rows.filter((r) => r.ten || r.so_luong).length} vật liệu`
                            : "Chưa có vật liệu"}
                </span>
            </div>
        </div>
    );
}

export default function MaterialsTab() {
    return <MaterialsGrid />;
}
