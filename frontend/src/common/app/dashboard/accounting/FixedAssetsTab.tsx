import React, { useState, useMemo, useRef, useEffect } from "react";
import { Modal, notification, Popconfirm } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ChevronDown, ChevronRight, Trash2, PlusCircle, Check, X, Pencil, Search, Users, HardHat } from "lucide-react";
import { useUser } from "../../../common/hooks/useUser";
import {
  AccountingErpService,
  type FixedAsset,
  type FixedAssetEvent,
  type AssetPerson,
} from "../../../services/accounting-erp.service";
import { SummaryCard, StatusBadge, FA_STATUS_OPTIONS, formatMoney } from "./shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  purchase: { label: "Ngày mua", color: "bg-teal-100 text-teal-700", icon: "🛒" },
  maintenance: { label: "Ngày bảo trì", color: "bg-amber-100 text-amber-700", icon: "🔧" },
  responsible: { label: "Người phụ trách", color: "bg-purple-100 text-purple-700", icon: "👤" },
  volume: { label: "Thông tin khối lượng", color: "bg-emerald-100 text-emerald-700", icon: "⚖️" },
};

const emptyForm = {
  name: "",
  purchase_date: dayjs().format("YYYY-MM-DD"),
  cost: 0,
  salvage_value: 0,
  useful_life_months: 36,
  department: "Văn phòng",
  quantity: 1,
};

// ─── PersonPicker: combobox thông minh (tìm nhân viên/thầu phụ + nhập tự do) ─

type PersonValue = { name: string; phone: string };

