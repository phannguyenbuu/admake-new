import axiosClient from "./axiosClient";

export type InventoryCategory = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
};

export type Warehouse = {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  description?: string | null;
  status: string;
  is_default?: boolean;
};

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  sku?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  item_type: string;
  unit: string;
  default_supplier_id?: string | null;
  default_supplier_name?: string | null;
  default_warehouse_id?: string | null;
  default_warehouse_name?: string | null;
  standard_cost: number;
  average_cost: number;
  min_stock_level: number;
  is_active: boolean;
  note?: string | null;
  quantity_on_hand?: number;
  inventory_value?: number;
  below_min_stock?: boolean;
};

export type StockTransaction = {
  id: string;
  transaction_code: string;
  transaction_date: string;
  transaction_type: string;
  status: string;
  warehouse_id: string;
  warehouse_name?: string | null;
  destination_warehouse_id?: string | null;
  destination_warehouse_name?: string | null;
  item_id: string;
  item_code?: string | null;
  item_name?: string | null;
  unit?: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  direction: string;
  balance_after?: number | null;
  partner_id?: string | null;
  partner_name?: string | null;
  task_id?: string | null;
  project_id?: string | null;
  note?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  reference_code?: string | null;
  storekeeper_id?: string | null;
  accounting_entry_id?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  trace_links?: Array<Record<string, any>>;
};

export type InventoryBalance = {
  item_id: string;
  item_code?: string | null;
  item_name?: string | null;
  warehouse_id: string;
  warehouse_name?: string | null;
  unit?: string | null;
  quantity_on_hand: number;
  average_cost: number;
  inventory_value: number;
  min_stock_level?: number;
  below_min_stock?: boolean;
};

export type InventorySummary = {
  active_items: number;
  transaction_count: number;
  total_inventory_value: number;
  below_min_stock_count: number;
};

export const InventoryService = {
  bootstrap: (lead_id: number) => axiosClient.post("/inventory/bootstrap", { lead_id }),

  listCategories: (params: Record<string, any>) => axiosClient.get("/inventory/categories", { params }),
  createCategory: (payload: Record<string, any>) => axiosClient.post("/inventory/categories", payload),
  updateCategory: (id: string, payload: Record<string, any>) => axiosClient.put(`/inventory/categories/${id}`, payload),
  deleteCategory: (id: string) => axiosClient.delete(`/inventory/categories/${id}`),

  listWarehouses: (params: Record<string, any>) => axiosClient.get("/inventory/warehouses", { params }),
  createWarehouse: (payload: Record<string, any>) => axiosClient.post("/inventory/warehouses", payload),
  updateWarehouse: (id: string, payload: Record<string, any>) => axiosClient.put(`/inventory/warehouses/${id}`, payload),
  deleteWarehouse: (id: string) => axiosClient.delete(`/inventory/warehouses/${id}`),

  listItems: (params: Record<string, any>) => axiosClient.get("/inventory/items", { params }),
  createItem: (payload: Record<string, any>) => axiosClient.post("/inventory/items", payload),
  getItem: (id: string) => axiosClient.get(`/inventory/items/${id}`),
  updateItem: (id: string, payload: Record<string, any>) => axiosClient.put(`/inventory/items/${id}`, payload),
  patchItemStatus: (id: string, payload: Record<string, any>) => axiosClient.patch(`/inventory/items/${id}/status`, payload),
  deleteItem: (id: string) => axiosClient.delete(`/inventory/items/${id}`),

  listTransactions: (params: Record<string, any>) => axiosClient.get("/inventory/transactions", { params }),
  createTransaction: (payload: Record<string, any>) => axiosClient.post("/inventory/transactions", payload),
  getTransaction: (id: string) => axiosClient.get(`/inventory/transactions/${id}`),
  updateTransaction: (id: string, payload: Record<string, any>) => axiosClient.put(`/inventory/transactions/${id}`, payload),
  confirmTransaction: (id: string) => axiosClient.post(`/inventory/transactions/${id}/confirm`, {}),
  cancelTransaction: (id: string) => axiosClient.post(`/inventory/transactions/${id}/cancel`, {}),

  getBalances: (params: Record<string, any>) => axiosClient.get("/inventory/balances", { params }),
  getStockCard: (params: Record<string, any>) => axiosClient.get("/inventory/stock-card", { params }),
  getMovementReport: (params: Record<string, any>) => axiosClient.get("/inventory/movement-report", { params }),
  getValuationReport: (params: Record<string, any>) => axiosClient.get("/inventory/valuation-report", { params }),
  getSummary: (params: Record<string, any>) => axiosClient.get("/inventory/summary", { params }),
  getTrace: (params: Record<string, any>) => axiosClient.get("/inventory/trace", { params }),
};
