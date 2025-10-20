import React from "react";
import {
  createBrowserRouter,
  type NonIndexRouteObject,
  Navigate,
} from "react-router-dom";

import BaseLayout from "./common/layouts/base.layout";
import Error404 from "./app/404";
import { useInfo } from "./common/hooks/info.hook";
import { RequireRoles } from "./services/RequireAuth"; // tùy biến nếu cần

import GroupQRPage from "./components/chat/components/GroupQRPage";
import Workpoint from "./components/chat/components/Workpoint";
import { WorkPointPage } from "./app/dashboard/workpoints/page";
import { UserDashboard } from "./app/dashboard/user/page";
import { SupplierDashboard } from "./app/dashboard/supplier/page";
import { CustomerDashboard } from "./app/dashboard/customer/page";
import { WorkTableDetailPage } from "./app/dashboard/work-tables/page";

import {
  AccountBookOutlined,
  BookOutlined,
  CheckOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  InboxOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TeamOutlined,
  BarChartOutlined,
  AccountBookOutlined,
} from "@ant-design/icons";

import { CenterBox } from "./components/chat/components/commons/TitlePanel";
import { Typography } from "@mui/material";

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
