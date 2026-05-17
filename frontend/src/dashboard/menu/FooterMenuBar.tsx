import { useLocation, useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import {
  AppstoreOutlined,
  MenuOutlined,
  PlusOutlined,
  TeamOutlined,
  StarFilled,
} from "@ant-design/icons";
import type { WorkSpace } from "../../common/@types/work-space.type";
import { useUser } from "../../common/common/hooks/useUser";
import ModalCreateSpace from "../../common/components/dashboard/work-tables/work-space/ModalCreateSpace";
import AllTasksModal from "../../common/components/dashboard/work-tables/AllTasksModal";
import { PRIMARY_GROUP_KEYS } from "./menu.constants";
import "./mobile-menu.css";

type MenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  path?: string;
};

interface FooterMenuBarProps {
  mobileMenuItems: MenuItem[];
  allMenuItems: MenuItem[];
}

export default function FooterMenuBar({
  mobileMenuItems,
  allMenuItems,
}: FooterMenuBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { workspaces } = useUser();

  const [showMobileWorkspaceModal, setShowMobileWorkspaceModal] = useState(false);
  const [showPrimaryGroupModal, setShowPrimaryGroupModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const findMenuByKey = (key: string) =>
    allMenuItems.find((item) => item.key === key) ||
    mobileMenuItems.find((item) => item.key === key);

  const primaryGroupItems: MenuItem[] = PRIMARY_GROUP_KEYS
    .map((key) => {
      const matched = findMenuByKey(key);
      if (!matched) return null;

      return {
        key,
        label: matched.label,
        icon: matched.icon,
        path: key,
      };
    })
    .filter(Boolean) as MenuItem[];

  const workspaceMenuItem = findMenuByKey("/work-tables");
  const moreMenuItems = allMenuItems.filter(
    (item) =>
      item.key !== "/infor" &&
      item.key !== "/work-tables" &&
      !PRIMARY_GROUP_KEYS.includes(item.key as (typeof PRIMARY_GROUP_KEYS)[number]),
  );

  const isPrimaryActive = PRIMARY_GROUP_KEYS.some((key) => pathname.startsWith(key));
  const isWorkTableActive = pathname.startsWith("/work-tables");
  const isMoreActive = moreMenuItems.some(
    (item) => item.key !== "divider-1" && pathname.startsWith(item.key),
  );

  return (
    <>
      <div className="mobile-menu-container fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-2 z-[9999] shadow-lg bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-around">
          <BottomItem
            active={isPrimaryActive}
            disabled={primaryGroupItems.length === 0}
            icon={<AppstoreOutlined />}
            label="Nhân sự"
            onClick={() => setShowPrimaryGroupModal(true)}
          />

          <BottomItem
            active={isWorkTableActive}
            disabled={!workspaceMenuItem}
            icon={workspaceMenuItem?.icon || <TeamOutlined />}
            label={workspaceMenuItem?.label || "Bảng công việc"}
            onClick={() => setShowMobileWorkspaceModal(true)}
          />

          <BottomItem
            active={isMoreActive}
            disabled={moreMenuItems.length === 0}
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
        title={workspaceMenuItem?.label || "Bảng công việc"}
        onClose={() => setShowMobileWorkspaceModal(false)}
        headerAction={
          workspaceMenuItem ? (
            <div className="flex items-center gap-1">
              <AllTasksModal />
            </div>
          ) : null
        }
      >
        {!workspaceMenuItem ? (
          <div className="text-center py-8 text-gray-200">
            <p>Bạn không được cấp quyền xem mục này.</p>
          </div>
        ) : workspaces.length === 0 ? (
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
            {workspaces.map((workspace: WorkSpace) => (
              <div
                key={workspace.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  navigate(`/work-tables/${workspace.id}`);
                  setShowMobileWorkspaceModal(false);
                }}
              >
                <div style={{ padding: 0, background: "none", border: "none", color: "yellow" }}>
                  {workspace.pinned && <StarFilled />}
                </div>

                <span
                  className="text-sm font-semibold text-white truncate flex-1 min-w-0"
                  style={{ color: workspace.status === "FREE" ? "yellow" : "#fff" }}
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
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`mobile-menu-item flex flex-col items-center ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${active ? "active" : ""}`}
      onClick={() => {
        if (!disabled) onClick();
      }}
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
  headerAction,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[10000] flex items-end"
      style={{ display: open ? "flex" : "none" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="rounded-t-3xl w-full max-h-[70vh] overflow-hidden" style={{ backgroundColor: "#00B5B4" }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-white uppercase">{title}</h3>
          <div className="flex items-center gap-3">
            {headerAction}
            <button onClick={onClose} className="text-white hover:text-gray-200 text-lg font-bold">
              ×
            </button>
          </div>
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
  icon: ReactNode;
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
