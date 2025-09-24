import {
  createBrowserRouter,
  type NonIndexRouteObject,
} from "react-router-dom";
import BaseLayout from "./common/layouts/base.layout";
import type { UserRole } from "./@types/user.type";
import Error404 from "./app/404";
import type React from "react";
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
} from "@ant-design/icons";
import { WorkTableDetailPage } from "./app/dashboard/work-tables/page";
import { UserDashboard } from "./app/dashboard/user/page";
import { MaterialDashboard } from "./app/dashboard/material/page";
import { InvoiceDashboard } from "./app/dashboard/invoice/page";
import { CustomerDashboard } from "./app/dashboard/customer/page";
import { SettingDashboard } from "./app/dashboard/setting/page";
import { AccountingDashboard } from "./app/dashboard/accounting/page";
import { InforDashboard } from "./app/infor/page";
import { WorkPointsPage } from "./app/dashboard/work-points/page";
import { useInfo } from "./common/hooks/info.hook";
import Error403 from "./app/403";
import { Navigate } from "react-router-dom";

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

  console.log(children);
  return children;
}

interface TRoute extends Omit<NonIndexRouteObject, "index" | "children"> {
  children?: TRoute[];
  roles?: UserRole[];
  title?: string;
  icon?: React.ReactNode;
  ignoreInMenu?: boolean;
  isMainMenu?: boolean;
  index?: boolean;
}
const routes: TRoute = {
  path: "/",
  element: <BaseLayout />,
  errorElement: <Error404 />,
  children: [
    // {
    //   path: "/",
    //   index: true,
    //   lazy: () => import("./app/login/page"),
    //   title: "Đăng nhập",
    //   ignoreInMenu: true,
    // },

    {
      index: true,
      element: <Navigate to="/dashboard" replace />,
    },
    {
      path: "login", // chuyển trang login thành path 'login' tách biệt
      lazy: () => import("./app/login/page"),
      title: "Đăng nhập",
      ignoreInMenu: true,
    },



    {
      path: "/dashboard",
      lazy: () => import("./app/dashboard/page"),
      title: "Bảng điều khiển",
      isMainMenu: true,
      children: [
        {
          path: "/dashboard",
          index: true,
          element: (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Bảng điều khiển</h1>
              <p>Chào mừng bạn đến với hệ thống quản lý!</p>
            </div>
          ),
          title: "Home",
          icon: <HomeOutlined />,
          ignoreInMenu: true,
        },
        {
          path: "/dashboard/work-points",
          element: <WorkPointsPage />,
          title: "Chấm công",
          icon: <CheckOutlined />,
        },
        {
          path: "/dashboard/users",
          element: (
            <RequireRoles roles={["user:management"]}>
              <UserDashboard />
            </RequireRoles>
          ),
          roles: ["user:management"],
          title: "Quản lý nhân sự",
          icon: <FormOutlined />,
        },
        {
          path: "/dashboard/materials",
          element: (
            <RequireRoles roles={["warehouse:management"]}>
              <MaterialDashboard />
            </RequireRoles>
          ),
          roles: ["warehouse:management"],
          title: "Quản lý vật liệu",
          icon: <InboxOutlined />,
        },
        {
          path: "/dashboard/customers",
          element: (
            <RequireRoles roles={["customer:management"]}>
              <CustomerDashboard />
            </RequireRoles>
          ),
          roles: ["customer:management"],
          title: "Quản lý khách hàng",
          icon: <TeamOutlined />,
        },
        {
          path: "/dashboard/work-tables",
          element: <WorkTableDetailPage />,
          title: "Bảng công việc",
          icon: <TeamOutlined />,
          children: [
            {
              path: "/dashboard/work-tables/:boardId",
              element: <WorkTableDetailPage />,
            },
          ],
        },

        {
          path: "/dashboard/invoices",
          element: (
            <RequireRoles roles={["accounting:management"]}>
              <InvoiceDashboard />
            </RequireRoles>
          ),
          roles: ["accounting:management"],
          title: "Báo giá",
          icon: <FileTextOutlined />,
        },

        {
          path: "/dashboard/accounting",
          element: (
            <RequireRoles roles={["accounting:management"]}>
              <AccountingDashboard />
            </RequireRoles>
          ),
          roles: ["accounting:management"],
          title: "Kế toán",
          icon: <AccountBookOutlined />,
        },
        {
          path: "/dashboard/settings",
          element: (
            <RequireRoles
              roles={[
                "setting:management",
                "permission:management",
                "role:management",
              ]}
            >
              <SettingDashboard />
            </RequireRoles>
          ),
          roles: [
            "setting:management",
            "permission:management",
            "role:management",
          ],
          title: "Cài đặt",
          icon: <SettingOutlined />,
        },
        {
          path: "/dashboard/infor",
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
};
export function getMainMenuItems(pathname?: string): MenuItem[] {
  const { data: user } = useInfo();
  // const { setAdminMode } = useAdminMode();
  if (!pathname) {
    pathname = window.location.pathname;
  }
  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const userPermissions = user?.role.permissions || []; // Lấy permissions từ user, mặc định là mảng rỗng nếu không có

  const loop = (routes: Array<TRoute | undefined>): MenuItem[] => {
    return routes.reduce((acc: MenuItem[], route) => {
      if (!route) return acc;

      // Kiểm tra nếu route có roles và userPermissions không chứa bất kỳ role nào trong đó
      // const hasPermission =
      //   !route.roles ||
      //   route.roles.some((role) => userPermissions.includes(role));

      const hasPermission = true;

      if (!route.ignoreInMenu && hasPermission) {
        const push: MenuItem = {
          key: route.path || "",
          icon: route.icon || <BookOutlined />,
          label: route.title || "Menu",
          active: pathname?.includes(route.path || ""),
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
export function FallbackElement() {
  return <div>Loading...</div>;
}
