import type { BaseEntity } from "./common.type";

export interface CreateWorkData {
  name: string; // Tên công việc
  customer: string; // ID hoặc tên khách hàng (input search)
  customerName?: string; // Tên khách hàng (hiển thị)
  customerPhone?: string; // Số điện thoại khách hàng (hiển thị)
  customerAddress?: string; // Địa chỉ thi công (hiển thị)
  description?: string; // Mô tả công việc
  startDate?: string | Date; // Ngày bắt đầu
  endDate?: string | Date; // Ngày kết thúc
  salary?: string | number; // Mức lương
  type?: string; // Hình thức (công khoán, fulltime, parttime)
  materials?: SelectedMaterial[]; // Danh sách vật liệu đã chọn
  users?: SelectedUser[]; // Danh sách nhân sự đã chọn
  activity?: string; // Bình luận hoạt động
  status?: string; // Trạng thái công việc (ví dụ: 'Chưa nhận việc')
  listName?: string; // Tên danh sách (ví dụ: 'Phân việc')
}

// Thay đổi interface cho vật liệu đã chọn
export interface SelectedMaterial {
  value: string;
  label: string;
  quantity: number;
}

// Thay đổi interface cho nhân sự đã chọn
export interface SelectedUser {
  value: string;
  label: string;
}

export interface WorkSpace {
  id: string;
  name: string;
  cover?: string;
}

export interface MaterialTask {
  materialId: number;
  quantity: number;
}

export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: string; // có thể thu hẹp thành "OPEN" | "DONE" | ...
  // type: string; // có thể thu hẹp thành "REWARD" | ...
  reward: number; // số tiền thưởng
  amount: number;
  type: "MONTHLY" | "REWARD" | string;
  assign_ids: string[]; // id của user
  workspaceId: string; // id của workspace
  customerId: string; // id của customer
  materials: MaterialTask[]; // danh sách vật tư
  start_time?: string | Date; // Thời gian bắt đầu
  end_time?: string | Date; // Thời gian kết thúc
}

export interface TaskGroup {
  count: number;
  tasks: Task[];
}

export interface TasksResponse {
  [status: string]: TaskGroup;
}

export interface ColumnType {
  id: string;
  title: string;
  type: string;
}

export interface ManagermentBoardProps {
  workspaceId: string;
}

export interface FormTaskDetailProps {
  taskDetail: Task | null;
  workspaceId: string;
  form: any;
}


export interface FormTaskProps {
  form: any;
  open: boolean;
  onCancel: () => void;
  taskId?: string;
  initialValues?: Task | null;
  workspaceId: string;
  onSuccess?: () => void;
}

export interface AdminPermissions {
  adminMode: boolean,
  adminMaterial: boolean,
  adminInvoice: boolean,
  adminCustomer: boolean,
  adminRole: boolean,
  adminSetting: boolean,
  adminUser: boolean,
  adminAccounting: boolean,
  adminStatistics: boolean,
};

export interface Mode {
  adminMode: AdminPermissions;
  userMode: boolean;
}