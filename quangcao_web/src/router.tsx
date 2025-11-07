import { createBrowserRouter, type NonIndexRouteObject,} from "react-router-dom";

import BaseLayout from "./common/layouts/base.layout";
import type { UserRole } from "./@types/user.type";
import Error404 from "./app/404";
import React, { Suspense, lazy } from "react";
import {
  AccountBookOutlined, BookOutlined, CheckOutlined, FileTextOutlined, FormOutlined,
  HomeOutlined, InboxOutlined, TeamOutlined, UserOutlined, PieChartOutlined,
  BarChartOutlined,LineChartOutlined,
} from "@ant-design/icons";

// import { WorkTableDetailPage } from "./app/dashboard/work-tables/page";
// import { UserDashboard } from "./app/dashboard/user/page";
// import { SupplierDashboard } from "./app/dashboard/supplier/page";
// import { CustomerDashboard } from "./app/dashboard/customer/page";
import { InforDashboard } from "./app/infor/page";
// import { WorkPointPage } from "./app/dashboard/workpoints/page";
import { useInfo } from "./common/hooks/info.hook";
import { Navigate } from "react-router-dom";
import Login from "./app/login/page";
import GroupQRPage from "./components/chat/components/GroupQRPage";
import Workpoint from "./components/chat/components/Workpoint";
import { CenterBox } from "./components/chat/components/commons/TitlePanel";
import { ChatGroupProvider } from "./components/chat/ProviderChat";
import { Typography } from "@mui/material";
import { WorkpointSettingProvider } from "./common/hooks/useWorkpointSetting";

interface TRoute extends Omit<NonIndexRouteObject, "index" | "children"> {
  children?: TRoute[];
  roles?: UserRole[];
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
        Cám ơn quý khách đã quan tâm. Tính năng này đang phát triển ...
      </Typography>
      <Typography color="#00B4B6" fontSize={16} fontStyle="italic" textAlign="center">
        Vui lòng quay lại sau!
      </Typography>
    </CenterBox>
  )
}

const DashboardPage = lazy(() => import("./app/dashboard/page"));
const WorkPointPage = lazy(() => import("./app/dashboard/workpoints/page"));
const UserDashboard = lazy(() => import("./app/dashboard/user/page"));
const CustomerDashboard = lazy(() => import("./app/dashboard/customer/page"));
const SupplierDashboard = lazy(() => import("./app/dashboard/supplier/page"));
const WorkTableDetailPage = lazy(() => import("./app/dashboard/work-tables/page"));

