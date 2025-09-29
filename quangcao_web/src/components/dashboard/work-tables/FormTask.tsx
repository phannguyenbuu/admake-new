import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Modal,
  message,
  AutoComplete,
  InputNumber,
  Typography,
  Tag,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  ProjectOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "./css/css.css";
import type { Task } from "../../../@types/work-space.type";
import type { Customer } from "../../../@types/customer.type";
// import { MaterialSection } from "../invoice/MaterialSection";
import { UserSection } from "../invoice/UserSection";
import CommentSection from "./CommentSection";
import {
  useCreateTask,
  useGetTaskById,
  useUpdateTask,
  useUpdateTaskStatusById,
} from "../../../common/hooks/work-space.hook";
import {
  useCustomerQuery,
  useCustomerDetail,
} from "../../../common/hooks/customer.hook";
import FormCustomer from "../customer-managerment/FormCustomer";
import { useInfo } from "../../../common/hooks/info.hook";
import CheckInOut from "./CheckInOut";
import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";
// import type { User } from "../../../@types/user.type";
import JobInfoCard from "./job/JobInfoCard";
import EnhanceHeader from "./job/EnhanceHeader";
import JobCustomerInfo from "./job/JobCustomerInfo";
import JobDescription from "./job/JobDescription";
import JobTimeAndProcess from "./job/JobTimeAndProcess ";
import MobileDatePickerModal from "./job/MobileDatePickerModal";
import MaterialInfo from "./job/MaterialInfo";
import AgentInfo from "./job/AgentInfo";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface FormTaskProps {
  open: boolean;
  onCancel: () => void;
  taskId?: string;
  initialValues?: Task | null;
  workspaceId: string;
  onSuccess?: () => void;
}

