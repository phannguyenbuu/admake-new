import axiosClient from "./axiosClient";

export interface MaterialRecord {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  price?: number;
  image?: string | null;
  description?: string | null;
  supplier?: string | null;
  lead_id?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialMovementPayload {
  material_id: string;
  movement_type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  unit_cost?: number;
  task_id?: string;
  note?: string;
  lead_id?: number;
}

export const MaterialService = {
  getAll: (params: Record<string, string | number | undefined>) =>
    axiosClient.get("/material/", { params }),
  getSummary: (lead?: number) =>
    axiosClient.get("/material/summary", { params: { lead } }),
  create: (dto: Partial<MaterialRecord> & { category?: string }) =>
    axiosClient.post("/material/", dto),
  moveStock: (dto: MaterialMovementPayload) => axiosClient.post("/material/movement", dto),
  getLedger: (id: string, params?: Record<string, string | number | undefined>) =>
    axiosClient.get(`/material/${id}/ledger`, { params }),
};