function PersonPicker({
  value, onChange, people, placeholder = "Tên người...",
}: {
  value: PersonValue;
  onChange: (v: PersonValue) => void;
  people: AssetPerson[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!inputWrapRef.current) return;
      const r = inputWrapRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 240) });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const filtered = useMemo(() => {
    if (!q.trim()) return people;
    const kw = q.toLowerCase();
    return people.filter((p) => p.name.toLowerCase().includes(kw) || p.phone.includes(kw));
  }, [people, q]);

  const handleSelect = (p: AssetPerson) => {
    onChange({ name: p.name, phone: p.phone });
    setQ(p.name);
    setOpen(false);
  };

  const openDropdown = () => {
    if (!inputWrapRef.current) return;
    const r = inputWrapRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 240) });
    setOpen(true);
  };

  return (
    <div ref={ref} className="flex flex-col gap-1 w-full">
      <div ref={inputWrapRef} className="flex items-center border border-slate-300 rounded-md bg-white overflow-hidden">
        <Search size={11} className="ml-2 text-slate-400 shrink-0" />
        <input
          value={q !== "" ? q : (value.name || "")}
          onFocus={() => { setQ(value.name || ""); openDropdown(); }}
          onChange={(e) => { setQ(e.target.value); openDropdown(); }}
          onBlur={() => onChange({ name: q || value.name, phone: value.phone })}
          placeholder={placeholder}
          className="flex-1 px-2 py-1 text-xs outline-none bg-transparent"
        />
        {(value.name || q) && (
          <button type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange({ name: "", phone: "" }); setQ(""); setOpen(false); }}
            className="pr-1.5 text-slate-300 hover:text-slate-500">
            <X size={10} />
          </button>
        )}
      </div>

      {/* Fixed dropdown — vượt qua overflow:hidden của bảng */}
      {open && dropPos && (
        <div
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-400 italic">
              Không tìm thấy — sẽ lưu tên vừa nhập
            </div>
          ) : (
            filtered.map((p) => (
              <button key={p.id} type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
                className="w-full text-left px-3 py-2 hover:bg-teal-50 flex items-center gap-2 text-xs border-b border-slate-50 last:border-0 transition-colors"
              >
                {p.user_type === "subcontractor"
                  ? <HardHat size={13} className="text-amber-500 shrink-0" />
                  : <Users size={13} className="text-teal-500 shrink-0" />}
                <span className="font-medium text-slate-800">{p.name}</span>
                {p.phone && <span className="ml-auto text-slate-400 font-mono shrink-0 text-[11px]">{p.phone}</span>}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${p.user_type === "subcontractor"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-teal-100 text-teal-700"
                  }`}>
                  {p.user_type === "subcontractor" ? "Thầu phụ" : "NV"}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <input
        value={value.phone || ""}
        onChange={(e) => onChange({ name: value.name || q, phone: e.target.value })}
        placeholder="SĐT liên hệ..."
        className="border border-slate-300 rounded-md px-2 py-1 text-xs outline-none bg-white"
      />
    </div>
  );
}


// ─── Inline text cell ─────────────────────────────────────────────────────────

function InlineEdit({
  value, onSave, type = "text", placeholder = "",
}: {
  value: string; onSave: (v: string) => void; type?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const commit = () => { setEditing(false); if (local !== value) onSave(local); };
  if (editing)
    return (
      <input autoFocus type={type} value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="border border-teal-400 bg-teal-50 rounded px-2 py-1 text-xs w-full outline-none"
        placeholder={placeholder}
      />
    );
  return (
    <span title="Nhấp để sửa" onClick={() => { setLocal(value); setEditing(true); }}
      className="cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 text-xs inline-block w-full transition-colors">
      {value || <span className="text-slate-300 italic">{placeholder || "—"}</span>}
    </span>
  );
}

// ─── Inline status selector ───────────────────────────────────────────────────

function InlineStatus({ status, assetId, onUpdated }: {
  status: string; assetId: string; onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const updateMut = useMutation({
    mutationFn: (s: string) => AccountingErpService.updateFixedAsset(assetId, { status: s }),
    onSuccess: () => { onUpdated(); setEditing(false); },
    onError: (e: any) => notification.error({ message: e?.response?.data?.description || "Cập nhật thất bại" }),
  });
  if (editing)
    return (
      <select autoFocus value={status}
        className="text-xs border border-teal-400 rounded-md px-1 py-1 outline-none bg-teal-50 w-full"
        onBlur={() => setEditing(false)}
        onChange={(e) => updateMut.mutate(e.target.value)}
      >
        {FA_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  return (
    <span title="Nhấp để đổi trạng thái" onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className="cursor-pointer">
      <StatusBadge status={status} />
    </span>
  );
}

// ─── Sortable column header ───────────────────────────────────────────────────

function SortableHeader({ label, field, sortField, sortDir, onSort, className = "" }: {
  label: string; field: string; sortField: string | null; sortDir: "asc" | "desc";
  onSort: (f: string) => void; className?: string;
}) {
  const active = sortField === field;
  return (
    <th className={`px-3 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors whitespace-nowrap ${className}`}
      onClick={() => onSort(field)}
      title="Click để sắp xếp">
      <span className="flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${active ? "text-teal-500" : "text-slate-300"}`}>
          {active ? (sortDir === "asc" ? "▲" : "▼") : "▲▼"}
        </span>
      </span>
    </th>
  );
}

// ─── Event sub-row (inline CRUD like phát sinh / tạm ứng) ────────────────────

type EventForm = { event_type: string; event_date: string; person_name: string; note: string; };

const emptyEvent = {
  event_type: "purchase" as string,
  event_date: dayjs().format("YYYY-MM-DD"),
  person_name: "",
  person_phone: "",
  note: "",
};

function EventItem({
  event, assetId, people, isEditing, onStartEdit, onCancelEdit, onDeleted, onUpdated,
}: {
  event: FixedAssetEvent; assetId: string; people: AssetPerson[];
  isEditing: boolean; onStartEdit: () => void; onCancelEdit: () => void;
  onDeleted: () => void; onUpdated: (updated: FixedAssetEvent) => void;
}) {
  const meta = EVENT_TYPE_LABELS[event.event_type] || { label: event.event_type, color: "bg-slate-100 text-slate-600", icon: "📌" };
  const [saving, setSaving] = useState(false);
  const [dateVal, setDateVal] = useState(event.event_date ? dayjs(event.event_date).format("YYYY-MM-DD") : "");
  const [typeVal, setTypeVal] = useState(event.event_type);
  const [personVal, setPersonVal] = useState<{ name: string; phone: string }>({
    name: event.person_name || "",
    phone: event.person_phone || "",
  });
  const [noteVal, setNoteVal] = useState(event.note || "");

  React.useEffect(() => {
    if (!isEditing) {
      setDateVal(event.event_date ? dayjs(event.event_date).format("YYYY-MM-DD") : "");
      setTypeVal(event.event_type);
      setPersonVal({ name: event.person_name || "", phone: event.person_phone || "" });
      setNoteVal(event.note || "");
    }
  }, [event, isEditing]);

  const saveEdit = async () => {
    setSaving(true);
    try {
      await AccountingErpService.updateAssetEvent(assetId, event.id, {
        event_type: typeVal, event_date: dateVal,
        person_name: personVal.name, person_phone: personVal.phone, note: noteVal,
      });
      onUpdated({
        ...event, event_type: typeVal, event_date: dateVal,
        person_name: personVal.name, person_phone: personVal.phone, note: noteVal
      });
    } catch { }
    setSaving(false);
    onCancelEdit();
  };

  const handleDelete = async () => {
    try {
      await AccountingErpService.deleteAssetEvent(assetId, event.id);
      onDeleted();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.description || "Xóa thất bại" });
    }
  };

  if (isEditing) {
    const m = EVENT_TYPE_LABELS[typeVal] || { color: "bg-slate-100 text-slate-600" };
    return (
      <div className={`flex flex-wrap items-center gap-2 text-xs px-3 py-2 rounded-lg border ${m.color} border-current/20`}>
        <select value={typeVal} onChange={(e) => setTypeVal(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white outline-none">
          {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <input type="date" value={dateVal} onChange={(e) => setDateVal(e.target.value)}
          className="border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none bg-white" disabled={saving} />
        <div className="flex-1 min-w-[180px]">
          <PersonPicker value={personVal} onChange={setPersonVal} people={people} />
        </div>
        <input value={noteVal} onChange={(e) => setNoteVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") onCancelEdit(); }}
          placeholder="Ghi chú..."
          className="flex-1 min-w-[100px] border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none bg-white" disabled={saving} />
        <button onClick={saveEdit} disabled={saving} className="text-teal-600 hover:text-teal-800"><Check size={13} /></button>
        <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg border group/ev ${meta.color} border-current/10`}>
      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${meta.color}`}>
        {meta.icon} {meta.label}
      </span>
      <span className="whitespace-nowrap text-slate-600">
        {event.event_date ? dayjs(event.event_date).format("DD/MM/YYYY") : "—"}
      </span>
      {event.person_name && (
        <span className="font-medium text-slate-700 whitespace-nowrap">{event.person_name}</span>
      )}
      {event.person_phone && (
        <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap">{event.person_phone}</span>
      )}
      <span
        onClick={onStartEdit}
        className="flex-1 text-slate-400 italic truncate max-w-[220px] cursor-pointer hover:text-slate-600 hover:not-italic"
        title="Nhấp để sửa"
      >
        {event.note || <span className="text-slate-300">Thêm ghi chú...</span>}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover/ev:opacity-100 transition-opacity ml-auto">
        <button onClick={onStartEdit} className="p-1 rounded hover:bg-white text-slate-400 hover:text-teal-600 transition-colors">
          <Pencil size={11} />
        </button>
        <Popconfirm title="Xóa mục này?" onConfirm={handleDelete} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
          <button className="p-1 rounded hover:bg-white text-rose-400 hover:text-rose-600 transition-colors">
            <Trash2 size={11} />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
}

// ─── Event sub-panel (like PaymentSubRow) ─────────────────────────────────────

function EventSubPanel({ assetId, events, people, onEventsChanged }: {
  assetId: string;
  events: FixedAssetEvent[];
  people: AssetPerson[];
  onEventsChanged: (evs: FixedAssetEvent[]) => void;
}) {
  const [addForm, setAddForm] = useState(emptyEvent);
  const [addPersonVal, setAddPersonVal] = useState<{ name: string; phone: string }>({ name: "", phone: "" });
  const [addingLoading, setAddingLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = async () => {
    setAddingLoading(true);
    try {
      const res = await AccountingErpService.createAssetEvent(assetId, {
        ...addForm, person_name: addPersonVal.name, person_phone: addPersonVal.phone,
      });
      onEventsChanged([...events, res.data as FixedAssetEvent]);
      setAddForm(emptyEvent);
      setAddPersonVal({ name: "", phone: "" });
      notification.success({ message: "Đã thêm mục" });
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.description || "Thêm thất bại" });
    }
    setAddingLoading(false);
  };

  return (
    <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100">
      <div className="flex flex-col gap-1.5">
        {events.length === 0 && (
          <span className="text-xs text-slate-400 italic">Chưa có mục nào</span>
        )}

        {events.map((ev) => (
          <EventItem
            key={ev.id}
            event={ev}
            assetId={assetId}
            people={people}
            isEditing={editingId === ev.id}
            onStartEdit={() => setEditingId(ev.id)}
            onCancelEdit={() => setEditingId(null)}
            onDeleted={() => {
              setEditingId(null);
              onEventsChanged(events.filter((x) => x.id !== ev.id));
            }}
            onUpdated={(updated) => {
              setEditingId(null);
              onEventsChanged(events.map((x) => (x.id === updated.id ? updated : x)));
            }}
          />
        ))}

        {/* Quick-add row */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <select
            value={addForm.event_type}
            onChange={(e) => setAddForm((p) => ({ ...p, event_type: e.target.value }))}
            className={`text-xs border rounded-md px-2 py-1 cursor-pointer ${addForm.event_type === "purchase"
              ? "border-teal-300 bg-teal-50 text-teal-700"
              : addForm.event_type === "maintenance"
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-purple-300 bg-purple-50 text-purple-700"
              }`}
          >
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>

          <input type="date" value={addForm.event_date}
            onChange={(e) => setAddForm((p) => ({ ...p, event_date: e.target.value }))}
            className="text-xs border border-slate-200 rounded-md px-2 py-1"
          />

          <div className="flex-1 min-w-[210px]">
            <PersonPicker
              value={addPersonVal}
              onChange={setAddPersonVal}
              people={people}
              placeholder="Chọn / nhập tên người phụ trách..."
            />
          </div>


          <input
            value={addForm.note}
            onChange={(e) => setAddForm((p) => ({ ...p, note: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Ghi chú..."
            className="text-xs border border-slate-200 rounded-md px-2 py-1 flex-1 min-w-[120px]"
          />

          <button
            onClick={handleAdd}
            disabled={addingLoading}
            className={`text-xs text-white px-3 py-1 rounded-md transition-colors whitespace-nowrap ${addingLoading ? "opacity-40 cursor-not-allowed" : ""
              } ${addForm.event_type === "purchase"
                ? "bg-teal-500 hover:bg-teal-600"
                : addForm.event_type === "maintenance"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
          >
            {addingLoading ? "Đang lưu..." : "+ Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Asset expandable row ─────────────────────────────────────────────────────

function AssetRow({ row, people, onRefetch }: { row: FixedAsset; people: AssetPerson[]; onRefetch: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [events, setEvents] = useState<FixedAssetEvent[]>(row.events || []);
  React.useEffect(() => { setEvents(row.events || []); }, [row.events]);
  const remain = Math.max(0, (row.cost || 0) - (row.accumulated_depreciation || 0));

  return (
    <React.Fragment>
      <tr className="border-b last:border-0 hover:bg-slate-50/60 transition-colors group">
        <td className="px-3 py-3">
          <button onClick={() => setExpanded((v) => !v)} className="text-slate-400 hover:text-teal-600 transition-colors" title="Xem mục con">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-3 py-2"><div className="font-medium text-slate-700 text-xs leading-tight">{row.code}</div></td>
        <td className="px-3 py-2"><div className="font-semibold text-slate-800 text-sm">{row.name}</div></td>
        <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">{row.purchase_date ? dayjs(row.purchase_date).format("DD/MM/YYYY") : "—"}</td>
        <td className="px-3 py-2 text-xs text-center font-semibold text-slate-700">{row.quantity ?? 1}</td>
        <td className="px-3 py-2 text-xs text-right font-medium text-slate-700">{formatMoney(row.cost)} đ</td>
        <td className="px-3 py-2 text-xs text-right text-slate-500">{formatMoney(row.monthly_depreciation)} đ</td>
        <td className="px-3 py-2 text-xs text-right text-rose-600 font-medium">{formatMoney(row.accumulated_depreciation)} đ</td>
        <td className="px-3 py-2 text-xs text-right text-emerald-600 font-medium">{formatMoney(remain)} đ</td>
        <td className="px-3 py-2 text-xs text-slate-600">{row.department || "—"}</td>
        <td className="px-3 py-2"><InlineStatus status={row.status} assetId={row.id} onUpdated={onRefetch} /></td>
      </tr>
      {expanded && (
        <tr><td colSpan={11} className="p-0">
          <EventSubPanel assetId={row.id} events={events} people={people} onEventsChanged={setEvents} />
        </td></tr>
      )}
    </React.Fragment>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function FixedAssetsTab() {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();

  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const toggleSort = (field: string) => {
    setPage(1);
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const listQuery = useQuery({
    queryKey: ["fixed-assets", userLeadId],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.listFixedAssets({ lead: userLeadId })).data,
  });

  // Load people list (employees + subcontractors) for this lead
  const peopleQuery = useQuery({
    queryKey: ["fa-people", userLeadId],
    enabled: !!userLeadId,
    queryFn: async () => (await AccountingErpService.listPeopleForAsset(userLeadId!)).data,
    staleTime: 5 * 60 * 1000,
  });
  const people = (peopleQuery.data?.data || []) as AssetPerson[];

  const createMutation = useMutation({
    mutationFn: () => AccountingErpService.createFixedAsset({ ...form, lead_id: userLeadId }),
    onSuccess: async () => {
      notification.success({ message: "Đã tạo tài sản cố định" });
      setOpen(false); setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
    },
    onError: (e: any) => notification.error({ message: e?.response?.data?.description || "Tạo thất bại" }),
  });

  const depreciationMutation = useMutation({
    mutationFn: () => AccountingErpService.runDepreciation({ lead_id: userLeadId, period_key: month }),
    onSuccess: async (res) => {
      notification.success({ message: `Đã chạy khấu hao ${res.data?.count || 0} tài sản` });
      await queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
    },
    onError: (e: any) => notification.error({ message: e?.response?.data?.description || "Chạy khấu hao thất bại" }),
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });

  const allRows = useMemo(() => (listQuery.data?.data || []) as FixedAsset[], [listQuery.data]);
  const departments = useMemo(() => [...new Set(allRows.map((r) => r.department).filter(Boolean))] as string[], [allRows]);

  const hasActiveFilter = !!(filterStatus || filterDept || keyword);

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      rows = rows.filter((r) =>
        r.name?.toLowerCase().includes(kw) ||
        r.code?.toLowerCase().includes(kw) ||
        r.department?.toLowerCase().includes(kw)
      );
    }
    if (filterStatus) rows = rows.filter((r) => r.status === filterStatus);
    if (filterDept) rows = rows.filter((r) => r.department === filterDept);
    return rows;
  }, [allRows, keyword, filterStatus, filterDept]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let aV: number | string = 0, bV: number | string = 0;
      switch (sortField) {
        case "code": aV = a.code || ""; bV = b.code || ""; break;
        case "name": aV = a.name?.toLowerCase() || ""; bV = b.name?.toLowerCase() || ""; break;
        case "date": aV = a.purchase_date || ""; bV = b.purchase_date || ""; break;
        case "qty": aV = a.quantity ?? 1; bV = b.quantity ?? 1; break;
        case "cost": aV = a.cost || 0; bV = b.cost || 0; break;
        case "monthly": aV = a.monthly_depreciation || 0; bV = b.monthly_depreciation || 0; break;
        case "accum": aV = a.accumulated_depreciation || 0; bV = b.accumulated_depreciation || 0; break;
        case "remain": aV = (a.cost || 0) - (a.accumulated_depreciation || 0); bV = (b.cost || 0) - (b.accumulated_depreciation || 0); break;
        case "dept": aV = a.department?.toLowerCase() || ""; bV = b.department?.toLowerCase() || ""; break;
        case "status": aV = a.status || ""; bV = b.status || ""; break;
      }
      if (typeof aV === "string") return sortDir === "asc" ? aV.localeCompare(bV as string) : (bV as string).localeCompare(aV);
      return sortDir === "asc" ? aV - (bV as number) : (bV as number) - aV;
    });
  }, [filteredRows, sortField, sortDir]);

  const totalCount = sortedRows.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pageRows = pageSize === 0 ? sortedRows : sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalCost = filteredRows.reduce((s, r) => s + Number(r.cost || 0), 0);
  const totalAccum = filteredRows.reduce((s, r) => s + Number(r.accumulated_depreciation || 0), 0);

  const sortProps = { sortField, sortDir, onSort: (f: string) => { setPage(1); toggleSort(f); } };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard label="Nguyên giá" value={`${formatMoney(totalCost)} đ`} tone="teal" />
        <SummaryCard label="Hao mòn lũy kế" value={`${formatMoney(totalAccum)} đ`} tone="amber" />
        <SummaryCard label="Giá trị còn lại" value={`${formatMoney(totalCost - totalAccum)} đ`} tone="emerald" />
      </div>

      {/* Toolbar Row 1 */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <span className="text-xs text-slate-400 whitespace-nowrap">Tháng KH</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm outline-none bg-transparent" />
          </div>
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm tên / mã / bộ phận..."
            className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <button className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap" onClick={() => setOpen(true)}>
            + TSCĐ
          </button>
          <button
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            onClick={() => depreciationMutation.mutate()}
            disabled={depreciationMutation.isPending}
          >
            {depreciationMutation.isPending ? "Đang chạy..." : "Chạy khấu hao"}
          </button>
        </div>

        {/* Toolbar Row 2: filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600">
            <option value="">Trạng thái: Tất cả</option>
            {FA_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600">
            <option value="">Bộ phận: Tất cả</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600">
            {[20, 50, 100, 0].map((n) => (
              <option key={n} value={n}>{n === 0 ? "Tất cả" : `${n} / trang`}</option>
            ))}
          </select>

          {hasActiveFilter && (
            <button onClick={() => { setKeyword(""); setFilterStatus(""); setFilterDept(""); setPage(1); }}
              className="flex items-center gap-1 text-xs text-rose-500 border border-rose-200 rounded-lg px-2.5 py-1.5 hover:bg-rose-50 transition-colors">
              ✕ Xóa bộ lọc
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400">
            {filteredRows.length !== allRows.length
              ? `${filteredRows.length} / ${allRows.length} tài sản`
              : `${allRows.length} tài sản`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left" style={{ minWidth: 1100 }}>
          <thead>
            <tr className="text-[11px] text-slate-500 border-b bg-slate-50 uppercase tracking-wide">
              <th className="px-3 py-3 w-8" />
              <SortableHeader label="Mã" field="code" {...sortProps} />
              <SortableHeader label="Tên tài sản" field="name" {...sortProps} />
              <SortableHeader label="Ngày mua" field="date" {...sortProps} />
              <SortableHeader label="SL" field="qty" {...sortProps} className="text-center" />
              <SortableHeader label="Nguyên giá" field="cost" {...sortProps} className="text-right" />
              <SortableHeader label="KH/tháng" field="monthly" {...sortProps} className="text-right" />
              <SortableHeader label="Lũy kế" field="accum" {...sortProps} className="text-right" />
              <SortableHeader label="Còn lại" field="remain" {...sortProps} className="text-right" />
              <SortableHeader label="Bộ phận" field="dept" {...sortProps} />
              <SortableHeader label="Trạng thái" field="status" {...sortProps} />
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading ? (
              <tr><td colSpan={11} className="py-12 text-center text-slate-400 text-sm">Đang tải...</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                {hasActiveFilter ? "Không có kết quả phù hợp bộ lọc." : "Chưa có tài sản cố định nào."}
              </td></tr>
            ) : (
              pageRows.map((row) => <AssetRow key={row.id} row={row} people={people} onRefetch={refetch} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{totalCount} tài sản — trang {safePage}/{totalPages}</span>
          <div className="flex items-center gap-1">
            <button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(safePage - 2 + i, totalPages - 4 + i, totalPages));
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded border transition-colors ${p === safePage ? "bg-teal-500 text-white border-teal-500" : "border-slate-200 hover:bg-slate-50"}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">›</button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal title="Tạo tài sản cố định mới" open={open}
        onCancel={() => { setOpen(false); setForm(emptyForm); }}
        onOk={() => createMutation.mutate()}
        confirmLoading={createMutation.isPending}
        okText="Tạo" cancelText="Hủy" width={520}
      >
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tên tài sản *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="VD: Máy in Xerox 3020"
              className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Ngày mua</label>
              <input type="date" value={form.purchase_date} onChange={(e) => setForm((p) => ({ ...p, purchase_date: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Số lượng</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value || 1) }))}
                className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nguyên giá (đ)</label>
              <input type="number" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: Number(e.target.value || 0) }))}
                placeholder="0" className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Giá trị thu hồi</label>
              <input type="number" value={form.salvage_value} onChange={(e) => setForm((p) => ({ ...p, salvage_value: Number(e.target.value || 0) }))}
                placeholder="0" className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Số tháng KH</label>
              <input type="number" value={form.useful_life_months} onChange={(e) => setForm((p) => ({ ...p, useful_life_months: Number(e.target.value || 0) }))}
                placeholder="36" className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Bộ phận sử dụng</label>
            <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              placeholder="Văn phòng, Kho, Sản xuất..."
              className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