export default function FormTask({
  open,
  onCancel,
  taskId,
  workspaceId,
  onSuccess,
}: FormTaskProps) {
  const [form] = Form.useForm();
  const isEditMode = !!taskId; // TODO: check if task is edit mode
  const adminMode = useCheckPermission();
  const { data: taskDetail } = useGetTaskById(taskId || "");
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: info } = useInfo();
  const { mutate: updateTaskStatus } = useUpdateTaskStatusById();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [mode, setMode] = useState({ adminMode: adminMode, userMode: false });
  const [time, setTime] = useState({
    startTime: null as dayjs.Dayjs | null,
    endTime: null as dayjs.Dayjs | null,
  });
  const [material, setMaterial] = useState({
    selectedMaterials: [] as any[],
    materialQuantities: {} as { [key: string]: number },
  });
  const [users, setUsers] = useState({ selectedUsers: [] as string[] });
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [currentDatePicker, setCurrentDatePicker] = useState<{
    type: "startTime" | "endTime";
    value: dayjs.Dayjs | null;
  }>({ type: "startTime", value: null });
  const [currentStatus, setCurrentStatus] = useState<string>("OPEN");

  const mappedTask = useMemo(() => {
    if (!taskDetail) return null;
    return {
      ...taskDetail,
      // @ts-ignore
      customerId: taskDetail?.customer?.id || null,
    };
  }, [taskDetail]);


  console.log('Mapped-Task', mappedTask, taskDetail, users, taskId, workspaceId, material);

  const [customer, setCustomer] = useState({
    searchValue: "", // tạo search value
    selectedId: mappedTask?.customerId || null, // tạo selected id
    selectedCustomer: null as Customer | null, // tạo selected customer
    isTyping: false, // tạo is typing
  });

  const { data: customers, isLoading: loadingCustomers } = useCustomerQuery({
    limit: 50,
    search: customer.searchValue,
  });
  const { data: customerDetail } = useCustomerDetail(customer.selectedId || "");

  useEffect(() => {

    console.log("mappedTask changed:", mappedTask);

    setMode({
      adminMode: adminMode,
      // @ts-ignore
      userMode: mappedTask?.assignIds.includes(info?.id || "") || false,
    });
  }, [info, mappedTask]);

  const filteredCustomers = useMemo(() => {
    if (!customers?.data) return [];
    const search = customer.searchValue.toLowerCase().trim();
    if (!search) return customers.data.slice(0, 5);
    return customers.data
      .filter((c: Customer) =>
        ["fullName", "phone", "workAddress"].some((key) =>
          c[key as keyof Customer]?.toString().toLowerCase().includes(search)
        )
      )
      .slice(0, 10);
  }, [customers?.data, customer.searchValue]);

  const duration = useMemo(() => {
    const { startTime, endTime } = time;
    return startTime && endTime
      ? Math.max(endTime.diff(startTime, "day"), 0)
      : 0;
  }, [time]);

  // const getStatusMeta = (status: string) => {
  //   const statusMap: Record<string, any> = {
  //     OPEN: { color: "blue", label: "Phân việc", icon: "📋" },
  //     IN_PROGRESS: { color: "orange", label: "Sản xuất", icon: "⚡" },
  //     DONE: { color: "green", label: "Hoàn thiện", icon: "✅" },
  //     REWARD: { color: "purple", label: "Đã Nghiệm Thu", icon: "🏆" },
  //   };
  //   return statusMap[status] || statusMap.OPEN;
  // };

  // Handlers và các useEffect giữ nguyên như code gốc...
  const handlers = {
    materialCheck: useCallback((checked: boolean, materialObj: any) => {
      setMaterial((prev) => ({
        ...prev,
        selectedMaterials: checked
          ? [...prev.selectedMaterials, materialObj]
          : prev.selectedMaterials.filter((m) => m.id !== materialObj.id),
      }));
    }, []),

    materialRemove: useCallback((material: string) => {
      setMaterial((prev) => {
        const quantities = { ...prev.materialQuantities };
        delete quantities[material];
        return {
          selectedMaterials: prev.selectedMaterials.filter(
            (m) => m.id !== material
          ),
          materialQuantities: quantities,
        };
      });
    }, []),

    materialQuantityChange: useCallback(
      (material: string, value: number | null) => {
        setMaterial((prev) => ({
          ...prev,
          materialQuantities: {
            ...prev.materialQuantities,
            [material]: value || 1,
          },
        }));
      },
      []
    ),

    userCheck: useCallback((checked: boolean, id: string) => {
      setUsers((prev) => ({
        selectedUsers: checked
          ? [...prev.selectedUsers, id]
          : prev.selectedUsers.filter((u) => u !== id),
      }));
    }, []),

    userRemove: useCallback((id: string) => {
      setUsers((prev) => ({
        selectedUsers: prev.selectedUsers.filter((u) => u !== id),
      }));
    }, []),

    startTimeChange: useCallback(
      (d: dayjs.Dayjs | null) => {
        setTime((prev) => {
          const newState = { ...prev, startTime: d };
          if (prev.endTime?.isBefore(d)) {
            newState.endTime = null;
            form.setFieldsValue({ endTime: null });
          }
          return newState;
        });
      },
      [form]
    ),

    endTimeChange: useCallback((d: dayjs.Dayjs | null) => {
      setTime((prev) => ({ ...prev, endTime: d }));
    }, []),

    customerSearch: useCallback((value: string) => {
      setCustomer((prev) => ({ ...prev, searchValue: value, isTyping: true }));
    }, []),

    customerSelect: useCallback(
      (value: string) => {
        const selected = filteredCustomers.find(
          (c: Customer) => c.fullName === value
        );
        if (selected) {
          setCustomer((prev) => ({
            ...prev,
            selectedId: selected.id,
            searchValue: value,
            selectedCustomer: selected,
            isTyping: false,
          }));
        }
      },
      [filteredCustomers]
    ),

    updateTaskStatus: useCallback(() => {
      updateTaskStatus(
        {
          dto: { status: "REWARD" },
          id: taskId || "",
        },
        {
          onSuccess: () => {
            message.success("Nghiệm thu công việc thành công!");
            onSuccess?.();
          },
          onError: () => {
            message.error("Có lỗi xảy ra khi nghiệm thu công việc!");
          },
        }
      );
    }, [updateTaskStatus, taskId]),
  };

  const resetStates = useCallback(() => {
    console.log('FORM', form);
    form.resetFields();
    setTime({ startTime: null, endTime: null });
    setMaterial({ selectedMaterials: [], materialQuantities: {} });
    setUsers({ selectedUsers: [] });
    setCustomer({
      searchValue: "",
      selectedId: null,
      selectedCustomer: null,
      isTyping: false,
    });
    setCurrentStatus("OPEN");
  }, [form]);

  // Các useEffect giữ nguyên...
  useEffect(() => {
    if (customerDetail && !customer.isTyping) {
      setCustomer((prev) => ({
        ...prev,
        //@ts-ignore
        selectedCustomer: customerDetail as Customer,
        //@ts-ignore
        searchValue: (customerDetail as Customer).fullName,
        isTyping: false,
      }));
    }
  }, [customerDetail, customer.isTyping]);

  useEffect(() => {
    if (!customer.isTyping && customer.searchValue) {
      form.setFieldsValue({ customer: customer.searchValue });
    }
    if (customer.selectedCustomer && !customer.isTyping) {
      form.setFieldsValue({ customer: customer.selectedCustomer.fullName });
    }
  }, [
    customer.searchValue,
    customer.isTyping,
    form,
    customer.selectedCustomer,
  ]);

  useEffect(() => {
    if (mappedTask) {
      form.setFieldsValue({
        //@ts-ignore
        title: mappedTask.title,
        //@ts-ignore
        description: mappedTask.description,
        customer: "",
        //@ts-ignore
        type: mappedTask.type,
        //@ts-ignore
        reward: mappedTask.reward,
        //@ts-ignore
        startTime: mappedTask.startTime ? dayjs(mappedTask.startTime) : null,
        //@ts-ignore
        endTime: mappedTask.endTime ? dayjs(mappedTask.endTime) : null,
      });
      setTime({
        //@ts-ignore
        startTime: mappedTask.startTime ? dayjs(mappedTask.startTime) : null,
        //@ts-ignore
        endTime: mappedTask.endTime ? dayjs(mappedTask.endTime) : null,
      });
      if ((mappedTask as any)?.materials) {
        const quantities: { [key: string]: number } = {};
        (mappedTask as any).materials.forEach(
          (m: any) => (quantities[m.materialId] = m.quantity)
        );
        setMaterial({
          selectedMaterials: (mappedTask as any).materials.map((m: any) => ({
            id: m.materialId,
            name: m.material?.name || "Unknown",
            price: m.material?.price || 0,
            unit: m.material?.unit || "cái",
          })),
          materialQuantities: quantities,
        });
      }
      //@ts-ignore
      if (mappedTask.assignIds)
        //@ts-ignore
        setUsers({ selectedUsers: mappedTask.assignIds });
      //@ts-ignore
      if (mappedTask.customerId)
        setCustomer((prev) => ({
          ...prev,
          selectedId: mappedTask.customerId,
        }));

      if (mappedTask.status) {
        //@ts-ignore
        setCurrentStatus(mappedTask.status);
        form.setFieldsValue({ status: mappedTask.status });
      }
    } else {
      resetStates();
    }
  }, [mappedTask, form, resetStates]);

  const handleCancel = useCallback(() => {
    resetStates();
    onCancel();
  }, [resetStates, onCancel]);

  const handleFinish = (values: Task) => {
    console.log("Form values:", values);
    console.log("Time state:", time);

    try {
      if (!workspaceId)
        return message.error("Workspace ID không được để trống!");

      // Kiểm tra validation ngày một cách chính xác
      if (!time.startTime) {
        message.error("Vui lòng chọn ngày bắt đầu!");
        // Scroll lên phần thời gian
        document.querySelector('[name="startTime"]')?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (!time.endTime) {
        message.error("Vui lòng chọn ngày kết thúc!");
        // Scroll lên phần thời gian
        document.querySelector('[name="endTime"]')?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (time.endTime.isBefore(time.startTime, "day")) {
        message.error("Ngày kết thúc không được bé hơn ngày bắt đầu!");
        // Scroll lên phần thời gian
        document.querySelector('[name="endTime"]')?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      const task: Omit<Task, "createById" | "id" | "createdAt" | "updatedAt"> =
        {
          title: values.title || "",
          description: values.description || "",
          status: values.status || "OPEN",
          type: values.type || "REWARD",
          reward: values.reward || 0,
          assignIds: users.selectedUsers,
          workspaceId,
          customerId: customer.selectedId || "",
          startTime: time.startTime?.toDate(), // Convert dayjs về Date
          endTime: time.endTime?.toDate(), // Convert dayjs về Date
          materials: material.selectedMaterials.map((materialObj) => {
            return {
              materialId: materialObj.id,
              material: {
                name: materialObj.name,
                price: materialObj.price || 0,
                unit: materialObj.unit || "cái",
              },
              quantity: material.materialQuantities[materialObj.id] || 1,
            };
          }),
        };

      if (isEditMode && mappedTask) {
        updateTask.mutateAsync(
          {
            //@ts-ignore
            id: mappedTask.id,
            dto: task as Task,
          },
          {
            onSuccess: () => {
              message.success("Cập nhật task thành công!");
              resetStates();
              onSuccess?.();
            },
            onError: () => {
              message.error("Có lỗi xảy ra khi cập nhật task!");
            },
          }
        );
      } else {
        createTask.mutate(task as Task, {
          onSuccess: () => {
            message.success("Tạo task thành công!");
            resetStates();
            onSuccess?.();
          },
          onError: () => {
            message.error("Có lỗi xảy ra khi tạo task!");
          },
        });
      }
      // Bỏ resetStates() và onSuccess?.() ở đây vì đã xử lý trong callback
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu task!");
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 sm:gap-2 px-1 sm:px-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <ProjectOutlined className="!text-white !text-sm sm:!text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <Title
              level={5}
              className="!m-0 !text-gray-900 !font-bold !text-sm sm:!text-base"
            >
              {isEditMode ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
            </Title>
            <Text className="text-gray-500 text-xs sm:text-sm !block !truncate">
              {customer.selectedCustomer?.fullName
                ? `Khách hàng: ${customer.selectedCustomer.fullName}`
                : "Quản lý công việc và nhân sự"}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width="calc(100vw - 20px)"
      style={{
        maxWidth: "900px",
      }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="!rounded-xl sm:!rounded-2xl task-modal"
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
          maxHeight: "calc(100vh - 250px)",
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
        {/* Enhanced Header */}
        <EnhanceHeader duration={duration}/>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <Form form={form} layout="vertical" requiredMark={false}>
            {/* Tên công việc & Trạng thái */}
            <JobInfoCard currentStatus={currentStatus} mode = {mode}/>

            {/* Thông tin khách hàng */}
            <JobCustomerInfo mode={mode} isEditMode={isEditMode}
              customer={customer} handlers={handlers}
              filteredCustomers={filteredCustomers} 
              loadingCustomers={loadingCustomers}
              setShowCustomerModal={setShowCustomerModal}
              setCustomer={setCustomer}
              form={form}/>

            {/* Mô tả */}
            <JobDescription mode={mode} taskDetail={taskDetail}/>

            {/* Thời gian và quy trình */}
            <JobTimeAndProcess  mode = {mode} time={time} 
              handlers={handlers} duration={duration} form = {form} 
              setCurrentDatePicker={setCurrentDatePicker}
              setShowDatePickerModal={setShowDatePickerModal}
              />

            {/* Vật liệu */}
            <MaterialInfo currentStatus={currentStatus} isEditMode={isEditMode} 
              mode={mode} material={material} 
              handlers={handlers}
              mappedTask={mappedTask}
              />

            {/* Nhân sự */}
            <AgentInfo currentStatus={currentStatus} isEditMode={isEditMode}
              mode={mode} users={users} handlers={handlers} mappedTask={mappedTask}
            />
            
            
            {/* Điểm danh - chỉ hiển thị cho user mode */}
            {taskId && mode.userMode && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-yellow-100 to-yellow-200 flex items-center justify-center">
                    <span className="text-yellow-600 text-xs sm:text-sm">
                      ⏰
                    </span>
                  </div>
                  <Text
                    strong
                    className="!text-gray-800 !text-sm sm:!text-base"
                  >
                    Điểm danh công việc
                  </Text>
                </div>
                <CheckInOut taskId={taskId} />
              </div>
            )}

            {/* Bình luận */}
            {taskId && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-pink-100 to-pink-200 flex items-center justify-center">
                    <span className="text-pink-600 text-xs sm:text-sm">💬</span>
                  </div>
                  <Text
                    strong
                    className="!text-gray-800 !text-sm sm:!text-base"
                  >
                    Bình luận & Hoạt động
                  </Text>
                </div>
                <CommentSection
                  taskId={taskId}
                  placeholder="Viết bình luận về công việc này..."
                  disabled={!mode.userMode}
                />
              </div>
            )}
            {/* Footer với các nút hành động */}
            <div className="sticky bottom-0 bg-white z-10 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 mt-4 sm:mt-6">
              {/* Nút hành động: Tạo/Cập nhật (khi chưa DONE/REWARD) */}
              {mode.adminMode &&
                currentStatus !== "DONE" &&
                currentStatus !== "REWARD" && (
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isPending}
                    size="middle"
                    className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
                    onClick={() => {
                      handleFinish(form.getFieldsValue());
                    }}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <span className="hidden sm:inline">
                          {isEditMode ? "Đang cập nhật..." : "Đang tạo..."}
                        </span>
                        <span className="sm:hidden">
                          {isEditMode ? "Cập nhật..." : "Tạo..."}
                        </span>
                      </span>
                    ) : isEditMode ? (
                      "✅ Cập nhật công việc"
                    ) : (
                      "🚀 Tạo công việc"
                    )}
                  </Button>
                )}

              {/* Nút hành động: Nghiệm thu (khi DONE) */}
              {mode.adminMode && currentStatus === "DONE" && (
                <Button
                  type="primary"
                  onClick={handlers.updateTaskStatus}
                  loading={isPending}
                  size="middle"
                  className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] hover:!from-[#0891b2] hover:!to-[#00B4B6] !border-0 !shadow-lg hover:!shadow-xl !font-bold !text-xs sm:!text-sm !transition-all !duration-200 !transform hover:!scale-105 !order-2 sm:!order-2 !drop-shadow-md"
                >
                  {isPending ? (
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span className="hidden sm:inline">
                        Đang nghiệm thu...
                      </span>
                      <span className="sm:hidden">Nghiệm thu...</span>
                    </span>
                  ) : (
                    "🏆 Nghiệm Thu"
                  )}
                </Button>
              )}

              {/* Nút Đóng */}
              <Button
                onClick={handleCancel}
                disabled={isPending}
                size="middle"
                className="!h-9 sm:!h-10 !px-4 sm:!px-6 !rounded-lg !text-gray-700 hover:!bg-gray-50 !font-medium !text-xs sm:!text-sm !transition-all !duration-200 !shadow-sm hover:!shadow-md hover:!scale-105 !order-1 sm:!order-1 !drop-shadow-md !border-none"
              >
                ❌ Đóng
              </Button>
            </div>
          </Form>
        </div>
      </div>

      {/* Modal tạo khách hàng mới */}
      <FormCustomer
        open={showCustomerModal}
        onCancel={() => setShowCustomerModal(false)}
        onRefresh={() => {}}
      />

      {/* Mobile Date Picker Modal */}
      <MobileDatePickerModal
        open={showDatePickerModal}
        onCancel={() => setShowDatePickerModal(false)}
        onConfirm={(date) => {
          if (currentDatePicker.type === "startTime") {
            handlers.startTimeChange(date);
            form.setFieldsValue({ startTime: date });
          } else {
            handlers.endTimeChange(date);
            form.setFieldsValue({ endTime: date });
          }
          setShowDatePickerModal(false);
        }}
        value={currentDatePicker.value}
        disabledDate={(current) => {
          if (currentDatePicker.type === "startTime") {
            return current && current < dayjs().startOf("day");
          } else {
            return (
              !time.startTime || (current && current < dayjs(time.startTime))
            );
          }
        }}
      />
    </Modal>
  );
}



