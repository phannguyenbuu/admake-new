import { Modal, Input, Form, Typography, Tag, Button } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { convert } from "../../../common/utils/help.util";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface LateCheckInModalProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading: boolean;
  lateMinutes: number;
  currentTime: dayjs.Dayjs;
  timeCheckin: string;
  form: any;
}

export const LateCheckInModal: React.FC<LateCheckInModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  confirmLoading,
  lateMinutes,
  currentTime,
  timeCheckin,
  form,
}) => {
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <ClockCircleOutlined className="!text-white !text-sm sm:!text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <Title
              level={5}
              className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
            >
              Điểm danh trễ
            </Title>
            <Text className="text-gray-500 text-sm sm:text-sm !block !truncate">
              Vui lòng cung cấp lý do cho việc đến trễ
            </Text>
          </div>
        </div>
      }
      open={isVisible}
      onCancel={handleCancel}
      footer={null}
      width="calc(100vw - 32px)"
      style={{
        maxWidth: "600px",
      }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="!rounded-xl sm:!rounded-2xl late-checkin-modal"
      styles={{
        content: {
          borderRadius: "12px",
          overflow: "hidden",
          padding: 0,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
        },
        body: {
          padding: 0,
          borderRadius: "12px",
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        },
        header: {
          borderBottom: "1px solid #f1f3f4",
          padding: "12px 16px",
          background: "linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)",
          borderRadius: "12px 12px 0 0",
          flexShrink: 0,
        },
        mask: {
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      <div className="bg-white h-full flex flex-col">
        {/* Enhanced Header với gradient background */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-b border-orange-200 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
              <Text className="text-orange-600 text-xs sm:text-sm font-medium">
                Thông tin điểm danh trễ
              </Text>
            </div>
            <Tag
              color="error"
              className="!px-1.5 !sm:!px-2 !py-0.5 !rounded-full !border-none !font-medium !text-xs !shadow-sm !ml-auto"
            >
              Trễ {convert(lateMinutes)}
            </Tag>
          </div>
        </div>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {/* Time Information Section */}
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-orange-200 shadow-md sm:shadow-lg mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center">
                <ClockCircleOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
              </div>
              <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                Thông tin thời gian
              </Text>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">
                  Thời gian hiện tại
                </div>
                <div className="text-base font-bold text-red-600 bg-red-50 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg">
                  {currentTime.format("HH:mm:ss")}
                </div>
              </div>
              <div className="text-center sm:border-l sm:border-r sm:border-gray-200">
                <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">
                  Thời gian quy định
                </div>
                <div className="text-base font-bold text-gray-700 bg-gray-50 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg">
                  {new Date(timeCheckin).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">
                  Số phút trễ
                </div>
                <div className="text-base font-bold text-red-700 bg-red-50 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg">
                  +{lateMinutes} phút
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-l-4 border-blue-400 shadow-sm mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="text-xs sm:text-base text-blue-800">
                <p className="font-semibold mb-1 sm:mb-2 text-xs sm:text-lg">
                  Lưu ý quan trọng:
                </p>
                <p className="mb-0 leading-relaxed text-xs sm:text-sm">
                  Điểm danh trễ sẽ được ghi nhận trong hệ thống. Vui lòng cung
                  cấp lý do rõ ràng để hỗ trợ quá trình xem xét.
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
                <ClockCircleOutlined className="!text-purple-600 !text-xs sm:!text-sm" />
              </div>
              <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                Lý do điểm danh trễ
              </Text>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="note"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập lý do điểm danh trễ!",
                  },
                  {
                    min: 10,
                    message: "Lý do phải có ít nhất 10 ký tự!",
                  },
                ]}
                className="!mb-0"
              >
                <TextArea
                  rows={3}
                  placeholder="Ví dụ: Gặp kẹt xe trên đường đi làm, xe hỏng, việc gia đình khẩn cấp..."
                  maxLength={500}
                  showCount
                  className="!resize-none !p-3 sm:!p-4 !text-xs sm:!text-sm !bg-white !rounded-lg !border !border-gray-300 focus:!border-orange-500 focus:!shadow-lg hover:!border-orange-500 !transition-all !duration-200 !shadow-sm"
                />
              </Form.Item>
            </Form>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="flex flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 mt-4 sm:mt-6 bg-white sticky bottom-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button
            onClick={handleCancel}
            disabled={confirmLoading}
            size="middle"
            className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
          >
            ❌ Hủy bỏ
          </Button>
          <Button
            type="primary"
            onClick={onConfirm}
            size="middle"
            className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-orange-500 !to-red-500 hover:!from-red-500 hover:!to-orange-500 !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
          >
            {confirmLoading ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Đang xử lý...</span>
              </span>
            ) : (
              "✅ Xác nhận điểm danh"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
