import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ModalCreateSpace from "../../common/components/dashboard/work-tables/work-space/ModalCreateSpace";
import {
  AppstoreOutlined,
  CheckOutlined,
  MenuOutlined,
  PlusOutlined,
  StarFilled,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "./mobile-menu.css";
import { useUser } from "../../common/common/hooks/useUser";
import { PRIMARY_GROUP_KEYS } from "./menu.constants";

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
};

interface FooterMenuBarProps {
  mobileMenuItems: MenuItem[];
  allMenuItems: MenuItem[];
}

export default function FooterMenuBar({ mobileMenuItems, allMenuItems }: FooterMenuBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [showMobileWorkspaceModal, setShowMobileWorkspaceModal] = useState(false);
  const [showPrimaryGroupModal, setShowPrimaryGroupModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { workspaces } = useUser();

  const findMenuByKey = (key: string) =>
    allMenuItems.find((item) => item.key === key) ||
    mobileMenuItems.find((item) => item.key === key);

  const primaryGroupItems: MenuItem[] = [
    {
      key: "/dashboard/workpoints",
      label: findMenuByKey("/dashboard/workpoints")?.label || "Chấm công",
      icon: findMenuByKey("/dashboard/workpoints")?.icon || <CheckOutlined />,
      path: "/dashboard/workpoints",
    },
    {
      key: "/dashboard/users",
      label: findMenuByKey("/dashboard/users")?.label || "Quản lý nhân sự",
      icon: findMenuByKey("/dashboard/users")?.icon || <UserOutlined />,
      path: "/dashboard/users",
    },
    {
      key: "/dashboard/customers",
      label: findMenuByKey("/dashboard/customers")?.label || "Quản lý khách hàng",
      icon: findMenuByKey("/dashboard/customers")?.icon || <TeamOutlined />,
      path: "/dashboard/customers",
    },
    {
      key: "/dashboard/supplier",
      label: findMenuByKey("/dashboard/supplier")?.label || "Quản lý thầu phụ",
      icon: findMenuByKey("/dashboard/supplier")?.icon || <UserOutlined />,
      path: "/dashboard/supplier",
    },
  ];

  const moreMenuItems = allMenuItems.filter(
    (item) =>
      item.key !== "/dashboard/work-tables" &&
      !PRIMARY_GROUP_KEYS.includes(item.key as (typeof PRIMARY_GROUP_KEYS)[number])
  );

  const isPrimaryActive = PRIMARY_GROUP_KEYS.some((key) => pathname.startsWith(key));
  const isWorkTableActive = pathname.startsWith("/dashboard/work-tables");
  const isMoreActive = moreMenuItems.some(
    (item) => item.key !== "divider-1" && pathname.startsWith(item.key)
  );

  return (
    <>
      <div className="mobile-menu-container fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-2 z-[9999] shadow-lg bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-around">
          <BottomItem
            active={isPrimaryActive}
            icon={<AppstoreOutlined />}
            label="Nhân sự"
            onClick={() => setShowPrimaryGroupModal(true)}
          />

          <BottomItem
            active={isWorkTableActive}
            icon={<TeamOutlined />}
            label="Bảng công việc"
            onClick={() => setShowMobileWorkspaceModal(true)}
          />

          <BottomItem
            active={isMoreActive}
            icon={<MenuOutlined />}
            label="Mở rộng"
            onClick={() => setShowMoreModal(true)}
          />
        </div>
      </div>

      <BottomSheet
        open={showPrimaryGroupModal}
        title="Nhân sự"
        onClose={() => setShowPrimaryGroupModal(false)}
      >
        {primaryGroupItems.map((item) => (
          <MenuRow
            key={item.key}
            icon={item.icon}
            label={item.label}
            onClick={() => {
              navigate(item.path || item.key);
              setShowPrimaryGroupModal(false);
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        open={showMobileWorkspaceModal}
        title="Bảng công việc"
        onClose={() => setShowMobileWorkspaceModal(false)}
      >
        {workspaces.length === 0 ? (
          <div className="text-center py-8 text-gray-200">
            <p>Chưa có bảng công việc nào</p>
            <button
              onClick={() => {
                setShowMobileWorkspaceModal(false);
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-[#00B4B6] text-white rounded-lg inline-flex items-center gap-2"
            >
              <PlusOutlined /> Tạo bảng mới
            </button>
          </div>
        ) : (
          <>
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  navigate(`/dashboard/work-tables/${workspace.id}`);
                  setShowMobileWorkspaceModal(false);
                }}
              >
                <div style={{ padding: 0, background: "none", border: "none", color: "yellow" }}>
                  {workspace.pinned && <StarFilled />}
                </div>

                <span
                  className="text-sm font-semibold text-white truncate flex-1 min-w-0"
                  style={{ color: workspace?.status === "FREE" ? "yellow" : "#fff" }}
                >
                  {workspace.name}
                </span>
              </div>
            ))}

            <button
              onClick={() => {
                setShowMobileWorkspaceModal(false);
                setIsModalOpen(true);
              }}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-100 hover:border-[#00B4B6] hover:text-white transition-colors cursor-pointer"
            >
              <PlusOutlined /> Tạo bảng mới
            </button>
          </>
        )}
      </BottomSheet>

      <BottomSheet open={showMoreModal} title="Mở rộng" onClose={() => setShowMoreModal(false)}>
        {moreMenuItems.map((item) => {
          if (item.label === "---") {
            return <div key={item.key} className="h-px bg-white/30 my-2" />;
          }

          return (
            <MenuRow
              key={item.key}
              icon={item.icon}
              label={item.label}
              onClick={() => {
                navigate(item.key);
                setShowMoreModal(false);
              }}
            />
          );
        })}
      </BottomSheet>

      <div className="!z-[10001]">
        <ModalCreateSpace
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          setIsModalOpen={setIsModalOpen}
        />
      </div>
    </>
  );
}

function BottomItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`mobile-menu-item flex flex-col items-center cursor-pointer ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <div
        className={`mobile-menu-icon w-12 h-12 rounded-full flex items-center justify-center ${
          active
            ? "bg-[#00B4B6] text-white shadow-lg active"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <span className="text-lg">{icon}</span>
      </div>
      <span
        className={`mobile-menu-label text-xs mt-1 font-medium block text-center ${
          active ? "text-[#00B4B6] active" : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[10000] flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="rounded-t-3xl w-full max-h-[70vh] overflow-hidden" style={{ backgroundColor: "#00B5B4" }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            x
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">{children}</div>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <span className="text-white text-lg">{icon}</span>
      <span className="text-sm font-semibold text-white truncate flex-1 min-w-0">{label}</span>
    </div>
  );
}
