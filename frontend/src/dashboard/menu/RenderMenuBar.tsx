import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "antd";
import { PlusOutlined, StarFilled } from "@ant-design/icons";
import type { WorkSpace } from "../../common/@types/work-space.type";
import { useUser } from "../../common/common/hooks/useUser";
import ModalCreateSpace from "../../common/components/dashboard/work-tables/work-space/ModalCreateSpace";
import ModalManagerWorkSpace from "../../common/components/dashboard/work-tables/work-space/ModalManagerWorkSpace";
import AllTasksModal from "../../common/components/dashboard/work-tables/AllTasksModal";
import { getMainMenuItems } from "../router";
import FooterMenuBar from "./FooterMenuBar";
import { MOBILE_CORE_KEYS, MOBILE_FALLBACK_ITEMS } from "./menu.constants";
import "./mobile-menu.css";

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

export default function RenderMenuBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const { workspaces, canViewPermission } = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTabletWorkspaceModalOpen, setIsTabletWorkspaceModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isMobile = width <= 768;
  const allMenuItems = getMainMenuItems(pathname, canViewPermission);

  const createMobileMenuItems = () => {
    const coreItems = allMenuItems.filter((item) =>
      MOBILE_CORE_KEYS.includes(item.key as (typeof MOBILE_CORE_KEYS)[number]),
    );

    if (coreItems.length > 0) {
      return coreItems.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        path: item.key,
      }));
    }

    return MOBILE_FALLBACK_ITEMS
      .map((fallbackItem) => {
        const matched = allMenuItems.find((item) => item.key === fallbackItem.key);
        if (!matched) return null;

        return {
          key: fallbackItem.key,
          label: matched.label,
          icon: matched.icon,
          path: fallbackItem.path,
        };
      })
      .filter(Boolean) as Array<{
        key: string;
        label: string;
        icon: ReactNode;
        path: string;
      }>;
  };

  const mobileMenuItems = createMobileMenuItems();

  if (isMobile) {
    return <FooterMenuBar mobileMenuItems={mobileMenuItems} allMenuItems={allMenuItems} />;
  }

  const createMenuItems = () => {
    return allMenuItems
      .filter((item) => item.key !== "/infor")
      .map((item) => {
        const hasChildren = item.key === "/work-tables";

        if (hasChildren && canViewPermission?.view_workspace) {
          return {
            key: item.key,
            icon: item.icon,
            label: (
              <div className="flex items-center justify-between w-full">
                <span>{item.label}</span>
                <div className="flex items-center gap-1">
                  <AllTasksModal />
                  <div
                    className="w-6 h-6 rounded-md bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center shadow-sm transition-all duration-200"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsTabletWorkspaceModalOpen(true);
                    }}
                  >
                    <PlusOutlined className="text-white text-xs font-bold" />
                  </div>
                </div>
              </div>
            ),
            children: (workspaces || []).map((workspace: WorkSpace) => ({
              id: workspace.id,
              key: `/work-tables/${workspace.id}`,
              label: (
                <div className="flex items-center gap-2 py-0.5 px-1 rounded-md hover:bg-white/10 transition-all duration-200">
                  <div style={{ padding: 0, background: "none", border: "none", color: "yellow" }}>
                    {workspace.pinned && <StarFilled />}
                  </div>
                  <span
                    className="text-xs font-medium text-white truncate flex-1 min-w-0"
                    style={{ color: workspace.status === "FREE" ? "yellow" : "#fff" }}
                  >
                    {workspace.name}
                  </span>
                </div>
              ),
            })),
          };
        }

        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
        };
      });
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "create-workspace") {
      setIsTabletWorkspaceModalOpen(true);
      return;
    }

    navigate(key);
  };

  return (
    <>
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

      <div className="!z-[10001]">
        <ModalCreateSpace
          open={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          onCancel={() => setIsModalOpen(false)}
        />
      </div>

      <ModalManagerWorkSpace
        isTabletWorkspaceModalOpen={isTabletWorkspaceModalOpen}
        setIsTabletWorkspaceModalOpen={setIsTabletWorkspaceModalOpen}
        // @ts-ignore
        workSpaces={workspaces || []}
        setIsOpenModalCreateSpace={setIsModalOpen}
      />
    </>
  );
}
