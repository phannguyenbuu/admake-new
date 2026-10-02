import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { notification, Select, ConfigProvider, type FormInstance, AutoComplete, Input, Tag } from "antd";
import { Trash2, Plus, ArrowUpRight, ArrowDownRight, ClipboardList, UserCheck, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTaskContext } from "../../../../common/hooks/useTask";
import type { TaskMaterialItem, TaskMaterialAdjustmentItem } from "../../../../@types/work-space.type";
import { useUser } from "../../../../common/hooks/useUser";
import { InventoryService, type InventoryItem } from "../../../../services/inventory.service";
import { UserService } from "../../../../services/user.service";
import axiosClient from "../../../../services/axiosClient";
import dayjs from "dayjs";

// ─── Helpers & Interfaces ───────────────────────────────────────────────────
function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parseFraction(str: string): number | null {
    if (!str) return null;
    const match = str.trim().match(/^(\d+)\s*\/\s*(\d+)/);
    if (match) {
        const num = parseInt(match[1], 10);
        const den = parseInt(match[2], 10);
        if (den !== 0) return num / den;
    }
    return null;
}

function formatMoney(amount: number): string {
    if (!amount || isNaN(amount)) return "0 ₫";
    return `${new Intl.NumberFormat("vi-VN").format(Math.round(amount))} ₫`;
}

export interface ExtraCostItem {
    id: string;
    title: string;
    amount: string;
    note: string;
}

const EMPTY_EXTRA_COST_ROW = (): ExtraCostItem => ({
    id: uid(),
    title: "",
    amount: "",
    note: "",
});

function getMaterialRowPrice(row: { ten?: string; quy_cach?: string }, items: any[]): number {
    for (const item of items) {
        const specs = item.spec_rows || [];
        
        // 1. Direct match with spec string
        if (specs.length > 0) {
            for (const spec of specs) {
                const specStr = [spec.color, spec.spec].filter(Boolean).join(" - ");
                const formattedName = `${item.name} - ${specStr}`;
                if (
                    row.ten === formattedName || 
                    (row.ten === item.name && row.quy_cach === specStr) ||
                    (row.ten === item.name && row.quy_cach === spec.spec)
                ) {
                    return Number(spec.price) || 0;
                }
            }
        }

        // 2. Fractional calculation or main item match
        if (row.ten === item.name || (item.name && row.ten && row.ten.startsWith(item.name))) {
            const mainPrice = item.standard_cost || item.average_cost || 0;
            if (row.quy_cach) {
                const fraction = parseFraction(row.quy_cach);
                if (fraction !== null) {
                    return Math.round(mainPrice * fraction);
                }
            }
            return mainPrice;
        }
    }
    return 0;
}

const EMPTY_ROW = (): TaskMaterialItem => ({
    id: uid(),
    ten: "",
    quy_cach: "",
    so_luong: "",
    dia_diem: "",
});

const EMPTY_ADJ_ROW = (): TaskMaterialAdjustmentItem => ({
    id: uid(),
    type: "PLUS",
    ten: "",
    quy_cach: "",
    so_luong: "1",
    dia_diem: "",
    date: dayjs().format("YYYY-MM-DD"),
    requester_name: "",
});

interface SelectMaterialOption {
    label: string;
    ten: string;
    quy_cach: string;
    dia_diem: string;
    unit: string;
    default_supplier_name?: string;
    supplier_link?: string;
}

interface SuggestSelectProps {
    value: string;
    onChange: (opt: SelectMaterialOption | null) => void;
    options: SelectMaterialOption[];
    placeholder: string;
    className?: string;
}

