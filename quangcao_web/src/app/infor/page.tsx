import type { IPage } from "../../@types/common.type";
import { Card, Button, Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useInfo } from "../../common/hooks/info.hook";
import { UserHeader } from "../../components/dashboard/info/UserHeader";
import { UserForm } from "../../components/dashboard/info/UserForm";
import { useState } from "react";

export const InforDashboard: IPage["Component"] = () => {
  const { data: info, isLoading: isLoadingInfo, refetch } = useInfo();

  const [config, setConfig] = useState({
    openEdit: false,
  });

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    };
  };

  const handleEdit = () => {
    toggle("openEdit")();
  };

  if (isLoadingInfo) {
    return (
      <div className="h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Lỗi tải thông tin
          </h1>
          <p className="text-gray-600">
            Không thể tải thông tin người dùng. Vui lòng thử lại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 lg:pt-20 w-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" />

      <div className="w-full max-w-2xl mx-auto relative z-10 px-2">
        {/* Single Card Container */}
        <Card
          className="!shadow-2xl !border-0 !backdrop-blur-xl !rounded-2xl"
          bodyStyle={{ padding: "0" }}
        >
          {/* Header với Avatar */}
          <UserHeader info={info} onRefetch={() => refetch()} />

          {/* Edit Form Button */}
          <div className="absolute top-4 right-4 z-20">
            <Tooltip title="Chỉnh sửa thông tin" placement="bottom">
              <Button
                shape="circle"
                icon={<EditOutlined />}
                className="!bg-cyan-500 !text-white !border-none !shadow-xl !hover:!bg-cyan-600 !w-8 !h-8"
                onClick={handleEdit}
                size="small"
              />
            </Tooltip>
          </div>

          {/* Form Information */}
          <UserForm
            info={info}
            config={config}
            toggle={toggle}
            onRefetch={() => refetch()}
          />
        </Card>
      </div>
    </div>
  );
};

export const loader = async () => {
  return null;
};
