import { Modal, Input, Checkbox, Typography, message, Button } from "antd";
import { useState, useEffect, useMemo, useCallback } from "react";
import { UserOutlined, SecurityScanOutlined } from "@ant-design/icons";
import type {
  PermissionItem,
  Role,
  RoleFormData,
  RoleModalProps,
} from "../../../../@types/role.type";
import {
  useCreateRole,
  useRoleDetail,
  useRolePermission,
  useUpdateRole,
} from "../../../../common/hooks/role.hook";

const { Title, Text } = Typography;

export const RoleModal = ({
  open,
  onCancel,
  refetchRoles,
  role,
}: RoleModalProps) => {
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { data: permissionsData } = useRolePermission();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();
  const { data: roleDetail, refetch } = useRoleDetail(role?.id);

  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    permissions: {},
  });

  // Memoize permissions data để tránh re-render không cần thiết
  const permissions = useMemo(() => {
    // @ts-ignore
    return (permissionsData as PermissionItem[]) || [];
  }, [permissionsData]);

  // Memoize role data
  const currentRole = useMemo(() => {
    // @ts-ignore
    return (roleDetail as Role) || role;
  }, [roleDetail, role]);

  // Khởi tạo formData khi có roleDetail hoặc role
  useEffect(() => {
    if (currentRole && permissions.length > 0) {
      const initialPermissions: Record<string, boolean> = {};

      // So sánh trực tiếp permissions từ role với permissionsData
      permissions.forEach((permission: PermissionItem) => {
        initialPermissions[permission.value] =
          currentRole.permissions?.includes(permission.value) || false;
      });

      setFormData({
        name: currentRole.name || "",
        permissions: initialPermissions,
      });
    } else if (!currentRole) {
      // Reset form khi tạo mới
      setFormData({
        name: "",
        permissions: {},
      });
    }
  }, [currentRole, permissions, open]);

  const handlePermissionChange = useCallback(
    (permission: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permission]: checked,
        },
      }));
    },
    []
  );

  const handleNameChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
  }, []);

  const handleCancel = () => {
    setFormData({
      name: "",
      permissions: {},
    });
    onCancel();
  };

  const handleSubmit = useCallback(async () => {
    try {
      // Chuyển đổi formData thành format phù hợp với API
      const selectedPermissions: string[] = Object.entries(formData.permissions)
        .filter(([_, isSelected]) => isSelected)
        .map(([permission]) => permission);

      const roleData: Pick<Role, "name" | "permissions"> = {
        name: formData.name.trim(),
        permissions: selectedPermissions,
      };

      if (role) {
        updateRole(
          { id: role.id, dto: roleData as Role },
          {
            onSuccess: () => {
              message.success({
                content: `Đã cập nhật chức vụ "${formData.name}" thành công!`,
                duration: 3,
              });
              refetchRoles();
              refetch();
              handleCancel();
            },
            onError: () => {
              message.error("Có lỗi xảy ra khi cập nhật chức vụ!");
            },
          }
        );
      } else {
        createRole(roleData as Role, {
          onSuccess: () => {
            message.success({
              content: `Đã tạo chức vụ "${formData.name}" thành công!`,
              duration: 3,
            });
            refetchRoles();
            handleCancel();
          },
          onError: () => {
            message.error("Có lỗi xảy ra khi tạo chức vụ!");
          },
        });
      }
    } catch (error) {
      message.error("Có lỗi xảy ra!");
    }
  }, [formData, role, createRole, updateRole, refetchRoles, refetch]);

  const isLoading = isCreating || isUpdating;
  const isFormValid = formData.name.trim().length > 0;

  // Đếm số permissions được chọn
  const selectedPermissionsCount = Object.values(formData.permissions).filter(
    Boolean
  ).length;

  return (
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
              {role ? "Chỉnh sửa chức vụ" : "Tạo chức vụ mới"}
            </Title>
            <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
              {role
                ? `Cập nhật thông tin chức vụ: ${role.name}`
                : "Điền thông tin chức vụ và phân quyền"}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width="calc(100vw - 32px)"
      style={{
        maxWidth: "600px",
      }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="!rounded-xl sm:!rounded-2xl role-modal"
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
          maxHeight: "calc(100vh - 200px)",
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
        {/* Enhanced Header với gradient background - Fixed */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#00B4B6]/10 via-white to-[#0891b2]/10 border-b border-[#00B4B6]/20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#00B4B6] animate-pulse"></div>
              <Text className="text-[#00B4B6] text-xs sm:text-sm font-medium">
                Thông tin chức vụ và phân quyền
              </Text>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {/* Khối 1: Thông tin cơ bản */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-[#00B4B6]/10 to-[#0891b2]/10 flex items-center justify-center">
                <UserOutlined className="!text-[#0891b2] !text-xs sm:!text-sm" />
              </div>
              <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                Thông tin chức vụ
              </Text>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                <div className="w-1 h-1 bg-[#00B4B6] rounded-full"></div>
                <span className="text-gray-800 font-medium text-xs sm:text-sm">
                  Tên chức vụ
                </span>
                <span className="text-red-500">*</span>
              </div>
              <Input
                placeholder="Nhập tên chức vụ (ví dụ: Quản lý, Nhân viên...)"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-[#00B4B6] focus:!shadow-lg hover:!border-[#00B4B6] !transition-all !duration-200 !shadow-sm"
                size="middle"
              />
            </div>
          </div>

          {/* Khối 2: Phân quyền */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
                <SecurityScanOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
              </div>
              <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                Phân quyền hệ thống
              </Text>
              <div className="ml-auto text-xs text-gray-500">
                ({selectedPermissionsCount}/{permissions.length})
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
              {permissions.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <SecurityScanOutlined className="text-2xl mb-2 block mx-auto" />
                  Đang tải danh sách quyền hạn...
                </div>
              ) : (
                permissions.map((permission: PermissionItem) => (
                  <div
                    key={permission.value}
                    className={`flex items-center p-2 sm:p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                      formData.permissions[permission.value]
                        ? "bg-[#00B4B6]/5 border-[#00B4B6]/20"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Checkbox
                      checked={formData.permissions[permission.value] || false}
                      onChange={(e) =>
                        handlePermissionChange(
                          permission.value,
                          e.target.checked
                        )
                      }
                      className="!text-sm"
                    />
                    <div className="ml-3 flex-1">
                      <span
                        className={`text-sm font-medium block ${
                          formData.permissions[permission.value]
                            ? "text-[#00B4B6]"
                            : "text-gray-700"
                        }`}
                      >
                        {permission.label}
                      </span>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ml-2 ${
                        formData.permissions[permission.value]
                          ? "bg-[#00B4B6]"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Enhanced Footer - Fixed */}
          <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 mt-4 sm:mt-6 bg-white sticky bottom-0 px-4 sm:px-6">
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              size="middle"
              className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
            >
              ❌ Hủy bỏ
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              size="middle"
              className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">
                    {role ? "Đang cập nhật..." : "Đang tạo..."}
                  </span>
                  <span className="sm:hidden">
                    {role ? "Cập nhật..." : "Tạo..."}
                  </span>
                </span>
              ) : (
                `✅ ${role ? "Cập nhật chức vụ" : "Tạo chức vụ"}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
