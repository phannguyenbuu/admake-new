import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  Navigate,
  type NonIndexRouteObject,
} from "react-router-dom";
import {
  AccountBookOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  InboxOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Typography } from "@mui/material";
import BaseLayout from "../common/common/layouts/base.layout";
import type { UserRole } from "../common/@types/user.type";
import type {
  DashboardPermissionKey,
  UserCanViewFormProps,
} from "../common/@types/user-can-view.type";
import Error404 from "../common/app/404";
import UnPermissionBoard from "../common/app/dashboard/unPermissionBoard";
import { InforDashboard } from "../common/app/infor/page";
import { useUser } from "../common/common/hooks/useUser";
import { TaskProvider } from "../common/common/hooks/useTask";
import { WorkpointInforProvider } from "../common/common/hooks/useWorpointInfor";
import { WorkpointSettingProvider } from "../common/common/hooks/useWorkpointSetting";
import {
  getFirstAccessibleDashboardPath,
  hasDashboardPermission,
} from "../common/common/utils/permission.util";
import { CenterBox } from "../common/components/chat/components/commons/TitlePanel";

interface TRoute extends Omit<NonIndexRouteObject, "index" | "children"> {
  children?: TRoute[];
  roles?: UserRole[];
  requiredPermission?: DashboardPermissionKey;
  title?: string;
  icon?: React.ReactNode;
  ignoreInMenu?: boolean;
  isDevelope?: boolean;
  isMainMenu?: boolean;
  index?: boolean;
  tooltip?: string;
  isDivider?: boolean;
}

const DevelopeDashboard = () => {
  return (
    <CenterBox spacing={5}>
      <Typography color="#00B4B6" fontSize={16} fontStyle="italic" mt={25} textAlign="center">
        Cảm ơn quý khách đã quan tâm. Tính năng này đang phát triển...
      </Typography>
      <Typography color="#00B4B6" fontSize={16} fontStyle="italic" textAlign="center">
        Vui lòng quay lại sau.
      </Typography>
    </CenterBox>
  );
};

const DashboardPage = lazy(() => import("../common/app/dashboard/page"));
const WorkPointPage = lazy(() => import("../common/app/dashboard/workpoints/page"));
const UserDashboard = lazy(() => import("../common/app/dashboard/user/page"));
const CustomerDashboard = lazy(() => import("../common/app/dashboard/customer/page"));
const SupplierDashboard = lazy(() => import("../common/app/dashboard/supplier/page"));
const WorkTableDetailPage = lazy(() => import("../common/app/dashboard/work-tables/page"));
const StatisticDashboard = lazy(() => import("../common/app/dashboard/statistic/page"));
const InvoiceDashboard = lazy(() => import("../common/app/dashboard/invoices/page"));
const MaterialsDashboard = lazy(() => import("../common/app/dashboard/materials/page"));
const AccountingDashboard = lazy(() => import("../common/app/dashboard/accounting/page"));

const DashboardIndexRedirect = () => {
  const { canViewPermission } = useUser();
  const hasAccessToken =
    typeof window !== "undefined" && Boolean(localStorage.getItem("accessToken"));

  if (hasAccessToken && !canViewPermission) {
    return <div>Loading...</div>;
  }

  const nextPath = getFirstAccessibleDashboardPath(canViewPermission);

  if (nextPath) {
    return <Navigate to={nextPath} replace />;
  }

  return <UnPermissionBoard />;
};

