import {
  Button,
  Typography,
  Popconfirm,
  message,
  Modal,
  Tag,
  Select,
  Pagination,
  Grid,
} from "antd";
import { useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  useGetHolidays,
  useDeleteHoliday,
} from "../../../common/hooks/holiday.hook";
import { useUserDetail } from "../../../common/hooks/user.hook";
import type { Holiday, HolidayModalProps } from "../../../@types/holiday.type";
import HolidayModal from "./HolidayModal";
import dayjs from "dayjs";
import type { PaginationDto } from "../../../@types/common.type";

const { Title, Text } = Typography;

export const HolidayManagerment = ({
  open,
  user,
  onCancel,
}: Pick<HolidayModalProps, "open" | "onCancel" | "user">) => {
  const [pagination, setPagination] = useState<PaginationDto>({
    page: 1,
    limit: 10,
    search: "",
  });

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const { data: userDetail } = useUserDetail(user?._id);

  const { data: holidays, refetch } = useGetHolidays(
    user?._id || "",
    pagination
  );

  const { mutate: deleteHoliday, isPending: isDeleting } = useDeleteHoliday();
  const [config, setConfig] = useState({
    openCreate: false,
    openUpdate: false,
  });
  const [holiday, setHoliday] = useState<Holiday>();
  const [filterType, setFilterType] = useState<string>("ALL");

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, page, limit: pageSize }));
  };
  const handleShowSizeChange = (_: number, size: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit: size }));
  };

  const handleDeleteHoliday = (holidayId: string, holidayName: string) => {
    deleteHoliday(holidayId, {
      onSuccess: () => {
        message.success({
          content: `Đã xóa đơn nghỉ phép "${holidayName}" thành công!`,
          style: { marginTop: "20vh" },
          duration: 3,
        });
        refetch();
      },
      onError: () => {
        message.error({
          content: "Có lỗi xảy ra khi xóa đơn nghỉ phép!",
          style: { marginTop: "20vh" },
          duration: 3,
        });
      },
    });
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case "PUBLIC_HOLIDAY":
        return "red";
      case "COMPANY_HOLIDAY":
        return "blue";
      case "PERSONAL_LEAVE":
        return "green";
      case "SICK_LEAVE":
        return "orange";
      case "ANNUAL_LEAVE":
        return "purple";
      case "OTHER":
        return "default";
      default:
        return "default";
    }
  };

  const getHolidayTypeLabel = (type: string) => {
    switch (type) {
      case "PUBLIC_HOLIDAY":
        return "Lễ tết";
      case "COMPANY_HOLIDAY":
        return "Nghỉ công ty";
      case "PERSONAL_LEAVE":
        return "Nghỉ cá nhân";
      case "SICK_LEAVE":
        return "Nghỉ ốm";
      case "ANNUAL_LEAVE":
        return "Nghỉ phép năm";
      case "OTHER":
        return "Khác";
      default:
        return type;
    }
  };

  const filteredHolidays =
    holidays?.data?.filter((h: Holiday) =>
      filterType === "ALL" ? true : h.type === filterType
    ) || [];

  const handleCloseModal = () => {
    setConfig({ openCreate: false, openUpdate: false });
    setHoliday(undefined);
    onCancel();
  };

  //@ts-ignore
  const total = holidays?.total || 0;
  const showPagination = total > 10;
  const currentPage = pagination.page;
  const pageSize = pagination.limit;

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#0891b2] to-[#0e7490] flex items-center justify-center shadow-lg">
              <CalendarOutlined className="!text-white !text-sm sm:!text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <Title
                level={isMobile ? 5 : 4}
                className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
              >
                Quản lý đơn nghỉ phép
              </Title>
              <div className="flex items-center gap-1 sm:gap-2 mt-1">
                <UserOutlined className="!text-gray-500 !text-xs sm:!text-sm" />
                <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
                  Quản lý cho{" "}
                  <Text strong className="text-[#0891b2]">
                    {userDetail?.data?.fullName ||
                      user?.fullName ||
                      "Nhân viên"}
                  </Text>
                </Text>
              </div>
            </div>
          </div>
        }
        open={open}
        onCancel={handleCloseModal}
        footer={null}
        width={isMobile ? "95%" : isTablet ? 800 : 920}
        centered
        className="!rounded-2xl sm:!rounded-3xl holiday-modal"
        maskClosable={false}
        styles={{
          content: {
            borderRadius: isMobile ? "16px" : "24px",
            overflow: "hidden",
            padding: 0,
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
          },
          body: {
            padding: 0,
            borderRadius: isMobile ? "16px" : "24px",
          },
          header: {
            borderBottom: "1px solid #f1f3f4",
            padding: isMobile ? "16px 20px 12px" : "24px 32px 20px",
            background: "linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)",
            borderRadius: isMobile ? "16px 16px 0 0" : "24px 24px 0 0",
          },
          mask: {
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <div className="bg-white">
          {/* Enhanced Header - Mobile Optimized */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0891b2] animate-pulse"></div>
                  <Text className="text-gray-600 text-sm sm:text-base font-medium">
                    {total} đơn nghỉ phép
                  </Text>
                  {showPagination && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                      <Text className="text-gray-500 text-xs sm:text-sm">
                        Trang {currentPage} / {Math.ceil(total / pageSize)}
                      </Text>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  className="w-full sm:w-40"
                  size={isMobile ? "middle" : "large"}
                  placeholder="Lọc theo loại"
                  options={[
                    { value: "ALL", label: "Tất cả" },
                    { value: "PERSONAL_LEAVE", label: "Nghỉ cá nhân" },
                  ]}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setConfig({ ...config, openCreate: true })}
                  size={isMobile ? "middle" : "large"}
                  className="!bg-gradient-to-r !from-[#0891b2] !to-[#0e7490] !border-none !rounded-lg sm:!rounded-xl !shadow-lg hover:!shadow-xl !transition-all !duration-300 hover:!scale-105 !font-semibold !px-4 sm:!px-6 !text-xs sm:!text-sm"
                >
                  {isMobile ? "Thêm mới" : "Thêm đơn mới"}
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Content Area - Mobile Optimized */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredHolidays.length === 0 ? (
                <div className="text-center py-8 sm:py-16">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <CalendarOutlined className="!text-2xl sm:!text-3xl !text-gray-400" />
                  </div>
                  <Text className="text-gray-700 text-base sm:text-lg font-semibold block mb-2 sm:mb-3">
                    Chưa có đơn nghỉ phép nào
                  </Text>
                  <Text className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto leading-relaxed px-4">
                    Tạo đơn nghỉ phép đầu tiên để bắt đầu quản lý thời gian nghỉ
                  </Text>
                  <div className="mt-6 sm:mt-8">
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => setConfig({ ...config, openCreate: true })}
                      size={isMobile ? "middle" : "large"}
                      className="!border-2 !border-dashed !border-[#0891b2] !text-[#0891b2] hover:!bg-[#0891b2]/5 !rounded-lg sm:!rounded-xl !font-medium !px-6 sm:!px-8 !text-xs sm:!text-sm"
                    >
                      {isMobile
                        ? "Tạo đơn đầu tiên"
                        : "Tạo đơn nghỉ phép đầu tiên"}
                    </Button>
                  </div>
                </div>
              ) : (
                filteredHolidays.map((h: Holiday, index: number) => (
                  <div
                    key={h._id}
                    className="group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 bg-white hover:shadow-xl hover:-translate-y-1 border-gray-200 hover:border-[#0891b2]/40"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Holiday Icon - Mobile Optimized */}
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300 self-start sm:self-center">
                      <div className="w-full h-full bg-gradient-to-br from-[#0891b2] to-[#0e7490] flex items-center justify-center text-white text-base sm:text-xl font-bold relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <CalendarOutlined className="relative !text-sm sm:!text-lg" />
                      </div>
                    </div>

                    {/* Holiday Info - Mobile Optimized */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <Text className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-[#0891b2] transition-colors duration-300">
                          {h.name}
                        </Text>
                        <Tag
                          color={getHolidayTypeColor(h.type)}
                          className="!text-xs !px-2 sm:!px-3 !py-1 !rounded-full !border-none !font-medium self-start sm:self-center"
                        >
                          {getHolidayTypeLabel(h.type)}
                        </Tag>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <ClockCircleOutlined className="!text-gray-500 !text-xs sm:!text-sm" />
                          <Text className="text-gray-600 text-xs sm:text-sm font-medium">
                            {dayjs(h.startDate).format("DD/MM/YYYY")} -{" "}
                            {dayjs(h.endDate).format("DD/MM/YYYY")}
                          </Text>
                        </div>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
                        <Text className="text-gray-500 text-xs sm:text-sm">
                          {dayjs(h.endDate).diff(dayjs(h.startDate), "day") + 1}{" "}
                          ngày
                        </Text>
                      </div>

                      {h.description && (
                        <Text className="text-gray-600 text-xs sm:text-sm line-clamp-2 max-w-md">
                          {h.description}
                        </Text>
                      )}
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-start sm:self-center">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => {
                          setHoliday(h);
                          setConfig({ ...config, openUpdate: true });
                        }}
                        className="!text-blue-600 hover:!text-blue-700 hover:!bg-blue-50 !rounded-lg !px-2 sm:!px-3 !py-1 !h-7 sm:!h-8 !border !border-blue-200 hover:!border-blue-300 !shadow-sm hover:!shadow-md !transition-all !duration-200 !text-xs"
                        title="Chỉnh sửa đơn nghỉ phép"
                      >
                        {isMobile ? (
                          "Sửa"
                        ) : (
                          <span className="text-xs font-medium">Sửa</span>
                        )}
                      </Button>

                      <Popconfirm
                        title={
                          <div className="max-w-xs">
                            <div className="flex items-center gap-2 mb-2">
                              <ExclamationCircleOutlined className="!text-orange-500 !text-lg" />
                              <Text
                                strong
                                className="text-gray-800 text-sm sm:text-base"
                              >
                                Xác nhận xóa đơn nghỉ phép
                              </Text>
                            </div>
                            <Text className="text-gray-600 text-xs sm:text-sm">
                              Bạn có chắc muốn xóa{" "}
                              <Text strong className="text-red-600">
                                "{h.name}"
                              </Text>
                              ?
                            </Text>
                          </div>
                        }
                        onConfirm={() => handleDeleteHoliday(h._id, h.name)}
                        okText="Xóa đơn nghỉ phép"
                        cancelText="Hủy bỏ"
                        placement={isMobile ? "top" : "topRight"}
                        okButtonProps={{
                          danger: true,
                          loading: isDeleting,
                          className:
                            "!bg-red-500 !border-red-500 hover:!bg-red-600 hover:!border-red-600 !rounded-lg !font-medium !px-3 sm:!px-4 !py-2 !h-auto !shadow-lg hover:!shadow-xl !transition-all !duration-300 !text-xs sm:!text-sm",
                          icon: <DeleteOutlined />,
                        }}
                        cancelButtonProps={{
                          className:
                            "!border-gray-300 !text-gray-600 hover:!border-gray-400 hover:!text-gray-700 !rounded-lg !font-medium !px-3 sm:!px-4 !py-2 !h-auto !bg-white hover:!bg-gray-50 !transition-all !duration-300 !text-xs sm:!text-sm",
                        }}
                        overlayStyle={{ maxWidth: isMobile ? "90vw" : "400px" }}
                        overlayInnerStyle={{
                          padding: isMobile ? "16px" : "20px",
                          borderRadius: "12px",
                          boxShadow:
                            "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                        }}
                      >
                        <Button
                          type="text"
                          icon={
                            <DeleteOutlined className="!text-red-500 !text-xs sm:!text-sm" />
                          }
                          size="small"
                          danger
                          className="!text-red-600 hover:!text-red-700 hover:!bg-red-50 !rounded-lg !px-2 sm:!px-3 !py-1 !h-7 sm:!h-8 !border !border-red-500 hover:!border-red-300 !shadow-sm hover:!shadow-md !transition-all !duration-200 !text-xs"
                          disabled={isDeleting}
                          title="Xóa đơn nghỉ phép"
                        >
                          {isMobile ? (
                            "Xóa"
                          ) : (
                            <span className="text-xs font-medium">Xóa</span>
                          )}
                        </Button>
                      </Popconfirm>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0891b2]/0 to-[#0891b2]/0 group-hover:from-[#0891b2]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Enhanced Footer - Mobile Optimized */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                {showPagination && (
                  <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    simple={isMobile}
                    size={isMobile ? "small" : "default"}
                    showSizeChanger={!isMobile}
                    onChange={handlePageChange}
                    onShowSizeChange={handleShowSizeChange}
                    pageSizeOptions={
                      isMobile ? ["5", "10"] : ["5", "10", "20", "50"]
                    }
                    className="!bg-white !px-2 sm:!px-4 !py-2 !rounded-lg !shadow-sm !border !border-gray-200"
                  />
                )}
                {!showPagination && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <Text className="text-gray-600 text-xs sm:text-sm font-medium">
                      Đã tải {total} đơn nghỉ phép
                    </Text>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleCloseModal}
                  size={isMobile ? "middle" : "large"}
                  className="!border-gray-300 !text-gray-600 hover:!border-gray-400 hover:!text-gray-700 !rounded-lg sm:!rounded-xl !font-medium !px-4 sm:!px-6 hover:!shadow-md !transition-all !duration-300 !text-xs sm:!text-sm !w-full sm:!w-auto"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal tạo mới */}
      <HolidayModal
        user={user}
        open={config.openCreate}
        onCancel={() => {
          setConfig({ ...config, openCreate: false });
          refetch();
        }}
        refetchHolidays={refetch}
      />

      {/* Modal sửa */}
      <HolidayModal
        user={user}
        open={config.openUpdate}
        onCancel={() => {
          setConfig({ ...config, openUpdate: false });
          refetch();
        }}
        refetchHolidays={refetch}
        holiday={holiday}
      />
    </>
  );
};
