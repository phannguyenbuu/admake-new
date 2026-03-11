import type { IPage } from "../../../@types/common.type";
import React, { useEffect, useMemo, useState } from "react";
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
import MaterialSphereViewer from "../../../components/dashboard/materials/MaterialSphereViewer";

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

const emptyItemForm = {
  code: "",
  name: "",
  sku: "",
  category_id: "",
  item_type: "raw_material",
  unit: "cái",
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
};

const MaterialsDashboard: IPage["Component"] = () => {
  const { userLeadId } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"items" | "transactions" | "reports">("items");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [detailTx, setDetailTx] = useState<StockTransaction | null>(null);
  const [previewItemId, setPreviewItemId] = useState("");
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [txForm, setTxForm] = useState(emptyTxForm);

  const paramsBase = { lead: userLeadId };

  useEffect(() => {
    if (userLeadId > 0) {
      InventoryService.bootstrap(userLeadId).catch(() => undefined);
    }
  }, [userLeadId]);

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

  const summaryQuery = useQuery({
    queryKey: ["inventory-summary", userLeadId, month],
    enabled: userLeadId > 0,
    queryFn: async () => (await InventoryService.getSummary({ ...paramsBase, month })).data as InventorySummary,
  });

  const itemsQuery = useQuery({
    queryKey: ["inventory-items", userLeadId, search, statusFilter, categoryFilter, warehouseFilter],
    enabled: userLeadId > 0,
    queryFn: async () =>
      (await InventoryService.listItems({
        ...paramsBase,
        search: search || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        warehouse_id: warehouseFilter || undefined,
        page: 1,
        limit: 200,
      })).data.data as InventoryItem[],
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

  const items = itemsQuery.data || [];
  const transactions = transactionsQuery.data || [];
  const balances = balancesQuery.data || [];
  const categories = categoriesQuery.data || [];
  const warehouses = warehousesQuery.data || [];
  const summary = summaryQuery.data || {
    active_items: 0,
    transaction_count: 0,
    total_inventory_value: 0,
    below_min_stock_count: 0,
  };

  const money = (value: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0));

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
      const payload = { ...itemForm, lead_id: userLeadId };
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

  const toggleItemStatus = async (item: InventoryItem) => {
    try {
      await InventoryService.patchItemStatus(item.id, { lead_id: userLeadId, is_active: !item.is_active });
      notification.success({ message: item.is_active ? "Đã ngừng sử dụng vật tư" : "Đã kích hoạt lại vật tư" });
      await refreshAll();
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.description || "Không thể đổi trạng thái vật tư" });
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      code: item.code,
      name: item.name,
      sku: item.sku || "",
      category_id: item.category_id || "",
      item_type: item.item_type,
      unit: item.unit,
      default_supplier_name: item.default_supplier_name || "",
      default_warehouse_id: item.default_warehouse_id || "",
      standard_cost: item.standard_cost || 0,
      average_cost: item.average_cost || 0,
      min_stock_level: item.min_stock_level || 0,
      note: item.note || "",
    });
    setItemModalOpen(true);
  };

  const reportRows = useMemo(
    () => [...balances].sort((a, b) => (b.inventory_value || 0) - (a.inventory_value || 0)),
    [balances]
  );

  const activeWarehouseName = warehouses.find((warehouse) => warehouse.id === warehouseFilter)?.name;
  const previewItem = items.find((item) => item.id === previewItemId) || items[0] || null;
  const previewMaterial =
    (previewItem && PREVIEW_MATERIAL_BY_TYPE[previewItem.item_type]) || PREVIEW_MATERIAL_BY_TYPE.raw_material;

  return (
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
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                activeTab === key
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-slate-200 bg-white text-slate-600"
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
                    <div className="text-sm font-semibold text-slate-700">Preview vật liệu</div>
                    <div className="text-xs text-slate-500">Giữ lại khối Three.js để xem nhanh bề mặt vật tư</div>
                  </div>
                  {previewItem && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {ITEM_TYPE_LABEL[previewItem.item_type] || previewItem.item_type}
                    </span>
                  )}
                </div>
                <div className="mb-3 h-[280px] rounded-2xl bg-slate-900 p-2">
                  <MaterialSphereViewer {...previewMaterial} />
                </div>
                {previewItem ? (
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
                    <div className="font-semibold text-slate-700">{previewItem.name}</div>
                    <div className="text-slate-500">Mã: {previewItem.code}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>SKU: {previewItem.sku || "-"}</div>
                      <div>Đơn vị: {previewItem.unit}</div>
                      <div>Giá bình quân: {money(previewItem.average_cost || previewItem.standard_cost)} đ</div>
                      <div>Tồn hiện tại: {money(previewItem.quantity_on_hand || 0)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Chưa có vật tư để preview.
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="min-w-[1120px] w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                      <th className="px-3 py-3">Mã vật tư</th>
                      <th className="px-3 py-3">Tên vật tư</th>
                      <th className="px-3 py-3">Nhóm</th>
                      <th className="px-3 py-3">Loại</th>
                      <th className="px-3 py-3">Đơn vị</th>
                      <th className="px-3 py-3">Kho mặc định / Tổng tồn</th>
                      <th className="px-3 py-3">Đơn giá tham chiếu</th>
                      <th className="px-3 py-3">Giá trị tồn</th>
                      <th className="px-3 py-3">Tồn tối thiểu</th>
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b last:border-0 cursor-pointer ${
                          previewItem?.id === item.id ? "bg-teal-50/60" : ""
                        }`}
                        onClick={() => setPreviewItemId(item.id)}
                      >
                        <td className="px-3 py-3 font-medium text-slate-700">{item.code}</td>
                        <td className="px-3 py-3 text-slate-700">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.sku || "-"}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{item.category_name || "-"}</td>
                        <td className="px-3 py-3 text-slate-600">{ITEM_TYPE_LABEL[item.item_type] || item.item_type}</td>
                        <td className="px-3 py-3 text-slate-600">{item.unit}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {item.default_warehouse_name || "-"} / {money(item.quantity_on_hand || 0)}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{money(item.average_cost || item.standard_cost)} đ</td>
                        <td className="px-3 py-3 text-slate-700">{money(item.inventory_value || 0)} đ</td>
                        <td className="px-3 py-3 text-slate-600">{money(item.min_stock_level || 0)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-md border px-2 py-1 text-xs ${
                              item.is_active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.is_active ? "Đang dùng" : "Ngừng dùng"}
                          </span>
                        </td>
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                              onClick={() => handleOpenEdit(item)}
                            >
                              Sửa
                            </button>
                            <button
                              className="rounded-md border border-amber-200 px-2 py-1 text-xs text-amber-700"
                              onClick={() => toggleItemStatus(item)}
                            >
                              {item.is_active ? "Ngừng dùng" : "Kích hoạt"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">
                          Chưa có vật tư.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
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
                    ))}
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
                          className={`rounded-md border px-2 py-1 text-xs ${
                            row.below_min_stock
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
      </section>

      <Modal
        open={itemModalOpen}
        onCancel={() => {
          setItemModalOpen(false);
          setEditingItem(null);
          setItemForm(emptyItemForm);
        }}
        onOk={() => itemMutation.mutate()}
        okText={editingItem ? "Cập nhật" : "Tạo vật tư"}
        confirmLoading={itemMutation.isPending}
        title={editingItem ? "Cập nhật vật tư" : "Tạo vật tư"}
      >
        <div className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Mã vật tư"
              value={itemForm.code}
              disabled={Boolean(editingItem)}
              onChange={(e) => setItemForm((prev) => ({ ...prev, code: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="SKU"
              value={itemForm.sku}
              onChange={(e) => setItemForm((prev) => ({ ...prev, sku: e.target.value }))}
            />
          </div>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Tên vật tư"
            value={itemForm.name}
            onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={itemForm.category_id}
              onChange={(e) => setItemForm((prev) => ({ ...prev, category_id: e.target.value }))}
            >
              <option value="">Chọn nhóm</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={itemForm.item_type}
              onChange={(e) => setItemForm((prev) => ({ ...prev, item_type: e.target.value }))}
            >
              {Object.entries(ITEM_TYPE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Đơn vị tính"
              value={itemForm.unit}
              onChange={(e) => setItemForm((prev) => ({ ...prev, unit: e.target.value }))}
            />
            <select
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={itemForm.default_warehouse_id}
              onChange={(e) => setItemForm((prev) => ({ ...prev, default_warehouse_id: e.target.value }))}
            >
              <option value="">Kho mặc định</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Nhà cung cấp mặc định"
            value={itemForm.default_supplier_name}
            onChange={(e) => setItemForm((prev) => ({ ...prev, default_supplier_name: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Giá chuẩn"
              value={itemForm.standard_cost}
              onChange={(e) => setItemForm((prev) => ({ ...prev, standard_cost: Number(e.target.value) }))}
            />
            <input
              type="number"
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Giá bình quân"
              value={itemForm.average_cost}
              onChange={(e) => setItemForm((prev) => ({ ...prev, average_cost: Number(e.target.value) }))}
            />
            <input
              type="number"
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Tồn tối thiểu"
              value={itemForm.min_stock_level}
              onChange={(e) => setItemForm((prev) => ({ ...prev, min_stock_level: Number(e.target.value) }))}
            />
          </div>
          <textarea
            className="min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Ghi chú"
            value={itemForm.note}
            onChange={(e) => setItemForm((prev) => ({ ...prev, note: e.target.value }))}
          />
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
    </div>
  );
};

export default MaterialsDashboard;