function SuggestSelect({ value, onChange, options, placeholder }: SuggestSelectProps) {
    const selectedOption = options.find(o => o.ten === value || o.label === value);

    const handleSelect = (val: string) => {
        const opt = options.find(o => o.label === val || o.ten === val);
        if (opt) {
            onChange(opt);
            const supplierName = opt.default_supplier_name;
            const supplierLink = opt.supplier_link;
            if (supplierName || supplierLink) {
                const sName = supplierName || "Đại lý vật tư";
                notification.info({
                    message: `🏪 Đại lý vật tư: ${sName}`,
                    description: supplierLink ? (
                        <div className="flex flex-col gap-1 mt-1">
                            <span className="text-xs text-slate-600">Thông tin đại lý cung cấp vật tư này:</span>
                            <a
                              href={supplierLink.startsWith("http") ? supplierLink : `https://${supplierLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 underline hover:text-blue-800"
                            >
                              🔗 Click xem Website / HTML Đại lý ({sName})
                            </a>
                        </div>
                    ) : `Đại lý cung cấp: ${sName}`,
                    duration: 6,
                    placement: "topRight"
                });
            }
        }
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
                value={selectedOption ? selectedOption.label : (value || undefined)}
                onChange={handleSelect}
                placeholder={placeholder}
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                    ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={options.map(o => ({
                    value: o.label,
                    label: o.label
                }))}
            />
        </ConfigProvider>
    );
}

interface MaterialsGridProps {
    form?: FormInstance;
    userId?: string;
}

// ─── Materials Grid Tab ───────────────────────────────────────────────────────
function MaterialsGrid({ form, userId }: MaterialsGridProps) {
    const { taskDetail } = useTaskContext();
    const { userLeadId } = useUser();

    // Fetch Inventory Library
    const { data: resItems } = useQuery({
        queryKey: ["inventory-items", userLeadId],
        enabled: userLeadId > 0,
        queryFn: async () => (await InventoryService.listItems({ lead: userLeadId, limit: 1000 })).data?.data as InventoryItem[],
    });

    // Fetch Workshop Staff Users
    const { data: resStaff } = useQuery({
        queryKey: ["users-staff-list", userLeadId],
        enabled: userLeadId > 0,
        queryFn: async () => {
            const res = await UserService.getAll({ lead_id: userLeadId, limit: 1000 } as any);
            return (res.data?.data || res.data || []) as any[];
        }
    });

    const staffOptions = useMemo(() => {
        const list = resStaff || [];
        if (Array.isArray(list)) {
            return list.map((u: any) => ({
                label: u.fullName || u.username || u.name || "Nhân viên",
                value: u.fullName || u.username || u.name || "Nhân viên",
                id: String(u.id || u.user_id || "")
            }));
        }
        return [];
    }, [resStaff]);

    // Top-level AutoComplete list ONLY displays main items (Vật tư tổng) to keep dropdown clean & compact
    const libraryOptions = useMemo<SelectMaterialOption[]>(() => {
        const items = resItems || [];
        return items.map(item => {
            const supName = item.default_supplier_name || "";
            const supLink = (item as any).supplier_link || "";
            return {
                label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
                ten: item.name,
                quy_cach: item.unit || "",
                dia_diem: item.default_warehouse_name || "Kho VTU",
                unit: item.unit || "",
                default_supplier_name: supName,
                supplier_link: supLink,
            };
        });
    }, [resItems]);

    // Baseline Rows state
    const initRows = (): TaskMaterialItem[] => {
        const saved = (taskDetail?.materials ?? []) as TaskMaterialItem[];
        return saved.length > 0 ? saved : [EMPTY_ROW()];
    };

    // Adjustment Rows state
    const initAdjRows = (): TaskMaterialAdjustmentItem[] => {
        const saved = (taskDetail?.material_adjustments ?? []) as TaskMaterialAdjustmentItem[];
        return saved.length > 0 ? saved : [];
    };

    // Extra Contingency Costs state
    const initExtraRows = (): ExtraCostItem[] => {
        const saved = ((taskDetail as any)?.extra_costs ?? []) as ExtraCostItem[];
        return saved;
    };

    const [rows, setRows] = useState<TaskMaterialItem[]>(initRows);
    const [adjRows, setAdjRows] = useState<TaskMaterialAdjustmentItem[]>(initAdjRows);
    const [extraRows, setExtraRows] = useState<ExtraCostItem[]>(initExtraRows);
    const [saving, setSaving] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { 
        setRows(initRows()); 
        setAdjRows(initAdjRows());
        setExtraRows(initExtraRows());
    }, [taskDetail?.id]);

    useEffect(() => {
        if (form) {
            form.setFieldValue("materials", rows.filter((r) => r.ten || r.so_luong));
            form.setFieldValue("material_adjustments", adjRows.filter((r) => r.ten || r.so_luong));
            form.setFieldValue("extra_costs", extraRows.filter((r) => r.title || r.amount));
        }
    }, [rows, adjRows, extraRows, form]);

    // ── Auto-save ────────────────────────────────────────────────────────────
    const saveToServer = useCallback(async (
        matsData: TaskMaterialItem[],
        adjsData: TaskMaterialAdjustmentItem[],
        extraData: ExtraCostItem[]
    ) => {
        if (!taskDetail?.id) return;
        const payloadMats = matsData.filter((r) => r.ten || r.so_luong);
        const payloadAdjs = adjsData.filter((r) => r.ten || r.so_luong || r.requester_name);
        const payloadExtra = extraData.filter((r) => r.title || r.amount);
        setSaving(true);
        try {
            const currentUserId = userId || JSON.parse(localStorage.getItem('Admake-User-Access') || '{}')?.user_id;
            await axiosClient.put(`/task/${taskDetail.id}`, { 
                materials: payloadMats,
                material_adjustments: payloadAdjs,
                extra_costs: payloadExtra,
                user_id: currentUserId,
            });
        } catch {
            notification.error({ message: "Lỗi lưu dữ liệu vật liệu & chi phí" });
        } finally {
            setSaving(false);
        }
    }, [taskDetail?.id, userId]);

    const scheduleAutoSave = (
        matsData: TaskMaterialItem[],
        adjsData: TaskMaterialAdjustmentItem[],
        extraData: ExtraCostItem[] = extraRows
    ) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveToServer(matsData, adjsData, extraData), 800);
    };

    // ── Baseline Row handlers ──────────────────────────────────────────────────
    const handleChange = (rowId: string, field: keyof Omit<TaskMaterialItem, "id">, value: string) => {
        setRows((prev) => {
            const next = prev.map((r) => r.id === rowId ? { ...r, [field]: value } : r);
            scheduleAutoSave(next, adjRows, extraRows);
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
            scheduleAutoSave(next, adjRows, extraRows);
            return next;
        });
    };

    const handleAddRow = () => {
        setRows((prev) => {
            const next = [...prev, EMPTY_ROW()];
            scheduleAutoSave(next, adjRows, extraRows);
            return next;
        });
    };

    const handleDeleteRow = (rowId: string) => {
        setRows((prev) => {
            const next = prev.filter((r) => r.id !== rowId);
            const result = next.length > 0 ? next : [EMPTY_ROW()];
            scheduleAutoSave(result, adjRows, extraRows);
            return result;
        });
    };

    // ── Adjustment Row handlers ───────────────────────────────────────────────
    const handleAdjChange = (rowId: string, field: keyof Omit<TaskMaterialAdjustmentItem, "id">, value: any) => {
        setAdjRows((prev) => {
            const next = prev.map((r) => r.id === rowId ? { ...r, [field]: value } : r);
            scheduleAutoSave(rows, next, extraRows);
            return next;
        });
    };

    const handleAdjSelectMaterial = (rowId: string, opt: SelectMaterialOption | null) => {
        if (!opt) return;
        setAdjRows((prev) => {
            const next = prev.map(r => r.id === rowId ? {
                ...r,
                ten: opt.ten,
                quy_cach: opt.quy_cach,
                dia_diem: opt.dia_diem
            } : r);
            scheduleAutoSave(rows, next, extraRows);
            return next;
        });
    };

    const handleAddAdjRow = () => {
        setAdjRows((prev) => {
            const next = [...prev, EMPTY_ADJ_ROW()];
            scheduleAutoSave(rows, next, extraRows);
            return next;
        });
    };

    const handleDeleteAdjRow = (rowId: string) => {
        setAdjRows((prev) => {
            const next = prev.filter((r) => r.id !== rowId);
            scheduleAutoSave(rows, next, extraRows);
            return next;
        });
    };

    // ── Extra Contingency Cost Row Handlers ────────────────────────────────────
    const handleExtraChange = (id: string, field: keyof ExtraCostItem, value: string) => {
        setExtraRows((prev) => {
            const next = prev.map((r) => r.id === id ? { ...r, [field]: value } : r);
            scheduleAutoSave(rows, adjRows, next);
            return next;
        });
    };

    const handleAddExtraRow = () => {
        setExtraRows((prev) => {
            const next = [...prev, EMPTY_EXTRA_COST_ROW()];
            scheduleAutoSave(rows, adjRows, next);
            return next;
        });
    };

    const handleDeleteExtraRow = (id: string) => {
        setExtraRows((prev) => {
            const next = prev.filter((r) => r.id !== id);
            scheduleAutoSave(rows, adjRows, next);
            return next;
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number, isAdj = false) => {
        if (e.key === "Tab" && !e.shiftKey && colIdx === 2 && rowIdx === (isAdj ? adjRows.length - 1 : rows.length - 1)) {
            e.preventDefault();
            if (isAdj) handleAddAdjRow(); else handleAddRow();
        }
        if (e.key === "Enter") { 
            e.preventDefault(); 
            if (isAdj) handleAddAdjRow(); else handleAddRow(); 
        }
    };

    // ── Calculations ──────────────────────────────────────────────────────────
    const baselineCalculations = useMemo(() => {
        let totalCost = 0;
        rows.forEach(r => {
            const price = getMaterialRowPrice(r, resItems || []);
            const qty = parseFloat(r.so_luong) || 0;
            totalCost += price * qty;
        });
        return { totalCost, count: rows.filter(r => r.ten || r.so_luong).length };
    }, [rows, resItems]);

    const adjCalculations = useMemo(() => {
        let totalPlusCost = 0;
        let totalMinusCost = 0;
        adjRows.forEach(r => {
            const price = getMaterialRowPrice(r, resItems || []);
            const qty = parseFloat(r.so_luong) || 0;
            const amount = price * qty;
            if (r.type === "PLUS") {
                totalPlusCost += amount;
            } else {
                totalMinusCost += amount;
            }
        });
        return { totalPlusCost, totalMinusCost, netAdjCost: totalPlusCost - totalMinusCost, count: adjRows.filter(r => r.ten || r.so_luong).length };
    }, [adjRows, resItems]);

    const netFinalCost = baselineCalculations.totalCost + adjCalculations.netAdjCost;

    const totalExtraCost = useMemo(() => {
        return extraRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }, [extraRows]);

    const assignedStaffCount = taskDetail?.assign_ids?.length || 0;
    const laborRewardCost = Number(taskDetail?.reward || 0);

    const grandTotalOrderCost = netFinalCost + laborRewardCost + totalExtraCost;

    // ── Grid Column Layout ────────────────────────────────────────────────────
    const COL_W = ["minmax(0, 3fr)", "minmax(0, 1.5fr)", "minmax(0, 1.2fr)", "minmax(0, 1.5fr)", "minmax(0, 1.8fr)", "minmax(0, 1.5fr)", "32px"];
    const COL_ADJ_W = [
        "105px",              // 1. Loại (+/-)
        "minmax(0, 2.5fr)",   // 2. Từ thư viện vật tư
        "minmax(0, 1.3fr)",   // 3. Quy cách
        "minmax(0, 1fr)",     // 4. Số lượng
        "minmax(0, 1.2fr)",   // 5. Đơn giá
        "minmax(0, 1.5fr)",   // 6. Thành tiền
        "minmax(0, 1.2fr)",   // 7. Phân bổ
        "125px",              // 8. Ngày yêu cầu
        "minmax(0, 1.6fr)",   // 9. Nhân viên yêu cầu
        "32px"                // 10. Delete
    ];

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
        <div className="py-2 w-full flex flex-col gap-6">
            
            {/* ── SECTION 1: VẬT TƯ GỐC ────────────────────────────────────── */}
            <div className="w-full overflow-x-auto border border-slate-200 rounded-xl p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 text-xs font-bold">
                            1
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                            Danh sách vật tư gốc (List gốc)
                        </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Tổng gốc: <strong className="text-slate-800">{formatMoney(baselineCalculations.totalCost)}</strong>
                    </span>
                </div>

                <div style={{ minWidth: 800 }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: COL_W.join(" "), gap: 4, marginBottom: 4 }}>
                        {["Từ thư viện vật tư", "Quy cách", "Số lượng", "Đơn giá", "Thành tiền", "Phân bổ", ""].map((label) => (
                            <div key={label} className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1 bg-slate-100 rounded whitespace-nowrap">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="flex flex-col gap-1">
                        {rows.map((row, rowIdx) => {
                            const price = getMaterialRowPrice(row, resItems || []);
                            const qty = parseFloat(row.so_luong) || 0;
                            const totalAmount = price * qty;

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

                                    {/* Quy cách (Có gợi ý 1/2 tấm, 1/4 tấm, v.v...) */}
                                    {(() => {
                                        const item = (resItems || []).find(it => it.name === row.ten || (row.ten && row.ten.startsWith(it.name)));
                                        const specs: any[] = (item as any)?.spec_rows || [];
                                        const optionsSet = new Set<string>();
                                        specs.forEach(s => {
                                            if (s.spec) optionsSet.add(s.spec);
                                            if (s.color) optionsSet.add(s.color);
                                            const specStr = [s.color, s.spec].filter(Boolean).join(" - ");
                                            if (specStr) optionsSet.add(specStr);
                                        });

                                        const defaultFractions = ["1/2 tấm", "1/4 tấm", "1/3 tấm", "3/4 tấm", "1/2", "1/4", "1/3", "3/4"];
                                        const itemSpecs = Array.from(new Set([...Array.from(optionsSet), ...defaultFractions]));

                                        return (
                                            <AutoComplete
                                                value={row.quy_cach}
                                                options={itemSpecs.map(spec => ({ value: spec }))}
                                                onChange={(val) => handleChange(row.id, "quy_cach", val)}
                                                filterOption={(inputValue, option) =>
                                                    (((option as any)?.value as string) || "").toLowerCase().includes(inputValue.toLowerCase())
                                                }
                                                style={{ width: "100%" }}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="VD: 1/2 tấm, 1/4..."
                                                    className={inputCls}
                                                    onKeyDown={(e) => handleKeyDown(e, rowIdx, 1)}
                                                />
                                            </AutoComplete>
                                        );
                                    })()}

                                    {/* Số lượng */}
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={row.so_luong}
                                        onChange={(e) => handleChange(row.id, "so_luong", e.target.value)}
                                        placeholder="VD: 5"
                                        className={inputCls}
                                        onKeyDown={(e) => handleKeyDown(e, rowIdx, 2)}
                                    />

                                    {/* Đơn giá */}
                                    <input
                                        readOnly
                                        value={price > 0 ? formatMoney(price) : "—"}
                                        placeholder="0 ₫"
                                        className={readOnlyCls}
                                        title="Đơn giá tự động từ kho"
                                    />

                                    {/* Thành tiền */}
                                    <input
                                        readOnly
                                        value={totalAmount > 0 ? formatMoney(totalAmount) : "—"}
                                        placeholder="0 ₫"
                                        className={readOnlyCls}
                                        title="Thành tiền"
                                    />

                                    {/* Địa điểm */}
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

                    {/* Add Baseline Row */}
                    <div className="flex items-center justify-between mt-3">
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 font-medium border border-dashed border-cyan-300 rounded-lg px-3 py-1.5 hover:bg-cyan-50 transition-colors"
                        >
                            <Plus size={13} />
                            Thêm dòng vật tư gốc
                        </button>
                    </div>
                </div>
            </div>


            {/* ── SECTION 2: YÊU CẦU BỔ SUNG / PHÁT SINH GIẢM ───────────────────── */}
            <div className="w-full overflow-x-auto border border-emerald-200 rounded-xl p-3 bg-emerald-50/20 shadow-2xs">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold">
                            2
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                            Yêu cầu vật tư bổ sung hoặc phát sinh giảm
                        </span>
                        <span className="text-[11px] text-slate-500 italic">
                            (Giữ nguyên list gốc, ghi rõ thời điểm & nhân viên yêu cầu)
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {adjCalculations.totalPlusCost > 0 && (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded">
                                + Bổ sung: {formatMoney(adjCalculations.totalPlusCost)}
                            </span>
                        )}
                        {adjCalculations.totalMinusCost > 0 && (
                            <span className="text-xs font-medium text-rose-700 bg-rose-100/80 border border-rose-200 px-2 py-0.5 rounded">
                                - Giảm: {formatMoney(adjCalculations.totalMinusCost)}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ minWidth: 1080 }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: COL_ADJ_W.join(" "), gap: 4, marginBottom: 4 }}>
                        {[
                            "Loại (+/-)", 
                            "Từ thư viện vật tư", 
                            "Quy cách", 
                            "Số lượng", 
                            "Đơn giá", 
                            "Thành tiền", 
                            "Phân bổ", 
                            "Ngày yêu cầu", 
                            "Nhân viên yêu cầu", 
                            ""
                        ].map((label) => (
                            <div key={label} className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-2 py-1 bg-emerald-100/60 rounded whitespace-nowrap">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Adjustment Rows */}
                    {adjRows.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-emerald-200 rounded-lg bg-white/60 text-slate-400 text-xs">
                            Chưa có yêu cầu vật tư bổ sung hoặc phát sinh giảm. Bấm <strong>"+ Thêm yêu cầu phát sinh"</strong> để bắt đầu.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {adjRows.map((row, rowIdx) => {
                                const price = getMaterialRowPrice(row, resItems || []);
                                const qty = parseFloat(row.so_luong) || 0;
                                const amount = price * qty;
                                const isPlus = row.type === "PLUS";

                                return (
                                    <div key={row.id} style={{ display: "grid", gridTemplateColumns: COL_ADJ_W.join(" "), gap: 4 }}>
                                        {/* 1. Loại (+/-) Toggle Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleAdjChange(row.id, "type", isPlus ? "MINUS" : "PLUS")}
                                            className={`h-[34px] w-full rounded border px-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
                                                isPlus 
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 active:scale-95" 
                                                    : "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100/80 active:scale-95"
                                            }`}
                                            title="Click để chuyển trạng thái Bổ sung (+) / Phát sinh giảm (-)"
                                        >
                                            {isPlus ? (
                                                <>
                                                    <ArrowUpRight size={13} strokeWidth={2.5} />
                                                    <span>+ Bổ sung</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowDownRight size={13} strokeWidth={2.5} />
                                                    <span>- Giảm</span>
                                                </>
                                            )}
                                        </button>

                                        {/* 2. Tên / Combobox */}
                                        <SuggestSelect
                                            value={row.ten}
                                            onChange={(opt) => handleAdjSelectMaterial(row.id, opt)}
                                            options={libraryOptions}
                                            placeholder="🔍 Chọn vật liệu..."
                                            className={inputCls}
                                        />

                                        {/* 3. Quy cách */}
                                        {(() => {
                                            const item = (resItems || []).find(it => it.name === row.ten || (row.ten && row.ten.startsWith(it.name)));
                                            const specs: any[] = (item as any)?.spec_rows || [];
                                            const optionsSet = new Set<string>();
                                            specs.forEach(s => {
                                                if (s.spec) optionsSet.add(s.spec);
                                                if (s.color) optionsSet.add(s.color);
                                                const specStr = [s.color, s.spec].filter(Boolean).join(" - ");
                                                if (specStr) optionsSet.add(specStr);
                                            });

                                            const defaultFractions = ["1/2 tấm", "1/4 tấm", "1/3 tấm", "3/4 tấm", "1/2", "1/4", "1/3", "3/4"];
                                            const itemSpecs = Array.from(new Set([...Array.from(optionsSet), ...defaultFractions]));

                                            return (
                                                <AutoComplete
                                                    value={row.quy_cach}
                                                    options={itemSpecs.map(spec => ({ value: spec }))}
                                                    onChange={(val) => handleAdjChange(row.id, "quy_cach", val)}
                                                    filterOption={(inputValue, option) =>
                                                        (((option as any)?.value as string) || "").toLowerCase().includes(inputValue.toLowerCase())
                                                    }
                                                    style={{ width: "100%" }}
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder="VD: 1/2 tấm, 1/4..."
                                                        className={inputCls}
                                                        onKeyDown={(e) => handleKeyDown(e, rowIdx, 1, true)}
                                                    />
                                                </AutoComplete>
                                            );
                                        })()}

                                        {/* 4. Số lượng */}
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={row.so_luong}
                                            onChange={(e) => handleAdjChange(row.id, "so_luong", e.target.value)}
                                            placeholder="VD: 2"
                                            className={inputCls}
                                            onKeyDown={(e) => handleKeyDown(e, rowIdx, 2, true)}
                                        />

                                        {/* 5. Đơn giá */}
                                        <input
                                            readOnly
                                            value={price > 0 ? formatMoney(price) : "—"}
                                            placeholder="0 ₫"
                                            className={readOnlyCls}
                                            title="Đơn giá tự động từ kho"
                                        />

                                        {/* 6. Thành tiền */}
                                        <input
                                            readOnly
                                            value={amount > 0 ? `${isPlus ? "+" : "-"}${formatMoney(amount)}` : "—"}
                                            placeholder="0 ₫"
                                            className={`text-sm border rounded px-2 py-1.5 w-full cursor-not-allowed font-medium ${
                                                amount > 0 
                                                    ? (isPlus ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-600")
                                                    : "bg-slate-50 border-slate-100 text-slate-500"
                                            }`}
                                            title="Thành tiền phát sinh"
                                        />

                                        {/* 7. Phân bổ */}
                                        <input
                                            readOnly
                                            value={row.dia_diem}
                                            placeholder="Kho..."
                                            className={readOnlyCls}
                                            title="Lấy tự động từ thư viện"
                                        />

                                        {/* 8. Ngày yêu cầu */}
                                        <input
                                            type="date"
                                            value={row.date || dayjs().format("YYYY-MM-DD")}
                                            onChange={(e) => handleAdjChange(row.id, "date", e.target.value)}
                                            className="text-xs border border-slate-200 rounded px-1.5 py-1.5 focus:outline-none focus:border-emerald-400 bg-white w-full"
                                            title="Thời điểm yêu cầu"
                                        />

                                        {/* 9. Nhân viên yêu cầu */}
                                        <ConfigProvider
                                            theme={{
                                                components: {
                                                    Select: {
                                                        controlHeight: 34,
                                                    }
                                                }
                                            }}
                                        >
                                            <Select
                                                showSearch
                                                value={row.requester_name || undefined}
                                                onChange={(val) => handleAdjChange(row.id, "requester_name", val)}
                                                placeholder="Chọn NV xưởng..."
                                                style={{ width: "100%" }}
                                                filterOption={(input, option) =>
                                                    ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                                                }
                                                options={staffOptions.map(s => ({
                                                    value: s.value,
                                                    label: s.label
                                                }))}
                                            />
                                        </ConfigProvider>

                                        {/* 10. Delete */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAdjRow(row.id)}
                                            className="flex items-center justify-center w-8 h-8 rounded hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-colors"
                                            title="Xoá dòng"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Adjustment Row */}
                    <div className="flex items-center justify-between mt-3">
                        <button
                            type="button"
                            onClick={handleAddAdjRow}
                            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-medium border border-dashed border-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-100/50 transition-colors"
                        >
                            <Plus size={13} />
                            Thêm yêu cầu bổ sung / phát sinh giảm
                        </button>
                    </div>
                </div>
            </div>


            {/* ── SECTION 3: PHÁT SINH CHI PHÍ KHÁC (CHƯA NGHĨ TỚI) ─────────────── */}
            <div className="w-full border border-amber-200 rounded-xl p-3 bg-amber-50/20 shadow-2xs">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-white text-xs font-bold">
                            3
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                            Phát sinh chi phí khác (Nội dung chưa lường trước, xe cẩu, keo, di chuyển...)
                        </span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        + Tổng phát sinh khác: {formatMoney(totalExtraCost)}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    {extraRows.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-amber-300 rounded-lg bg-white/80 text-slate-400 text-xs">
                            Chưa có mục phát sinh ngoài dự kiến. Bấm <strong>"+ Thêm khoản phát sinh"</strong> để nhập diễn giải & số tiền.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {extraRows.map((row) => (
                                <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                                    <div className="sm:col-span-5">
                                        <input
                                            type="text"
                                            value={row.title}
                                            onChange={(e) => handleExtraChange(row.id, "title", e.target.value)}
                                            placeholder="Tên chi phí / Diễn giải số liệu (VD: Thuê xe cẩu, mua keo thêm...)"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <input
                                            type="number"
                                            value={row.amount}
                                            onChange={(e) => handleExtraChange(row.id, "amount", e.target.value)}
                                            placeholder="Số tiền (đ)..."
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <input
                                            type="text"
                                            value={row.note}
                                            onChange={(e) => handleExtraChange(row.id, "note", e.target.value)}
                                            placeholder="Ghi chú chi tiết..."
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="sm:col-span-1 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteExtraRow(row.id)}
                                            className="flex items-center justify-center w-8 h-8 rounded hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-colors"
                                            title="Xóa mục phát sinh"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-2">
                        <button
                            type="button"
                            onClick={handleAddExtraRow}
                            className="flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 font-medium border border-dashed border-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-100/60 transition-colors"
                        >
                            <Plus size={13} />
                            Thêm khoản phát sinh / Diễn giải số liệu
                        </button>
                    </div>
                </div>
            </div>


            {/* ── SECTION 4: TỔNG HỢP CHI PHÍ TOÀN BỘ ĐƠN HÀNG ────────────────── */}
            <div className="w-full rounded-xl border border-slate-300 bg-slate-900 text-white p-4 shadow-md">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ClipboardList size={16} className="text-cyan-400" />
                        <span>Bảng Tổng hợp toàn bộ chi phí đơn hàng</span>
                    </div>
                    <span className="text-xs text-slate-400 font-normal">
                        {saving ? "Đang lưu..." : "Đã đồng bộ"}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* 1. Chi phí Vật tư */}
                    <div className="bg-slate-800/90 rounded-lg p-3 border border-slate-700 flex flex-col">
                        <span className="text-[11px] text-slate-400 font-medium">1. Chi phí Vật tư (Gốc + Điều chỉnh)</span>
                        <span className="text-sm font-bold text-cyan-300 mt-1">{formatMoney(netFinalCost)}</span>
                    </div>

                    {/* 2. Chi phí Nhân công */}
                    <div className="bg-slate-800/90 rounded-lg p-3 border border-slate-700 flex flex-col">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <UserCheck size={12} className="text-emerald-400" />
                            2. Nhân công ({assignedStaffCount} người)
                        </span>
                        <span className="text-sm font-bold text-emerald-400 mt-1">{formatMoney(laborRewardCost)}</span>
                    </div>

                    {/* 3. Phát sinh khác */}
                    <div className="bg-slate-800/90 rounded-lg p-3 border border-slate-700 flex flex-col">
                        <span className="text-[11px] text-slate-400 font-medium">3. Chi phí phát sinh khác</span>
                        <span className="text-sm font-bold text-amber-400 mt-1">{formatMoney(totalExtraCost)}</span>
                    </div>

                    {/* 4. Tổng chi phí đơn hàng */}
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg p-3 flex flex-col shadow-sm">
                        <span className="text-[11px] text-teal-100 font-medium">TỔNG CHI PHÍ THỰC TẾ ĐƠN HÀNG</span>
                        <span className="text-base font-black mt-1">{formatMoney(grandTotalOrderCost)}</span>
                    </div>
                </div>
            </div>

        </div>
    );
}

interface MaterialsTabProps {
    form?: FormInstance;
    userId?: string;
}

export default function MaterialsTab({ form, userId }: MaterialsTabProps) {
    return <MaterialsGrid form={form} userId={userId} />;
}
