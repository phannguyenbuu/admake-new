import type { IPage } from "../../../@types/common.type";
import React, { useEffect, useMemo, useState, Suspense, useDeferredValue } from "react";
import { Pencil, Trash2, Plus, X, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Modal, notification } from "antd";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../../../common/hooks/useUser";
import {
  InventoryService,
  type InventoryBalance,
  type InventoryCategory,
  type InventoryItem,
  type InventorySummary,
  type StockTransaction,
  type Warehouse,
} from "../../../services/inventory.service";
import { UserService } from "../../../services/user.service";
import StorageLocationsTab from "./StorageLocationsTab";
import ItemConfigTab, { useItemStatuses, useItemUnits } from "./ItemConfigTab";
import type { ItemStatus } from "./ItemConfigTab";
import UnPermissionBoard from "../unPermissionBoard";
import JobAsset from "../../../components/dashboard/work-tables/task/JobAsset";
import { useApiHost, useApiStatic } from "../../../common/hooks/useApiHost";
import type { MessageTypeProps } from "../../../@types/chat.type";

const MaterialLab = React.lazy(() => import("../../../components/dashboard/material-lab/MaterialLab"));

const ITEM_TYPE_LABEL: Record<string, string> = {
  raw_material: "Nguyên vật liệu",
  merchandise: "Hàng hóa",
  semi_finished: "Bán thành phẩm",
  finished_goods: "Thành phẩm",
};

