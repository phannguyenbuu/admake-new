import { Modal, Button, Typography, Form } from "antd";
import {
  PlusOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { WorkSpace } from "../../../../@types/work-space.type";
import { useLocation, useNavigate } from "react-router-dom";
import { useCheckPermission } from "../../../../common/hooks/checkPermission.hook";
import { useState, useCallback } from "react";
import ModalEditWorkSpace from "./ModalEditWorkSpace";
import ModalDeleteWorkSpace from "./ModalDeleteWorkSpace";

const { Title, Text } = Typography;

interface ModalManagerWorkSpaceProps {
  isTabletWorkspaceModalOpen: boolean;
  setIsTabletWorkspaceModalOpen: (isOpen: boolean) => void;
  workSpaces: WorkSpace[];
  setIsOpenModalCreateSpace: (isOpen: boolean) => void;
  onRefresh?: () => void; // Callback để refresh danh sách workspace
}

export default function ModalManagerWorkSpace({
  isTabletWorkspaceModalOpen,
  setIsTabletWorkspaceModalOpen,
  workSpaces,
  setIsOpenModalCreateSpace,
  onRefresh,
}: ModalManagerWorkSpaceProps) {
  const adminMode = useCheckPermission();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // State cho edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkSpace | null>(
    null
  );
  const [editForm] = Form.useForm();

  // State cho delete confirmation
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<WorkSpace | null>(
    null
  );

  // Hàm xử lý edit workspace
  const handleEdit = useCallback(
    (workspace: WorkSpace) => {
      setEditingWorkspace(workspace);
      editForm.setFieldsValue({
        name: workspace.name,
      });
      setEditModalVisible(true);
    },
    [editForm]
  );

  // Hàm xử lý mở delete modal
  const openDeleteModal = useCallback((workspace: WorkSpace) => {
    setDeletingWorkspace(workspace);
    setDeleteModalVisible(true);
  }, []);

  // Hàm đóng các modal
  const closeEditModal = useCallback(() => {
    setEditModalVisible(false);
    setEditingWorkspace(null);
    editForm.resetFields();
  }, [editForm]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalVisible(false);
    setDeletingWorkspace(null);
  }, []);

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0891b2] to-[#0e7490] flex items-center justify-center shadow-lg">
              <TeamOutlined className="!text-white !text-lg" />
            </div>
            <div>
              <Title level={4} className="!m-0 !text-gray-900 !font-bold">
                Quản lý bảng công việc
              </Title>
              <Text className="text-gray-500 text-sm">
                Chọn bảng công việc để làm việc
              </Text>
            </div>
          </div>
        }
        open={isTabletWorkspaceModalOpen}
        onCancel={() => setIsTabletWorkspaceModalOpen(false)}
        footer={null}
        width={680}
        centered
        className="!rounded-3xl workspace-modal"
        styles={{
          content: {
            borderRadius: "24px",
            overflow: "hidden",
            padding: 0,
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
          },
          body: {
            padding: 0,
            borderRadius: "24px",
          },
          header: {
            borderBottom: "1px solid #f1f3f4",
            padding: "24px 32px 20px",
            background: "linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)",
            borderRadius: "24px 24px 0 0",
          },
          mask: {
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <div className="bg-white">
          {/* Enhanced Header với gradient background */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0891b2] animate-pulse"></div>
                  <Text className="text-gray-600 text-base font-medium">
                    {/* @ts-ignore */}
                    {workSpaces?.length || 0} bảng công việc có sẵn
                  </Text>
                </div>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsOpenModalCreateSpace(true)}
                size="large"
                disabled={!adminMode}
                className="!bg-gradient-to-r !from-[#0891b2] !to-[#0e7490] !border-none !rounded-xl !shadow-lg hover:!shadow-xl !transition-all !duration-300 hover:!scale-105 !font-semibold !px-6"
              >
                Tạo bảng công việc mới
              </Button>
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="p-8">
            <div className="space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
              {/* @ts-ignore */}
              {workSpaces?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <TeamOutlined className="!text-3xl !text-gray-400" />
                  </div>
                  <Text className="text-gray-700 text-lg font-semibold block mb-3">
                    Chưa có bảng công việc nào
                  </Text>
                  <Text className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
                    Tạo bảng công việc đầu tiên để bắt đầu tổ chức và quản lý
                    công việc của bạn một cách hiệu quả
                  </Text>
                  <div className="mt-8">
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => setIsTabletWorkspaceModalOpen(true)}
                      size="large"
                      className="!border-2 !border-dashed !border-[#0891b2] !text-[#0891b2] hover:!bg-[#0891b2]/5 !rounded-xl !font-medium !px-8"
                    >
                      Tạo bảng công việc đầu tiên
                    </Button>
                  </div>
                </div>
              ) : (
                /* @ts-ignore */
                workSpaces?.map((workspace: WorkSpace, index: number) => (
                  <div
                    key={workspace._id}
                    className={`group relative flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                      pathname === `/dashboard/work-tables/${workspace._id}`
                        ? "border-[#0891b2] bg-gradient-to-r from-[#0891b2]/8 to-[#0891b2]/4 shadow-lg shadow-[#0891b2]/20"
                        : "border-gray-200 hover:border-[#0891b2]/40 bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                    onClick={() => {
                      // Chuyển đến workspace khi click
                      navigate(`/dashboard/work-tables/${workspace._id}`);
                      setIsTabletWorkspaceModalOpen(false);
                    }}
                  >
                    {/* Enhanced Workspace Cover */}
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300">
                      {workspace.cover ? (
                        <>
                          <img
                            src={workspace.cover}
                            alt="workspace cover"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0891b2] to-[#0e7490] flex items-center justify-center text-white text-xl font-bold relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          <span className="relative">
                            {workspace.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Active indicator overlay */}
                      {pathname ===
                        `/dashboard/work-tables/${workspace._id}` && (
                        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#0891b2] border-2 border-white shadow-sm"></div>
                      )}
                    </div>

                    {/* Enhanced Workspace Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Text
                          className={`font-bold text-lg block truncate transition-colors duration-300 ${
                            pathname ===
                            `/dashboard/work-tables/${workspace._id}`
                              ? "text-[#0891b2]"
                              : "text-gray-900 group-hover:text-[#0891b2]"
                          }`}
                        >
                          {workspace.name}
                        </Text>
                        {/* {pathname ===
                          `/dashboard/work-tables/${workspace._id}` && (
                          <div className="px-2 py-1 bg-[#0891b2] text-white text-xs font-semibold rounded-full">
                            Đang hoạt động
                          </div>
                        )} */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Text className="text-gray-500 text-sm font-medium">
                          Bảng công việc
                        </Text>
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        <Text className="text-gray-400 text-xs">
                          Cập nhật gần đây
                        </Text>
                      </div>
                    </div>

                    {/* Action Buttons - chỉ hiện khi là admin */}
                    {adminMode && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn không cho trigger onClick của workspace
                            handleEdit(workspace);
                          }}
                          className="!text-blue-600 hover:!text-blue-700 hover:!bg-blue-50 !rounded-lg !px-3 !py-1 !h-8 !border !border-blue-200 hover:!border-blue-300 !shadow-sm hover:!shadow-md !transition-all !duration-200"
                          title="Chỉnh sửa workspace"
                        >
                          <span className="text-xs font-medium">Sửa</span>
                        </Button>
                        <Button
                          type="text"
                          icon={
                            <DeleteOutlined className="!text-red-500 !text-sm" />
                          }
                          size="small"
                          danger
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn không cho trigger onClick của workspace
                            openDeleteModal(workspace);
                          }}
                          className="!text-red-600 hover:!text-red-700 hover:!bg-red-50 !rounded-lg !px-3 !py-1 !h-8 !border !border-red-500 hover:!border-red-300 !shadow-sm hover:!shadow-md !transition-all !duration-200"
                          title="Xóa workspace"
                        >
                          <span className="text-xs font-medium">Xóa</span>
                        </Button>
                      </div>
                    )}

                    {/* Enhanced Arrow indicator */}
                    <div
                      className={`transition-all duration-300 ${
                        pathname === `/dashboard/work-tables/${workspace._id}`
                          ? "text-[#0891b2] opacity-100"
                          : "text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0891b2]/0 to-[#0891b2]/0 group-hover:from-[#0891b2]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <Text className="text-gray-600 text-sm font-medium">
                    Đã tải {/* @ts-ignore */}
                    {workSpaces?.length || 0} bảng công việc
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsTabletWorkspaceModalOpen(false)}
                  size="large"
                  className="!border-gray-300 !text-gray-600 hover:!border-gray-400 hover:!text-gray-700 !rounded-xl !font-medium !px-6 hover:!shadow-md !transition-all !duration-300"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ModalEditWorkSpace
        editModalVisible={editModalVisible}
        closeEditModal={closeEditModal}
        editForm={editForm}
        workspaceId={editingWorkspace?._id || ""}
        onSuccess={onRefresh}
      />

      <ModalDeleteWorkSpace
        deleteModalVisible={deleteModalVisible}
        closeDeleteModal={closeDeleteModal}
        deletingWorkspace={deletingWorkspace || ({} as WorkSpace)}
        refetchWorkSpaces={onRefresh || (() => {})}
      />
    </>
  );
}
