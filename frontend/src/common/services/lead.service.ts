import axiosClient from "./axiosClient";

export interface CompanyInfoData {
  brand_name: string;
  company: string;
  tax_code: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
}

export const LeadService = {
  getCompanyInfo: (leadId: number) => {
    return axiosClient.get<CompanyInfoData>(`/lead/company-info`, { params: { lead_id: leadId } });
  },
  updateCompanyInfo: (data: Partial<CompanyInfoData> & { lead_id: number }) => {
    return axiosClient.put<CompanyInfoData>(`/lead/company-info`, data);
  },
  uploadLogo: (file: File, leadId: number) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lead_id", String(leadId));
    return axiosClient.post<{ success: boolean; logo_url: string }>(`/lead/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
