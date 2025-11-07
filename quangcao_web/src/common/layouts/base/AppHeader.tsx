import { Layout, Dropdown, Avatar, Popover, Modal, message, notification } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
// import NotificationDropdown from "../../../components/NotificationDropdown";
import { useNavigate } from "react-router-dom";
import { useInfo } from "../../hooks/info.hook";
import { useGetNotification } from "../../hooks/notification.hook";
// import { useSocket } from "../../../socket/SocketContext";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkSpaceQueryAll } from "../../hooks/work-space.hook";
import ChatGroupList from "./ChatGroupList";
import { useUser } from "../../hooks/useUser";
import { QuestionOutlined } from '@ant-design/icons';
import AllManagementModal from "../../../components/dashboard/work-tables/AllManagementModal";
import { useLocation } from "react-router-dom";
import { ChatGroupProvider } from "../../../components/chat/ProviderChat";
import NoteWorkpointModal from "./NoteWorkpointModal";

const { Header } = Layout;

export default function AppHeader() {
  const location = useLocation().pathname;
  // console.log('location',useLocation());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const {username, userId, userRole, userRoleId, userLeadId, workspaces, setWorkspaces} = useUser();
  const [questionOpen, setQuestionOpen] = useState(false);

  // console.log('USER_NAME', useUser(), username);
  
  // call hook useInfo
  const { data: info, refetch: refetchInfo } = useInfo();
  // const { isConnected, on } = useSocket();

  //@ts-ignore
  const { data: receiveWorkSpaces, refetch: refetchWorkSpaces } = useWorkSpaceQueryAll({lead: userLeadId});

  useEffect(()=>{
    //@ts-ignore
    setWorkspaces(receiveWorkSpaces);
  },[receiveWorkSpaces]);

  const handleQuestionClick = () => {
    setQuestionOpen(true);
  }

  const handleCancel = () => {
    setQuestionOpen(false)
  }

  const { data: notificationsData, refetch } = useGetNotification({
    page: 1,
    limit: 10,
  });

  // useEffect(() => {
  //   if (isConnected) {
  //     on("notification", () => {
  //       refetch();
  //     });
  //   }
  // }, [isConnected, on, refetch]);

  // const handleNotificationClick = () => {
  //   setNotificationOpen(!notificationOpen);
  // };

  // @ts-ignore
  const unreadCount = notificationsData?.meta?.unread || 0;

  const handleLogout = () => {
    // Xóa token
    localStorage.removeItem("Admake-User-Access");
    sessionStorage.removeItem("accessToken");

    // Invalidate tất cả queries để xóa cache data cũ
    queryClient.clear();

    // Reset info
    refetchInfo();

    notification.success({message:"Đăng xuất thành công"});
    window.location.href = "https://quanly.admake.vn/login";  // chuyển trang theo URL tuyệt đối
  };

  return (
    <ChatGroupProvider>
      <Header className="flex items-center gap-1 justify-between !px-4 md:!px-8 !bg-white shadow-sm h-14 md:h-16 sticky top-0 z-30 border-b border-gray-200">
        {/* Logo Section - Left side */}
        <div className="flex items-center gap-3">
          {/* Logo icon */}
          <div>
            <img src="/logo.jpg" alt="logo" style={{width:40,height:'auto'}} />
          </div>
          {/* Logo text */}
          <div className="flex items-center justify-center">
            <img src="/ADMAKE.svg" alt="ADMAKE" className="h-8" />
          </div>
        </div>

        {/* Menu Chat Group List */}
        <ChatGroupList/>

        <AllManagementModal/>

        
          <div onClick={handleQuestionClick}
            className="p-0 rounded-full hover:bg-gray-100 transition-all duration-200 flex items-center justify-center">
            <QuestionOutlined 
              className={`text-lg md:text-xl transition-colors duration-200 ${
                notificationOpen || unreadCount > 0
                  ? "text-cyan-500"
                  : "text-gray-600 group-hover:text-cyan-500"
              }`}
            />

          </div>

          {/* Admin role text */}
          <div className="hidden md:flex items-center">
            <span className="text-gray-700 font-semibold text-sm px-3 py-1.5 bg-gray-100 rounded-full">
              {username || "Admin"} / {userRole?.name}
            </span>
          </div>

          {/* Avatar dropdown */}
          <div className="flex items-center">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "user",
                    label: "Thông tin",
                    icon: <UserOutlined />,
                    onClick: () => {
                      navigate("/dashboard/infor");
                    },
                  },
                  {
                    key: "logout",
                    label: "Đăng xuất",
                    icon: <LogoutOutlined />,
                    danger: true,
                    onClick: handleLogout,
                  },
                ],
              }}
              trigger={["click"]}
              placement="bottomRight"
              arrow
            >
              <Avatar
                size={32}
                className="md:!size-10 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                  color: "#fff",
                  border: "2px solid #e5e7eb",
                }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </div>
        
      </Header>

      {location === '/dashboard/workpoints'
        && <NoteWorkpointModal questionOpen={questionOpen} onCancel={handleCancel} />}
    </ChatGroupProvider>
  );
}
