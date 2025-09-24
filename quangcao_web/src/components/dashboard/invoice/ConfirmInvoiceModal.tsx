import { Modal, Button, Card, Tag, Row, Col, Statistic } from "antd";
import dayjs from "dayjs";
import {
  ShoppingCartOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { ConfirmInvoiceModalProps } from "../../../@types/invoice.type";

export const ConfirmInvoiceModal: React.FC<ConfirmInvoiceModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  confirmLoading,
  materials,
  selectedMaterials,
  quantities,
  users,
  selectedUsers,
  date,
  totalDays,
  totalMaterialsCost,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pt-4 pb-2 px-8">
          <span className="text-cyan-600 font-semibold text-lg">
            Xác nhận báo giá
          </span>
        </div>
      }
      open={isVisible}
      onCancel={onCancel}
      footer={
        <div className="flex justify-end gap-3 px-6 pb-4">
          <Button key="cancel" onClick={onCancel} size="large">
            Huỷ
          </Button>
          <Button
            key="confirm"
            type="primary"
            loading={confirmLoading}
            onClick={onConfirm}
            size="large"
            className="!bg-[#00B4B6] !font-semibold"
          >
            Xác nhận báo giá
          </Button>
        </div>
      }
      width={750}
      centered
      bodyStyle={{ padding: "24px 24px 16px" }}
    >
      <div className="space-y-6">
        <Row gutter={[20, 20]}>
          {/* Vật liệu */}
          <Col span={12}>
            <Card
              size="small"
              title={
                <div className="flex items-center gap-2 py-1">
                  <ShoppingCartOutlined className="text-cyan-600" />
                  <span className="font-semibold text-base">
                    Vật liệu ({selectedMaterials.length})
                  </span>
                </div>
              }
              className="h-full"
              bodyStyle={{ padding: "16px" }}
            >
              <div className="max-h-36 overflow-y-auto space-y-2">
                {selectedMaterials.map((materialId) => {
                  const material = materials?.find(
                    (m) => m._id === materialId._id
                  );
                  const quantity = quantities[materialId._id] || 1;
                  const totalPrice = (material?.price || 0) * quantity;
                  return (
                    <div
                      key={materialId._id}
                      className="flex justify-between items-start py-2 px-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1 pr-3">
                        <div className="font-medium text-sm text-gray-800 mb-1">
                          {material?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {quantity} {material?.unit} ×{" "}
                          {material?.price?.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <Tag color="cyan" className="font-semibold shrink-0">
                        {totalPrice.toLocaleString("vi-VN")}đ
                      </Tag>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>

          {/* Nhân sự */}
          <Col span={12}>
            <Card
              size="small"
              title={
                <div className="flex items-center gap-2 py-1">
                  <TeamOutlined className="text-cyan-600" />
                  <span className="font-semibold text-base">
                    Nhân sự ({selectedUsers.length})
                  </span>
                </div>
              }
              className="h-full"
              bodyStyle={{ padding: "16px" }}
            >
              <div className="max-h-36 overflow-y-auto space-y-2">
                {selectedUsers.map((userId) => {
                  const user = users?.find((u) => u._id === userId);
                  return (
                    <div
                      key={userId}
                      className="flex items-center py-2 px-2 bg-gray-50 rounded-md"
                    >
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                      <span className="font-medium text-sm text-gray-800">
                        {user?.fullName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>

          {/* Thời gian */}
          <Col span={12}>
            <Card
              size="small"
              title={
                <div className="flex items-center gap-2 py-1">
                  <CalendarOutlined className="text-cyan-600" />
                  <span className="font-semibold text-base">
                    Thời gian thi công
                  </span>
                </div>
              }
              bodyStyle={{ padding: "16px" }}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Ngày khởi công:</span>
                  <span className="font-medium text-sm text-gray-800">
                    {date.startDate
                      ? dayjs(date.startDate).format("DD/MM/YYYY")
                      : "Chưa chọn"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Ngày bàn giao:</span>
                  <span className="font-medium text-sm text-gray-800">
                    {date.endDate
                      ? dayjs(date.endDate).format("DD/MM/YYYY")
                      : "Chưa chọn"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    Tổng số ngày:
                  </span>
                  <Tag color="blue" className="font-semibold">
                    {totalDays} ngày
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>

          {/* Tổng giá */}
          <Col span={12}>
            <Card
              size="small"
              title={
                <div className="flex items-center gap-2 py-1">
                  <DollarOutlined className="text-cyan-600" />
                  <span className="font-semibold text-base">
                    Tổng giá vật liệu
                  </span>
                </div>
              }
              bodyStyle={{ padding: "16px" }}
            >
              <div className="text-center py-2">
                <Statistic
                  value={totalMaterialsCost}
                  precision={0}
                  valueStyle={{
                    color: "#00B4B6",
                    fontSize: "26px",
                    fontWeight: "bold",
                  }}
                  suffix="đ"
                  formatter={(value) => value?.toLocaleString("vi-VN")}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tóm tắt */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-5 rounded-lg border border-cyan-200 mx-1">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Tổng cộng:</div>
              <div className="font-semibold text-cyan-700 text-base">
                {selectedMaterials.length} vật liệu • {selectedUsers.length}{" "}
                nhân sự • {totalDays} ngày
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-600">Tổng giá trị:</div>
              <div className="text-2xl font-bold text-cyan-600">
                {totalMaterialsCost.toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
