import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ModalCreateSpace from "../dashboard/work-tables/work-space/ModalCreateSpace";
import { PlusOutlined } from "@ant-design/icons";
import "./mobile-menu.css";
// import { useCheckPermission } from "../../common/hooks/checkPermission.hook";

interface FooterMenuBarProps {
  mobileMenuItems: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    path: string;
  }>;
  boards: Array<{
    _id: string;
    name: string;
    cover?: string;
  }>;
  onAddBoard: (values: { name: string }) => void;
}

export default function FooterMenuBar({
  mobileMenuItems,
  boards,
  onAddBoard,
}: FooterMenuBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // const adminMode = useCheckPermission();

  // State cho mobile workspace modal
  const [showMobileWorkspaceModal, setShowMobileWorkspaceModal] =
    useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu - Bao gồm Profile, hiển thị ở dưới cùng */}
      <div className="mobile-menu-container fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-2 z-[9999] shadow-lg bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-around">
          {mobileMenuItems.map((item) => {
            const isActive = pathname.startsWith(item.key);
            const isWorkSpace = item.key === "/dashboard/work-tables";

            return (
              <div
                key={item.key}
                className={`mobile-menu-item flex flex-col items-center cursor-pointer ${
                  isActive ? "active" : ""
                }`}
                onClick={() => {
                  if (isWorkSpace) {
                    setShowMobileWorkspaceModal(true);
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <div
                  className={`mobile-menu-icon w-12 h-12 rounded-full flex items-center justify-center ${
                    isActive
                      ? "bg-[#00B4B6] text-white shadow-lg active"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                </div>
                <span
                  className={`mobile-menu-label text-xs mt-1 font-medium block text-center ${
                    isActive ? "text-[#00B4B6] active" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Workspace Modal */}
      {showMobileWorkspaceModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[10000] flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMobileWorkspaceModal(false);
            }
          }}
        >
          <div className="bg-white rounded-t-3xl w-full max-h-[70vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Bảng công việc
              </h3>
              <button
                onClick={() => setShowMobileWorkspaceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {boards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có bảng công việc nào</p>
                  <button
                    onClick={() => {
                      setShowMobileWorkspaceModal(false);
                      setIsModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-[#00B4B6] text-white rounded-lg flex items-center gap-2"
                  >
                    <PlusOutlined /> Tạo bảng mới
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {boards.map((board) => (
                    <div
                      key={board._id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Đóng modal trước
                        setShowMobileWorkspaceModal(false);

                        // Navigate sau khi modal đã đóng
                        setTimeout(() => {
                          navigate(`/dashboard/work-tables/${board._id}`);
                        }, 150);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        pathname === `/dashboard/work-tables/${board._id}`
                          ? "bg-[#00B4B6]/10 border border-[#00B4B6]/20"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="w-12 h-8 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                        {board.cover ? (
                          <img
                            src={board.cover}
                            alt="cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                            ?
                          </div>
                        )}
                      </div>
                      <span
                        className={`font-medium flex-1 ${
                          pathname === `/dashboard/work-tables/${board._id}`
                            ? "text-[#00B4B6]"
                            : "text-gray-800"
                        }`}
                      >
                        {board.name}
                      </span>
                    </div>
                  ))}

                  {/* Add new board button */}
                  {/* {adminMode && ( */}
                    <button
                      onClick={() => {
                        setShowMobileWorkspaceModal(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#00B4B6] hover:text-[#00B4B6] transition-colors cursor-pointer"
                    >
                      <PlusOutlined /> Tạo bảng mới
                    </button>
                  {/* )} */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo bảng mới cho Mobile */}
      <div className="!z-[10001]">
        <ModalCreateSpace
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onCreate={(values) => {
            onAddBoard(values);
            setIsModalOpen(false);
          }}
        />
      </div>
    </>
  );
}
