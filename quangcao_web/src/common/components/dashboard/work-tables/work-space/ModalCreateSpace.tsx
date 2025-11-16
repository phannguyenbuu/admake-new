import { Button, Form, Input, Typography, Modal, notification } from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import { useUser } from "../../../../common/hooks/useUser";
import { useNavigate } from 'react-router-dom';
import type { WorkSpace } from "../../../../@types/work-space.type";

const { Title, Text } = Typography;

interface ModalCreateSpaceProps {
  open: boolean;
  onCancel: () => void;
  onCreate?: (values: { name: string }) => void;
  setIsModalOpen?: (open: boolean) => void;
}

export default function ModalCreateSpace({
  open,
  onCancel,
  onCreate,
  setIsModalOpen,
}: ModalCreateSpaceProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const {userLeadId, setCurrentWorkspace, workspaces, setWorkspaces} = useUser();
  // form.setFieldValue("status","FREE");

  const handleCreate = async (values:{name: string} ) => {
    try {
      const response = await fetch(`${useApiHost()}/workspace/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: values.name, lead: userLeadId, status:"FREE" }),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tạo bảng công việc");
      }

      const wItem:WorkSpace = await response.json();

      notification.success({message:"Tạo bảng công việc thành công!", description: values.name});
      window.location.href = `${window.location.origin}/dashboard/work-tables/${wItem.id}`
      // form.resetFields();
            
      // setWorkspaces(prev => [...prev, wItem]);
      // setCurrentWorkspace(wItem);

      // setIsModalOpen(false);



    } catch (error) {
      notification.error({message:"Tạo bảng công việc thất bại"});
      console.error(error);
    }
  };



  return (
    <Modal
      title={
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#00B4B6] to-[#0891b2] flex items-center justify-center shadow-lg">
            <PlusOutlined className="!text-white !text-sm sm:!text-base " />
          </div>
          <div>
            <Title
              level={4}
              className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
            >
              Tạo bảng công việc mới
            </Title>
            <Text className="!text-gray-500 !text-sm sm:!text-base">
              Tạo bảng công việc mới để tổ chức công việc
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      centered
      className="!rounded-3xl create-workspace-modal"
      styles={{
        content: {
          borderRadius: "24px",
          overflow: "hidden",
          padding: 0,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
        },
        body: {
          padding: 0,
          borderRadius: "24px",
        },
        header: {
          borderBottom: "1px solid #f1f3f4",
          padding: "24px 32px 20px",
          background: "linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)",
          borderRadius: "24px 24px 0 0",
        },
        mask: {
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      <div className="bg-white">
        {/* Enhanced Header với gradient background */}
        <div className="px-8 py-6 bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-green-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <Text className="text-green-600 text-base font-medium">
                Thông tin bảng công việc mới
              </Text>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="p-8">
          <Form
            layout="vertical"
            onFinish={handleCreate}
            form={form}
            autoComplete="off"
            className="space-y-6"
          >
            <Form.Item
              name="name"
              label={
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-semibold text-base">
                    Tên bảng công việc
                  </span>{" "}
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              }
              rules={[
                { required: true, message: "Vui lòng nhập tên bảng công việc" },
                { min: 3, message: "Tên bảng phải có ít nhất 3 ký tự" },
                { max: 50, message: "Tên bảng không được quá 50 ký tự" },
              ]}
              className="!mb-6"
            >
              <Input
                placeholder="Nhập tên bảng công việc..."
                className="!h-12 !text-base !rounded-xl !border !border-gray-300 focus:!border-green-500 focus:!shadow-lg hover:!border-green-300 !transition-all !duration-200 !shadow-sm"
                size="large"
                prefix={<TeamOutlined className="!text-green-500 !mr-2" />}
              />
            </Form.Item>

            {/* Info section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="!text-white !text-xs !font-bold">ℹ️</span>
                </div>
                <div>
                  <Text className="text-blue-800 font-medium text-sm block mb-1">
                    Lưu ý khi tạo bảng công việc:
                  </Text>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {/* <li>• Tên bảng sẽ hiển thị cho tất cả thành viên</li> */}
                    <li>• Bạn có thể chỉnh sửa hoặc xóa bảng sau này</li>
                    <li>• Bảng mới sẽ được tạo với trạng thái hoạt động</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <Button
                onClick={onCancel}
                size="large"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
              >
                ❌ Hủy bỏ
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
                icon={<PlusOutlined />}
              >
                Tạo bảng công việc
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
}
