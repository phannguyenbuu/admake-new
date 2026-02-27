import { CheckOutlined, LineChartOutlined, TeamOutlined } from "@ant-design/icons";

export const MOBILE_CORE_KEYS = [
  "/dashboard/workpoints",
  "/dashboard/work-tables",
  "/dashboard/users",
  "/dashboard/customers",
] as const;

export const PRIMARY_GROUP_KEYS = [
  "/dashboard/workpoints",
  "/dashboard/users",
  "/dashboard/supplier",
  "/dashboard/customers",
] as const;

export const MOBILE_FALLBACK_ITEMS = [
  {
    key: "/dashboard/workpoints",
    label: "Chấm công",
    icon: <CheckOutlined />,
    path: "/dashboard/workpoints",
  },
  {
    key: "/dashboard/work-tables",
    label: "Bảng công việc",
    icon: <TeamOutlined />,
    path: "/dashboard/work-tables",
  },
  {
    key: "/dashboard/users",
    label: "Quản lý nhân sự",
    icon: <LineChartOutlined />,
    path: "/dashboard/users",
  },
  {
    key: "/dashboard/customers",
    label: "Quản lý khách hàng",
    icon: <TeamOutlined />,
    path: "/dashboard/customers",
  },
] as const;
