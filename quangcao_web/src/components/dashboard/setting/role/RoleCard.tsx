import { Card, Button, Typography, Popconfirm, message, Modal } from "antd";
import { useState, useEffect } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SettingOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";
import {
  useRoleQuery,
  useDeleteRole,
} from "../../../../common/hooks/role.hook";
import type { Role } from "../../../../@types/role.type";
import { RoleModal } from "./RoleModal";

const { Title, Text } = Typography;

export const RoleCard = () => {
  const { data: roles, refetch } = useRoleQuery();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();
  const [config, setConfig] = useState({
    openCreate: false,
    openUpdate: false,
    openDeleteList: false,
  });
  const [role, setRole] = useState<Role>();

  useEffect(()=> {
    console.log('roles', roles);
  },[roles]);

  const convertPermission = (permissions: string) => {
    switch (permissions) {
      case "user:management":
        return "Quản lý người dùng";
      case "setting:management":
        return "Quản lý cài đặt";
      case "customer:management":
        return "Quản lý khách hàng";
      case "work:management":
        return "Quản lý bảng công việc";
      case "statistics:management":
        return "Quản lý thống kê";
      case "permission:management":
        return "Quản lý quyền hạn";
      case "role:management":
        return "Quản lý chức vụ";
      case "accounting:management":
        return "Quản lý kế toán";
      case "warehouse:management":
        return "Quản lý kho vật tư";
      default:
        return "Quản lý";
    }
  };

  const handleDeleteRole = (roleId: number, roleName: string) => {
    deleteRole(roleId, {
      onSuccess: () => {
        message.success({
          content: `Đã xóa chức vụ "${roleName}" thành công!`,
          style: {
            marginTop: "20vh",
          },
          duration: 3,
        });
        refetch();
      },
      onError: () => {
        message.error({
          content: "Có lỗi xảy ra khi xóa chức vụ!",
          style: {
            marginTop: "20vh",
          },
          duration: 3,
        });
      },
    });
  };

  return (
    <>
      <Card
        title={
          <div className="!flex !items-center !justify-between !w-full">
            <Title
              level={5}
              className="!text-[#0891b2] !m-0 !text-lg sm:!text-xl"
            >
              • Chức vụ
            </Title>
            <Button
              type="text"
              icon={
                <SettingOutlined className="!text-lg sm:!text-xl !text-[#0891b2]" />
              }
              className="!p-2 !rounded-lg hover:!scale-110 hover:!bg-[#0891b2]/10 !transition-all !duration-300 !ease-in-out"
              title="Quản lý chức vụ"
              onClick={() => setConfig({ ...config, openDeleteList: true })}
            />
          </div>
        }
        className="!rounded-2xl !bg-white/80 !shadow-2xl !drop-shadow-xl !shadow-gray-300/50 !h-full !flex !flex-col"
        hoverable
      >
        <div className="flex-1 flex flex-col">
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-2 lg:gap-3 flex-1">
            {/* @ts-ignore */}
            {roles?.map((role: Role) => (
              <Button
                key={role.id}
                className="!border-[#00B4B6] !text-[#0891b2] !shadow-lg !text-sm sm:!text-base md:!text-sm lg:!text-base hover:!shadow-xl hover:!scale-105 !transition-all !duration-300"
                onClick={() => {
                  setRole(role);
                  setConfig({ ...config, openUpdate: true });
                }}
              >
                {role.name}
              </Button>
            ))}
          </div>
          <div className="mt-auto pt-4">
            <Button
              type="primary"
              className="!bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] !border-none !shadow-lg !text-sm sm:!text-base md:!text-sm lg:!text-base hover:!shadow-xl hover:!scale-105 !transition-all !duration-300"
              onClick={() => setConfig({ ...config, openCreate: true })}
            >
              + Thêm
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal danh sách chức vụ được cải thiện */}
      <Modal
        title={
          <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#00B4B6] to-[#0891b2] flex items-center justify-center shadow-lg">
              <UserOutlined className="!text-white !text-sm sm:!text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <Title
                level={5}
                className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
              >
                Quản lý chức vụ
              </Title>
              <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
                Chỉnh sửa hoặc xóa các chức vụ hiện có
              </Text>
            </div>
          </div>
        }
        open={config.openDeleteList}
        onCancel={() => setConfig({ ...config, openDeleteList: false })}
        footer={null}
        width="calc(100vw - 32px)"
        style={{
          maxWidth: "700px",
        }}
        centered
        destroyOnHidden
        maskClosable={false}
        className="!rounded-xl sm:!rounded-2xl role-management-modal"
        styles={{
          content: {
            borderRadius: "12px",
            overflow: "hidden",
            padding: 0,
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
          },
          body: {
            padding: 0,
            borderRadius: "12px",
            maxHeight: "calc(100vh - 250px)",
            overflowY: "auto",
          },
          header: {
            borderBottom: "1px solid #f1f3f4",
            padding: "12px 16px",
            background: "linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)",
            borderRadius: "12px 12px 0 0",
            flexShrink: 0,
          },
          mask: {
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <div className="bg-white h-full flex flex-col">
          {/* Enhanced Header với gradient background */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#00B4B6]/10 via-white to-[#0891b2]/10 border-b border-[#00B4B6]/20 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#00B4B6] animate-pulse"></div>
                <Text className="text-[#00B4B6] text-xs sm:text-sm font-medium">
                  Danh sách chức vụ hiện có
                </Text>
                {/* @ts-ignore */}
                {roles?.length > 0 && (
                  <div className="ml-auto flex-shrink-0">
                    <div className="bg-[#00B4B6]/10 text-[#00B4B6] px-2 py-1 rounded-full text-xs font-medium shadow-sm drop-shadow-md">
                      {/* @ts-ignore */}
                      {roles.length} chức vụ
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {/* @ts-ignore */}
            {roles?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 sm:mb-6">
                  <UserOutlined className="text-2xl sm:text-3xl text-gray-400" />
                </div>
                <Title
                  level={5}
                  className="!text-gray-600 !mb-2 !text-base sm:!text-lg"
                >
                  Chưa có chức vụ nào
                </Title>
                <Text className="text-gray-500 text-sm sm:text-base text-center max-w-sm">
                  Hệ thống chưa có chức vụ nào được tạo. Hãy tạo chức vụ đầu
                  tiên để bắt đầu quản lý phân quyền.
                </Text>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* @ts-ignore */}
                {roles?.map((role: Role, index: number) => (
                  <div
                    key={role.id}
                    className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#00B4B6]/30 transition-all duration-300 ease-in-out overflow-hidden"
                  >
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00B4B6]/5 to-[#0891b2]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="relative p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        {/* Role Info */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#00B4B6]/10 to-[#0891b2]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <UserOutlined className="text-[#0891b2] text-base sm:text-lg" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                              <Text className="text-gray-800 font-bold text-base sm:text-lg truncate">
                                {role.name}
                              </Text>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00B4B6] opacity-60" />
                              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                #{index + 1}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="bg-[#00B4B6]/10 text-[#00B4B6] px-2 py-1 rounded-full text-xs font-medium shadow-sm drop-shadow-md">
                                Chức vụ
                              </div>
                              {role.permissions &&
                                role.permissions.length > 0 && (
                                  <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium shadow-sm drop-shadow-md">
                                    {role.permissions.length} quyền
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 ml-4">
                          <Button
                            type="text"
                            size="middle"
                            icon={<EditOutlined />}
                            className="!text-[#0891b2] hover:!text-white hover:!bg-[#0891b2] !border-none !rounded-lg !px-3 !py-2 !h-9 !transition-all !duration-300 hover:!scale-105 hover:!shadow-lg !font-medium !text-sm"
                            onClick={() => {
                              setRole(role);
                              setConfig({
                                ...config,
                                openUpdate: true,
                                openDeleteList: false,
                              });
                            }}
                          >
                            <span className="hidden sm:inline ml-1">
                              Chỉnh sửa
                            </span>
                          </Button>

                          <Popconfirm
                            title={
                              <div className="max-w-xs">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                    <ExclamationCircleOutlined className="text-orange-500 text-sm" />
                                  </div>
                                  <div>
                                    <Text
                                      strong
                                      className="text-gray-800 block text-sm"
                                    >
                                      Xác nhận xóa chức vụ
                                    </Text>
                                  </div>
                                </div>
                                <Text className="text-gray-600 text-sm leading-relaxed">
                                  Bạn có chắc chắn muốn xóa chức vụ{" "}
                                  <Text
                                    strong
                                    className="text-red-600 bg-red-50 px-1 py-0.5 rounded"
                                  >
                                    "{role.name}"
                                  </Text>
                                  ?
                                </Text>
                                <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                                  <Text className="text-red-600 text-xs">
                                    ⚠️ Hành động này không thể hoàn tác và sẽ
                                    ảnh hưởng đến tất cả người dùng có chức vụ
                                    này.
                                  </Text>
                                </div>
                              </div>
                            }
                            onConfirm={() =>
                              handleDeleteRole(role.id, role.name)
                            }
                            okText="🗑️ Xóa chức vụ"
                            cancelText="❌ Hủy bỏ"
                            placement="topRight"
                            okButtonProps={{
                              danger: true,
                              loading: isDeleting,
                              className:
                                "!bg-gradient-to-r !from-red-500 !to-red-600 !border-none hover:!from-red-600 hover:!to-red-700 !rounded-lg !font-bold !px-4 !py-2 !h-auto !shadow-lg hover:!shadow-xl !transition-all !duration-300 !text-white hover:!scale-105",
                            }}
                            cancelButtonProps={{
                              className:
                                "!border-2 !border-gray-300 !text-gray-600 hover:!border-gray-400 hover:!text-gray-700 !rounded-lg !font-medium !px-4 !py-2 !h-auto !bg-white hover:!bg-gray-50 !transition-all !duration-300 hover:!scale-105",
                            }}
                            overlayStyle={{
                              maxWidth: "420px",
                            }}
                            overlayInnerStyle={{
                              padding: "24px",
                              borderRadius: "16px",
                              boxShadow:
                                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
                              border: "1px solid #f1f3f4",
                            }}
                          >
                            <Button
                              type="text"
                              size="middle"
                              icon={<DeleteOutlined />}
                              className="!text-red-500 hover:!text-white hover:!bg-red-500 !border-none !rounded-lg !px-3 !py-2 !h-9 hover:!scale-105 !transition-all !duration-300 hover:!shadow-lg !font-medium !text-sm"
                              disabled={isDeleting}
                            >
                              <span className="hidden sm:inline ml-1">Xóa</span>
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>

                      {/* Additional Info - Role Permissions Preview */}
                      {role.permissions && role.permissions.length > 0 && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <SecurityScanOutlined className="text-gray-400 text-xs" />
                            <Text className="text-gray-500 text-xs font-medium">
                              Quyền hạn được phân công
                            </Text>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions
                              .slice(0, 3)
                              .map((permission: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs shadow-sm drop-shadow-md"
                                >
                                  {convertPermission(permission)}
                                </div>
                              ))}
                            {role.permissions.length > 3 && (
                              <div className="bg-[#00B4B6]/10 text-[#00B4B6] px-2 py-1 rounded text-xs font-medium shadow-sm drop-shadow-md">
                                +{role.permissions.length - 3} quyền khác
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t border-gray-100 flex-shrink-0 sticky bottom-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00B4B6] animate-pulse" />
                <Text className="text-gray-500 text-xs sm:text-sm">
                  {/* @ts-ignore */}
                  Tổng cộng: {roles?.length || 0} chức vụ
                </Text>
              </div>
              <Button
                onClick={() => setConfig({ ...config, openDeleteList: false })}
                className="!px-4 !sm:!px-6 !py-2 !text-gray-700 hover:!bg-gray-50 !rounded-lg !text-sm !font-medium !transition-all !duration-200 !shadow-sm hover:!shadow-md"
              >
                ✅ Hoàn tất
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <RoleModal
        open={config.openCreate}
        onCancel={() => {
          setConfig({ ...config, openCreate: false });
          refetch();
        }}
        refetchRoles={refetch}
      />
      {/* Modal sửa */}
      <RoleModal
        open={config.openUpdate}
        onCancel={() => {
          setConfig({ ...config, openUpdate: false });
          refetch();
        }}
        refetchRoles={refetch}
        role={role}
      />
    </>
  );
};
