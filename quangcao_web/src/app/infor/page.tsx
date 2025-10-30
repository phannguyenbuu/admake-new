import type { IPage } from "../../@types/common.type";
import { Card, Button, Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useInfo } from "../../common/hooks/info.hook";
import { UserHeader } from "../../components/dashboard/info/UserHeader";
import { UserForm } from "../../components/dashboard/info/UserForm";
import { useState } from "react";
import { useUser } from "../../common/hooks/useUser";

export const InforDashboard: IPage["Component"] = () => {
  // const { data: info, isLoading: isLoadingInfo, refetch } = useInfo();
  const {userId, username, userRoleId, userRole, userIcon} = useUser();

  const [config, setConfig] = useState({
    openEdit: false,
  });

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    };
  };

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
          {/* <UserHeader info={info} onRefetch={() => refetch()} /> */}

          <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-t-xl sm:rounded-t-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center relative">
              {/* User Info */}
              <div className="text-center text-white">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-1 drop-shadow-lg">
                  {username}
                </h2>
                <p className="text-sm sm:text-base text-cyan-200 drop-shadow-md">
                  {userRole?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Form Button */}
          {/* <div className="absolute top-4 right-4 z-20">
            <Tooltip title="Chỉnh sửa thông tin" placement="bottom">
              <Button
                shape="circle"
                icon={<EditOutlined />}
                className="!bg-cyan-500 !text-white !border-none !shadow-xl !hover:!bg-cyan-600 !w-8 !h-8"
                onClick={handleEdit}
                size="small"
              />
            </Tooltip>
          </div> */}

          {/* Form Information */}
          {/* <UserForm
            info={info}
            config={config}
            toggle={toggle}
            onRefetch={() => refetch()}
          /> */}
        </Card>
      </div>
    </div>
  );
};

export const loader = async () => {
  return null;
};
