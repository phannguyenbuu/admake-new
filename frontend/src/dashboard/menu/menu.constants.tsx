import { CheckOutlined, LineChartOutlined, TeamOutlined } from "@ant-design/icons";

export const MOBILE_CORE_KEYS = [
  "/workpoints",
  "/work-tables",
  "/users",
  "/customers",
] as const;

export const PRIMARY_GROUP_KEYS = [
  "/workpoints",
  "/users",
  "/supplier",
  "/customers",
] as const;

export const MOBILE_FALLBACK_ITEMS = [
  {
    key: "/workpoints",
    label: "Chấm công",
    icon: <CheckOutlined />,
    path: "/workpoints",
  },
  {
    key: "/work-tables",
    label: "Bảng công việc",
    icon: <TeamOutlined />,
    path: "/work-tables",
  },
  {
    key: "/users",
    label: "Quản lý nhân sự",
    icon: <LineChartOutlined />,
    path: "/users",
  },
  {
    key: "/customers",
    label: "Quản lý khách hàng",
    icon: <TeamOutlined />,
    path: "/customers",
  },
] as const;