const routes: TRoute = {
  path: "/",
  element: <BaseLayout />,
  errorElement: <Error404 />,
  children: [
    
    {
      path: "/login", // chuyển trang login thành path 'login' tách biệt
      index: true,
      element: <Login />,
      title: "Đăng nhập",
      ignoreInMenu: true,
    },
    
    {
      path: "/chat/:id",
      element: <ChatGroupProvider><GroupQRPage/></ChatGroupProvider>,
      title: "Chat Group",
      ignoreInMenu: true,
    },


    {
      path: "/point/:id/",
      element: <WorkpointSettingProvider><Workpoint/></WorkpointSettingProvider>,
      title: "Workpoint",
      ignoreInMenu: true,
    },

    {
      path: "/dashboard",
      element: (
        <Suspense fallback={<div>Loading...</div>}>
          <WorkpointSettingProvider>
            <DashboardPage />
          </WorkpointSettingProvider>
        </Suspense>
      ),
      // lazy: () => import("./app/dashboard/page"),
      title: "Bảng điều khiển",
      isMainMenu: true,
      children: [
        
        {
          path: "/dashboard",
          index: true,
          // element: (
          //   <div className="p-6">
          //     <h1 className="text-2xl font-bold mb-4">Bảng điều khiển</h1>
          //     <p>Chào mừng bạn đến với hệ thống quản lý!</p>
          //   </div>
          // ),
          element: <Navigate to="/dashboard/users" replace />,
          title: "Home",
          icon: <HomeOutlined />,
          ignoreInMenu: true,
        },
        
        {
          path: "/dashboard/workpoints",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              
                <WorkPointPage />
              
            </Suspense>
          ),
          title: "Chấm công",
          icon: <CheckOutlined />,
        },
        {
          path: "/dashboard/users",
         element: (
            <Suspense fallback={<div>Loading...</div>}>
              <UserDashboard />
            </Suspense>
          ),
          roles: ["user:management"],
          title: "Quản lý nhân sự",
          icon: <LineChartOutlined />,
        },
        {
          path: "/dashboard/supplier",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <SupplierDashboard />
          </Suspense>),
          roles: ["user:management"],
          title: "Quản lý thầu phụ",
          icon: <FormOutlined />,
        },
       
        {
          path: "/dashboard/customers",
          element: (
            <Suspense fallback={<div>Loading...</div>}>
          <CustomerDashboard />
          </Suspense>),
          roles: ["customer:management"],
          title: "Quản lý khách hàng",
          icon: <TeamOutlined />,
          isDevelope: false,
        },
        {
          path: "/dashboard/work-tables",
          element: (<Suspense fallback={<div>Loading...</div>}>
            <WorkTableDetailPage />
            </Suspense>),
          title: "Bảng công việc",
          icon: <BarChartOutlined />,
          children: [
            {
              path: "/dashboard/work-tables/:boardId",
              element: <WorkTableDetailPage />,
            },
          ],
        },
        {
          path: "divider-1",
          title: "divider",
          isDivider: true,  // lá cờ nhận biết đây là divider
          ignoreInMenu: false,
        },
        {
          path: "/dashboard/materials",
          element: (<DevelopeDashboard/>),
          roles: ["warehouse:management"],
          title: "Quản lý vật liệu",
          icon: <InboxOutlined />,
          isDevelope: true,
        },
        {
          path: "/dashboard/statistics",
          element: (<DevelopeDashboard/>),
          title: "Phân tích",
          icon: <PieChartOutlined  />,
        },
        {
          path: "/dashboard/invoices",
          element: (<DevelopeDashboard/>),
          roles: ["accounting:management"],
          title: "Báo giá",
          icon: <FileTextOutlined />,
        },

        {
          path: "/dashboard/accounting",
          element: (<DevelopeDashboard/>),
          
          roles: ["accounting:management"],
          title: "Kế toán",
          icon: <AccountBookOutlined />,
        },
        {
          path: "/dashboard/infor",
          element: <InforDashboard />,
          title: "Hồ sơ",
          icon: <UserOutlined />,
          ignoreInMenu: false,
        }
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
  isDevelope: boolean,
  tooltip: string,
  style:any,
};

export function getMainMenuItems(pathname?: string): MenuItem[] {
  const { data: user } = useInfo();
  if (!pathname) {
    pathname = window.location.pathname;
  }
  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  // const userPermissions = user?.role.permissions || [];

  const loop = (routes: Array<TRoute | undefined>): MenuItem[] => {
    return routes.reduce((acc: MenuItem[], route) => {
      if (!route) return acc;

      const hasPermission = true; // Gộp check quyền nếu cần

      if (!route.ignoreInMenu && hasPermission) {
        if (route.isDivider) {
          acc.push({
            key: route.path || Math.random().toString(),
            icon: null,
            label: "---",
            //@ts-ignore
            isDivider: true,
          });
        } else {
          const isDeveloping = (route as any).isDevelope || false;

          const push: MenuItem = {
            key: route.path || "",
            icon: route.icon || <BookOutlined />,
            label: route.title || "Menu",
            active: !isDeveloping, //pathname?.includes(route.path || ""),
            isDevelope: isDeveloping,
            tooltip: isDeveloping ? "Tính năng đang phát triển" : "",
            style: isDeveloping
              ? { opacity: 0.5, cursor: "not-allowed" }
              : {},
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
    }, []) as MenuItem[];
  };

  const main =
    routes.children
      ?.filter((route) => route.isMainMenu && !route.ignoreInMenu)
      .map((e) => e.children)
      .flat() || [];

  return loop(main) as MenuItem[];
}


export const router = createBrowserRouter([routes as NonIndexRouteObject], {});
export type Router = typeof router;
// export function FallbackElement() {
//   return <div>Loading...</div>;
// }

