import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Form, Modal, Typography, notification, Tabs } from "antd";
import {
  FileTextOutlined,
  InboxOutlined,
  MessageOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Stack } from "@mui/material";
import { ChevronDown, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import type { Task, UserSearchProps, ZipUserSearchProps } from "../../../@types/work-space.type";
import { UpdateButtonContext } from "../../../common/hooks/useUpdateButtonTask";
import { useApiHost } from "../../../common/hooks/useApiHost";
import { useTaskContext } from "../../../common/hooks/useTask";
import { useUser } from "../../../common/hooks/useUser";
import { fixedColumns } from "./Managerment";
import TaskHeader from "./task/FormTaskHeader";
import JobAgentInfo from "./task/JobAgentInfo";
import JobAsset from "./task/JobAsset";
import JobDescription from "./task/JobDescription";
import JobInfoCard from "./task/JobInfoCard";
import JobTimeAndProcess from "./task/JobTimeAndProcess ";
import MaterialsTab from "./task/MaterialsTab";
import type { UploadIconButtonHandle } from "./task/UploadIconButton";

const { Text } = Typography;

function getAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken')
    || sessionStorage.getItem('accessToken')
    || '';
}

interface FormTaskProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues: Task | null;
  users: UserSearchProps[];
  currentColumn: number;
}