{/*Giao diện form được chia nhiều phần component con như:
EnhanceHeader: header phần thông tin nâng cao.
JobInfoCard: phần tên công việc, trạng thái.
JobCustomerInfo: thông tin khách hàng với autocomplete.
JobDescription: mô tả công việc.
JobTimeAndProcess: phần chọn ngày và hình thức làm việc.
MaterialInfo: phần vật liệu cần thiết.
AgentInfo: thông tin nhân sự thực hiện.
CheckInOut: phần điểm danh thực hiện công việc.
CommentSection: phần bình luận và hoạt động.
Khung Modal do Ant Design cung cấp với nhiều chỉnh sửa giao diện, hỗ trợ responsive. */}


{/*Các biến điều khiển và vai trò chính trong code:
open: boolean, điều khiển hiển thị modal form.
onCancel: hàm gọi khi đóng modal, dùng để reset form và trạng thái.
taskId: nếu có, chỉ ra form đang ở chế độ chỉnh sửa (edit mode), nếu không là tạo mới.
workspaceId: ID của workspace chứa task.
onSuccess: callback gọi khi tạo hoặc cập nhật thành công task.
Các trạng thái nội bộ:
form: instance form của Ant Design để thao tác với form.
isEditMode: true khi chỉnh sửa task.
adminMode: nhận quyền admin từ hook useCheckPermission.
taskDetail: dữ liệu task lấy từ hook useGetTaskById.
createTask, updateTask, updateTaskStatus: hook để gọi API tạo, sửa, hoặc đổi trạng thái task.
time: trạng thái quản lý ngày bắt đầu và ngày kết thúc (startTime, endTime).
material: quản lý vật liệu chọn và số lượng.
users: quản lý người dùng được chỉ định (assign).
customer: quản lý thông tin khách hàng, autocomplete tìm kiếm và chọn khách.
duration: tự tính dựa trên ngày bắt đầu, ngày kết thúc.
currentStatus: trạng thái hiện tại của task (OPEN, DONE, v.v).
mappedTask: thông tin task đã map thêm customerId để tiện dùng.

Các handler chính gồm:
materialCheck, materialRemove, materialQuantityChange: xử lý chọn, bỏ chọn, thay số lượng vật liệu.
userCheck, userRemove: quản lý danh sách người dùng được phân công.
startTimeChange, endTimeChange: cập nhật ngày bắt đầu và kết thúc, đồng thời validate ngày.
customerSearch, customerSelect: tìm kiếm và chọn khách hàng trong autocomplete.
updateTaskStatus: gọi API cập nhật trạng thái task (ví dụ nghiệm thu).
resetStates: reset toàn bộ trạng thái về mặc định (dùng khi đóng form hoặc tạo mới).
handleCancel: gọi reset trạng thái và đóng modal.
handleFinish: xử lý lưu tạo mới hoặc sửa task, gọi API tương ứng với validate dữ liệu trước.
Nhìn chung, component này quản lý cả trạng thái UI, dữ liệu form, tìm kiếm khách hàng, 
chọn vật liệu, người dùng phân công, thời gian, trạng thái task..., 
đồng thời tương tác nhiều hook API để lấy và cập nhật dữ liệu.*/}
