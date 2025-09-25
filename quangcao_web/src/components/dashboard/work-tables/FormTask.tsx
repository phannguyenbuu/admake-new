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
import { MaterialSection } from "../invoice/MaterialSection";
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
import type { User } from "../../../@types/user.type";

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

  const getStatusMeta = (status: string) => {
    const statusMap: Record<string, any> = {
      OPEN: { color: "blue", label: "Phân việc", icon: "📋" },
      IN_PROGRESS: { color: "orange", label: "Sản xuất", icon: "⚡" },
      DONE: { color: "green", label: "Hoàn thiện", icon: "✅" },
      REWARD: { color: "purple", label: "Đã Nghiệm Thu", icon: "🏆" },
    };
    return statusMap[status] || statusMap.OPEN;
  };

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
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-cyan-500/10 via-white to-cyan-600/10 border-b border-cyan-500/20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
              <Text className="text-cyan-600 text-xs sm:text-sm font-medium">
                Thông tin công việc
              </Text>
            </div>
            {duration > 0 && (
              <Tag
                color="cyan"
                className="!px-1.5 sm:!px-2 !py-0.5 !rounded-full !border-none !font-medium !text-xs !shadow-sm !ml-auto"
              >
                Thời gian: {duration} ngày
              </Tag>
            )}
          </div>
        </div>

        {/* Enhanced Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <Form form={form} layout="vertical" requiredMark={false}>
            {/* Tên công việc & Trạng thái */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 flex items-center justify-center">
                  <ProjectOutlined className="!text-cyan-600 !text-xs sm:!text-sm" />
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Thông tin cơ bản
                </Text>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <Form.Item
                  name="title"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Tên công việc
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Vui lòng nhập tên công việc" },
                    { min: 3, message: "Ít nhất 3 ký tự" },
                  ]}
                  className="!mb-0"
                >
                  <Input
                    placeholder="Nhập tên công việc..."
                    className="!h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
                    size="middle"
                    disabled={!mode.adminMode}
                  />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-2 font-medium">
                      Danh sách
                    </span>
                    <Tag
                      color={getStatusMeta(currentStatus).color}
                      className="!px-3 !py-1.5 !rounded-lg !border-none !font-medium !text-xs !shadow-md !w-fit"
                    >
                      {getStatusMeta(currentStatus).icon}{" "}
                      {getStatusMeta(currentStatus).label}
                    </Tag>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-2 font-medium">
                      Trạng thái
                    </span>
                    <Tag
                      color={getStatusMeta(currentStatus).color}
                      className="!px-3 !py-1.5 !rounded-lg !border-none !font-medium !text-xs !shadow-md !w-fit"
                    >
                      {currentStatus === "OPEN"
                        ? "⏳ Chưa nhận việc"
                        : currentStatus === "IN_PROGRESS"
                        ? "🚀 Đang thực hiện"
                        : currentStatus === "DONE"
                        ? "✅ Đã hoàn thành"
                        : currentStatus === "REWARD"
                        ? "🏆 Đã Nghiệm Thu"
                        : "⏳ Chưa nhận việc"}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                    <UserOutlined className="!text-blue-600 !text-xs sm:!text-sm" />
                  </div>
                  <Text
                    strong
                    className="!text-gray-800 !text-sm sm:!text-base"
                  >
                    Thông tin khách hàng
                  </Text>
                </div>
                {mode.adminMode && !isEditMode && (
                  <Button
                    type="link"
                    size="small"
                    className="!text-cyan-600 hover:!text-cyan-700 !text-xs !font-medium hover:!underline"
                    onClick={() => setShowCustomerModal(true)}
                  >
                    + Tạo mới
                  </Button>
                )}
              </div>

              {mode.adminMode && !isEditMode && (
                <Form.Item
                  name="customer"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Tìm kiếm khách hàng
                      </span>
                    </div>
                  }
                  className="!mb-3"
                >
                  <AutoComplete
                    value={customer.searchValue}
                    onChange={handlers.customerSearch}
                    onSelect={handlers.customerSelect}
                    placeholder="Nhập tên, số điện thoại hoặc địa chỉ..."
                    className="!h-9 sm:!h-10 !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm"
                    options={filteredCustomers.map((c: Customer) => ({
                      key: c.id,
                      value: c.fullName,
                      label: (
                        <div className="flex flex-col py-1">
                          <div className="font-medium text-sm">
                            {c.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            📞 {c.phone}{" "}
                            {c.workAddress ? `• 📍 ${c.workAddress}` : ""}
                          </div>
                        </div>
                      ),
                    }))}
                    filterOption={false}
                    showSearch
                    allowClear
                    notFoundContent={
                      loadingCustomers ? (
                        <div className="text-center py-2 text-gray-500 text-xs">
                          ⏳ Đang tìm kiếm...
                        </div>
                      ) : customer.searchValue ? (
                        <div className="text-center py-2 text-gray-500 text-xs">
                          Không tìm thấy "{customer.searchValue}"
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-500 text-xs">
                          Nhập từ khóa để tìm kiếm
                        </div>
                      )
                    }
                    onClear={() =>
                      setCustomer({
                        searchValue: "",
                        selectedId: null,
                        selectedCustomer: null,
                        isTyping: false,
                      })
                    }
                  />
                </Form.Item>
              )}

              {customer.selectedCustomer && (
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cột trái: Tên + Địa điểm */}
                    <div className="space-y-4">
                      {/* Tên khách hàng */}
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs">👤</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-600 mb-1">
                            Tên khách hàng
                          </div>
                          <div className="text-sm font-semibold text-gray-800 break-words">
                            {customer.selectedCustomer.fullName || "-"}
                          </div>
                        </div>
                      </div>

                      {/* Địa điểm */}
                      {customer.selectedCustomer.workAddress && (
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-xs">📍</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-gray-600 mb-1">
                              Địa điểm
                            </div>
                            <div className="text-sm font-medium text-cyan-700 break-words whitespace-pre-wrap">
                              {customer.selectedCustomer.workAddress}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cột phải: SĐT + Thông tin công việc */}
                    <div className="space-y-4">
                      {/* Số điện thoại */}
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs">📞</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-600 mb-1">
                            Số điện thoại
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
                            {customer.selectedCustomer.phone ? (
                              <a
                                href={`tel:${customer.selectedCustomer.phone.replace(
                                  /\s/g,
                                  ""
                                )}`}
                                className="text-cyan-700 hover:underline"
                              >
                                {customer.selectedCustomer.phone}
                              </a>
                            ) : (
                              "-"
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Thông tin công việc */}
                      {customer.selectedCustomer.workInfo && (
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 text-xs">💼</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-gray-600 mb-1">
                              Thông tin công việc
                            </div>
                            <div className="text-sm font-medium text-purple-700 break-words leading-relaxed">
                              {customer.selectedCustomer.workInfo}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mô tả */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-green-100 to-green-200 flex items-center justify-center">
                  <span className="text-green-600 text-xs sm:text-sm">📝</span>
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Mô tả công việc
                </Text>
              </div>

              {mode.adminMode ? (
                <Form.Item
                  name="description"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Chi tiết công việc
                      </span>
                    </div>
                  }
                  className="!mb-0"
                >
                  <TextArea
                    rows={3}
                    showCount
                    maxLength={1000}
                    placeholder="Mô tả chi tiết về công việc cần thực hiện..."
                    className="!rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm !resize-none !text-xs sm:!text-sm"
                  />
                </Form.Item>
              ) : (
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {/* @ts-ignore */}
                    {taskDetail?.description || "Không có mô tả"}
                  </div>
                </div>
              )}
            </div>

            {/* Thời gian và quy trình */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center">
                  <CalendarOutlined className="!text-orange-600 !text-xs sm:!text-sm" />
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Thời gian & quy trình
                </Text>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <Form.Item
                  name="startTime"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Ngày bắt đầu
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                  className="!mb-0"
                >
                  <div className="flex gap-2">
                    <DatePicker
                      className="!flex-1 !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày"
                      onChange={(date) => {
                        console.log("startTime DatePicker onChange:", date);
                        handlers.startTimeChange(date);
                        form.setFieldsValue({ startTime: date });
                      }}
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                      value={time.startTime}
                      disabled={!mode.adminMode}
                      size="middle"
                      onOpenChange={(open) => {
                        // Trên mobile, mở modal thay vì datepicker
                        if (open && window.innerWidth <= 768) {
                          setCurrentDatePicker({
                            type: "startTime",
                            value: time.startTime,
                          });
                          setShowDatePickerModal(true);
                          return false; // Ngăn datepicker mở
                        }
                      }}
                    />
                    {/* <Button
                      type="default"
                      size="middle"
                      className="!h-9 sm:!h-10 !px-3 !rounded-lg !border !border-gray-300 hover:!border-cyan-500 !text-gray-600 hover:!text-cyan-600 !transition-all !duration-200"
                      onClick={() => {
                        setCurrentDatePicker({
                          type: "startTime",
                          value: time.startTime,
                        });
                        setShowDatePickerModal(true);
                      }}
                      disabled={!mode.adminMode}
                    >
                      📅
                    </Button> */}
                  </div>
                </Form.Item>

                <Form.Item
                  name="endTime"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Ngày kết thúc
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Chọn ngày kết thúc" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const startTime = getFieldValue("startTime");
                        if (
                          !startTime ||
                          (value && dayjs(value).isBefore(dayjs(startTime)))
                        ) {
                          return Promise.reject(
                            new Error(
                              "Ngày kết thúc không được bé hơn ngày bắt đầu"
                            )
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  className="!mb-0"
                >
                  <div className="flex gap-2">
                    <DatePicker
                      className="!flex-1 !h-9 sm:!h-10 !text-xs sm:!text-sm !rounded-lg !border !border-gray-300 focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !shadow-sm"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày"
                      onChange={(date) => {
                        console.log("endTime DatePicker onChange:", date);
                        handlers.endTimeChange(date);
                        form.setFieldsValue({ endTime: date });
                      }}
                      disabled={!mode.adminMode || !time.startTime}
                      disabledDate={(current) =>
                        !time.startTime ||
                        (current && current < dayjs(time.startTime))
                      }
                      value={time.endTime}
                      size="middle"
                      onOpenChange={(open) => {
                        // Trên mobile, mở modal thay vì datepicker
                        if (open && window.innerWidth <= 768) {
                          setCurrentDatePicker({
                            type: "endTime",
                            value: time.endTime,
                          });
                          setShowDatePickerModal(true);
                          return false; // Ngăn datepicker mở
                        }
                      }}
                    />
                    {/* <Button
                      type="default"
                      size="middle"
                      className="!h-9 sm:!h-10 !px-3 !rounded-lg !border !border-gray-300 hover:!border-cyan-500 !text-gray-600 hover:!text-cyan-600 !transition-all !duration-200"
                      onClick={() => {
                        setCurrentDatePicker({
                          type: "endTime",
                          value: time.endTime,
                        });
                        setShowDatePickerModal(true);
                      }}
                      disabled={!mode.adminMode || !time.startTime}
                    >
                      📅
                    </Button> */}
                  </div>
                </Form.Item>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
                    <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-800 font-medium text-xs sm:text-sm">
                      Tổng thời gian
                    </span>
                  </div>
                  <div className="bg-cyan-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-center shadow-md h-9 sm:h-10 flex items-center justify-center">
                    ⏱️ {duration} ngày
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Form.Item
                  name="type"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Hình thức làm việc
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Chọn hình thức làm việc" },
                  ]}
                  className="!mb-0"
                >
                  <Select
                    placeholder="Chọn hình thức"
                    className="!h-9 sm:!h-10 !rounded-lg  focus:!border-cyan-500 focus:!shadow-lg hover:!border-cyan-500 !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm"
                    size="middle"
                    disabled={!mode.adminMode}
                  >
                    <Select.Option value="REWARD">💼 Công khoán</Select.Option>
                    <Select.Option value="MONTHLY">📅 Công tháng</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="reward"
                  label={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-800 font-medium text-xs sm:text-sm">
                        Mức lương
                      </span>
                      <span className="text-red-500">*</span>
                    </div>
                  }
                  rules={[{ required: true, message: "Nhập mức lương" }]}
                  className="!mb-0"
                >
                  <InputNumber
                    size="large"
                    controls={false}
                    placeholder="Nhập mức lương"
                    className={`!w-full !rounded-lg !border !transition-all !duration-200 !text-xs sm:!text-sm !shadow-sm`}
                    min={0}
                    step={1000}
                    disabled={!mode.adminMode}
                    formatter={(value) =>
                      `${value ?? 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                    }
                    parser={(value) => {
                      if (!value) return 0;
                      const numValue = value.replace(/\./g, "");
                      return (numValue ? Number(numValue) : 0) as 0;
                    }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Vật liệu */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
                  <span className="text-purple-600 text-xs sm:text-sm">🔧</span>
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Vật liệu cần thiết
                </Text>
              </div>
              {currentStatus === "OPEN" && !isEditMode ? (
                <MaterialSection
                  selected={material.selectedMaterials}
                  quantities={material.materialQuantities}
                  onCheck={handlers.materialCheck}
                  onRemove={handlers.materialRemove}
                  onQuantityChange={handlers.materialQuantityChange}
                  disabled={mode.adminMode && currentStatus !== "OPEN"}
                />
              ) : (
                <div
                  className="px-3 sm:px-4 pb-4 max-h-60 overflow-y-auto space-y-2"
                  style={{ maxHeight: 240 }}
                >
                  {/* @ts-ignore */}
                  {mappedTask?.materials?.map((m: any) => {
                    const material = m.material;
                    const qty = material.quantity || 1;
                    return (
                      <div key={material.id} className="p-2 md:p-0">
                        {/* Row responsive */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                          {/* Tên */}
                          <div className="flex-1 min-w-0">
                            <span className="text-cyan-600 font-semibold cursor-pointer hover:underline block truncate">
                              {material?.name || "Unknown Material"}
                            </span>
                          </div>

                          {/* Số lượng + Thành tiền */}
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <span className="text-gray-600">Số lượng</span>
                            <span className="text-green-600 font-semibold text-sm">
                              {qty} x {material?.price.toLocaleString("vi-VN")}đ
                            </span>
                            <span className="text-green-600 font-semibold text-sm">
                              ={" "}
                              {(
                                ((material?.price || 0) * qty) as number
                              ).toLocaleString("vi-VN")}
                              đ
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nhân sự */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-indigo-100 to-indigo-200 flex items-center justify-center">
                  <UserOutlined className="!text-indigo-600 !text-xs sm:!text-sm" />
                </div>
                <Text strong className="!text-gray-800 !text-sm sm:!text-base">
                  Nhân sự thực hiện
                </Text>
              </div>
              {/* chỉ hiện thị ở phân việc có status là OPEN */}
              {currentStatus !== "DONE" && currentStatus !== "REWARD" ? (
                <UserSection
                  selectedUsers={users.selectedUsers}
                  onUserCheck={handlers.userCheck}
                  onRemoveUser={handlers.userRemove}
                />
              ) : (
                <div
                  className="px-4 pb-4 max-h-60 overflow-y-auto"
                  style={{ maxHeight: "240px" }}
                >
                  {/* @ts-ignore */}
                  {mappedTask?.assigns?.map((user: User) => {
                    return (
                      <div
                        key={user.id}
                        className="flex items-center border-b last:border-b-0 py-2"
                      >
                        <span className="text-cyan-600 font-semibold flex-1 cursor-pointer hover:underline">
                          {user?.fullName || user?.username || "Unknown User"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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

// Mobile Date Picker Modal Component
interface MobileDatePickerModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (date: dayjs.Dayjs | null) => void;
  value: dayjs.Dayjs | null;
  disabledDate?: (current: dayjs.Dayjs) => boolean;
}

function MobileDatePickerModal({
  open,
  onCancel,
  onConfirm,
  value,
  disabledDate,
}: MobileDatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(value);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  useEffect(() => {
    setSelectedDate(value);
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth((prev) => prev.subtract(1, "month"));
    } else {
      setCurrentMonth((prev) => prev.add(1, "month"));
    }
  };

  const handleDateSelect = (date: dayjs.Dayjs) => {
    if (disabledDate && disabledDate(date)) return;
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const handleReset = () => {
    setSelectedDate(null);
  };

  const getDaysInMonth = () => {
    const start = currentMonth.startOf("month");
    const end = currentMonth.endOf("month");
    const startDay = start.day(); // 0 = Chủ nhật, 1 = Thứ 2, ...
    const daysInMonth = end.date();

    const days = [];

    // Thêm các ngày trống ở đầu
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Thêm các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(start.date(i));
    }

    return days;
  };

  const weekDays = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
  const days = getDaysInMonth();

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="90vw"
      style={{ maxWidth: "400px" }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="mobile-date-picker-modal"
      styles={{
        content: {
          borderRadius: "16px",
          overflow: "hidden",
          padding: 0,
        },
        body: {
          padding: 0,
        },
        mask: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <div className="bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Chọn ngày</h3>
          {/* <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button> */}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center p-4 bg-gray-50">
          <button
            onClick={() => handleMonthChange("prev")}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors mr-4"
          >
            <LeftOutlined className="text-gray-600" />
          </button>

          <h4 className="text-lg font-medium text-gray-800">
            Tháng {currentMonth.format("MM YYYY")}
          </h4>

          <button
            onClick={() => handleMonthChange("next")}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors ml-4"
          >
            <RightOutlined className="text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-10" />;
              }

              const isDisabled = disabledDate ? disabledDate(day) : false;
              const isSelected =
                selectedDate && day.isSame(selectedDate, "day");
              const isToday = day.isSame(dayjs(), "day");

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    h-10 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isDisabled
                        ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                        : isSelected
                        ? "text-white bg-orange-500 shadow-lg scale-105"
                        : isToday
                        ? "text-orange-600 bg-orange-50 border border-orange-200"
                        : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                    }
                  `}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <Button
            onClick={handleReset}
            className="flex-1 h-12 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Đặt lại
          </Button>
          <Button
            type="primary"
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-lg bg-green-600 border-green-600 text-white hover:bg-green-700 font-medium"
          >
            Áp dụng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
