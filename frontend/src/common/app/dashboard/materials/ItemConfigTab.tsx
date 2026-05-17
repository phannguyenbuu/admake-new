/**
 * Tab cấu hình vật tư — Quản lý danh sách trạng thái vật tư có thể tùy chỉnh.
 * Mỗi trạng thái có: nhãn, màu hiển thị, is_active (xác định có kích hoạt tồn kho không).
 */
import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Check, X, GripVertical } from "lucide-react";

// ─── Unit Types ────────────────────────────────────────────────────────────────
export const DEFAULT_UNITS: string[] = [
    "cái", "chiếc", "con", "chuyến",
    "kg", "tấn",
    "cây", "tấm",
];

const UNITS_STORAGE_KEY = (leadId: number) => `item_units_${leadId}`;

export function useItemUnits(leadId: number): [string[], (units: string[]) => void] {
    const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
    useEffect(() => {
        const raw = localStorage.getItem(UNITS_STORAGE_KEY(leadId));
        if (raw) { try { setUnits(JSON.parse(raw)); return; } catch { /* ignore */ } }
        setUnits([...DEFAULT_UNITS].sort((a, b) => a.localeCompare(b, 'vi')));
        const handler = () => {
            const r = localStorage.getItem(UNITS_STORAGE_KEY(leadId));
            if (r) { try { setUnits(JSON.parse(r)); } catch { /* ignore */ } }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [leadId]);
    const persist = (data: string[]) => {
        const sorted = [...data].sort((a, b) => a.localeCompare(b, 'vi'));
        setUnits(sorted);
        localStorage.setItem(UNITS_STORAGE_KEY(leadId), JSON.stringify(sorted));
    };
    return [units, persist];
}
// ─── Category Types ────────────────────────────────────────────────────────────────
export interface ItemCategory {
    id: string;    // slug
    name: string;
}

export const DEFAULT_CATEGORIES: ItemCategory[] = [
    { id: "nguyen_vat_lieu", name: "Nguyên vật liệu" },
    { id: "hang_hoa", name: "Hàng hóa" },
    { id: "ban_thanh_pham", name: "Bán thành phẩm" },
    { id: "thanh_pham", name: "Thành phẩm" },
];

const CATS_STORAGE_KEY = (leadId: number) => `item_categories_${leadId}`;

export function useItemCategories(leadId: number): [ItemCategory[], (cats: ItemCategory[]) => void] {
    const [cats, setCats] = useState<ItemCategory[]>(DEFAULT_CATEGORIES);
    useEffect(() => {
        const raw = localStorage.getItem(CATS_STORAGE_KEY(leadId));
        if (raw) { try { setCats(JSON.parse(raw)); return; } catch { /* ignore */ } }
        setCats([...DEFAULT_CATEGORIES].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
        const handler = () => {
            const r = localStorage.getItem(CATS_STORAGE_KEY(leadId));
            if (r) { try { setCats(JSON.parse(r)); } catch { /* ignore */ } }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [leadId]);
    const persist = (data: ItemCategory[]) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        setCats(sorted);
        localStorage.setItem(CATS_STORAGE_KEY(leadId), JSON.stringify(sorted));
    };
    return [cats, persist];
}

// ─── Status Types ─────────────────────────────────────────────────────────────
export interface ItemStatus {
    key: string;       // slug key duy nhất (viết thường, không dấu)
    label: string;     // nhãn hiển thị
    color: string;     // tailwind text color class
    bg: string;        // tailwind bg+border class
    counts_active: boolean; // có tính vào "đang dùng" / tồn không?
}

// ─── Default statuses ─────────────────────────────────────────────────────────
export const DEFAULT_ITEM_STATUSES: ItemStatus[] = [
    { key: "dang_dung", label: "Đang dùng", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", counts_active: true },
    { key: "khong_dung", label: "Không dùng", color: "text-slate-600", bg: "bg-slate-100 border-slate-200", counts_active: false },
    { key: "cho_nhap", label: "Chờ nhập", color: "text-sky-700", bg: "bg-sky-50 border-sky-200", counts_active: false },
    { key: "cho_ban", label: "Chờ bán", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", counts_active: false },
    { key: "cat_sai", label: "Cắt sai", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", counts_active: false },
    { key: "bo", label: "Bỏ", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", counts_active: false },
];

const COLOR_OPTIONS = [
    { label: "Xanh lá", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Xanh lam", color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
    { label: "Tím", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
    { label: "Cam", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    { label: "Đỏ", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
    { label: "Xám", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
    { label: "Teal", color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
];

const STORAGE_KEY = (leadId: number) => `item_statuses_${leadId}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slugify(str: string) {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_").slice(0, 32);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props { leadId: number; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function ItemConfigTab({ leadId }: Props) {
    const [statuses, setStatuses] = useState<ItemStatus[]>([]);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<ItemStatus>(DEFAULT_ITEM_STATUSES[0]);
    const [addOpen, setAddOpen] = useState(false);
    const [addLabel, setAddLabel] = useState("");
    const [addColor, setAddColor] = useState(COLOR_OPTIONS[0]);
    const [addCountsActive, setAddCountsActive] = useState(false);

    // Load
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY(leadId));
        if (raw) {
            try { setStatuses(JSON.parse(raw)); return; } catch { /* ignore */ }
        }
        setStatuses(DEFAULT_ITEM_STATUSES);
    }, [leadId]);

    const persist = (data: ItemStatus[]) => {
        setStatuses(data);
        localStorage.setItem(STORAGE_KEY(leadId), JSON.stringify(data));
    };

    const handleAdd = () => {
        if (!addLabel.trim()) return;
        const key = slugify(addLabel) || `status_${Date.now()}`;
        if (statuses.find(s => s.key === key)) {
            const n = key + "_" + Date.now().toString(36).slice(-4);
            persist([...statuses, { key: n, label: addLabel.trim(), color: addColor.color, bg: addColor.bg, counts_active: addCountsActive }]);
        } else {
            persist([...statuses, { key, label: addLabel.trim(), color: addColor.color, bg: addColor.bg, counts_active: addCountsActive }]);
        }
        setAddLabel("");
        setAddOpen(false);
    };

    const handleStartEdit = (s: ItemStatus) => {
        setEditingKey(s.key);
        setEditForm({ ...s });
    };

    const handleSaveEdit = () => {
        persist(statuses.map(s => s.key === editingKey ? { ...editForm } : s));
        setEditingKey(null);
    };

    const handleDelete = (key: string) => {
        if (DEFAULT_ITEM_STATUSES.find(d => d.key === key)) {
            // không xóa default, chỉ ẩn nếu muốn
            alert("Không thể xóa trạng thái mặc định.");
            return;
        }
        persist(statuses.filter(s => s.key !== key));
    };

    const handleReset = () => {
        persist(DEFAULT_ITEM_STATUSES);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-700">Danh sách trạng thái vật tư</div>
                    <div className="text-xs text-slate-400 mt-0.5">Tùy chỉnh các trạng thái hiển thị trong dropdown trạng thái vật tư.</div>
                </div>
                <button
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
                >
                    Reset mặc định
                </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[28px_1fr_120px_100px_60px] gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div />
                <div>Nhãn / Key</div>
                <div>Màu sắc</div>
                <div>Tính "active"</div>
                <div className="text-center">Thao tác</div>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-1.5">
                {statuses.map((s) => {
                    const isEditing = editingKey === s.key;
                    const isDefault = Boolean(DEFAULT_ITEM_STATUSES.find(d => d.key === s.key));

                    return (
                        <div key={s.key} className="grid grid-cols-[28px_1fr_120px_100px_60px] gap-2 items-center px-3 py-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors">
                            {/* Drag handle (decorative) */}
                            <GripVertical size={14} className="text-slate-300" />

                            {/* Label + key */}
                            {isEditing ? (
                                <div className="flex flex-col gap-1">
                                    <input
                                        autoFocus
                                        value={editForm.label}
                                        onChange={(e) => setEditForm(p => ({ ...p, label: e.target.value }))}
                                        className="rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:border-teal-400"
                                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditingKey(null); }}
                                    />
                                    <span className="text-xs text-slate-400">{editForm.key}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-0.5">
                                    <span className={`inline-flex self-start items-center px-2 py-0.5 rounded-full border text-xs font-medium ${s.bg} ${s.color}`}>
                                        {s.label}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">{s.key}</span>
                                </div>
                            )}

                            {/* Color */}
                            {isEditing ? (
                                <select
                                    className="rounded border border-slate-200 px-2 py-1 text-xs"
                                    value={editForm.color}
                                    onChange={(e) => {
                                        const opt = COLOR_OPTIONS.find(c => c.color === e.target.value);
                                        if (opt) setEditForm(p => ({ ...p, color: opt.color, bg: opt.bg }));
                                    }}
                                >
                                    {COLOR_OPTIONS.map(opt => (
                                        <option key={opt.color} value={opt.color}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full border ${s.bg}`} />
                                    <span className="text-xs text-slate-500">
                                        {COLOR_OPTIONS.find(c => c.color === s.color)?.label ?? "Tuỳ chỉnh"}
                                    </span>
                                </div>
                            )}

                            {/* Counts as active */}
                            {isEditing ? (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.counts_active}
                                        onChange={(e) => setEditForm(p => ({ ...p, counts_active: e.target.checked }))}
                                        className="accent-teal-500"
                                    />
                                    <span className="text-xs text-slate-600">Có</span>
                                </label>
                            ) : (
                                <div className="flex items-center">
                                    {s.counts_active
                                        ? <span className="text-xs text-emerald-600 font-medium">✓ Active</span>
                                        : <span className="text-xs text-slate-400">—</span>}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="p-1.5 rounded hover:bg-teal-50 text-teal-500 transition-colors"><Check size={13} /></button>
                                        <button onClick={() => setEditingKey(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"><X size={13} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleStartEdit(s)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Sửa"><Pencil size={13} /></button>
                                        {!isDefault && (
                                            <button onClick={() => handleDelete(s.key)} className="p-1.5 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors" title="Xóa"><Trash2 size={13} /></button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add new */}
            {addOpen ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/30 px-3 py-2.5">
                    <input
                        autoFocus
                        value={addLabel}
                        onChange={(e) => setAddLabel(e.target.value)}
                        placeholder="Tên trạng thái..."
                        className="flex-1 min-w-[120px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:border-teal-400 bg-white"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddOpen(false); }}
                    />
                    <select
                        value={addColor.color}
                        onChange={(e) => {
                            const opt = COLOR_OPTIONS.find(c => c.color === e.target.value);
                            if (opt) setAddColor(opt);
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white"
                    >
                        {COLOR_OPTIONS.map(opt => <option key={opt.color} value={opt.color}>{opt.label}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={addCountsActive} onChange={(e) => setAddCountsActive(e.target.checked)} className="accent-teal-500" />
                        Tính active
                    </label>
                    <button onClick={handleAdd} disabled={!addLabel.trim()} className="flex items-center gap-1 rounded-lg bg-teal-500 text-white px-3 py-1.5 text-sm font-semibold hover:bg-teal-600 disabled:opacity-40 transition-colors flex-shrink-0">
                        <Check size={13} /> Lưu
                    </button>
                    <button onClick={() => setAddOpen(false)} className="rounded-lg border border-slate-200 text-slate-500 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors flex-shrink-0">Huỷ</button>
                </div>
            ) : (
                <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-1.5 text-sm text-teal-600 font-medium border border-dashed border-teal-300 rounded-xl px-4 py-2 hover:bg-teal-50 transition-colors"
                >
                    <Plus size={14} /> Thêm trạng thái
                </button>
            )}

            {/* Note */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
                💡 Trạng thái mặc định (6 trạng thái đầu) không thể xóa nhưng có thể đổi nhãn và màu. Trạng thái có "Tính active" sẽ được đếm vào số vật tư đang hoạt động.
            </div>

            {/* Divider */}
            <hr className="border-slate-200" />

            {/* Unit config section */}
            <UnitConfigSection leadId={leadId} />

            {/* Divider */}
            <hr className="border-slate-200" />

            {/* Category config section */}
            <CategoryConfigSection leadId={leadId} />
        </div>
    );
}

// ─── Category Config Section ─────────────────────────────────────────────────────
function CategoryConfigSection({ leadId }: { leadId: number }) {
    const [cats, persistCats] = useItemCategories(leadId);
    const [addOpen, setAddOpen] = useState(false);
    const [newCat, setNewCat] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editVal, setEditVal] = useState("");

    function slugify(s: string) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 32);
    }

    const handleAdd = () => {
        const name = newCat.trim();
        if (!name) return;
        const id = slugify(name) || `cat_${Date.now().toString(36)}`;
        if (cats.find(c => c.id === id || c.name === name)) return;
        persistCats([...cats, { id, name }]);
        setNewCat("");
        setAddOpen(false);
    };

    const handleDelete = (id: string) => {
        if (DEFAULT_CATEGORIES.find(c => c.id === id)) { alert("Không thể xóa nhóm mặc định."); return; }
        persistCats(cats.filter(c => c.id !== id));
    };

    const handleSaveEdit = () => {
        const name = editVal.trim();
        if (!name || !editingId) return;
        persistCats(cats.map(c => c.id === editingId ? { ...c, name } : c));
        setEditingId(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-700">Nhóm vật tư</div>
                    <div className="text-xs text-slate-400 mt-0.5">Danh sách nhóm xuất hiện trong dropdown khi tạo / sửa vật tư.
                    </div>
                </div>
                <button onClick={() => persistCats([...DEFAULT_CATEGORIES])}
                    className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                    Reset mặc định
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {cats.map(c => (
                    <div key={c.id} className="group flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-700 hover:border-slate-300 transition-colors">
                        {editingId === c.id ? (
                            <>
                                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                    className="w-28 text-xs border-b border-teal-400 outline-none bg-transparent" />
                                <button onClick={handleSaveEdit} className="text-teal-500 hover:text-teal-700"><Check size={11} /></button>
                                <button onClick={() => setEditingId(null)} className="text-slate-400"><X size={11} /></button>
                            </>
                        ) : (
                            <>
                                <span>{c.name}</span>
                                <button onClick={() => { setEditingId(c.id); setEditVal(c.name); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"><Pencil size={10} /></button>
                                {!DEFAULT_CATEGORIES.find(d => d.id === c.id) && (
                                    <button onClick={() => handleDelete(c.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity"><X size={10} /></button>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {addOpen ? (
                    <div className="flex items-center gap-1.5 border border-teal-200 bg-teal-50/40 rounded-full px-3 py-1">
                        <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddOpen(false); }}
                            placeholder="Tên nhóm mới..."
                            className="w-32 text-xs outline-none bg-transparent" />
                        <button onClick={handleAdd} disabled={!newCat.trim()} className="text-teal-500 hover:text-teal-700 disabled:opacity-40"><Check size={12} /></button>
                        <button onClick={() => setAddOpen(false)} className="text-slate-400"><X size={12} /></button>
                    </div>
                ) : (
                    <button onClick={() => setAddOpen(true)}
                        className="flex items-center gap-1 border border-dashed border-teal-300 rounded-full px-3 py-1 text-xs text-teal-600 font-medium hover:bg-teal-50 transition-colors">
                        <Plus size={11} /> Thêm
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Unit Config Section ───────────────────────────────────────────────────────
function UnitConfigSection({ leadId }: { leadId: number }) {
    const [units, persistUnits] = useItemUnits(leadId);
    const [addOpen, setAddOpen] = useState(false);
    const [newUnit, setNewUnit] = useState("");
    const [editingUnit, setEditingUnit] = useState<string | null>(null);
    const [editVal, setEditVal] = useState("");

    const handleAdd = () => {
        const v = newUnit.trim();
        if (!v || units.includes(v)) return;
        persistUnits([...units, v]);
        setNewUnit("");
        setAddOpen(false);
    };

    const handleDelete = (u: string) => {
        if (DEFAULT_UNITS.includes(u)) { alert("Không thể xóa đơn vị mặc định."); return; }
        persistUnits(units.filter(x => x !== u));
    };

    const handleSaveEdit = () => {
        const v = editVal.trim();
        if (!v || !editingUnit) return;
        if (units.includes(v) && v !== editingUnit) return;
        persistUnits(units.map(u => u === editingUnit ? v : u));
        setEditingUnit(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-700">Đơn vị tính</div>
                    <div className="text-xs text-slate-400 mt-0.5">Danh sách đơn vị tính xuất hiện trong dropdown khi tạo / sửa vật tư.</div>
                </div>
                <button onClick={() => persistUnits([...DEFAULT_UNITS])}
                    className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                    Reset mặc định
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {units.map(u => (
                    <div key={u} className="group flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-700 hover:border-slate-300 transition-colors">
                        {editingUnit === u ? (
                            <>
                                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingUnit(null); }}
                                    className="w-16 text-xs border-b border-teal-400 outline-none bg-transparent" />
                                <button onClick={handleSaveEdit} className="text-teal-500 hover:text-teal-700"><Check size={11} /></button>
                                <button onClick={() => setEditingUnit(null)} className="text-slate-400 hover:text-slate-600"><X size={11} /></button>
                            </>
                        ) : (
                            <>
                                <span>{u}</span>
                                <button onClick={() => { setEditingUnit(u); setEditVal(u); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"><Pencil size={10} /></button>
                                {!DEFAULT_UNITS.includes(u) && (
                                    <button onClick={() => handleDelete(u)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity"><X size={10} /></button>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {addOpen ? (
                    <div className="flex items-center gap-1.5 border border-teal-200 bg-teal-50/40 rounded-full px-3 py-1">
                        <input autoFocus value={newUnit} onChange={e => setNewUnit(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddOpen(false); }}
                            placeholder="Đơn vị mới..."
                            className="w-24 text-xs outline-none bg-transparent" />
                        <button onClick={handleAdd} disabled={!newUnit.trim()} className="text-teal-500 hover:text-teal-700 disabled:opacity-40"><Check size={12} /></button>
                        <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
                    </div>
                ) : (
                    <button onClick={() => setAddOpen(true)}
                        className="flex items-center gap-1 border border-dashed border-teal-300 rounded-full px-3 py-1 text-xs text-teal-600 font-medium hover:bg-teal-50 transition-colors">
                        <Plus size={11} /> Thêm
                    </button>
                )}
            </div>
        </div>
    );
}


// ─── Re-export hook để dùng ở page.tsx ────────────────────────────────────────
export function useItemStatuses(leadId: number): ItemStatus[] {
    const [statuses, setStatuses] = useState<ItemStatus[]>(DEFAULT_ITEM_STATUSES);
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY(leadId));
        if (raw) { try { setStatuses(JSON.parse(raw)); return; } catch { /* ignore */ } }
        setStatuses(DEFAULT_ITEM_STATUSES);
        // Listen for changes from config tab
        const handler = () => {
            const r = localStorage.getItem(STORAGE_KEY(leadId));
            if (r) { try { setStatuses(JSON.parse(r)); } catch { /* ignore */ } }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [leadId]);
    return statuses;
}
