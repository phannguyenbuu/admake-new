export type Language = 'vi' | 'en';

export interface PlanFeature {
  id: string;
  nameVI: string;
  nameEN: string;
  isCustomOnly?: boolean; // Highlighted or premium items
}

export interface PricingPlan {
  id: 'basic' | 'professional' | 'specialized';
  nameVI: string;
  nameEN: string;
  badgeStyle: string; // Tailwind colors for ribbons
  prices: {
    monthly6: number;   // Price for 6-month cycle
    monthly12: number;  // Price for 12-month cycle
    customYearly?: number; // Special model for the specialized package
  };
  storageGB: number;
  features: string[]; // List of feature IDs included
}

export const FEATURES: PlanFeature[] = [
  { id: 'reports', nameVI: 'Báo Cáo & Phân Tích', nameEN: 'Reports & Analytics' },
  { id: 'gps_attendance', nameVI: 'Chấm Công GPS', nameEN: 'GPS Time Attendance' },
  { id: 'tasks', nameVI: 'Giao Việc', nameEN: 'Task Assignment' },
  { id: 'orders', nameVI: 'Quản Lý Đơn Hàng', nameEN: 'Order Management' },
  { id: 'crm', nameVI: 'Quản Lý Khách Hàng', nameEN: 'Customer Management (CRM)' },
  { id: 'contract_piece', nameVI: 'Cơ Chế Khoán', nameEN: 'Contract & Piece-rate System' },
  { id: 'hr', nameVI: 'Quản Lý Nhân Sự', nameEN: 'HR Management' },
  { id: 'subcontractors', nameVI: 'Quản Lý Thầu Phụ', nameEN: 'Subcontractor Management' },
  { id: 'payroll', nameVI: 'Bảng Lương', nameEN: 'Payroll & Compensation' },
  { id: 'chat', nameVI: 'Chat Nhóm', nameEN: 'Group Chat Collaboration' },
  { id: 'rating', nameVI: 'Chấm Sao', nameEN: 'Performance & Star Ratings' },
  { id: 'contracts', nameVI: 'Giấy Tờ Hợp Đồng', nameEN: 'Contract Documents' },
  { id: 'inventory', nameVI: 'Vật Tư - Tồn Kho', nameEN: 'Materials & Inventory Management', isCustomOnly: true },
  { id: 'quotations', nameVI: 'Báo Giá', nameEN: 'Quotation Generation', isCustomOnly: true }
];

export const PLANS: PricingPlan[] = [
  {
    id: 'basic',
    nameVI: 'CƠ BẢN',
    nameEN: 'BASIC',
    badgeStyle: 'bg-cyan-500 text-white shadow-cyan-300/40',
    prices: {
      monthly6: 2000000,
      monthly12: 3000000
    },
    storageGB: 10,
    features: [
      'reports',
      'gps_attendance',
      'tasks',
      'orders',
      'crm',
      'contract_piece',
      'hr',
      'subcontractors',
      'payroll',
      'chat',
      'rating',
      'contracts'
    ]
  },
  {
    id: 'professional',
    nameVI: 'CHUYÊN NGHIỆP',
    nameEN: 'PROFESSIONAL',
    badgeStyle: 'bg-[#189bb4] text-white shadow-[#189bb4]/40',
    prices: {
      monthly6: 2500000,
      monthly12: 4000000
    },
    storageGB: 20,
    features: [
      'reports',
      'gps_attendance',
      'tasks',
      'orders',
      'crm',
      'contract_piece',
      'hr',
      'subcontractors',
      'payroll',
      'chat',
      'rating',
      'contracts',
      'inventory',
      'quotations'
    ]
  },
  {
    id: 'specialized',
    nameVI: 'CHUYÊN DỤNG 3D',
    nameEN: '3D SPECIALIZED',
    badgeStyle: 'bg-amber-500 text-black shadow-amber-300/40',
    prices: {
      monthly6: 0,
      monthly12: 0,
      customYearly: 2000000 // 2,000,000 / year
    },
    storageGB: 50,
    features: [
      'reports',
      'gps_attendance',
      'tasks',
      'orders',
      'crm',
      'inventory',
      'quotations'
    ]
  }
];