const routes: TRoute = {
  path: "/",
  element: (
    <WorkpointInforProvider>
      <WorkpointSettingProvider>
        <TaskProvider>
          <BaseLayout />
        </TaskProvider>
      </WorkpointSettingProvider>
    </WorkpointInforProvider>
  ),
  errorElement: <Error404 />,
  children: [
    {
      path: "/",
      element: (
        <Suspense fallback={<div>Loading...</div>}>
          <DashboardPage />
        </Suspense>
      ),
      title: "Bảng điều khiển",
      isMainMenu: true,
      children: [
        {
          index: true,
          element: <DashboardIndexRedirect />,
          title: "Home",
          icon: <HomeOutlined />,
          ignoreInMenu: true,
        },
        {
          path: "/workpoints",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <WorkPointPage />
            </Suspense>
          ),
          requiredPermission: "view_workpoint",
          title: "Chấm công",
          icon: <CheckOutlined />,
        },
        {
          path: "/user",
          element: <Navigate to="/users" replace />,
          title: "Quản lý nhân sự",
          ignoreInMenu: true,
        },
        {
          path: "/users",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <UserDashboard />
            </Suspense>
          ),
          roles: ["user:management"],
          requiredPermission: "view_user",
          title: "Quản lý nhân sự",
          icon: <LineChartOutlined />,
        },
        {
          path: "/supplier",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <SupplierDashboard />
            </Suspense>
          ),
          roles: ["user:management"],
          requiredPermission: "view_supplier",
          title: "Quản lý thầu phụ",
          icon: <FormOutlined />,
        },
        {
          path: "/customers",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <CustomerDashboard />
            </Suspense>
          ),
          roles: ["customer:management"],
          requiredPermission: "view_customer",
          title: "Quản lý khách hàng",
          icon: <TeamOutlined />,
          isDevelope: false,
        },
        {
          path: "/work-tables",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <WorkTableDetailPage />
            </Suspense>
          ),
          requiredPermission: "view_workspace",
          title: "Bảng công việc",
          icon: <BarChartOutlined />,
          children: [
            {
              path: "/work-tables/:boardId",
              element: <WorkTableDetailPage />,
            },
          ],
        },
        {
          path: "divider-1",
          title: "divider",
          isDivider: true,
          ignoreInMenu: false,
        },
        {
          path: "/statistics",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <StatisticDashboard />
            </Suspense>
          ),
          requiredPermission: "view_statistic",
          title: "Phân tích",
          icon: <PieChartOutlined />,
        },
        {
          path: "/accounting",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <AccountingDashboard />
            </Suspense>
          ),
          roles: ["accounting:management"],
          requiredPermission: "view_accountant",
          title: "Kế toán",
          icon: <AccountBookOutlined />,
        },
        {
          path: "/materials",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <MaterialsDashboard />
            </Suspense>
          ),
          roles: ["warehouse:management"],
          requiredPermission: "view_material",
          title: "Quản lý vật liệu",
          icon: <InboxOutlined />,
          isDevelope: false,
        },
        {
          path: "/invoices",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <InvoiceDashboard />
            </Suspense>
          ),
          roles: ["accounting:management"],
          requiredPermission: "view_invoice",
          title: "Báo giá",
          icon: <FileTextOutlined />,
        },
        {
          path: "/infor",
          element: <InforDashboard />,
          title: "Hồ sơ",
          icon: <UserOutlined />,
          ignoreInMenu: false,
        },
      ],
    },
  ],
};

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  children?: MenuItem[];
  isDevelope: boolean;
  tooltip: string;
  style: any;
};

export function getMainMenuItems(
  pathname?: string,
  canViewPermission?: UserCanViewFormProps | null,
): MenuItem[] {
  if (!pathname) {
    pathname = window.location.pathname;
  }
  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const loop = (routeItems: Array<TRoute | undefined>): MenuItem[] => {
    return routeItems.reduce((acc: MenuItem[], route) => {
      if (!route) return acc;

      const hasPermission = hasDashboardPermission(
        canViewPermission,
        route.requiredPermission,
      );

      if (!route.ignoreInMenu && hasPermission) {
        if (route.isDivider) {
          acc.push({
            key: route.path || Math.random().toString(),
            icon: null,
            label: "---",
            // @ts-ignore
            isDivider: true,
          });
        } else {
          const isDeveloping = route.isDevelope || false;
          const push: MenuItem = {
            key: route.path || "",
            icon: route.icon || <BookOutlined />,
            label: route.title || "Menu",
            active: !isDeveloping,
            isDevelope: isDeveloping,
            tooltip: isDeveloping ? "Tính năng đang phát triển" : "",
            style: isDeveloping ? { opacity: 0.5, cursor: "not-allowed" } : {},
          };

          if (!route.children?.length) {
            acc.push(push);
          } else {
            const children = loop(route.children);
            if (children.length > 0) {
              acc.push({ ...push, children });
            }
          }
        }
      }

      return acc;
    }, []);
  };

  const main =
    routes.children
      ?.filter((route) => route.isMainMenu && !route.ignoreInMenu)
      .map((route) => route.children)
      .flat() || [];

  return loop(main);
}

export const router = createBrowserRouter([routes as NonIndexRouteObject], {});
export type Router = typeof router;
