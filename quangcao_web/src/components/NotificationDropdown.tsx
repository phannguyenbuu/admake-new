import { Empty, Spin, Tooltip } from "antd";
import { useSocket } from "../socket/SocketContext";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  useCheckNotification,
  useGetNotification,
} from "../common/hooks/notification.hook";
import type { BaseEntity } from "../@types/common.type";

interface Notification extends BaseEntity {
  fromUserId: string;
  isRead: boolean;
  message: string;
  title: string;
  userId: string;
}

// Function để format thời gian theo yêu cầu
const formatTime = (dateString: string | Date): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "vừa xong";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  } else {
    // Hiển thị ngày tháng năm
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
};

export default function NotificationDropdown() {
  const { isConnected, on, off } = useSocket();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useGetNotification({
    page: currentPage,
    limit: 10,
  });
  const { data: checkNotification } = useCheckNotification();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sắp xếp notifications theo thời gian mới nhất lên đầu
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime(); // Mới nhất lên đầu
    });
  }, [notifications]);

  // Load thêm notifications
  const loadMoreNotifications = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
  }, [currentPage, isLoadingMore, hasMore]);

  // Handle scroll để load more
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // Khi scroll đến cuối (còn 50px nữa là đến cuối)
      if (
        scrollHeight - scrollTop - clientHeight < 50 &&
        !isLoadingMore &&
        hasMore &&
        !isLoading
      ) {
        loadMoreNotifications();
      }
    },
    [loadMoreNotifications, isLoadingMore, hasMore, isLoading]
  );

  useEffect(() => {
    if (notificationsData?.data) {
      if (currentPage === 1) {
        setNotifications(notificationsData.data);
      } else {
        setNotifications((prev) => [...prev, ...notificationsData.data]);
      }
      if (notificationsData.data.length < 10) {
        setHasMore(false);
      }

      setIsLoadingMore(false);
    }
  }, [notificationsData, currentPage]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleNotification = (data: any) => {
      // Thêm notification mới vào đầu danh sách
      setNotifications((prev) => [data, ...prev]);
    };
    on("notification", handleNotification);

    return () => {
      off("notification", handleNotification);
    };
  }, [isConnected, on, off]);

  const handleCheckNotification = () => {
    checkNotification;
    refetch();
  };

  return (
    <div className="w-80 max-w-[90vw] overflow-hidden rounded-xl shadow-2xl border border-gray-200 bg-white">
      {/* Header - Light grey background matching dashboard */}
      <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 px-3 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gray-300 flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-600 rounded-full animate-pulse"></div>
          </div>
          <h3 className="font-bold text-gray-700 text-sm sm:text-lg tracking-wide">
            Thông báo
          </h3>
        </div>
        <div
          className="text-gray-600 text-xs sm:text-sm cursor-pointer hover:text-gray-800 hover:bg-gray-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md font-medium"
          onClick={handleCheckNotification}
        >
          <span className="hidden sm:inline">Đánh dấu đã đọc</span>
          <span className="sm:hidden">Đã đọc</span>
        </div>
      </div>

      {/* List */}
      <div
        ref={scrollContainerRef}
        className="max-h-80 overflow-y-auto bg-white"
        style={{
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE 10+
        }}
        onScroll={handleScroll}
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          
          .notification-tooltip .ant-tooltip-inner {
            max-width: 300px;
            padding: 12px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 1px solid rgba(209, 213, 219, 0.3);
            color: #374151;
          }
          
          .notification-tooltip .ant-tooltip-arrow::before {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          }
          
          .notification-item {
            position: relative;
            overflow: hidden;
          }
          
          .notification-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 3px;
            background: linear-gradient(to bottom, #9ca3af, #6b7280);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .notification-item:hover::before {
            opacity: 1;
          }
        `}</style>
        <div className="hide-scrollbar">
          {sortedNotifications.length === 0 && !isLoading ? (
            <div className="p-4 sm:p-6 text-center">
              <Empty
                description={
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">
                    Chưa có thông báo nào
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <>
              {sortedNotifications.map((notification) => (
                <Tooltip
                  key={notification._id || `notification-${Date.now()}`}
                  title={
                    <div>
                      <div className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                        {notification.title || "Thông báo"}
                      </div>
                      <div className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        {notification.message || "Không có nội dung"}
                      </div>
                    </div>
                  }
                  placement="left"
                  overlayClassName="notification-tooltip"
                >
                  <div className="notification-item flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-300 hover:shadow-sm group">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* title */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs sm:text-sm font-bold line-clamp-1 text-gray-800 group-hover:text-gray-700 transition-colors">
                          {notification.title}
                        </div>
                      </div>
                      <div className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-2">
                        {notification.message || "Thông báo mới"}
                      </div>
                      <div className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded-full inline-block">
                        {notification.createdAt
                          ? formatTime(notification.createdAt.toString())
                          : "vừa xong"}
                      </div>
                    </div>

                    {/* Unread indicator dot */}
                    {!notification.isRead && (
                      <div className="relative flex-shrink-0">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full shadow-sm"></div>
                        <div className="absolute inset-0 w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full animate-ping opacity-30"></div>
                      </div>
                    )}
                  </div>
                </Tooltip>
              ))}

              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="p-4 sm:p-6 text-center">
                  <Spin size="small" className="text-gray-500" />
                  <div className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 font-medium">
                    <span className="hidden sm:inline">Đang tải thêm...</span>
                    <span className="sm:hidden">Đang tải...</span>
                  </div>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMore && sortedNotifications.length > 0 && (
                <div className="p-3 sm:p-4 text-center">
                  <div className="text-xs sm:text-sm text-gray-400 bg-gray-50 px-3 sm:px-4 py-2 rounded-full inline-block font-medium">
                    <span className="hidden sm:inline">
                      Đã hiển thị tất cả thông báo
                    </span>
                    <span className="sm:hidden">Đã hiển thị tất cả</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
