import { Button, Layout, Dropdown, Avatar, Popover, Modal, message, notification } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
// import NotificationDropdown from "../../../components/NotificationDropdown";
import { useNavigate } from "react-router-dom";
import { useInfo } from "../../hooks/info.hook";
// import { useGetNotification } from "../../hooks/notification.hook";
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
import NotifyModal from "./NotifyModal";

const { Header } = Layout;

export default function AppHeader() {
  const location = useLocation().pathname;
  // console.log('location',useLocation());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const {username, userId, userRole, userRoleId, userLeadId, workspaces, setWorkspaces, fullName} = useUser();
  const [questionOpen, setQuestionOpen] = useState(false);
  const {getNotifyList, notifyList} = useUser();
  // console.log('USER_NAME', useUser(), username);
  
  // call hook useInfo
  const { data: info, refetch: refetchInfo } = useInfo();
  // const { isConnected, on } = useSocket();

  //@ts-ignore
  const { data: receiveWorkSpaces, refetch: refetchWorkSpaces } = useWorkSpaceQueryAll({lead: userLeadId});

  useEffect(()=>{
    if(!receiveWorkSpaces) return;
    //@ts-ignore
    receiveWorkSpaces.sort((a, b) => {
      if (a.pinned === b.pinned) {
        // Nếu cùng pinned, so sánh updatedAt giảm dần
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      // Ưu tiên pinned true lên trước
      return a.pinned ? -1 : 1;
    });
    //@ts-ignore
    setWorkspaces(receiveWorkSpaces);
  },[receiveWorkSpaces]);

  const handleQuestionClick = () => {
    setQuestionOpen(true);
  }

  const handleCancel = () => {
    setQuestionOpen(false)
  }

  
  useEffect(() => {
    getNotifyList(); // Gọi lần đầu khi mount

    const intervalId = setInterval(() => {
      getNotifyList();
    }, 60000); // 60000ms = 1 phút

    return () => clearInterval(intervalId); // Cleanup khi unmount
  }, [getNotifyList]);

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
    <>
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
              className={`text-lg md:text-xl transition-colors duration-200`}
            />

          </div>

          {/* Admin role text */}
          <div className="hidden md:flex items-center">
            <span className="text-gray-700 font-semibold text-sm px-3 py-1.5 bg-gray-100 rounded-full">
              {fullName || "Admin"} / {userRole?.name}
            </span>

            <Button style={{background:'none', border:'none'}}>
              <span className="text-white font-semibold text-sm px-3 py-1.5 bg-red-600 rounded-full">
                {notifyList.length}
              </span>
            </Button>
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
    <NotifyModal />
    </>
  );
}