const TX_TYPE_LABEL: Record<string, string> = {
  purchase_receipt: "Nhập kho mua hàng",
  sales_issue: "Xuất kho bán hàng",
  internal_issue: "Xuất dùng nội bộ",
  task_issue: "Xuất cho công trình",
  sales_return: "Nhập trả hàng",
  adjustment_increase: "Điều chỉnh tăng",
  adjustment_decrease: "Điều chỉnh giảm",
  transfer: "Chuyển kho",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const PREVIEW_MATERIAL_BY_TYPE: Record<
  string,
  {
    baseColor: string;
    roughness: number;
    metalness: number;
    emissive?: string;
    emissiveIntensity?: number;
    transmission?: number;
    ior?: number;
  }
> = {
  raw_material: {
    baseColor: "#b8894f",
    roughness: 0.32,
    metalness: 0.72,
    emissive: "#3a2b19",
    emissiveIntensity: 0.1,
  },
  merchandise: {
    baseColor: "#7c8aa0",
    roughness: 0.42,
    metalness: 0.25,
  },
  semi_finished: {
    baseColor: "#5f8f78",
    roughness: 0.58,
    metalness: 0.18,
  },
  finished_goods: {
    baseColor: "#d6e4f2",
    roughness: 0.14,
    metalness: 0.48,
    transmission: 0.08,
    ior: 1.35,
  },
};

interface SpecRow { id: string; color: string; spec: string; unit: string; price: number | ""; _editing?: boolean; }
const emptySpec = (): SpecRow => ({ id: Math.random().toString(36).slice(2), color: "", spec: "", unit: "", price: "" });
const emptySpecDraft = () => ({ color: "", spec: "", unit: "", price: "" as number | "" });

// ─── SpecGrid helpers ─────────────────────────────────────────────────────────
function PriceCell({ value, placeholder, isHeader, onCommit }: {
  value?: number | "";
  placeholder?: string;
  isHeader?: boolean;
  onCommit: (v: number | "") => void;
}) {
  const hasValue = value !== undefined && value !== "" && value !== 0;
  const [editing, setEditing] = React.useState(false);
  const [local, setLocal] = React.useState(hasValue ? String(value) : "");

  if (editing) {
    return (
      <div className="flex items-center gap-0.5 mt-1">
        <input
          autoFocus type="number" min="0"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={() => { onCommit(local === "" ? "" : Number(local)); setEditing(false); }}
          onKeyDown={e => {
            if (e.key === "Enter") { onCommit(local === "" ? "" : Number(local)); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-20 border border-teal-300 rounded px-1.5 py-0.5 text-[10px] outline-none bg-white"
          placeholder="giá..."
        />
        <span className="text-[9px] text-slate-400">đ</span>
      </div>
    );
  }

  return (
    <div
      className={`mt-1 text-[10px] cursor-pointer rounded px-1.5 py-0.5 inline-block transition-colors ${hasValue
        ? "text-amber-700 bg-amber-50 border border-amber-200 font-semibold"
        : isHeader
          ? "text-slate-400 hover:text-slate-600 hover:bg-white border border-dashed border-slate-200"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        }`}
      onClick={() => { setLocal(hasValue ? String(value) : ""); setEditing(true); }}
      title="Click để nhập giá"
    >
      {hasValue ? Number(value).toLocaleString("vi-VN") + "đ ✶" : placeholder || "—"}
    </div>
  );
}

function AddHeaderCell({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState("");
  if (open) {
    return (
      <div className="flex items-center gap-0.5">
        <input
          autoFocus value={val} onChange={e => setVal(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => {
            if (e.key === "Enter" && val.trim()) { onAdd(val.trim()); setVal(""); setOpen(false); }
            if (e.key === "Escape") { setVal(""); setOpen(false); }
          }}
          className="w-20 border border-teal-300 rounded px-1.5 py-0.5 text-[10px] outline-none bg-white"
        />
        <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(""); setOpen(false); } }}
          className="text-teal-500 hover:text-teal-700"><Check size={10} /></button>
        <button onClick={() => { setVal(""); setOpen(false); }}
          className="text-slate-300 hover:text-slate-500"><X size={10} /></button>
      </div>
    );
  }
  return (
    <button onClick={() => setOpen(true)}
      className="text-[10px] text-teal-500 hover:text-teal-700 font-medium whitespace-nowrap flex items-center gap-0.5">
      <Plus size={10} />{placeholder}
    </button>
  );
}


const emptyItemForm = {
  code: "",
  name: "",
  sku: "",
  category_id: "",
  item_type: "raw_material",
  unit: "cái",
  item_status: "dang_dung",
  default_supplier_name: "",
  default_warehouse_id: "",
  standard_cost: 0,
  average_cost: 0,
  min_stock_level: 0,
  note: "",
};

const emptyTxForm = {
  transaction_type: "purchase_receipt",
  transaction_date: dayjs().format("YYYY-MM-DD"),
  warehouse_id: "",
  destination_warehouse_id: "",
  item_id: "",
  quantity: 0,
  unit_cost: 0,
  partner_name: "",
  task_id: "",
  project_id: "",
  reference_type: "",
  reference_id: "",
  note: "",
  storekeeper_id: "",
};

const ITEM_PAGE_SIZE = 50;

type InventoryPagination = {
  page: number;
  per_page: number;
  total: number;
  pages: number;
};

type InventoryItemsResponse = {
  data: InventoryItem[];
  pagination: InventoryPagination;
};

const MaterialsDashboard: IPage["Component"] = () => {
  const {
    userLeadId,
    canViewPermission,
    tmpTaskCreatedAssets,
    tmpTaskCreatedMessages,
    setTmpTaskCreatedAssets,
    setTmpTaskCreatedMessages,
  } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"items" | "transactions" | "reports" | "locations" | "config">("items");
  const itemStatuses = useItemStatuses(userLeadId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [itemPage, setItemPage] = useState(1);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [detailTx, setDetailTx] = useState<StockTransaction | null>(null);
  const [previewItemId, setPreviewItemId] = useState("");
  const [activeViewerTab, setActiveViewerTab] = useState<"3d" | "photos">("3d");
  const [photoModalSrc, setPhotoModalSrc] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);
  const [specAddOpen, setSpecAddOpen] = useState(false);
  const [specDraft, setSpecDraft] = useState(emptySpecDraft());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // per-item inline add-form state
  const [itemSpecDraft, setItemSpecDraft] = useState<Record<string, ReturnType<typeof emptySpecDraft>>>({});
  // Đơn vị tính per lead
  const [unitList] = useItemUnits(userLeadId);

  const toggleExpandItem = (id: string) =>
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const saveItemSpecRows = async (item: InventoryItem, newRows: SpecRow[]) => {
    try {
      await InventoryService.updateItem(item.id, { lead_id: userLeadId, spec_rows: newRows } as any);
      await refreshAll();
    } catch { /* ignore */ }
  };
  const setItemSpecDraftValue = (itemId: string, patch: Partial<ReturnType<typeof emptySpecDraft>>) => {
    setItemSpecDraft((prev) => ({
      ...prev,
      [itemId]: {
        ...emptySpecDraft(),
        ...(prev[itemId] || {}),
        ...patch,
      },
    }));
  };

  const resetItemSpecDraft = (itemId: string, unit = "") => {
    setItemSpecDraft((prev) => ({
      ...prev,
      [itemId]: { ...emptySpecDraft(), unit },
    }));
  };

  const handleAddItemSpec = async (item: InventoryItem, itemSpecs: SpecRow[]) => {
    const draft = itemSpecDraft[item.id] || emptySpecDraft();
    const nextRow: SpecRow = {
      ...emptySpec(),
      color: draft.color.trim(),
      spec: draft.spec.trim(),
      unit: draft.unit.trim() || item.unit || "",
      price: draft.price === "" ? "" : Number(draft.price),
    };
    if (!nextRow.color && !nextRow.spec) {
      notification.warning({ message: "Nhap mau hoac quy cach truoc khi them" });
      return;
    }
    await saveItemSpecRows(item, [...itemSpecs, nextRow]);
    resetItemSpecDraft(item.id, item.unit || "");
  };
  const [txForm, setTxForm] = useState(emptyTxForm);

  const paramsBase = { lead: userLeadId };

  useEffect(() => {
    if (userLeadId > 0) {
      InventoryService.bootstrap(userLeadId).catch(() => undefined);
    }
  }, [userLeadId]);

  useEffect(() => {
    setItemPage(1);
  }, [userLeadId, search, statusFilter, categoryFilter, warehouseFilter]);

  const categoriesQuery = useQuery({
    queryKey: ["inventory-categories", userLeadId],
    enabled: userLeadId > 0,
    queryFn: async () => (await InventoryService.listCategories(paramsBase)).data.data as InventoryCategory[],
  });

  const warehousesQuery = useQuery({
    queryKey: ["inventory-warehouses", userLeadId],
    enabled: userLeadId > 0,
    queryFn: async () => (await InventoryService.listWarehouses(paramsBase)).data.data as Warehouse[],
  });

  const usersQuery = useQuery({
    queryKey: ["inventory-users", userLeadId],
    enabled: userLeadId > 0,
    queryFn: async () => (await UserService.getAll({ lead_id: userLeadId, limit: 1000 } as any)).data.data as any[],
  });

  const summaryQuery = useQuery({
    queryKey: ["inventory-summary", userLeadId, month],
    enabled: userLeadId > 0,
    queryFn: async () => (await InventoryService.getSummary({ ...paramsBase, month })).data as InventorySummary,
  });

  const itemsQuery = useQuery({
    queryKey: ["inventory-items", userLeadId, search, statusFilter, categoryFilter, warehouseFilter, itemPage],
    enabled: userLeadId > 0,
    queryFn: async () =>
      (await InventoryService.listItems({
        ...paramsBase,
        search: search || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        warehouse_id: warehouseFilter || undefined,
        page: itemPage,
        limit: ITEM_PAGE_SIZE,
      })).data as InventoryItemsResponse,
  });

  const transactionsQuery = useQuery({
    queryKey: ["inventory-transactions", userLeadId, month, txStatusFilter, txTypeFilter, warehouseFilter, search],
    enabled: userLeadId > 0,
    queryFn: async () =>
      (await InventoryService.listTransactions({
        ...paramsBase,
        from_date: `${month}-01`,
        to_date: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
        status: txStatusFilter || undefined,
        transaction_type: txTypeFilter || undefined,
        warehouse_id: warehouseFilter || undefined,
        search: search || undefined,
        page: 1,
        limit: 200,
      })).data.data as StockTransaction[],
  });

  const balancesQuery = useQuery({
    queryKey: ["inventory-balances", userLeadId, warehouseFilter],
    enabled: userLeadId > 0,
    queryFn: async () =>
      (await InventoryService.getBalances({
        ...paramsBase,
        warehouse_id: warehouseFilter || undefined,
      })).data.data as InventoryBalance[],
  });

  const items = itemsQuery.data?.data || [];
  const itemsPagination = itemsQuery.data?.pagination;
  const transactions = transactionsQuery.data || [];
  const balances = balancesQuery.data || [];
  const categories = categoriesQuery.data || [];
  const warehouses = warehousesQuery.data || [];
  const users = usersQuery.data || [];
  const summary = summaryQuery.data || {
    active_items: 0,
    transaction_count: 0,
    total_inventory_value: 0,
    below_min_stock_count: 0,
  };

  const money = (value: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0));

  useEffect(() => {
    if (itemsPagination?.pages && itemPage > itemsPagination.pages) {
      setItemPage(itemsPagination.pages);
    }
  }, [itemPage, itemsPagination?.pages]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory-items", userLeadId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions", userLeadId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-balances", userLeadId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-summary", userLeadId] }),
    ]);
  };

  const itemMutation = useMutation({
    mutationFn: async () => {
      const validSpecs = specRows.filter(r => r.color || r.spec || r.unit);
      const payload = {
        ...itemForm,
        code: itemForm.code.trim().toUpperCase(),
        name: itemForm.name.trim(),
        sku: itemForm.sku.trim(),
        default_supplier_name: itemForm.default_supplier_name.trim(),
        note: itemForm.note.trim(),
        lead_id: userLeadId,
        spec_rows: validSpecs,
      };
      if (editingItem) {
        return InventoryService.updateItem(editingItem.id, payload);
      }
      return InventoryService.createItem(payload);
    },
    onSuccess: async () => {
      notification.success({ message: editingItem ? "Đã cập nhật vật tư" : "Đã tạo vật tư" });
      setItemModalOpen(false);
      setEditingItem(null);
      setItemForm(emptyItemForm);
      setSpecRows([]);
      setSpecAddOpen(false);
      setSpecDraft(emptySpecDraft());
      setTmpTaskCreatedAssets((prev) => prev.filter((item) => item.type !== "material"));
      setTmpTaskCreatedMessages((prev) => prev.filter((item) => item.type !== "material"));
      await refreshAll();
    },
    onError: (error: any) =>
      notification.error({ message: error?.response?.data?.description || "Không thể lưu vật tư" }),
  });

  const transactionMutation = useMutation({
    mutationFn: async (mode: "draft" | "confirm") => {
      const created = await InventoryService.createTransaction({ ...txForm, lead_id: userLeadId });
      if (mode === "confirm") {
        await InventoryService.confirmTransaction(created.data.id);
      }
    },
    onSuccess: async () => {
      notification.success({ message: "Đã ghi nhận giao dịch kho" });
      setTxForm((prev) => ({
        ...emptyTxForm,
        warehouse_id: prev.warehouse_id,
        item_id: prev.item_id,
        transaction_type: prev.transaction_type,
      }));
      await refreshAll();
    },
    onError: (error: any) =>
      notification.error({ message: error?.response?.data?.description || "Không thể tạo giao dịch kho" }),
  });

  const legacyToggleItemStatus = async (item: InventoryItem) => {
    try {
      await InventoryService.deleteItem(item.id);
      notification.success({ message: item.is_active ? "Đã ngừng sử dụng vật tư" : "Đã kích hoạt lại vật tư" });
      await refreshAll();
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.description || "Không thể đổi trạng thái vật tư" });
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    try {
      await InventoryService.deleteItem(item.id);
      notification.success({ message: "Đã xóa vật tư" });
      if (previewItemId === item.id) {
        setPreviewItemId("");
      }
      await refreshAll();
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.description || "Không thể xóa vật tư" });
    }
  };

  const toggleItemStatus = (item: InventoryItem) =>
    Modal.confirm({
      title: "Xóa vật tư",
      content: `Xóa vật tư ${item.code} - ${item.name}?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      centered: true,
      onOk: () => handleDeleteItem(item),
    });

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      code: item.code,
      name: item.name,
      sku: item.sku || "",
      category_id: item.category_id || "",
      item_type: item.item_type,
      unit: item.unit,
      item_status: (item as any).item_status ?? (item.is_active ? "dang_dung" : "khong_dung"),
      default_supplier_name: item.default_supplier_name || "",
      default_warehouse_id: item.default_warehouse_id || "",
      standard_cost: item.standard_cost || 0,
      average_cost: item.average_cost || 0,
      min_stock_level: item.min_stock_level || 0,
      note: item.note || "",
    });
    const savedSpecs = (item as any).spec_rows;
    setSpecRows(Array.isArray(savedSpecs) && savedSpecs.length > 0 ? savedSpecs : []);
    setSpecAddOpen(false);
    setSpecDraft(emptySpecDraft());
    setItemModalOpen(true);
  };

  const reportRows = useMemo(
    () => [...balances].sort((a, b) => (b.inventory_value || 0) - (a.inventory_value || 0)),
    [balances]
  );

  const activeWarehouseName = warehouses.find((warehouse) => warehouse.id === warehouseFilter)?.name;
  const deferredPreviewItemId = useDeferredValue(previewItemId);
  const previewItem = items.find((item) => item.id === deferredPreviewItemId) || items[0] || null;
  const previewMaterial =
    (previewItem && PREVIEW_MATERIAL_BY_TYPE[previewItem.item_type]) || PREVIEW_MATERIAL_BY_TYPE.raw_material;

  const apiHost = useApiHost();
  const [previewMessages, setPreviewMessages] = useState<MessageTypeProps[]>([]);
  const [editingMessages, setEditingMessages] = useState<MessageTypeProps[]>([]);

  useEffect(() => {
    if (previewItem?.id) {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      fetch(`${apiHost}/inventory/items/${previewItem.id}/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          setPreviewMessages(data.messages || []);
        })
        .catch(console.error);
    } else {
      setPreviewMessages([]);
    }
  }, [previewItem?.id, apiHost]);

  useEffect(() => {
    if (editingItem?.id) {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      fetch(`${apiHost}/inventory/items/${editingItem.id}/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          setEditingMessages(data.messages || []);
        })
        .catch(console.error);
    } else {
      setEditingMessages([]);
    }
  }, [editingItem?.id, apiHost]);

  const materialImages = useMemo(() => {
    return previewMessages.filter((msg) => msg.file_url && msg.file_url.trim() !== "");
  }, [previewMessages]);

  return canViewPermission?.view_material ? (
    <div className="w-full flex flex-col gap-5 pb-8">
      <section className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-slate-800">Kho hàng</div>
            <div className="text-sm text-slate-500">
              Module inventory chuẩn hóa vật tư, giao dịch kho, tồn kho và liên kết kế toán.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="rounded-full border border-slate-200 px-4 py-2 text-sm"
              value={search}
              placeholder="Tìm tên, mã, SKU, nhà cung cấp"
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="month"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["items", "Vật tư"],
            ["transactions", "Giao dịch kho"],
            ["reports", "Báo cáo tồn kho"],
            ["locations", "📍 Địa điểm cất giữ"],
            ["config", "⚙️ Cấu hình"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeTab === key
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="text-xs text-slate-500">Số mã vật tư active</div>
            <div className="text-2xl font-semibold text-emerald-700">{money(summary.active_items)}</div>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <div className="text-xs text-slate-500">Số giao dịch trong kỳ</div>
            <div className="text-2xl font-semibold text-sky-700">{money(summary.transaction_count)}</div>
          </div>
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <div className="text-xs text-slate-500">Tổng giá trị tồn kho</div>
            <div className="text-2xl font-semibold text-cyan-700">{money(summary.total_inventory_value)} đ</div>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <div className="text-xs text-slate-500">Vật tư dưới định mức</div>
            <div className="text-2xl font-semibold text-amber-700">{money(summary.below_min_stock_count)}</div>
          </div>
        </div>

        {activeTab === "items" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Tất cả nhóm</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
              >
                <option value="">Tất cả kho</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang dùng</option>
                <option value="inactive">Ngừng dùng</option>
              </select>
              <button
                className="ml-auto rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  setEditingItem(null);
                  setItemForm(emptyItemForm);
                  setItemModalOpen(true);
                }}
              >
                + Tạo vật tư
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Hình ảnh vật tư</div>
                    <div className="text-xs text-slate-500">Đính kèm hình ảnh và ghi chú cho vật tư</div>
                  </div>
                  {previewItem && (
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs text-teal-600 font-medium">
                      {previewItem.code}
                    </span>
                  )}
                </div>
                {previewItem ? (
                  <div className="space-y-4">
                    <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
                      <div className="font-semibold text-slate-700">{previewItem.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>SKU: {previewItem.sku || "-"}</div>
                        <div>Đơn vị: {previewItem.unit}</div>
                        <div>Giá bình quân: {money(previewItem.average_cost || previewItem.standard_cost)} đ</div>
                        <div>Tồn hiện tại: {money(previewItem.quantity_on_hand || 0)}</div>
                      </div>
                    </div>

                    {/* 3D Material Lab & Photos Viewer */}
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-[#03050c] p-3 shadow-sm">
                      {/* Tab Header */}
                      <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveViewerTab("3d")}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                              activeViewerTab === "3d"
                                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            }`}
                          >
                            🧊 Xem 3D
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveViewerTab("photos")}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                              activeViewerTab === "photos"
                                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            }`}
                          >
                            🖼️ Ảnh thực tế ({materialImages.length})
                          </button>
                        </div>
                      </div>

                      {activeViewerTab === "3d" ? (
                        <Suspense fallback={
                          <div className="flex items-center justify-center aspect-square w-full rounded-xl bg-slate-900/50" style={{ maxWidth: 380 }}>
                            <div className="text-xs text-slate-500 animate-pulse">Đang tải 3D viewer…</div>
                          </div>
                        }>
                          <MaterialLab
                            initialMaterialId={previewItem?.preview_material || "lumion_standard"}
                            materialProps={previewItem}
                            onSaveMaterial={async (materialId) => {
                              if (!previewItem) return;
                              try {
                                await InventoryService.updateItem(previewItem.id, {
                                  lead_id: userLeadId,
                                  preview_material: materialId,
                                } as any);
                                notification.success({ message: "Đã cập nhật vật liệu 3D" });
                                await refreshAll();
                              } catch {
                                notification.error({ message: "Không thể cập nhật vật liệu" });
                              }
                            }}
                          />
                        </Suspense>
                      ) : (
                        /* Photos Tab Content */
                        <div className="aspect-square w-full rounded-xl bg-slate-900/20 p-2 overflow-y-auto" style={{ maxWidth: 380 }}>
                          {materialImages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs gap-2 py-8">
                              <span className="text-2xl">📷</span>
                              <span className="text-slate-400">Không có ảnh thực tế nào.</span>
                              <span className="text-[10px] text-slate-600 text-center px-4">Hãy bấm nút "Sửa" trên dòng vật tư để đăng tải hình ảnh.</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {materialImages.map((asset, index) => {
                                const staticBase = useApiStatic();
                                const buildStaticUrl = (path?: string | null) => {
                                  if (!path) return "";
                                  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
                                    return path;
                                  }
                                  if (path.startsWith("/")) {
                                    return path;
                                  }
                                  return `${staticBase}/${path}`;
                                };
                                
                                const getOriginalImagePath = (path?: string | null) => {
                                  if (!path) return "";
                                  return path.startsWith("thumbs/thumb_")
                                    ? path.replace("thumbs/thumb_", "")
                                    : path;
                                };

                                const thumbSrc = buildStaticUrl(asset.thumb_url || asset.file_url);
                                const fullSrc = buildStaticUrl(getOriginalImagePath(asset.file_url));

                                return (
                                  <div
                                    key={asset.message_id || index}
                                    onClick={() => setPhotoModalSrc(fullSrc)}
                                    className="relative aspect-square rounded-lg overflow-hidden border border-white/5 cursor-zoom-in hover:border-teal-500/50 transition-colors bg-slate-950 group"
                                  >
                                    <img
                                      src={thumbSrc}
                                      alt="material"
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Chọn một vật tư bên dưới để xem hình ảnh.
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="min-w-[860px] w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                      <th className="px-3 py-3 w-8" />
                      <th className="px-3 py-3">Mã vật tư</th>
                      <th className="px-3 py-3">Nhóm / Tên vật tư</th>
                      <th className="px-3 py-3">Kho / Tổng tồn</th>
                      <th className="px-3 py-3">Đơn giá</th>
                      <th className="px-3 py-3">Tồn (giá trị / tối thiểu)</th>
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const isExpanded = expandedItems.has(item.id);
                      const itemSpecs: SpecRow[] = (item as any).spec_rows || [];
                      const defaultPrice = item.average_cost || item.standard_cost || 0;
                      const draft = itemSpecDraft[item.id] || emptySpecDraft();
                      const isActive = (previewItemId ? previewItemId === item.id : items[0]?.id === item.id);
                      const textPrimary = isActive ? "text-white" : "text-slate-700 group-hover:text-white";
                      const textSecondary = isActive ? "text-white/90" : "text-slate-600 group-hover:text-white/90";
                      const textMuted = isActive ? "text-white/70" : "text-slate-400 group-hover:text-white/70";

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            className={`border-b last:border-0 cursor-pointer transition-colors group ${isActive ? "bg-[#00bba7]" : "bg-white hover:bg-[#00bba7]"}`}
                            onClick={() => setPreviewItemId(item.id)}
                          >
                            {/* Expand chevron */}
                            <td className="px-2 py-3 text-center" onClick={(e) => { e.stopPropagation(); toggleExpandItem(item.id); }}>
                              <button className={`transition-colors ${isActive ? "text-white/70 hover:text-white" : "text-slate-300 group-hover:text-white/70 hover:text-white"}`}>
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </button>
                            </td>
                            <td className={`px-3 py-3 font-medium ${textPrimary}`}>{item.code}</td>
                            <td className={`px-3 py-3 ${textPrimary}`}>
                              {item.category_name && (
                                <div className={`text-[10px] font-medium uppercase tracking-wide mb-0.5 ${textMuted}`}>{item.category_name}</div>
                              )}
                              <div className="font-medium">{item.name}</div>
                              {item.sku && <div className={`text-xs ${textMuted}`}>{item.sku}</div>}
                            </td>
                            <td className={`px-3 py-3 ${textSecondary}`}>
                              <div>{item.default_warehouse_name || "-"}</div>
                              <div className={`text-xs ${textMuted}`}>{money(item.quantity_on_hand || 0)} {item.unit}</div>
                            </td>
                            <td className={`px-3 py-3 whitespace-nowrap ${textSecondary}`}>{money(item.average_cost || item.standard_cost)} đ</td>
                            <td className={`px-3 py-3 ${textSecondary}`}>
                              <div className={textPrimary}>{money(item.inventory_value || 0)} đ</div>
                              <div className={`text-xs ${textMuted}`}>min: {money(item.min_stock_level || 0)}</div>
                            </td>
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const curKey = (item as any).item_status ?? (item.is_active ? "dang_dung" : "khong_dung");
                                const meta: ItemStatus = itemStatuses.find(s => s.key === curKey) ?? itemStatuses[0];
                                return (
                                  <select
                                    value={curKey}
                                    className={`rounded-md border px-2 py-1 text-xs whitespace-nowrap cursor-pointer focus:outline-none ${meta.bg} ${meta.color}`}
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      const isActive = itemStatuses.find(s => s.key === newStatus)?.counts_active ?? false;
                                      try {
                                        await InventoryService.updateItem(item.id, { lead_id: userLeadId, item_status: newStatus, is_active: isActive } as any);
                                        await refreshAll();
                                      } catch { /* ignore */ }
                                    }}
                                  >
                                    {itemStatuses.map(s => (
                                      <option key={s.key} value={s.key}>{s.label}</option>
                                    ))}
                                  </select>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button title="Sửa" className={`p-1.5 rounded-lg transition-colors ${isActive ? "text-white/80 hover:text-white hover:bg-white/10" : "text-slate-400 group-hover:text-white/80 hover:text-white hover:bg-white/10"}`} onClick={() => handleOpenEdit(item)}>
                                  <Pencil size={14} />
                                </button>
                                <button title="Xoá / Ngừng dùng" className={`p-1.5 rounded-lg transition-colors ${isActive ? "text-white/80 hover:text-rose-200 hover:bg-white/10" : "text-slate-400 group-hover:text-white/80 hover:text-rose-200 hover:bg-white/10"}`} onClick={() => toggleItemStatus(item)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Sub-row: Spec rows (AR-style) */}
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={8} className="p-0">
                                <div className="border-t border-slate-100">
                                  {/* ─── SPEC GRID ─────────────────────────────── */}
                                  {(() => {
                                    // Derive unique colors (columns) and specs (rows)
                                    const colors = Array.from(new Set(
                                      itemSpecs.filter(r => r.color).map(r => r.color)
                                    ));
                                    const specs = Array.from(new Set(
                                      itemSpecs.filter(r => r.spec).map(r => r.spec)
                                    ));

                                    // Helper: find a cell price
                                    const findCell = (spec: string, color: string) =>
                                      itemSpecs.find(r => r.spec === spec && r.color === color);
                                    const findColDefault = (color: string) =>
                                      itemSpecs.find(r => r.color === color && !r.spec);
                                    const findRowDefault = (spec: string) =>
                                      itemSpecs.find(r => r.spec === spec && !r.color);

                                    const upsertCell = (spec: string, color: string, price: number | "") => {
                                      const existing = findCell(spec, color);
                                      if (existing) {
                                        saveItemSpecRows(item, itemSpecs.map(r =>
                                          r.id === existing.id ? { ...r, price } : r
                                        ));
                                      } else {
                                        saveItemSpecRows(item, [...itemSpecs, {
                                          ...emptySpec(), spec, color,
                                          unit: itemSpecs[0]?.unit || "",
                                          price
                                        }]);
                                      }
                                    };
                                    const upsertHeader = (key: string, isColor: boolean, price: number | "") => {
                                      const existing = isColor ? findColDefault(key) : findRowDefault(key);
                                      if (existing) {
                                        saveItemSpecRows(item, itemSpecs.map(r =>
                                          r.id === existing.id ? { ...r, price } : r
                                        ));
                                      } else {
                                        saveItemSpecRows(item, [...itemSpecs, {
                                          ...emptySpec(),
                                          color: isColor ? key : "",
                                          spec: isColor ? "" : key,
                                          unit: itemSpecs[0]?.unit || "",
                                          price
                                        }]);
                                      }
                                    };
                                    const deleteCol = (color: string) =>
                                      saveItemSpecRows(item, itemSpecs.filter(r => r.color !== color));
                                    const deleteRow = (spec: string) =>
                                      saveItemSpecRows(item, itemSpecs.filter(r => r.spec !== spec));

                                    const hasGrid = colors.length > 0 || specs.length > 0;

                                    return (
                                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                        {hasGrid && (
                                          <div className="overflow-x-auto">
                                            <table className="text-xs border-collapse min-w-max rounded-md overflow-hidden">
                                              <thead>
                                                <tr>
                                                  {/* top-left corner: row label */}
                                                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500 font-normal text-left min-w-[110px]">
                                                    Quy cách ╲ Màu
                                                  </th>
                                                  {colors.map(color => (
                                                    <th key={color} className="border border-slate-200 bg-slate-100 px-2 py-2 text-center min-w-[100px]">
                                                      <div className="flex items-center justify-between gap-1">
                                                        <span className="inline-block rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-teal-700">
                                                          {color}
                                                        </span>
                                                        <button onClick={() => deleteCol(color)}
                                                          className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
                                                          <X size={10} />
                                                        </button>
                                                      </div>
                                                      {/* col default price */}
                                                      <PriceCell
                                                        value={findColDefault(color)?.price}
                                                        placeholder="giá cột"
                                                        isHeader
                                                        onCommit={v => upsertHeader(color, true, v)}
                                                      />
                                                    </th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {specs.map(spec => {
                                                  const rowDef = findRowDefault(spec);
                                                  return (
                                                    <tr key={spec} className="transition-colors hover:bg-slate-100/70">
                                                      {/* Row header */}
                                                      <td className="border border-slate-200 bg-slate-100 px-2 py-1.5">
                                                        <div className="flex items-center gap-1 justify-between">
                                                          <span className="inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-sky-700">
                                                            {spec}
                                                          </span>
                                                          <button onClick={() => deleteRow(spec)}
                                                            className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
                                                            <X size={10} />
                                                          </button>
                                                        </div>
                                                        {/* Row default price */}
                                                        <PriceCell
                                                          value={rowDef?.price}
                                                          placeholder="giá hàng"
                                                          isHeader
                                                          onCommit={v => upsertHeader(spec, false, v)}
                                                        />
                                                      </td>
                                                      {/* Cells */}
                                                      {colors.map(color => {
                                                        const cell = findCell(spec, color);
                                                        return (
                                                          <td key={color} className="border border-slate-200 bg-white px-2 py-1.5 text-center">
                                                            <PriceCell
                                                              value={cell?.price}
                                                              placeholder={
                                                                findColDefault(color)?.price !== undefined && findColDefault(color)?.price !== ""
                                                                  ? String(Number(findColDefault(color)!.price).toLocaleString("vi-VN")) + "đ"
                                                                  : rowDef?.price !== undefined && rowDef?.price !== ""
                                                                    ? String(Number(rowDef!.price).toLocaleString("vi-VN")) + "đ"
                                                                    : defaultPrice ? defaultPrice.toLocaleString("vi-VN") + "đ" : "—"
                                                              }
                                                              onCommit={v => upsertCell(spec, color, v)}
                                                            />
                                                          </td>
                                                        );
                                                      })}
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}

                                        {/* If empty, show hint */}
                                        {!hasGrid && (
                                          <div className="flex flex-wrap items-center gap-3 py-2 px-2">
                                            <span className="text-xs text-slate-400 italic">Chưa có quy cách / màu sắc.</span>
                                          </div>
                                        )}

                                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                                          <input
                                            value={draft.color}
                                            onChange={(e) => setItemSpecDraftValue(item.id, { color: e.target.value })}
                                            placeholder="Màu"
                                            className="min-w-[120px] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
                                          />
                                          <input
                                            value={draft.spec}
                                            onChange={(e) => setItemSpecDraftValue(item.id, { spec: e.target.value })}
                                            placeholder="Quy cách"
                                            className="min-w-[160px] flex-[1.2] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
                                          />
                                          <input
                                            value={draft.unit}
                                            onChange={(e) => setItemSpecDraftValue(item.id, { unit: e.target.value })}
                                            placeholder="Đơn vị"
                                            className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
                                          />
                                          <input
                                            type="number"
                                            min="0"
                                            value={draft.price}
                                            onChange={(e) =>
                                              setItemSpecDraftValue(item.id, {
                                                price: e.target.value === "" ? "" : Number(e.target.value),
                                              })
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") void handleAddItemSpec(item, itemSpecs);
                                            }}
                                            placeholder="Giá"
                                            className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => void handleAddItemSpec(item, itemSpecs)}
                                            className="rounded-md bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-600"
                                          >
                                            Lưu
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">Chưa có vật tư.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                <div>
                  Hiển thị{" "}
                  {itemsPagination?.total
                    ? `${(itemPage - 1) * ITEM_PAGE_SIZE + 1}-${Math.min(itemPage * ITEM_PAGE_SIZE, itemsPagination.total)}`
                    : "0-0"}{" "}
                  / {itemsPagination?.total || 0} vật tư
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={itemPage <= 1}
                    onClick={() => setItemPage((prev) => Math.max(1, prev - 1))}
                  >
                    Trước
                  </button>
                  <div className="min-w-[92px] text-center font-medium text-slate-600">
                    Trang {itemsPagination?.page || 1}/{itemsPagination?.pages || 1}
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!itemsPagination || itemPage >= itemsPagination.pages}
                    onClick={() => setItemPage((prev) => prev + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-slate-700">Tạo giao dịch kho</div>
              <div className="space-y-2">
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={txForm.transaction_type}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, transaction_type: e.target.value }))}
                >
                  {Object.entries(TX_TYPE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={txForm.transaction_date}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, transaction_date: e.target.value }))}
                />
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={txForm.warehouse_id}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, warehouse_id: e.target.value }))}
                >
                  <option value="">Chọn kho</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
                {txForm.transaction_type === "transfer" && (
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={txForm.destination_warehouse_id}
                    onChange={(e) =>
                      setTxForm((prev) => ({ ...prev, destination_warehouse_id: e.target.value }))
                    }
                  >
                    <option value="">Kho đích</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={txForm.item_id}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, item_id: e.target.value }))}
                >
                  <option value="">Chọn vật tư</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Số lượng"
                  value={txForm.quantity}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                />
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Đơn giá"
                  value={txForm.unit_cost}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, unit_cost: Number(e.target.value) }))}
                />
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={txForm.storekeeper_id || ""}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, storekeeper_id: e.target.value }))}
                >
                  <option value="">Thủ kho (Không bắt buộc)</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Đối tác"
                  value={txForm.partner_name}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, partner_name: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Task ID"
                  value={txForm.task_id}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, task_id: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Công trình / Workspace ID"
                  value={txForm.project_id}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, project_id: e.target.value }))}
                />
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    value={txForm.reference_type}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, reference_type: e.target.value }))}
                  >
                    <option value="">Ref loại</option>
                    <option value="document">Chứng từ</option>
                    <option value="ap_bill">AP bill</option>
                    <option value="ar_invoice">AR invoice</option>
                    <option value="task">Task</option>
                    <option value="workspace">Công trình</option>
                    <option value="manual">Manual</option>
                  </select>
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="Reference ID"
                    value={txForm.reference_id}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, reference_id: e.target.value }))}
                  />
                </div>
                <textarea
                  className="min-h-[84px] w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Ghi chú"
                  value={txForm.note}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, note: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                    onClick={() => transactionMutation.mutate("draft")}
                    disabled={transactionMutation.isPending}
                  >
                    Lưu nháp
                  </button>
                  <button
                    className="rounded-lg bg-teal-500 px-3 py-2 text-sm font-semibold text-white"
                    onClick={() => transactionMutation.mutate("confirm")}
                    disabled={transactionMutation.isPending}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                >
                  <option value="">Tất cả loại</option>
                  {Object.entries(TX_TYPE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="draft">Nháp</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="min-w-[1280px] w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                      <th className="px-3 py-3">Ngày</th>
                      <th className="px-3 py-3">Mã giao dịch</th>
                      <th className="px-3 py-3">Loại</th>
                      <th className="px-3 py-3">Vật tư</th>
                      <th className="px-3 py-3">Kho</th>
                      <th className="px-3 py-3">Nhập</th>
                      <th className="px-3 py-3">Xuất</th>
                      <th className="px-3 py-3">Đơn giá</th>
                      <th className="px-3 py-3">Thành tiền</th>
                      <th className="px-3 py-3">Đối tượng / task</th>
                      <th className="px-3 py-3">Tham chiếu</th>
                      <th className="px-3 py-3">Thủ kho</th>
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const storekeeper = users.find((u: any) => String(u.id) === String(tx.storekeeper_id));
                      const storekeeperName = storekeeper ? (storekeeper.fullName || storekeeper.username) : (tx.storekeeper_id || "-");
                      return (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="px-3 py-3 text-slate-600">{dayjs(tx.transaction_date).format("DD/MM/YYYY")}</td>
                        <td className="px-3 py-3 font-medium text-slate-700">{tx.transaction_code}</td>
                        <td className="px-3 py-3 text-slate-600">{TX_TYPE_LABEL[tx.transaction_type] || tx.transaction_type}</td>
                        <td className="px-3 py-3 text-slate-600">{tx.item_code} - {tx.item_name}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {tx.warehouse_name || "-"}
                          {tx.destination_warehouse_name ? ` -> ${tx.destination_warehouse_name}` : ""}
                        </td>
                        <td className="px-3 py-3 text-emerald-700">{tx.direction === "in" ? money(tx.quantity) : "-"}</td>
                        <td className="px-3 py-3 text-rose-700">
                          {tx.direction === "out" || tx.direction === "transfer" ? money(tx.quantity) : "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{money(tx.unit_cost)} đ</td>
                        <td className="px-3 py-3 text-slate-700">{money(tx.total_cost)} đ</td>
                        <td className="px-3 py-3 text-slate-600">{tx.partner_name || tx.task_id || tx.project_id || "-"}</td>
                        <td className="px-3 py-3 text-slate-600">{tx.reference_code || tx.reference_id || "-"}</td>
                        <td className="px-3 py-3 text-slate-600">{storekeeperName}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-md border px-2 py-1 text-xs ${STATUS_BADGE[tx.status] || STATUS_BADGE.draft}`}>
                            {STATUS_LABEL[tx.status] || tx.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                              onClick={async () => setDetailTx((await InventoryService.getTransaction(tx.id)).data)}
                            >
                              Chi tiết
                            </button>
                            {tx.status === "draft" && (
                              <button
                                className="rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                                onClick={async () => {
                                  await InventoryService.confirmTransaction(tx.id);
                                  await refreshAll();
                                }}
                              >
                                Xác nhận
                              </button>
                            )}
                            {tx.status !== "cancelled" && (
                              <button
                                className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700"
                                onClick={async () => {
                                  await InventoryService.cancelTransaction(tx.id);
                                  await refreshAll();
                                }}
                              >
                                Hủy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={13} className="px-3 py-8 text-center text-sm text-slate-500">
                          Chưa có giao dịch kho.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-1 text-sm font-semibold text-slate-700">Tồn hiện tại theo vật tư / kho</div>
              <div className="mb-3 text-xs text-slate-500">
                {activeWarehouseName ? `Đang lọc theo kho ${activeWarehouseName}` : "Hiển thị toàn bộ kho"}
              </div>
              <table className="min-w-[860px] w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-3 py-3">Mã vật tư</th>
                    <th className="px-3 py-3">Tên vật tư</th>
                    <th className="px-3 py-3">Kho</th>
                    <th className="px-3 py-3">Tồn hiện tại</th>
                    <th className="px-3 py-3">Giá bình quân</th>
                    <th className="px-3 py-3">Giá trị tồn</th>
                    <th className="px-3 py-3">Định mức</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row) => (
                    <tr key={`${row.item_id}-${row.warehouse_id}`} className="border-b last:border-0">
                      <td className="px-3 py-3 text-slate-700">{row.item_code}</td>
                      <td className="px-3 py-3 text-slate-700">{row.item_name}</td>
                      <td className="px-3 py-3 text-slate-600">{row.warehouse_name}</td>
                      <td className="px-3 py-3 text-slate-700">
                        {money(row.quantity_on_hand)} {row.unit || ""}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{money(row.average_cost)} đ</td>
                      <td className="px-3 py-3 text-slate-700">{money(row.inventory_value)} đ</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-md border px-2 py-1 text-xs ${row.below_min_stock
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white text-slate-500"
                            }`}
                        >
                          {money(row.min_stock_level || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reportRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                        Chưa có dữ liệu tồn kho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-slate-700">Định giá tồn kho</div>
              <div className="space-y-3">
                {reportRows.slice(0, 10).map((row) => (
                  <div
                    key={`${row.item_id}-${row.warehouse_id}-card`}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="text-sm font-semibold text-slate-700">{row.item_name}</div>
                    <div className="text-xs text-slate-500">{row.warehouse_name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Tồn: {money(row.quantity_on_hand)} {row.unit || ""}
                    </div>
                    <div className="text-sm text-slate-600">Giá trị: {money(row.inventory_value)} đ</div>
                  </div>
                ))}
                {reportRows.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Chưa có dữ liệu để định giá.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "locations" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-1 text-sm font-semibold text-slate-700">📍 Địa điểm cất giữ</div>
            <div className="mb-4 text-xs text-slate-500">
              Quản lý danh sách địa điểm lưu trữ vật tư theo danh mục: Kho, Công ty, Văn phòng, Công trình, Nhà riêng...
            </div>
            <StorageLocationsTab leadId={userLeadId} />
          </div>
        )}

        {activeTab === "config" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-1 text-sm font-semibold text-slate-700">⚙️ Cấu hình vật tư</div>
            <div className="mb-4 text-xs text-slate-500">Tùy chỉnh danh sách trạng thái vật tư, màu sắc hiển thị. Thay đổi có hiệu lực ngay lập tức trên toàn bộ bảng.</div>
            <ItemConfigTab leadId={userLeadId} />
          </div>
        )}
      </section>

      <Modal
        open={itemModalOpen}
        width={640}
        onCancel={() => {
          setItemModalOpen(false);
          setEditingItem(null);
          setItemForm(emptyItemForm);
          setSpecRows([]);
          setSpecAddOpen(false);
          setSpecDraft(emptySpecDraft());
          // Clear draft assets when cancelling
          setTmpTaskCreatedAssets((prev) => prev.filter((item) => item.type !== "material"));
          setTmpTaskCreatedMessages((prev) => prev.filter((item) => item.type !== "material"));
        }}
        onOk={() => {
          const code = itemForm.code.trim().toUpperCase();
          if (!code) {
            notification.warning({ message: "Vui lòng nhập mã vật tư" });
            return;
          }
          if (!itemForm.name.trim()) {
            notification.warning({ message: "Vui lòng nhập tên vật tư" });
            return;
          }
          
          const dup = items.find(
            (it) =>
              it.code.toUpperCase() === code &&
              (!editingItem || it.id !== editingItem.id)
          );
          
          if (dup) {
            Modal.confirm({
              title: "Trùng mã vật tư",
              content: `Mã vật tư "${code}" đã tồn tại cho vật tư "${dup.name}". Bạn có muốn cập nhật (ghi đè) thông tin vào vật tư cũ này không?`,
              okText: "Ghi đè",
              okButtonProps: { danger: true },
              cancelText: "Hủy",
              centered: true,
              onOk: async () => {
                try {
                  const validSpecs = specRows.filter(r => r.color || r.spec || r.unit);
                  const payload = {
                    ...itemForm,
                    code: code,
                    name: itemForm.name.trim(),
                    sku: itemForm.sku.trim(),
                    default_supplier_name: itemForm.default_supplier_name.trim(),
                    note: itemForm.note.trim(),
                    lead_id: userLeadId,
                    spec_rows: validSpecs,
                  };
                  await InventoryService.updateItem(dup.id, payload);
                  notification.success({ message: "Đã cập nhật (ghi đè) vật tư thành công" });
                  setItemModalOpen(false);
                  setEditingItem(null);
                  setItemForm(emptyItemForm);
                  setSpecRows([]);
                  setSpecAddOpen(false);
                  setSpecDraft(emptySpecDraft());
                  await refreshAll();
                } catch (error: any) {
                  notification.error({ message: error?.response?.data?.description || "Không thể ghi đè vật tư" });
                }
              }
            });
          } else {
            itemMutation.mutate();
          }
        }}
        okText={editingItem ? "Cập nhật" : "Tạo vật tư"}
        confirmLoading={itemMutation.isPending}
        title={editingItem ? "Cập nhật vật tư" : "Tạo vật tư"}
      >
        <div className="space-y-3 pt-3">
          {/* Mã + SKU */}
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Mã vật tư"
              value={itemForm.code}
              onChange={(e) => setItemForm((p) => ({ ...p, code: e.target.value }))} />
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="SKU"
              value={itemForm.sku} onChange={(e) => setItemForm((p) => ({ ...p, sku: e.target.value }))} />
          </div>

          {(() => {
            const codeTrim = itemForm.code.trim().toUpperCase();
            if (!codeTrim) return null;
            const dup = items.find(
              (it) =>
                it.code.toUpperCase() === codeTrim &&
                (!editingItem || it.id !== editingItem.id)
            );
            if (!dup) return null;
            return (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5 font-medium animate-pulse">
                <span>⚠️</span>
                <span>Mã vật tư <strong>"{codeTrim}"</strong> đã tồn tại (Vật tư: <strong>{dup.name}</strong>). Lưu sẽ ghi đè lên vật tư cũ.</span>
              </div>
            );
          })()}

          {/* Nhóm — full width, trên tên */}
          <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={itemForm.category_id} onChange={(e) => setItemForm((p) => ({ ...p, category_id: e.target.value }))}>
            <option value="">Chọn nhóm vật tư</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Tên vật tư */}
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Tên vật tư"
            value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} />

          {/* Nhà cung cấp */}
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Nhà cung cấp"
            value={itemForm.default_supplier_name} onChange={(e) => setItemForm((p) => ({ ...p, default_supplier_name: e.target.value }))} />

          {/* Đơn giá trung bình + Đơn vị tính */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input type="number" min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-8"
                placeholder="Đơn giá trung bình"
                value={itemForm.average_cost || ""}
                onChange={(e) => setItemForm((p) => ({ ...p, average_cost: Number(e.target.value) }))} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">đ</span>
            </div>
            <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={itemForm.unit} onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))}
            >
              <option value="">Chọn đơn vị tính...</option>
              {unitList.map(u => <option key={u} value={u}>{u}</option>)}
              {itemForm.unit && !unitList.includes(itemForm.unit) && <option value={itemForm.unit}>{itemForm.unit}</option>}
            </select>
          </div>

          {/* Trạng thái */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">Trạng thái</div>
            <div className="flex flex-wrap gap-2">
              {itemStatuses.map(s => (
                <button key={s.key} type="button"
                  onClick={() => setItemForm(p => ({ ...p, item_status: s.key }))}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${itemForm.item_status === s.key
                    ? `${s.bg} ${s.color} ring-2 ring-offset-1 ring-teal-400`
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <textarea className="min-h-[60px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ghi chú" value={itemForm.note}
            onChange={(e) => setItemForm((p) => ({ ...p, note: e.target.value }))} />

          {/* Ô hình ảnh vật tư (JobAsset) */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-semibold text-slate-700 mb-2">Hình ảnh vật tư</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <JobAsset
                taskId={editingItem?.id}
                type="material"
                messages={editingMessages}
                title="Hình ảnh vật tư"
                instantSave={editingItem ? true : false}
              />
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        open={Boolean(detailTx)}
        onCancel={() => setDetailTx(null)}
        footer={null}
        title="Chi tiết giao dịch kho"
      >
        {detailTx && (
          <div className="space-y-3 pt-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">Mã giao dịch</div>
                <div className="font-medium text-slate-700">{detailTx.transaction_code}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Trạng thái</div>
                <div className="font-medium text-slate-700">{STATUS_LABEL[detailTx.status] || detailTx.status}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Ngày giao dịch</div>
                <div className="font-medium text-slate-700">{dayjs(detailTx.transaction_date).format("DD/MM/YYYY")}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Loại</div>
                <div className="font-medium text-slate-700">{TX_TYPE_LABEL[detailTx.transaction_type] || detailTx.transaction_type}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Vật tư</div>
                <div className="font-medium text-slate-700">{detailTx.item_code} - {detailTx.item_name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Kho</div>
                <div className="font-medium text-slate-700">
                  {detailTx.warehouse_name || "-"}
                  {detailTx.destination_warehouse_name ? ` -> ${detailTx.destination_warehouse_name}` : ""}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Số lượng</div>
                <div className="font-medium text-slate-700">
                  {money(detailTx.quantity)} {detailTx.unit || ""}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Giá trị</div>
                <div className="font-medium text-slate-700">{money(detailTx.total_cost)} đ</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Đối tác / task</div>
                <div className="font-medium text-slate-700">{detailTx.partner_name || detailTx.task_id || detailTx.project_id || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tham chiếu</div>
                <div className="font-medium text-slate-700">{detailTx.reference_code || detailTx.reference_id || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Thủ kho</div>
                <div className="font-medium text-slate-700">
                  {(() => {
                    const storekeeper = users.find((u: any) => String(u.id) === String(detailTx.storekeeper_id));
                    return storekeeper ? (storekeeper.fullName || storekeeper.username) : (detailTx.storekeeper_id || "-");
                  })()}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Ghi chú</div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-slate-700">
                {detailTx.note || "-"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Liên kết kế toán / chứng từ</div>
              <div className="space-y-2">
                {(detailTx.trace_links || []).length > 0 ? (
                  detailTx.trace_links?.map((link, index) => (
                    <div key={`${link.id || index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="text-xs text-slate-500">
                        {link.source_type} -&gt; {link.target_type}
                      </div>
                      <div className="font-medium text-slate-700">
                        {link.note || `${link.source_id} / ${link.target_id}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-slate-500">
                    Chưa có liên kết traceability.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal view full photo */}
      <Modal
        open={Boolean(photoModalSrc)}
        onCancel={() => setPhotoModalSrc(null)}
        footer={null}
        centered
        width={800}
      >
        <div className="flex justify-center items-center bg-black/5 rounded-lg overflow-hidden">
          <img
            src={photoModalSrc || ""}
            alt="material full"
            className="max-w-full max-h-[80vh] object-contain block"
          />
        </div>
      </Modal>
    </div>
  ) : <UnPermissionBoard />;
};

export default MaterialsDashboard;
