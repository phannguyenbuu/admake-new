import { Button, Layout, Dropdown, Avatar, Popover, Modal, message, notification, Tooltip } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined, FormOutlined, GiftOutlined } from "@ant-design/icons";
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

import { useLocation } from "react-router-dom";
import { ChatGroupProvider } from "../../../components/chat/ProviderChat";
import NoteWorkpointModal from "./NoteWorkpointModal";
import NotifyModal from "./NotifyModal";
import FeedbackModal from "./FeedbackModal";
import AffiliateModal from "./AffiliateModal";
import SearchIcon from '@mui/icons-material/Search';

const { Header } = Layout;

export default function AppHeader() {
  const location = useLocation().pathname;
  // console.log('location',useLocation());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const { username, userId, userRole, userRoleId, userLeadId, workspaces, setWorkspaces, fullName } = useUser();
  const [questionOpen, setQuestionOpen] = useState(false);
  const { getNotifyList, notifyList } = useUser();
  // console.log('USER_NAME', useUser(), username);

  // call hook useInfo
  const { data: info, refetch: refetchInfo } = useInfo();
  // const { isConnected, on } = useSocket();

  //@ts-ignore
  const { data: receiveWorkSpaces, refetch: refetchWorkSpaces } = useWorkSpaceQueryAll({ lead: userLeadId });

  useEffect(() => {
    if (!receiveWorkSpaces) return;
    //@ts-ignore
    receiveWorkSpaces.sort((a, b) => {
      if (a.pinned === b.pinned) {
        // Nếu cùng pinned, so sánh updatedAt giảm dần
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        return bTime - aTime;
      }
      // Ưu tiên pinned true lên trước
      return a.pinned ? -1 : 1;
    });
    //@ts-ignore
    setWorkspaces(receiveWorkSpaces);
  }, [receiveWorkSpaces]);

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
    localStorage.removeItem("accessToken");
    localStorage.removeItem("Admake-User-Access");
    sessionStorage.removeItem("accessToken");

    queryClient.clear();
    refetchInfo();

    notification.success({ message: "Logout successful" });
    window.location.href = "/login";
  };

  const avatarMenuItems = [
    {
      key: "affiliate",
      label: "🎁 Affiliate / Giới thiệu nhận quà",
      icon: <GiftOutlined className="text-amber-500" />,
      onClick: () => setAffiliateOpen(true),
    },
    ...(userRoleId === -2
      ? [
          {
            key: "user",
            label: "Phân quyền xem theo user",
            icon: <UserOutlined />,
            onClick: () => {
              navigate("/infor");
            },
          },
        ]
      : []),
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <ChatGroupProvider>
        <Header className="flex items-center gap-1 justify-between !px-4 md:!px-8 !bg-white shadow-sm h-14 md:h-16 sticky top-0 z-30 border-b border-gray-200">
          {/* Logo Section - Left side */}
          <div className="flex items-center gap-3">
            {/* Logo icon */}
            <div>
              <img src="/logo.jpg" alt="logo" style={{ width: 40, height: 'auto' }} />
            </div>
            {/* Logo text */}
            <div className="flex items-center justify-center">
              <img src="/ADMAKE.svg" alt="ADMAKE" className="h-8" />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Menu Chat Group List */}
            <ChatGroupList />

            {/* Nút Góp ý Admake */}
            <Tooltip title="Góp ý Admake">
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 border-none bg-transparent p-0"
                title="Góp ý Admake"
                style={{ width: 44, height: 44 }}
              >
                <div className="h-9 w-9 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shadow-2xs">
                  <FormOutlined className="text-base" />
                </div>
              </button>
            </Tooltip>

            {/* Admin role text */}
            <div className="hidden md:flex items-center">
              <span className="text-gray-700 font-semibold text-sm px-3 py-1.5 bg-gray-100 rounded-full">
                {fullName || "Admin"} / {userRole?.name}
              </span>

              <NotifyModal />
            </div>

            {/* Avatar dropdown */}
            <div className="flex items-center">
              <Dropdown
                menu={{
                  items: avatarMenuItems,
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
      </ChatGroupProvider>

      {/* Modal Góp ý Admake */}
      <FeedbackModal open={feedbackOpen} onCancel={() => setFeedbackOpen(false)} />

      {/* Modal Affiliate Giới thiệu Admake */}
      <AffiliateModal open={affiliateOpen} onCancel={() => setAffiliateOpen(false)} />
    </>
  );
}

