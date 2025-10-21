import {
  createBrowserRouter,
  type NonIndexRouteObject,
} from "react-router-dom";

import BaseLayout from "./common/layouts/base.layout";
import type { UserRole } from "./@types/user.type";
import Error404 from "./app/404";
import React from "react";
import {
  AccountBookOutlined,
  BookOutlined,
  CheckOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  InboxOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  PieChartOutlined,
  BarChartOutlined,

LineChartOutlined,

DotChartOutlined,
} from "@ant-design/icons";
import { Tooltip } from "@mui/material";
import { WorkTableDetailPage } from "./app/dashboard/work-tables/page";
import { UserDashboard } from "./app/dashboard/user/page";
import { SupplierDashboard } from "./app/dashboard/supplier/page";
import { MaterialDashboard } from "./app/dashboard/material/page";
import { InvoiceDashboard } from "./app/dashboard/invoice/page";
import { CustomerDashboard } from "./app/dashboard/customer/page";
import { SettingDashboard } from "./app/dashboard/setting/page";
import { AccountingDashboard } from "./app/dashboard/accounting/page";
import { InforDashboard } from "./app/infor/page";
import { WorkPointPage } from "./app/dashboard/workpoints/page";
import { useInfo } from "./common/hooks/info.hook";
// import Error403 from "./app/403";
import { Navigate } from "react-router-dom";
import QrPage from "./components/qr/QrPage";
import RequireAuth from "./services/RequireAuth";
import GroupQRPage from "./components/chat/components/GroupQRPage";
import Workpoint from "./components/chat/components/Workpoint";
import { StatisticDashboard } from "./app/dashboard/statistic/page";
import { CenterBox } from "./components/chat/components/commons/TitlePanel";
import { Typography } from "@mui/material";
import { useApiHost, useAdminIndex } from "./common/hooks/useApiHost";


// Route guard: chặn truy cập nếu không có quyền
function RequireRoles({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: React.ReactElement;
}) {
  // const { data: user } = useInfo();
  // const userPermissions = user?.role.permissions || [];
  // if (!roles || roles.length === 0) return children;
  // const hasPermission = roles.some((r) => userPermissions.includes(r));
  // return hasPermission ? children : <Error403 />;

  // console.log(children);
  // console.log(children);
  return children;
}

interface TRoute extends Omit<NonIndexRouteObject, "index" | "children"> {
  children?: TRoute[];
  title?: string;
  icon?: React.ReactNode;
  ignoreInMenu?: boolean;
  isDevelope?: boolean;
  isMainMenu?: boolean;
  index?: boolean;
  isDivider?: boolean;
}

const DevelopeDashboard = () => {
  return (
    <CenterBox spacing={5}>
      <Typography
        color="#00B4B6"
        fontSize={16}
        fontStyle="italic"
        mt={25}
        textAlign="center"
      >
        Cám ơn quý khách đã quan tâm. Tính năng này đang phát triển ...
      </Typography>
      <Typography color="#00B4B6" fontSize={16} fontStyle="italic" textAlign="center">
        Vui lòng quay lại sau!
      </Typography>
    </CenterBox>
  );
};

// Định nghĩa các route con dưới dạng mảng
const baseChildren: TRoute[] = [
  {
    path: "login",
    index: true,
    lazy: () => import("./app/login/page"),
    title: "Đăng nhập",
    ignoreInMenu: true,
  },
  {
    path: "chat/:id/:token",
    element: <GroupQRPage />,
    title: "Chat Group",
    ignoreInMenu: true,
  },
  {
    path: "point/:id",
    element: <Workpoint />,
    title: "Workpoint",
    ignoreInMenu: true,
  },
  {
    path: "dashboard",
    lazy: () => import("./app/dashboard/page"),
    title: "Bảng điều khiển",
    isMainMenu: true,
    children: [
      {
        index: true,
        element: <Navigate to="statistics" replace />,
        title: "Home",
        icon: <HomeOutlined />,
        ignoreInMenu: true,
      },
      {
        path: "workpoints",
        element: <WorkPointPage />,
        title: "Chấm công",
        icon: <CheckOutlined />,
      },
      {
        path: "users",
        element: (
          <RequireRoles roles={["user:management"]}>
            <UserDashboard />
          </RequireRoles>
        ),
        title: "Quản lý nhân sự",
        icon: <LineChartOutlined />,
      },
      {
        path: "supplier",
        element: (
          <RequireRoles roles={["user:management"]}>
            <SupplierDashboard />
          </RequireRoles>
        ),
        title: "Quản lý thầu phụ",
        icon: <FormOutlined />,
      },
      {
        path: "customers",
        element: (
          <RequireRoles roles={["customer:management"]}>
            <CustomerDashboard />
          </RequireRoles>
        ),
        title: "Quản lý khách hàng",
        icon: <TeamOutlined />,
        isDevelope: false,
      },
      {
        path: "work-tables",
        element: <WorkTableDetailPage />,
        title: "Bảng công việc",
        icon: <BarChartOutlined />,
        children: [
          {
            path: ":boardId",
            element: <WorkTableDetailPage />,
          },
        ],
      },
      // Thêm các route dashboard cần thiết khác tương tự...
    ],
  },
];

// Tạo route clone
const createClonedRoute = (path: string): TRoute => ({
  path,
  element: <BaseLayout />,
  errorElement: <Error404 />,
  children: baseChildren,
});

// Root route gốc "/"
const rootRoute: TRoute = {
  path: "/",
  element: <BaseLayout />,
  errorElement: <Error404 />,
  children: baseChildren,
};

// Mảng các đường dẫn clone
const clonePaths = ["/ad1", "/ad2", "/ad3", "/ad4", "/ad5"];

// Tạo mảng routes cho tất cả bản clone và root
const allRoutes: TRoute[] = [rootRoute, ...clonePaths.map(createClonedRoute)];

// Khởi tạo router
export const router = createBrowserRouter(allRoutes as NonIndexRouteObject[]);

// Fallback khi lazy load
export function FallbackElement() {
  return <div>Loading...</div>;
}