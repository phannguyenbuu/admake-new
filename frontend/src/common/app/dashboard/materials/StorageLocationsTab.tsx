import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, Trash2, Plus, Check, X, MapPin, Map, Search, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StorageLocation {
    id: string;
    name: string;
    category: LocationCategory;
    note?: string;
    lat?: number;
    lng?: number;
    address?: string; // địa chỉ đầy đủ từ geocoding
}

export type LocationCategory =
    | "kho"
    | "cong_ty"
    | "van_phong"
    | "cong_trinh"
    | "nha_rieng"
    | "khac";

export const LOCATION_CATEGORIES: {
    key: LocationCategory;
    label: string;
    color: string;
    bg: string;
}[] = [
        { key: "kho", label: "Kho", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
        { key: "cong_ty", label: "Công ty", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
        { key: "van_phong", label: "Văn phòng", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
        { key: "cong_trinh", label: "Công trình", color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
        { key: "nha_rieng", label: "Nhà riêng", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
        { key: "khac", label: "Khác", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
    ];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const STORAGE_KEY = (leadId: number) => `storage_locations_${leadId}`;

function getCategoryMeta(key: LocationCategory) {
    return LOCATION_CATEGORIES.find((c) => c.key === key) ?? LOCATION_CATEGORIES[5];
}

// ─── Nominatim geocoding (OpenStreetMap, no key required) ────────────────────
interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

async function searchPlaces(query: string): Promise<NominatimResult[]> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query + " Việt Nam"
    )}&format=json&limit=6&addressdetails=0`;
    const res = await fetch(url, { headers: { "Accept-Language": "vi" } });
    if (!res.ok) return [];
    return res.json();
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { "Accept-Language": "vi" } });
    if (!res.ok) return "";
    const data = await res.json();
    return data.display_name ?? "";
}

// ─── Map Picker Modal ─────────────────────────────────────────────────────────
interface MapPickerProps {
    initialLat?: number;
    initialLng?: number;
    onConfirm: (lat: number, lng: number, address: string) => void;
    onClose: () => void;
}

function MapPickerModal({ initialLat, initialLng, onConfirm, onClose }: MapPickerProps) {
    // Default center: Hà Nội
    const defaultLat = initialLat ?? 21.0285;
    const defaultLng = initialLng ?? 105.8542;
    const defaultZoom = initialLat ? 15 : 12;

    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [pinLat, setPinLat] = useState(defaultLat);
    const [pinLng, setPinLng] = useState(defaultLng);
    const [resolvedAddress, setResolvedAddress] = useState(initialLat ? "" : "");
    const [geoLoading, setGeoLoading] = useState(false);
    const [mapZoom, setMapZoom] = useState(defaultZoom);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Tạo Google Maps embed URL (no API key - embed basic map)
    // Dùng OpenStreetMap iframe làm fallback nếu không có key
    // Strategy: dùng OSM iframe + click để pick
    const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${(pinLng - 0.01).toFixed(4)
        },${(pinLat - 0.008).toFixed(4)},${(pinLng + 0.01).toFixed(4)},${(
            pinLat + 0.008
        ).toFixed(4)}&layer=mapnik&marker=${pinLat.toFixed(6)},${pinLng.toFixed(6)}`;

    // Google Maps iframe (cần click link bên ngoài)
    const gmapSrc = `https://maps.google.com/maps?q=${pinLat},${pinLng}&z=${mapZoom}&output=embed&hl=vi`;

    const doSearch = async (q: string) => {
        if (!q.trim()) { setResults([]); return; }
        setSearching(true);
        try {
            const data = await searchPlaces(q);
            setResults(data);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchChange = (v: string) => {
        setSearchQuery(v);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => doSearch(v), 600);
    };

    const handlePickResult = async (r: NominatimResult) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        setPinLat(lat);
        setPinLng(lng);
        setMapZoom(16);
        setResolvedAddress(r.display_name);
        setResults([]);
        setSearchQuery(r.display_name.split(",").slice(0, 2).join(","));
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) return;
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setPinLat(lat);
                setPinLng(lng);
                setMapZoom(17);
                const addr = await reverseGeocode(lat, lng);
                setResolvedAddress(addr);
                setSearchQuery(addr.split(",").slice(0, 2).join(","));
                setGeoLoading(false);
            },
            () => setGeoLoading(false)
        );
    };

    const handleConfirm = () => {
        onConfirm(pinLat, pinLng, resolvedAddress);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <Map size={18} className="text-teal-500" />
                    <span className="font-semibold text-slate-800">Chọn vị trí trên bản đồ</span>
                    <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Search bar */}
                <div className="px-5 py-3 border-b border-slate-100 space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Tìm kiếm địa điểm, địa chỉ..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                            />
                            {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-400 animate-spin" />}
                        </div>
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={geoLoading}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors disabled:opacity-60"
                            title="Dùng vị trí hiện tại"
                        >
                            {geoLoading ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
                            Vị trí của tôi
                        </button>
                    </div>

                    {/* Search results dropdown */}
                    {results.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                            {results.map((r) => (
                                <button
                                    key={r.place_id}
                                    onClick={() => handlePickResult(r)}
                                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 border-b last:border-0 border-slate-100 transition-colors"
                                >
                                    <span className="font-medium">{r.display_name.split(",")[0]}</span>
                                    <span className="text-xs text-slate-400 ml-2">
                                        {r.display_name.split(",").slice(1, 3).join(",")}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map iframe (OSM embed — no API key needed) */}
                <div className="relative flex-1 min-h-[320px]">
                    <iframe
                        key={`${pinLat.toFixed(5)}-${pinLng.toFixed(5)}`}
                        src={osmSrc}
                        width="100%"
                        height="100%"
                        style={{ border: "none", minHeight: 320 }}
                        title="Bản đồ"
                    />
                    {/* Overlay: click-to-pick instruction */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
                        📍 Vị trí đã chọn: {pinLat.toFixed(5)}, {pinLng.toFixed(5)}
                    </div>
                </div>

                {/* Google Maps link */}
                <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    <a
                        href={`https://maps.google.com/?q=${pinLat},${pinLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                        🗺 Mở trong Google Maps
                    </a>
                    {resolvedAddress && (
                        <span className="text-xs text-slate-500 truncate ml-2">
                            📌 {resolvedAddress.split(",").slice(0, 3).join(",")}
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
                    <div className="flex-1 min-w-0">
                        {resolvedAddress ? (
                            <div className="text-xs text-slate-500 truncate">
                                <span className="font-medium text-slate-700">Địa chỉ:</span>{" "}
                                {resolvedAddress.split(",").slice(0, 4).join(",")}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400">Tìm kiếm hoặc dùng vị trí hiện tại để chọn địa điểm</div>
                        )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                            Huỷ
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors flex items-center gap-1.5"
                        >
                            <Check size={14} />
                            Xác nhận vị trí
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
    leadId: number;
    selectable?: boolean;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StorageLocationsTab({
    leadId,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
}: Props) {
    const [locations, setLocations] = useState<StorageLocation[]>([]);
    const [filterCat, setFilterCat] = useState<LocationCategory | "">("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: "", category: "kho" as LocationCategory, note: "", lat: 0, lng: 0, address: "" });
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: "", category: "kho" as LocationCategory, note: "", lat: 0, lng: 0, address: "" });
    const [mapPickerFor, setMapPickerFor] = useState<"add" | "edit" | null>(null);

    // Persist
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY(leadId));
        if (raw) { try { setLocations(JSON.parse(raw)); } catch { /* ignore */ } }
    }, [leadId]);

    const persist = (data: StorageLocation[]) => {
        setLocations(data);
        localStorage.setItem(STORAGE_KEY(leadId), JSON.stringify(data));
    };

    // ── CRUD ──────────────────────────────────────────────────────────────────
    const handleAdd = () => {
        if (!addForm.name.trim()) return;
        persist([...locations, { id: uid(), ...addForm }]);
        setAddForm({ name: "", category: "kho", note: "", lat: 0, lng: 0, address: "" });
        setAddOpen(false);
    };

    const handleStartEdit = (loc: StorageLocation) => {
        setEditingId(loc.id);
        setEditForm({ name: loc.name, category: loc.category, note: loc.note ?? "", lat: loc.lat ?? 0, lng: loc.lng ?? 0, address: loc.address ?? "" });
    };

    const handleSaveEdit = () => {
        if (!editForm.name.trim()) return;
        persist(locations.map((l) => l.id === editingId ? { ...l, ...editForm } : l));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        persist(locations.filter((l) => l.id !== id));
        onSelectionChange?.(selectedIds.filter((s) => s !== id));
    };

    const toggleSelect = (id: string) => {
        if (!selectable || !onSelectionChange) return;
        onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
    };

    // ── Map picker callback ───────────────────────────────────────────────────
    const handleMapConfirm = (lat: number, lng: number, address: string) => {
        if (mapPickerFor === "add") {
            const shortName = address.split(",")[0].trim();
            setAddForm((p) => ({
                ...p,
                lat, lng, address,
                name: p.name || shortName,
            }));
        } else if (mapPickerFor === "edit") {
            setEditForm((p) => ({ ...p, lat, lng, address }));
        }
        setMapPickerFor(null);
    };

    const displayed = filterCat ? locations.filter((l) => l.category === filterCat) : locations;

    return (
        <div className="flex flex-col gap-4">
            {/* Map picker modal */}
            {mapPickerFor && (
                <MapPickerModal
                    initialLat={mapPickerFor === "edit" ? editForm.lat || undefined : addForm.lat || undefined}
                    initialLng={mapPickerFor === "edit" ? editForm.lng || undefined : addForm.lng || undefined}
                    onConfirm={handleMapConfirm}
                    onClose={() => setMapPickerFor(null)}
                />
            )}

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 pt-1">
                <button
                    onClick={() => setFilterCat("")}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filterCat === "" ? "bg-slate-700 border-slate-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                >
                    Tất cả ({locations.length})
                </button>
                {LOCATION_CATEGORIES.map((cat) => {
                    const cnt = locations.filter((l) => l.category === cat.key).length;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => setFilterCat(filterCat === cat.key ? "" : cat.key)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filterCat === cat.key ? `${cat.bg} ${cat.color}` : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            {cat.label}{cnt > 0 && <span className="ml-0.5 opacity-70">({cnt})</span>}
                        </button>
                    );
                })}
            </div>

            {/* Location list */}
            <div className="flex flex-col gap-2">
                {displayed.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                        Chưa có địa điểm nào. Nhấn "+ Thêm địa điểm" để bắt đầu.
                    </div>
                )}
                {displayed.map((loc) => {
                    const cat = getCategoryMeta(loc.category);
                    const isEditing = editingId === loc.id;
                    const isSelected = selectedIds.includes(loc.id);
                    const hasCoords = loc.lat && loc.lng;

                    return (
                        <div
                            key={loc.id}
                            className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${isSelected ? "border-teal-400 bg-teal-50/70 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                                } ${selectable ? "cursor-pointer" : ""}`}
                            onClick={() => !isEditing && toggleSelect(loc.id)}
                        >
                            {/* Checkbox */}
                            {selectable && (
                                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "border-teal-500 bg-teal-500" : "border-slate-300"
                                    }`}>
                                    {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                </div>
                            )}

                            <MapPin size={14} className={`flex-shrink-0 mt-0.5 ${cat.color}`} />

                            {/* Content */}
                            {isEditing ? (
                                <div className="flex flex-1 flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        autoFocus
                                        value={editForm.name}
                                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                                        className="flex-1 min-w-[120px] rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:border-teal-400"
                                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditingId(null); }}
                                    />
                                    <select
                                        value={editForm.category}
                                        onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value as LocationCategory }))}
                                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                                    >
                                        {LOCATION_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                                    </select>
                                    <input
                                        value={editForm.note}
                                        onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
                                        placeholder="Ghi chú..."
                                        className="flex-1 min-w-[80px] rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-teal-400"
                                    />
                                    {/* Map pick button */}
                                    <button
                                        type="button"
                                        onClick={() => setMapPickerFor("edit")}
                                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${editForm.lat ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                            }`}
                                        title="Chọn trên bản đồ"
                                    >
                                        <Map size={11} />
                                        {editForm.lat ? "Đã chọn" : "Bản đồ"}
                                    </button>
                                    <button onClick={handleSaveEdit} className="p-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600"><Check size={13} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={13} /></button>
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm text-slate-800">{loc.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>{cat.label}</span>
                                        {hasCoords && (
                                            <a
                                                href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                                                title="Mở Google Maps"
                                            >
                                                <Map size={11} />
                                                Google Maps
                                            </a>
                                        )}
                                    </div>
                                    {loc.address && (
                                        <div className="text-xs text-slate-400 truncate">{loc.address.split(",").slice(0, 4).join(",")}</div>
                                    )}
                                    {loc.note && !loc.address && (
                                        <div className="text-xs text-slate-400 truncate">{loc.note}</div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            {!isEditing && (
                                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleStartEdit(loc)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Sửa">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(loc.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Xóa">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add new */}
            {addOpen ? (
                <div className="rounded-xl border border-teal-200 bg-teal-50/40 px-3 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <MapPin size={14} className="text-teal-500 flex-shrink-0" />
                        <input
                            autoFocus
                            value={addForm.name}
                            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Tên địa điểm..."
                            className="flex-1 min-w-[130px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:border-teal-400 bg-white"
                            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddOpen(false); }}
                        />
                        <select
                            value={addForm.category}
                            onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value as LocationCategory }))}
                            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white flex-shrink-0"
                        >
                            {LOCATION_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                        <input
                            value={addForm.note}
                            onChange={(e) => setAddForm((p) => ({ ...p, note: e.target.value }))}
                            placeholder="Ghi chú..."
                            className="flex-1 min-w-[90px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:border-teal-400 bg-white"
                        />
                        <button
                            type="button"
                            onClick={() => setMapPickerFor("add")}
                            title="Chọn vị trí trên bản đồ"
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border flex-shrink-0 transition-colors ${addForm.lat
                                    ? "border-teal-400 bg-teal-100 text-teal-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            <Map size={12} />
                            {addForm.lat ? "✓ Map" : "📍 Map"}
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!addForm.name.trim()}
                            className="flex items-center gap-1 rounded-lg bg-teal-500 text-white px-3 py-1.5 text-sm font-semibold hover:bg-teal-600 disabled:opacity-40 transition-colors flex-shrink-0"
                        >
                            <Check size={13} />
                            Lưu
                        </button>
                        <button
                            onClick={() => setAddOpen(false)}
                            className="rounded-lg border border-slate-200 text-slate-500 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors flex-shrink-0"
                        >
                            Huỷ
                        </button>
                    </div>
                    {addForm.address && (
                        <div className="mt-1.5 pl-6 text-xs text-slate-400 truncate flex items-center gap-2">
                            📌 {addForm.address.split(",").slice(0, 4).join(",")}
                            {addForm.lat && addForm.lng && (
                                <a href={`https://maps.google.com/?q=${addForm.lat},${addForm.lng}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                                    ↗ Google Maps
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-2 self-start text-sm text-teal-600 font-medium border border-dashed border-teal-300 rounded-xl px-4 py-2 hover:bg-teal-50 transition-colors"
                >
                    <Plus size={14} />
                    Thêm địa điểm
                </button>
            )}

            {/* Selection summary */}
            {selectable && selectedIds.length > 0 && (
                <div className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700 font-medium">
                    Đã chọn: {selectedIds.map((id) => locations.find((l) => l.id === id)?.name).filter(Boolean).join(", ")}
                </div>
            )}
        </div>
    );
}
