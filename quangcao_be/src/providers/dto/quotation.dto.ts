// src/quotation/dto/quotation.dto.ts
export interface CompanyInfo {
    name: string;
    address?: string;
    phone?: string;
    hotline?: string;
    taxCode?: string;
  }
  
  export interface CustomerInfo {
    name: string;
    phone?: string;
    email?: string;
  }
  
  export interface MaterialItem {
    name: string;
    unit: string;   // ĐVT
    qty: number;    // SL
    price: number;  // Đơn giá
    note?: string;
  }
  
  export interface LaborItem {
    level: string;  // BẬC NHÂN CÔNG
    qty: number;    // SỐ LƯỢNG
    unitPrice: number; // ĐƠN GIÁ NHÂN CÔNG
    days: number;      // SỐ NGÀY THI CÔNG
    note?: string;
  }
  
  export interface QuotationDto {
    title: string; // Ví dụ: "THI CÔNG BIỂN HIỆU ..."
    company: CompanyInfo;
    date?: string; // ISO or any string
    materials: MaterialItem[];
    labors: LaborItem[];
    notes?: string[]; // các dòng ghi chú
  }
  