export default function FormTask({
  open,
  onCancel,
  onSuccess,
  users,
  currentColumn,
}: FormTaskProps) {
  const { workspaceId, isMobile, tmpTaskCreatedAssets, tmpTaskCreatedMessages, setTmpTaskCreatedAssets, setTmpTaskCreatedMessages } =
    useUser();
  const { taskDetail, setTaskDetail } = useTaskContext();

  const context = useContext(UpdateButtonContext);
  if (!context) throw new Error("UpdateButtonContext not found");
  const { setShowUpdateButton } = context;

  const [form] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState("info");
  const [isDocsCommentsExpanded, setIsDocsCommentsExpanded] = useState(false);
  const uploadIconRef = useRef<UploadIconButtonHandle | null>(null);
  const initializedTaskIdRef = useRef<string | null | undefined>(undefined);

  const [customerSearch, setCustomerSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [customerSelected, setCustomerSelected] = useState<UserSearchProps | null>(null);
  const [userSelected, setUserSelected] = useState<UserSearchProps | null>(null);
  const [userList, setUserList] = useState<ZipUserSearchProps[]>([]);

  const clearTemporaryTaskDraft = useCallback(() => {
    setTmpTaskCreatedAssets([]);
    setTmpTaskCreatedMessages([]);
  }, [setTmpTaskCreatedAssets, setTmpTaskCreatedMessages]);

  useEffect(() => {
    console.log("Open", taskDetail);
  }, [open, taskDetail]);

  useEffect(() => {
    if (!taskDetail || !taskDetail.assign_ids) return;

    setUserList(taskDetail.assign_ids);

    if (taskDetail.status === "DONE" && taskDetail.check_reward) {
      setShowUpdateButton(1);
    } else if (taskDetail.status === "REWARD") {
      setShowUpdateButton(2);
    } else {
      setShowUpdateButton(0);
    }
  }, [setShowUpdateButton, taskDetail]);

  const onUserDelete = (idToDelete: string | null) => {
    setUserList((prev) => prev.filter((user) => user.id !== idToDelete));
  };

  useEffect(() => {
    if (!userSelected) return;

    setUserList((prevUserList) => {
      const exists = prevUserList.some((user) => user.id === userSelected.user_id);

      if (exists) return prevUserList;

      return [
        ...prevUserList,
        {
          id: userSelected.user_id,
          name: userSelected.fullName ?? null,
        },
      ];
    });
  }, [userSelected]);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const values = await form.validateFields();

      const preparedValues = {
        ...values,
        start_time: values.start_time ? values.start_time.format("YYYY-MM-DD") : null,
        end_time: values.end_time ? values.end_time.format("YYYY-MM-DD") : null,
        icon: values.icon ?? taskDetail?.icon ?? null,
      };

      const accessToken = getAccessToken();

      if (taskDetail) {
        const response = await fetch(`${useApiHost()}/task/${taskDetail.id}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(preparedValues),
        });

        if (!response.ok) {
          throw new Error("Cập nhật công việc thất bại");
        }

        await response.json();
        notification.success({ message: "Cập nhật công việc thành công!" });
      } else {
        preparedValues["status"] = fixedColumns[currentColumn].type;
        preparedValues["icon"] = tmpTaskCreatedAssets.filter((item) => item.type === 'icon');
        preparedValues["assets"] = [
          ...tmpTaskCreatedAssets.filter((item) => item.type !== 'icon'),
          ...tmpTaskCreatedMessages,
        ];

        clearTemporaryTaskDraft();

        const response = await fetch(`${useApiHost()}/task/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(preparedValues),
        });

        if (!response.ok) {
          throw new Error("Tạo công việc thất bại");
        }

        const data = await response.json();
        setTaskDetail(data);
        notification.success({ message: "Tạo công việc thành công!" });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const startTime = Form.useWatch("start_time", form);
  const endTime = Form.useWatch("end_time", form);

  const computedDays = useMemo(() => {
    if (startTime && endTime) {
      const diff = dayjs(endTime).diff(dayjs(startTime), "day") + 1;
      return diff > 0 ? diff : 0;
    }
    return 1;
  }, [endTime, startTime]);

  const computedWorkDays = (userList?.length ?? 0) * computedDays;
  const WORKING_DAYS_PER_MONTH = 26;

  const computedTotalSalary = useMemo(() => {
    if (!userList || !users) return 0;

    return userList.reduce((sum, user) => {
      const userInfo = users.find((item) => item.user_id === user.id);
      const monthlySalary = userInfo?.salary ?? 0;
      const dailyRate = monthlySalary / WORKING_DAYS_PER_MONTH;
      return sum + dailyRate * computedDays;
    }, 0);
  }, [computedDays, userList, users]);

  useEffect(() => {
    form.setFieldsValue({
      assign_ids: userList ? userList.map((user) => user.id) : [],
      work_days: computedWorkDays,
      icon: taskDetail?.icon ?? null,
    });
  }, [computedWorkDays, form, taskDetail?.icon, userList]);

  useEffect(() => {
    if (!open) {
      initializedTaskIdRef.current = undefined;
      if (!taskDetail?.id) {
        clearTemporaryTaskDraft();
      }
      return;
    }

    const nextTaskId = taskDetail?.id ?? null;
    if (initializedTaskIdRef.current === nextTaskId) {
      return;
    }

    initializedTaskIdRef.current = nextTaskId;
    setUserSearch("");
    setUserSelected(null);
    setCustomerSearch("");
    setCustomerSelected(null);
    setActiveTabKey("info");
    setIsDocsCommentsExpanded(!taskDetail?.id);

    if (!taskDetail?.id) {
      clearTemporaryTaskDraft();
      setUserList([]);
      form.resetFields();
      form.setFieldsValue({
        workspace_id: workspaceId,
        work_days: 0,
        icon: null,
        start_time: dayjs().hour(8).minute(0).second(0),
        end_time: dayjs().hour(17).minute(0).second(0),
      });
    } else {
      form.setFieldsValue({
        workspace_id: workspaceId,
        work_days: (taskDetail as any)?.work_days ?? 0,
        icon: taskDetail?.icon ?? null,
      });
    }
  }, [clearTemporaryTaskDraft, form, open, taskDetail?.id, workspaceId]);

  const handleModalCancel = useCallback(() => {
    if (!taskDetail?.id) {
      clearTemporaryTaskDraft();
    }
    onCancel();
  }, [clearTemporaryTaskDraft, onCancel, taskDetail?.id]);

  const docsCommentsSection = (
    <div className="mx-auto mt-5 w-[96%] max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tài liệu & Bình luận
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Mở khi cần để xem tài liệu đính kèm và trao đổi.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDocsCommentsExpanded((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent p-0 text-slate-400 transition hover:text-teal-600"
            title={isDocsCommentsExpanded ? "Thu gọn tài liệu và bình luận" : "Mở tài liệu và bình luận"}
          >
            {isDocsCommentsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {isDocsCommentsExpanded && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 md:px-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <FileTextOutlined /> Tài liệu đính kèm
                </div>
                <JobAsset title="" type="task" />
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <MessageOutlined /> Bình luận
                </div>
                <JobAsset title="" type="comment" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={handleModalCancel}
      closable={false}
      footer={null}
      width={900}
      centered
      style={{ top: 12 }}
      styles={{ body: { padding: 0 } }}
    >
      <TaskHeader onUpdate={handleUpdate} onSuccess={onSuccess} onCancel={handleModalCancel} />

      <Form
        form={form}
        style={{
          overflowX: "hidden",
          maxHeight: "calc(100vh - 120px)",
          minHeight: isMobile ? "auto" : "min(80vh, calc(100vh - 160px))",
          overflowY: "auto",
          paddingBottom: "32px",
        }}
      >
        <Form.Item name="workspace_id" initialValue={workspaceId} hidden />
        <Form.Item name="assign_ids" initialValue={userList?.map((user) => user.id)} hidden />
        <Form.Item name="icon" hidden />

        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          type="line"
          centered
          className="mb-4 w-full"
          items={[
            {
              key: "info",
              label: (
                <span className="select-none flex items-center gap-1.5">
                  <ProfileOutlined /> Thông tin
                </span>
              ),
              children: (
                <div className="min-h-[520px] border-t border-slate-200 bg-[#f3f2f1] -mx-6 -mb-8 px-4 py-4 pb-8 sm:px-6 sm:py-6 sm:pb-12">
                  <div className="mx-auto grid w-[96%] max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex h-full min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        THÔNG TIN CÔNG VIỆC
                      </div>
                      <Stack spacing={3} className="w-full flex-grow">
                        <JobInfoCard
                          taskDetail={taskDetail ?? null}
                          currentStatus={taskDetail?.status ?? ""}
                          form={form}
                          uploadIconRef={uploadIconRef}
                        />
                        <JobDescription
                          form={form}
                          onPasteImage={async (file) => {
                            await uploadIconRef.current?.uploadImageFile(file);
                          }}
                        />
                      </Stack>
                    </div>

                    <Stack spacing={4} className="h-fit min-w-0 w-full">
                      <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex w-full items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-r from-blue-100 to-blue-200 sm:h-6 sm:w-6">
                              <span className="flex items-center justify-center text-xs leading-none text-blue-600 sm:text-sm">
                                👔
                              </span>
                            </div>
                            <Text strong className="!text-sm !text-slate-800 sm:!text-base">
                              Nhân sự phụ trách
                            </Text>
                          </div>

                          <div className="flex items-stretch gap-2">
                            <div className="flex min-w-[56px] flex-col items-center rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5">
                              <span className="text-[16px] font-bold leading-tight text-indigo-700">
                                {computedWorkDays}
                              </span>
                              <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-indigo-400">
                                Số công
                              </span>
                            </div>

                            <div className="flex min-w-[80px] flex-col items-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                              <span className="text-[14px] font-bold leading-tight text-emerald-700">
                                {computedTotalSalary > 0
                                  ? `${new Intl.NumberFormat("vi-VN").format(Math.round(computedTotalSalary))}₫`
                                  : "—"}
                              </span>
                              <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-emerald-400">
                                Số lương
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <JobAgentInfo
                            form={form}
                            mode="user"
                            users={users}
                            searchValue={userSearch}
                            setSearchValue={setUserSearch}
                            selectedAgent={userSelected}
                            setselectedAgent={setUserSelected}
                          />

                          {userList && userList.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-1">
                              {userList.map((item) => (
                                <UserItem key={item.id} user={item} onDelete={onUserDelete} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <JobTimeAndProcess form={form} />
                    </Stack>
                  </div>

                  {docsCommentsSection}
                </div>
              ),
            },
            {
              key: "materials",
              label: (
                <span className="select-none flex items-center gap-1.5">
                  <InboxOutlined /> Vật liệu
                </span>
              ),
              children: (
                <div className="min-h-[520px] border-t border-slate-200 bg-[#f3f2f1] -mx-6 -mb-8 px-4 py-4 pb-8 sm:px-6 sm:py-6 sm:pb-12">
                  <div className="mx-auto h-fit w-[96%] max-w-5xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      DANH SÁCH VẬT LIỆU
                    </div>
                    <MaterialsTab />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
}

interface UserItemSubProps {
  user: ZipUserSearchProps;
  onDelete: (id: string | null) => void;
}

const UserItem: React.FC<UserItemSubProps> = ({ user, onDelete }) => {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 shadow-sm">
      <span className="text-[13px] font-medium text-slate-700">{user.name}</span>
      <button
        onClick={() => onDelete(user.id)}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-slate-400 outline-none transition-colors hover:bg-rose-100 hover:text-rose-500"
        aria-label={`Xóa ${user.name}`}
        type="button"
      >
        ×
      </button>
    </div>
  );
};