export const TRANSLATIONS = {
  vi: {
    heroTitle: 'Cổng Tính Giá & Lập Kế Hoạch Gói Dịch Vụ',
    heroSub: 'Khám phá các gói dịch vụ tùy biến tối ưu bằng công cụ tương tác thông minh',
    duration6: '6 tháng',
    duration12: '12 tháng',
    durationYear: 'Năm',
    storageLabel: 'Lưu trữ',
    selectBillingCycle: 'Chọn Chu Kỳ Thanh Toán',
    monthly: 'Tháng',
    year: 'Năm',
    featuresTitle: 'Tính Năng Chi Tiết',
    activePlan: 'Gói đang chọn',
    totalPrice: 'Tổng chi phí thanh toán',
    savings: 'Tiết kiệm tương đương',
    configTitle: 'Tùy Chỉnh Kế Hoạch Dịch Vụ',
    customStorage: 'Dung Lượng Lưu Trữ Thêm (GB)',
    customStorageSub: '+20,000đ mỗi 10 GB',
    usersCount: 'Số Lượng Người Dùng (User)',
    usersCountSub: 'Miễn phí 10 users đầu, thêm +50,000đ/user/tháng',
    calculator: 'Bảng Tính Giá Ước Tính',
    selectedPackage: 'Gói Dịch Vụ',
    billingCycle: 'Chu kỳ',
    basePrice: 'Giá phiên bản gốc',
    extraStorageCost: 'Chi phí dung lượng thêm',
    extraUsersCost: 'Chi phí user bổ sung',
    recommended: 'Gợi ý tốt nhất',
    contactSales: 'Liên Hệ Đăng Ký',
    downloadQuote: 'Tải PDF Báo Giá / Chi Tiết',
    close: 'Đóng',
    currency: 'đ',
    quoteDetail: 'Bản Báo Giá Chi Tiết Hệ Thống',
    generatedOn: 'Ngày khởi tạo báo giá',
    customerInfo: 'Thông tin đăng ký nhanh',
    fullName: 'Họ và tên của bạn',
    phone: 'Số điện thoại liên hệ',
    companyName: 'Tên đơn vị / doanh nghiệp',
    submitQuote: 'Gửi Yêu Cầu Nhận Tư Vấn Trực Tiếp',
    requiredField: 'Vui lòng điền thông tin này',
    successMsg: 'Yêu cầu của bạn đã được tiếp nhận! Đội ngũ tư vấn sẽ liên hệ lại trong vòng 15 phút.',
    special3DTitle: 'Diễn Họa 3D Chuyên Dụng',
    special3DSub: 'Bốc tách vật tư & báo giá tự động chuyên biệt',
    vatNote: '* Giá trên chưa bao gồm VAT'
  },
  en: {
    heroTitle: 'Pricing Gateway & Plan Planner',
    heroSub: 'Explore optimized plans with our dynamic calculation tool',
    duration6: '6 Months',
    duration12: '12 Months',
    durationYear: 'Year',
    storageLabel: 'Storage',
    selectBillingCycle: 'Choose Billing Cycle',
    monthly: 'mo',
    year: 'yr',
    featuresTitle: 'Detailed Features',
    activePlan: 'Selected Plan',
    totalPrice: 'Total Billing Amount',
    savings: 'Equivalent Savings',
    configTitle: 'Customize Service Plan',
    customStorage: 'Extra Storage Capacity (GB)',
    customStorageSub: '+20,000 VND per 10 GB',
    usersCount: 'Number of Active Users',
    usersCountSub: 'First 10 users free, +50,000 VND/user/month additional',
    calculator: 'Pricing Summary Sheet',
    selectedPackage: 'Active Package',
    billingCycle: 'Billing duration',
    basePrice: 'Base subscription price',
    extraStorageCost: 'Additional storage cost',
    extraUsersCost: 'Additional user fee',
    recommended: 'Highly Recommended',
    contactSales: 'Get Started & Contact',
    downloadQuote: 'Export Pricing PDF / Print',
    close: 'Close',
    currency: ' VND',
    quoteDetail: 'Detailed Quotation Specifications',
    generatedOn: 'Generated on',
    customerInfo: 'Quick Registration Information',
    fullName: 'Your Full Name',
    phone: 'Contact Phone Number',
    companyName: 'Company / Organization Name',
    submitQuote: 'Send Direct Consultancy Request',
    requiredField: 'This field is required',
    successMsg: 'Your request has been registered! Our consultants will contact you within 15 minutes.',
    special3DTitle: '3D Specialized Visualization',
    special3DSub: 'Material takeoff & automated quotations specializing in 3D construction',
    vatNote: '* Prices shown exclude VAT'
  }
};
