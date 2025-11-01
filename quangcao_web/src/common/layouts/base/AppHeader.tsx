import { Layout, Dropdown, Avatar, Popover, Modal, message } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import NotificationDropdown from "../../../components/NotificationDropdown";
import { useNavigate } from "react-router-dom";
import { useInfo } from "../../hooks/info.hook";
import { useGetNotification } from "../../hooks/notification.hook";
import { useSocket } from "../../../socket/SocketContext";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkSpaceQueryAll } from "../../hooks/work-space.hook";
import ChatGroupList from "./ChatGroupList";
import { useUser } from "../../hooks/useUser";
import { QuestionOutlined } from '@ant-design/icons';
import AllManagementModal from "../../../components/dashboard/work-tables/AllManagementModal";
import { useLocation } from "react-router-dom";

import NoteWorkpointModal from "./NoteWorkpointModal";

const { Header } = Layout;

export default function AppHeader() {
  const location = useLocation().pathname;
  // console.log('location',useLocation());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const {username, userId, userRole, userRoleId, userLeadId} = useUser();
  const [questionOpen, setQuestionOpen] = useState(false);

  // console.log('USER_NAME', useUser(), username);
  
  // call hook useInfo
  const { data: info, refetch: refetchInfo } = useInfo();
  const { isConnected, on } = useSocket();

  //@ts-ignore
  const { data: workSpaces, refetch: refetchWorkSpaces } = useWorkSpaceQueryAll({lead: userLeadId});

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

  useEffect(() => {
    if (isConnected) {
      on("notification", () => {
        refetch();
      });
    }
  }, [isConnected, on, refetch]);

  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen);
  };

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

    message.success("Đăng xuất thành công");
    navigate("/login");
  };

  // console.log('WSA',workSpaces);


  return (
    <>
      <Header className="flex items-center justify-between !px-4 md:!px-8 !bg-white shadow-sm h-14 md:h-16 sticky top-0 z-30 border-b border-gray-200">
        {/* Logo Section - Left side */}
        <div className="flex items-center gap-3">
          {/* Logo icon */}
          <div className="flex items-center justify-center">
            <img src="/logo.jpg" alt="logo" className="w-13 h-13" />
          </div>
          {/* Logo text */}
          <div className="flex items-center justify-center">
            <img src="/ADMAKE.svg" alt="ADMAKE" className="h-8" />
          </div>
        </div>

        {/* Menu Chat Group List */}
        <ChatGroupList workSpaces={workSpaces}/>

        <AllManagementModal/>

        <div className="flex items-center gap-4 md:gap-6">
          {/* Center - Notification */}
          <div className="flex items-center justify-end">
            <div className="relative flex items-center">
              <Popover
                content={<NotificationDropdown />}
                trigger="click"
                placement="bottom"
                overlayClassName="notification-popover"
                arrow={false}
                open={notificationOpen}
                onOpenChange={setNotificationOpen}
                overlayStyle={{
                  padding: "8px",
                  maxWidth: "calc(100vw - 32px)",
                }}
                getPopupContainer={(triggerNode) =>
                  triggerNode.parentElement || document.body
                }
                styles={{
                  body: {
                    padding: 0,
                    borderRadius: "12px",
                    overflow: "hidden",
                  },
                }}
              >
                <div
                  className="relative cursor-pointer group flex items-center justify-end"
                  style={{gap:50}}
                  
                >
                  


                  <div style={{gap:50}}
                    onClick={handleNotificationClick}
                   className="p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 flex items-center justify-center">
                    

                    <BellOutlined
                      className={`text-lg md:text-xl transition-colors duration-200 ${
                        notificationOpen || unreadCount > 0
                          ? "text-cyan-500"
                          : "text-gray-600 group-hover:text-cyan-500"
                      }`}
                    />

                    
                    {/* Unread notification badge */}
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold leading-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      </div>
                    )}
                    {/* Pulse animation for new notifications */}
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-red-500 rounded-full animate-ping opacity-30"></div>
                    )}
                  </div>
                </div>
              </Popover>
            </div>
          </div>
        
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
        </div>
      </Header>

      {location === '/dashboard/workpoints' 
        && <NoteWorkpointModal questionOpen={questionOpen} onCancel={handleCancel} />}
    </>
  );
}
