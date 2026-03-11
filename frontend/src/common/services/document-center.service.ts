import axiosClient from "./axiosClient";

export type DocumentCenterListItem = {
  id: string;
  code: string;
  type: string;
  docDate: string;
  partnerId?: string | null;
  partnerName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  amount: number;
  currency?: string;
  status: string;
  description?: string | null;
  note?: string | null;
  tags?: string[];
  updatedAt?: string;
  attachmentCount?: number;
};

export type DocumentCenterAttachment = {
  id: string;
  document_id?: string | null;
  filename: string;
  mimeType?: string | null;
  size?: number | null;
  storageKey?: string | null;
  url?: string | null;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
};

export type DocumentCenterLink = {
  id: string;
  document_id: string;
  linked_document_id?: string | null;
  link_type?: string | null;
  note?: string | null;
};

export type DocumentCenterAuditLog = {
  id: string;
  action: string;
  from_status?: string | null;
  to_status?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  actedAt?: string | null;
  payload?: Record<string, any>;
};

export type DocumentCenterDetail = DocumentCenterListItem & {
  attachments?: DocumentCenterAttachment[];
  links?: DocumentCenterLink[];
  auditLog?: DocumentCenterAuditLog[];
};

export type DocumentCenterListResponse = {
  data: DocumentCenterListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type DocumentCenterMetadata = {
  types: string[];
  statuses: string[];
};

export const DocumentCenterService = {
  list: (params: Record<string, any>) =>
    axiosClient.get<DocumentCenterListResponse>("/documents", {
      params,
    }),
  getById: (id: string) => axiosClient.get<DocumentCenterDetail>(`/documents/${id}`),
  metadata: () => axiosClient.get<DocumentCenterMetadata>("/documents/metadata"),

  create: (payload: Record<string, any>) => axiosClient.post<DocumentCenterDetail>("/documents", payload),
  update: (id: string, payload: Record<string, any>) => axiosClient.patch<DocumentCenterDetail>(`/documents/${id}`, payload),

  submit: (id: string) => axiosClient.post<DocumentCenterDetail>(`/documents/${id}/submit`, {}),
  approve: (id: string) => axiosClient.post<DocumentCenterDetail>(`/documents/${id}/approve`, {}),
  cancel: (id: string) => axiosClient.post<DocumentCenterDetail>(`/documents/${id}/cancel`, {}),

  attachToDocument: (id: string, attachmentIds: string[]) =>
    axiosClient.post(`/documents/${id}/attachments`, { attachmentIds }),
  detachFromDocument: (id: string, attachmentId: string) =>
    axiosClient.delete(`/documents/${id}/attachments/${attachmentId}`),
  addLink: (id: string, payload: { linkedDocumentId?: string; linkType?: string; note?: string }) =>
    axiosClient.post(`/documents/${id}/links`, payload),

  uploadAttachment: (file: File, uploadedBy?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (uploadedBy) {
      formData.append("uploadedBy", uploadedBy);
    }
    return axiosClient.post<DocumentCenterAttachment>("/attachments/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
