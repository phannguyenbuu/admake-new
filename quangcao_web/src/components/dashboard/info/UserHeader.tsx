import { Avatar, Button, Input, Image, message, Tooltip, Spin } from "antd";
import {
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useUpdateAvatar } from "../../../common/hooks/info.hook";
import { useState, useEffect } from "react";
import type { UserHeaderProps } from "../../../@types/info.type";

export const UserHeader: React.FC<UserHeaderProps> = ({ info, onRefetch }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [config, setConfig] = useState({
    isEditingAvatar: false,
    isAvatarLoading: false,
    avatarError: false,
    isDragging: false,
  });
  const { mutate: updateAvatar, isPending: isUpdatingAvatar } =
    useUpdateAvatar();

  // Reset file khi thoát khỏi chế độ edit avatar
  useEffect(() => {
    if (!config.isEditingAvatar) {
      setFile(null);
      setIsDragging(false);
    }
  }, [config.isEditingAvatar]);

  // Reset avatar loading state when info changes
  useEffect(() => {
    if (info?.avatar) {
      setConfig((prev) => ({
        ...prev,
        isAvatarLoading: true,
        avatarError: false,
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        isAvatarLoading: false,
        avatarError: false,
      }));
    }
  }, [info?.avatar]);

  const handleEditAvatar = () => {
    setConfig({ ...config, isEditingAvatar: !config.isEditingAvatar });
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validation
    const isJpgOrPng =
      selectedFile.type === "image/jpeg" || selectedFile.type === "image/png";
    if (!isJpgOrPng) {
      message.error("Bạn chỉ có thể upload file JPG/PNG!");
      return;
    }

    const isLt2M = selectedFile.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Ảnh phải nhỏ hơn 2MB!");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file) {
      message.error("Vui lòng chọn ảnh trước khi upload!");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    updateAvatar(formData, {
      onSuccess: () => {
        message.success("Cập nhật avatar thành công!");
        setFile(null);
        setConfig({ ...config, isEditingAvatar: false });
        onRefetch?.();
      },
      onError: () => {
        message.error("Có lỗi xảy ra khi cập nhật avatar!");
      },
    });
  };

  return (
    <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-t-xl sm:rounded-t-2xl p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-center relative">
        <div className="relative mb-3 sm:mb-4">
          {/* Avatar Upload Area */}
          <div className="relative">
            {/* Current Avatar or Preview */}
            <div className="relative">
              {file ? (
                <Image
                  src={URL.createObjectURL(file)}
                  alt="avatar preview"
                  className="sm:!w-24 sm:!h-24 lg:!w-32 lg:!h-32 !rounded-full !border-4 !border-white !shadow-2xl"
                  style={{ objectFit: "cover" }}
                  preview={false}
                />
              ) : (
                <div className="relative">
                  <Avatar
                    size={80}
                    className="sm:!w-24 sm:!h-24 lg:!w-32 lg:!h-32 !border-4 !border-white !shadow-2xl"
                    src={
                      info?.avatar && !config.avatarError
                        ? `${import.meta.env.VITE_API_IMAGE}${info?.avatar}`
                        : undefined
                    }
                    icon={
                      !info?.avatar || config.avatarError ? (
                        <UserOutlined />
                      ) : undefined
                    }
                  />
                  {/* Loading overlay - chỉ hiện khi đang thực sự loading */}
                  {config.isAvatarLoading && info?.avatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-300 rounded-full border-4 border-white shadow-2xl">
                      <Spin
                        indicator={
                          <LoadingOutlined
                            style={{ fontSize: 24, color: "#666" }}
                            spin
                          />
                        }
                        size="large"
                      />
                    </div>
                  )}
                  {/* Hidden img element for lazy loading */}
                  {info?.avatar && (
                    <img
                      src={`${import.meta.env.VITE_API_IMAGE}${info?.avatar}`}
                      alt="avatar"
                      style={{ display: "none" }}
                      onLoad={() => {
                        setConfig((prev) => ({
                          ...prev,
                          isAvatarLoading: false,
                        }));
                      }}
                      onError={() => {
                        setConfig((prev) => ({
                          ...prev,
                          isAvatarLoading: false,
                          avatarError: true,
                        }));
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Upload Overlay - chỉ hiện khi đang edit avatar */}
            {config.isEditingAvatar && (
              <div
                className={`absolute inset-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "bg-cyan-600/80"
                    : "bg-black/50 hover:bg-black/70"
                }`}
                onClick={() =>
                  document.getElementById("avatar-file-input")?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                title="Click để chọn ảnh hoặc kéo thả ảnh vào đây"
              >
                <div className="text-center">
                  <PlusOutlined className="!text-white !text-xl !block !mb-1" />
                  <span className="!text-white !text-xs !block">Thay ảnh</span>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input - chỉ hiện khi đang edit avatar */}
          {config.isEditingAvatar && (
            <Input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleFileChange(e.target.files?.[0] || null);
              }}
              style={{ display: "none" }}
            />
          )}

          {/* Upload Button - chỉ hiện khi đang edit avatar và có file */}
          {config.isEditingAvatar && file && (
            <Button
              type="primary"
              size="small"
              loading={isUpdatingAvatar}
              onClick={handleUpload}
              className="!absolute !-bottom-2 !left-1/2 !transform !-translate-x-1/2 !bg-cyan-500 !border-cyan-500 hover:!bg-cyan-600 !text-white !shadow-lg"
              style={{ minWidth: "80px" }}
            >
              {isUpdatingAvatar ? "Đang tải..." : "Lưu"}
            </Button>
          )}

          {/* Edit Avatar Button */}
          <Tooltip title="Chỉnh sửa ảnh" placement="bottom">
            <Button
              shape="circle"
              icon={<EditOutlined />}
              className="!absolute !bottom-0 !-right-1 sm:!-right-2 !bg-cyan-500 !text-white !border-none !shadow-xl !hover:!bg-cyan-600 !w-6 !h-6 sm:!w-8 sm:!h-8"
              onClick={handleEditAvatar}
              size="small"
            />
          </Tooltip>
        </div>

        {/* User Info */}
        <div className="text-center text-white">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-1 drop-shadow-lg">
            {info.fullName || "Chưa cập nhật"}
          </h2>
          <p className="text-sm sm:text-base text-cyan-200 drop-shadow-md">
            {info?.role?.name || "Chưa cập nhật"}
          </p>
        </div>
      </div>
    </div>
  );
};
