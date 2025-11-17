import { useLocation, useNavigate } from "react-router-dom";
import { getMainMenuItems } from "../router";
import { useEffect, useState } from "react";
import ModalCreateSpace from "../../common/components/dashboard/work-tables/work-space/ModalCreateSpace";
import { StarOutlined, StarFilled } from "@ant-design/icons";
import FooterMenuBar from "./FooterMenuBar";
import {
  TeamOutlined,
  UserOutlined as ProfileIcon,
  CheckOutlined,
  PlusOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
// import {
//   useWorkSpaceQueryAll,
//   useCreateWorkSpace,
// } from "../../common/hooks/work-space.hook";
import { message, Menu } from "antd";
import type { WorkSpace } from "../../common/@types/work-space.type";
import "./mobile-menu.css";
// import { useCheckPermission } from "../../common/hooks/checkPermission.hook";
import ModalManagerWorkSpace from "../../common/components/dashboard/work-tables/work-space/ModalManagerWorkSpace";
import type { PaginationDto } from "../../common/@types/common.type";
import { useUser } from "../../common/common/hooks/useUser";

// Hook để theo dõi kích thước màn hình
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

export default function RenderMenuBar({}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const {userLeadId, workspaces, currentWorkspace} = useUser();

  const [query, setQuery] = useState<Partial<PaginationDto>>({
      page: 1,
      limit: 10,
      lead: userLeadId,
      search: "",
    });
  

  const adminMode = true; //useCheckPermission();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTabletWorkspaceModalOpen, setIsTabletWorkspaceModalOpen] = useState(false);

  // Desktop menu state - phải được khai báo trước khi có early return
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleTabletWorkTablesClick = () => {
    if (isTablet) {
      setIsTabletWorkspaceModalOpen(true);
    }
  };

  // Lấy menu items từ router và filter cho mobile
  const allMenuItems = getMainMenuItems(pathname);

  // Debug: Log menu items

  // Hàm tạo mobile menu items từ router
  const createMobileMenuItems = () => {
    // Lọc các menu items phù hợp cho mobile (không quá nhiều)
    const mobileMenuKeys = [
      "/dashboard/workpoints",
      "/dashboard/work-tables",
      "/dashboard/users",
      "/dashboard/customers",
    ];

    // Lấy menu items từ router và filter cho mobile
    const mobileItems = allMenuItems.filter((item) =>
      mobileMenuKeys.includes(item.key)
    );

    // Nếu không có đủ items, thêm fallback
    if (mobileItems.length < 3) {
      const fallbackItems = [
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
          label: "Nhân sự",
          icon: <LineChartOutlined />,
          path: "/dashboard/users",
        },
        {
          key: "/dashboard/customers",
          label: "Khách hàng",
          icon: <TeamOutlined />,
          path: "/dashboard/customers",
        },
      ];

      return fallbackItems.map((route) => {
        const routerItem = mobileItems.find((item) => item.key === route.key);
        return {
          ...route,
          label: routerItem?.label || route.label,
          icon: routerItem?.icon || route.icon,
        };
      });
    }

    return mobileItems.map((item) => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      path: item.key,
    }));
  };

  const mobileMenuItems = createMobileMenuItems();

  // Debug: Log mobile menu items

  // Kiểm tra responsive breakpoints
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  // const isDesktop = width > 1024;

  if (isMobile) {
    return (
      <FooterMenuBar
        mobileMenuItems={mobileMenuItems}
        // @ts-ignore
        // boards={workspaces || []}
        // onAddBoard={handleAddBoard}
      />
    );
  }

  // Tạo menu items cho Ant Design Menu
  const createMenuItems = () => {
    // console.log(getMainMenuItems(pathname));
    const menuItems = getMainMenuItems(pathname)
      .filter((item) => item.key !== "/dashboard/infor") // Ẩn Profile khỏi desktop menu
      .map((item) => {
        const hasChildren =
          item.key === "/dashboard/work-tables" &&
          // @ts-ignore
          (workspaces || []).length > 0;

        if (hasChildren && !isTablet) {
          // Menu item có children (workspaces)
          return {
            key: item.key,
            icon: item.icon,
            label: (
              <div className="flex items-center justify-between w-full">
                <span>{item.label}</span>
                {adminMode && (
                  <div
                    className="w-6 h-6 rounded-md bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center shadow-sm transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTabletWorkspaceModalOpen(true);
                    }}
                  >
                    <PlusOutlined className="text-white text-xs font-bold" />
                  </div>
                )}
              </div>
            ),
            children: [
              // @ts-ignore
              ...(workspaces || []).map((workspace: WorkSpace) => ({
                key: `/dashboard/work-tables/${workspace.id}`,
                label: (
                  <div className="flex items-center gap-3 py-1 px-2 rounded-lg hover:bg-white/10 transition-all duration-200">
                    <div style={{padding: 0, background:'none', border:'none', color: 'yellow'}}>
                      {/* {workspace.name?.charAt(0)?.toUpperCase() || "?"} */}
                      {workspace.pinned && <StarFilled />}
                    </div>
                  
                    <span className="text-sm font-semibold text-white truncate flex-1 min-w-0"
                      style ={{color: workspace?.status === "FREE" ? "yellow":"#fff"}}
                    >
                      {workspace.name}
                    </span>
                  </div>
                ),
              })),
            ],
          };
        } else {
          // Menu item thường
          return {
            key: item.key,
            icon: item.icon,
            label: isTablet ? null : item.label, // Ẩn text trên tablet
          };
        }
      });

    return menuItems;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "create-workspace") {
      setIsTabletWorkspaceModalOpen(true);
    } else if (key === "/dashboard/work-tables" && isTablet) {
      handleTabletWorkTablesClick();
    } else {
      navigate(key);
    }
  };

  return (
    <>
      {/* Ant Design Menu với Custom Scrollbar */}
      <div className="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar px-2">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          openKeys={Array.from(expandedItems)}
          onOpenChange={(openKeys) => setExpandedItems(new Set(openKeys))}
          onClick={handleMenuClick}
          items={createMenuItems()}
          theme="light"
          className="!border-none !bg-transparent !text-white !font-medium !w-full"
          style={{
            background: "transparent",
            border: "none",
            fontSize: "14px",
            fontWeight: "500",
            width: "100%",
            maxWidth: "100%",
          }}
        />
      </div>

      {/* Modal tạo bảng mới cho Desktop */}
      <div className="!z-[10001]">
        <ModalCreateSpace
          open={isModalOpen}
          setIsModalOpen = {setIsModalOpen}
          onCancel={() => setIsModalOpen(false)}
          // onCreate={handleAddBoard}
        />
      </div>

      {/* Modal Workspace cho Tablet - Enhanced UI */}
      <ModalManagerWorkSpace
        isTabletWorkspaceModalOpen={isTabletWorkspaceModalOpen}
        setIsTabletWorkspaceModalOpen={setIsTabletWorkspaceModalOpen}
        // @ts-ignore
        workSpaces={workspaces || []}
        setIsOpenModalCreateSpace={setIsModalOpen}
        // onRefresh={refetchWorkSpaces}
      />
    </>
  );
}
