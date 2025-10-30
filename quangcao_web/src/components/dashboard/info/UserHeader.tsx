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
