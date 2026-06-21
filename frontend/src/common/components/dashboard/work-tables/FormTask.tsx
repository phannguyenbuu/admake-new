import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Form, Modal, Typography, notification, Tabs, InputNumber } from "antd";
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
import { useQuery } from "@tanstack/react-query";
import { InventoryService, type InventoryItem } from "../../../services/inventory.service";

const { Text } = Typography;

function getAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken')
    || sessionStorage.getItem('accessToken')
    || '';
}

function getMaterialRowPrice(row: any, items: any[]): number {
  for (const item of items) {
    const specs = item.spec_rows || [];
    if (specs.length > 0) {
      for (const spec of specs) {
        const specStr = [spec.color, spec.spec].filter(Boolean).join(" - ");
        const formattedName = `${item.name} - ${specStr}`;
        if (row.ten === formattedName || (row.ten === item.name && row.quy_cach === specStr)) {
          return Number(spec.price) || 0;
        }
      }
    }
    if (row.ten === item.name) {
      return item.standard_cost || item.average_cost || 0;
    }
    if (item.name && row.ten && row.ten.startsWith(item.name)) {
      if (specs.length > 0) {
        for (const spec of specs) {
          const specStr = [spec.color, spec.spec].filter(Boolean).join(" - ");
          if (row.ten.includes(specStr) || row.quy_cach === specStr) {
            return Number(spec.price) || 0;
          }
        }
      }
      return item.standard_cost || item.average_cost || 0;
    }
  }
  return 0;
}

function getTaskMaterialCost(materials: any[], items: any[]): number {
  return materials.reduce((sum: number, row: any) => {
    const qty = parseFloat(row.so_luong) || 0;
    const price = getMaterialRowPrice(row, items);
    return sum + qty * price;
  }, 0);
}

interface FormTaskProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues: Task | null;
  users: UserSearchProps[];
  customers?: UserSearchProps[];
  currentColumn: number;
}

export default function FormTask({
  open,
  onCancel,
  onSuccess,
  users,
  customers = [],
  currentColumn,
}: FormTaskProps) {
  const { userLeadId, workspaceId, isMobile, tmpTaskCreatedAssets, tmpTaskCreatedMessages, setTmpTaskCreatedAssets, setTmpTaskCreatedMessages } =
    useUser();
  const { taskDetail, setTaskDetail } = useTaskContext();

  const context = useContext(UpdateButtonContext);
  if (!context) throw new Error("UpdateButtonContext not found");
  const { setShowUpdateButton } = context;

  const [form] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState("info");
  const [isDocsCommentsExpanded, setIsDocsCommentsExpanded] = useState(true);
  const [isMaterialsExpanded, setIsMaterialsExpanded] = useState(true);
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

  const apiHost = useApiHost();

  /** Flush pending draft messages/assets to server for an existing task */
  const flushDraftsForExistingTask = useCallback(
    async (taskId: string, accessToken: string) => {
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      // 1. Upload pending draft assets (files are already on server, just link them to the task)
      for (const draftAsset of tmpTaskCreatedAssets) {
        try {
          const formData = new FormData();
          formData.append("time", new Date().toISOString());
          formData.append("type", draftAsset.type || "task");
          formData.append("user_id", draftAsset.user_id || "");
          formData.append("task_id", taskId);
          // file is already uploaded – pass URL reference
          formData.append("file_url", draftAsset.file_url || "");
          formData.append("thumb_url", draftAsset.thumb_url || "");

          await fetch(`${apiHost}/task/${taskId}/upload-link`, {
            method: "PUT",
            credentials: "include",
            headers,
            body: formData,
          });
        } catch (err) {
          console.error("Flush draft asset error:", err);
        }
      }

      // 2. Send pending draft messages/comments
      for (const draftMsg of tmpTaskCreatedMessages) {
        try {
          const formData = new FormData();
          formData.append("time", new Date().toISOString());
          formData.append("type", draftMsg.type || "task");
          formData.append("user_id", draftMsg.user_id || "");
          formData.append("task_id", taskId);
          formData.append("text", draftMsg.text || "");
          formData.append("username", draftMsg.username || "");

          await fetch(`${apiHost}/task/${taskId}/message`, {
            method: "PUT",
            credentials: "include",
            headers,
            body: formData,
          });
        } catch (err) {
          console.error("Flush draft message error:", err);
        }
      }

      clearTemporaryTaskDraft();
    },
    [apiHost, clearTemporaryTaskDraft, tmpTaskCreatedAssets, tmpTaskCreatedMessages]
  );

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
        const response = await fetch(`${apiHost}/task/${taskDetail.id}`, {
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

        // Flush pending drafts (messages/assets) to the server
        const hasDrafts = tmpTaskCreatedAssets.length > 0 || tmpTaskCreatedMessages.length > 0;
        if (hasDrafts && taskDetail.id) {
          await flushDraftsForExistingTask(taskDetail.id.toString(), accessToken);
        }

        notification.success({ message: "Cập nhật công việc thành công!" });
      } else {
        preparedValues["status"] = fixedColumns[currentColumn].type;
        preparedValues["icon"] = preparedValues["icon"] || null;
        preparedValues["assets"] = [
          ...tmpTaskCreatedAssets.filter((item) => item.type !== 'icon'),
          ...tmpTaskCreatedMessages,
        ];

        clearTemporaryTaskDraft();

        const response = await fetch(`${apiHost}/task/`, {
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

  // Fetch Inventory Library for material cost calculation
  const { data: resItems } = useQuery({
    queryKey: ["inventory-items", userLeadId],
    enabled: userLeadId > 0,
    queryFn: async () => (await InventoryService.listItems({ lead: userLeadId, limit: 1000 })).data?.data as InventoryItem[],
  });

  const materials = Form.useWatch("materials", form) || [];
  const computedMaterialsCost = useMemo(() => {
    if (!resItems || !materials.length) return 0;
    return getTaskMaterialCost(materials, resItems);
  }, [materials, resItems]);

  const handlePrint = () => {
    if (!taskDetail || !customerSelected) return;

    const taskTitle = form.getFieldValue("title") || taskDetail.title || "Đơn hàng";
    const amountVal = form.getFieldValue("amount") || 0;
    const prepaymentVal = form.getFieldValue("prepayment") || 0;
    const balanceVal = Math.max(0, amountVal - prepaymentVal);

    const materialsList = form.getFieldValue("materials") || [];

    const dateStr = dayjs().format("DD/MM/YYYY");

    const materialRowsHtml = (materialsList || []).map((row: any, index: number) => {
      const price = getMaterialRowPrice(row, resItems || []);
      const qty = parseFloat(row.so_luong) || 0;
      const total = qty * price;
      return `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 10px;">${index + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px;">${row.ten || ""}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px;">${row.quy_cach || ""}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 10px;">${row.don_vi || ""}</td>
          <td style="text-align: right; border: 1px solid #cbd5e1; padding: 10px;">${qty}</td>
          <td style="text-align: right; border: 1px solid #cbd5e1; padding: 10px;">${new Intl.NumberFormat("vi-VN").format(price)}₫</td>
          <td style="text-align: right; border: 1px solid #cbd5e1; padding: 10px;">${new Intl.NumberFormat("vi-VN").format(total)}₫</td>
        </tr>
      `;
    }).join("");

    const printHtml = `
      <html>
      <head>
        <title>Báo giá / Bill - ${taskTitle}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #334155;
            font-size: 14px;
            line-height: 1.6;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .header-logo {
            font-size: 26px;
            font-weight: 800;
            color: #0f766e;
            letter-spacing: 0.5px;
          }
          .header-company-info {
            text-align: right;
            font-size: 11.5px;
            color: #64748b;
            line-height: 1.5;
          }
          .title-section {
            text-align: center;
            margin-bottom: 30px;
          }
          .title-section h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .info-table td {
            padding: 8px 4px;
            vertical-align: top;
            border-bottom: 1px dashed #f1f5f9;
          }
          .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .main-table th {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 12px 10px;
            font-weight: 700;
            text-align: center;
            font-size: 13px;
            color: #475569;
          }
          .summary-table {
            width: 50%;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .summary-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .summary-table tr:last-child td {
            border-bottom: 2px solid #0f766e;
            font-weight: bold;
            font-size: 16px;
            color: #0f766e;
          }
          .signature-section {
            width: 100%;
            margin-top: 60px;
            page-break-inside: avoid;
          }
          .signature-box {
            text-align: center;
            width: 50%;
            float: left;
            box-sizing: border-box;
          }
          .signature-space {
            height: 100px;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="header-logo">DECOR B-ONE</td>
            <td class="header-company-info">
              <strong>CÔNG TY TNHH DECOR B-ONE</strong><br/>
              Địa chỉ: 96 Đường số 1, KDC Cityland, Phường 7, Gò Vấp, TP.HCM<br/>
              Hotline: 0909 123 456 | Email: contact@b-onedecor.vn
            </td>
          </tr>
        </table>

        <div class="title-section">
          <h1>BẢNG BÁO GIÁ & ĐƠN ĐẶT HÀNG</h1>
          <div style="margin-top: 6px; color: #64748b; font-weight: 500;">Ngày lập: ${dateStr}</div>
        </div>

        <table class="info-table">
          <tr>
            <td style="width: 15%; color: #64748b;"><strong>Khách hàng:</strong></td>
            <td style="width: 45%; color: #1e293b; font-weight: 600;">${customerSelected.fullName || "Khách hàng vãng lai"}</td>
            <td style="width: 15%; color: #64748b;"><strong>Đơn hàng:</strong></td>
            <td style="width: 25%; color: #1e293b; font-weight: 600;">${taskTitle}</td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Điện thoại:</strong></td>
            <td style="color: #1e293b;">${customerSelected.phone || "-"}</td>
            <td style="color: #64748b;"><strong>Mã công việc:</strong></td>
            <td style="color: #1e293b; font-family: monospace;">${taskDetail.id}</td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Địa chỉ:</strong></td>
            <td style="color: #1e293b;">${customerSelected.workAddress || "-"}</td>
            <td style="color: #64748b;"><strong>Email:</strong></td>
            <td style="color: #1e293b;">${customerSelected.email || "-"}</td>
          </tr>
        </table>

        <div style="font-weight: 700; margin-bottom: 12px; text-transform: uppercase; font-size: 12px; color: #475569; letter-spacing: 0.5px;">Chi tiết vật tư đơn hàng</div>
        <table class="main-table">
          <thead>
            <tr>
              <th style="width: 6%;">STT</th>
              <th style="width: 38%;">Tên vật tư</th>
              <th style="width: 18%;">Quy cách</th>
              <th style="width: 10%;">Đơn vị</th>
              <th style="width: 8%;">SL</th>
              <th style="width: 10%;">Đơn giá</th>
              <th style="width: 10%;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${materialRowsHtml || `<tr><td colspan="7" style="text-align: center; border: 1px solid #cbd5e1; padding: 20px; color: #94a3b8;">Không có vật tư nào được ghi nhận</td></tr>`}
          </tbody>
        </table>

        <table class="summary-table">
          <tr>
            <td style="color: #64748b;">Tổng tiền vật tư:</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${new Intl.NumberFormat("vi-VN").format(Math.round(computedMaterialsCost))}₫</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Chi phí thực hiện (nhân công):</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${new Intl.NumberFormat("vi-VN").format(taskDetail.reward || 0)}₫</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #1e293b;">Tổng giá trị đơn hàng:</td>
            <td style="text-align: right; color: #0f766e; font-weight: 800;">${new Intl.NumberFormat("vi-VN").format(amountVal)}₫</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Đã tạm ứng:</td>
            <td style="text-align: right; color: #be123c; font-weight: 600;">-${new Intl.NumberFormat("vi-VN").format(prepaymentVal)}₫</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f766e;">Còn lại phải thanh toán:</td>
            <td style="text-align: right; color: #0f766e; font-weight: 800; font-size: 16px;">${new Intl.NumberFormat("vi-VN").format(balanceVal)}₫</td>
          </tr>
        </table>

        <div style="clear: both;"></div>

        <div class="signature-section">
          <div class="signature-box">
            <strong style="color: #334155;">ĐẠI DIỆN KHÁCH HÀNG</strong><br/>
            <span style="font-size: 11px; color: #94a3b8;">(Ký và ghi rõ họ tên)</span>
            <div class="signature-space"></div>
          </div>
          <div class="signature-box">
            <strong style="color: #334155;">ĐẠI DIỆN CÔNG TY</strong><br/>
            <span style="font-size: 11px; color: #94a3b8;">(Ký và ghi rõ họ tên)</span>
            <div class="signature-space"></div>
          </div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 500);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      assign_ids: userList ? userList.map((user) => user.id) : [],
      work_days: computedWorkDays,
    });
  }, [computedWorkDays, form, userList]);

  useEffect(() => {
    if (!open) {
      initializedTaskIdRef.current = undefined;
      clearTemporaryTaskDraft();
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
    setIsDocsCommentsExpanded(true);
    setIsMaterialsExpanded(true);

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
        amount: null,
        prepayment: null,
        customer_id: null,
        customer: null,
      });
      setCustomerSelected(null);
    } else {
      const custObj = taskDetail?.customer_id;
      const custId = typeof custObj === "object" && custObj ? custObj.id : (custObj ?? null);
      const custName = typeof custObj === "object" && custObj ? custObj.name : null;

      form.setFieldsValue({
        workspace_id: workspaceId,
        work_days: (taskDetail as any)?.work_days ?? 0,
        icon: taskDetail?.icon ?? null,
        amount: taskDetail?.amount ?? null,
        prepayment: taskDetail?.prepayment ?? null,
        customer_id: custId,
        customer: custName,
      });

      if (custObj) {
        setCustomerSelected({
          user_id: custId,
          fullName: custName ?? "",
          phone: typeof custObj === "object" ? custObj.phone : "",
          workAddress: typeof custObj === "object" ? custObj.address : "",
          email: typeof custObj === "object" ? custObj.email : "",
        } as any);
      } else {
        setCustomerSelected(null);
      }
    }
  }, [clearTemporaryTaskDraft, form, open, taskDetail, workspaceId]);

  useEffect(() => {
    if (customerSelected) {
      form.setFieldsValue({
        customer_id: customerSelected.user_id,
        customer: customerSelected.fullName || "",
      });
    } else {
      form.setFieldsValue({
        customer_id: null,
        customer: null,
      });
    }
  }, [customerSelected, form]);

  const handleModalCancel = useCallback(() => {
    const hasPendingDrafts = tmpTaskCreatedAssets.length > 0 || tmpTaskCreatedMessages.length > 0;

    if (hasPendingDrafts) {
      Modal.confirm({
        title: "Bạn có thay đổi chưa lưu",
        content: "Các tài liệu và bình luận vừa thêm sẽ bị mất nếu đóng. Bạn có muốn tiếp tục?",
        okText: "Đóng không lưu",
        cancelText: "Quay lại",
        okButtonProps: { danger: true },
        centered: true,
        onOk: () => {
          clearTemporaryTaskDraft();
          onCancel();
        },
      });
      return;
    }

    clearTemporaryTaskDraft();
    onCancel();
  }, [clearTemporaryTaskDraft, onCancel, tmpTaskCreatedAssets.length, tmpTaskCreatedMessages.length]);

  const docsCommentsSection = (
    <div className="mx-auto mt-5 w-[96%] max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Tài liệu & Bình luận
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Minh chứng & Trao đổi
            </span>
            <button
              type="button"
              onClick={() => setIsDocsCommentsExpanded((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent p-0 text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
              title={isDocsCommentsExpanded ? "Thu gọn" : "Mở rộng"}
            >
              {isDocsCommentsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isDocsCommentsExpanded && (
          <div className="bg-slate-50 px-4 py-4 md:px-5">
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

  const materialsSection = (
    <div className="mx-auto mt-5 w-[96%] max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Vật liệu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Danh sách vật tư công việc
            </span>
            <button
              type="button"
              onClick={() => setIsMaterialsExpanded((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent p-0 text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
              title={isMaterialsExpanded ? "Thu gọn" : "Mở rộng"}
            >
              {isMaterialsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isMaterialsExpanded && (
          <div className="bg-slate-50 px-4 py-4 md:px-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <InboxOutlined /> Danh sách vật liệu
              </div>
              <MaterialsTab form={form} />
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
        <Form.Item name="materials" hidden />
        <Form.Item name="customer_id" hidden />
        <Form.Item name="customer" hidden />

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
                        <div className="mb-4 flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-r from-blue-100 to-blue-200 sm:h-6 sm:w-6">
                              <span className="flex items-center justify-center text-xs leading-none text-blue-600 sm:text-sm">
                                👔
                              </span>
                            </div>
                            <Text strong className="!text-sm !text-slate-800 sm:!text-base whitespace-nowrap">
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

                            <div className="flex min-w-[80px] flex-col items-center rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5">
                              <span className="text-[14px] font-bold leading-tight text-amber-700">
                                {computedMaterialsCost > 0
                                  ? `${new Intl.NumberFormat("vi-VN").format(Math.round(computedMaterialsCost))}₫`
                                  : "—"}
                              </span>
                              <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-amber-500">
                                Tiền vật tư
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

                      {/* Khách hàng & Thanh toán Card */}
                      <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-r from-teal-100 to-teal-200 sm:h-6 sm:w-6">
                              <span className="flex items-center justify-center text-xs leading-none text-teal-600 sm:text-sm">
                                💰
                              </span>
                            </div>
                            <Text strong className="!text-sm !text-slate-800 sm:!text-base whitespace-nowrap">
                              Khách hàng & Thanh toán
                            </Text>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div>
                            <span className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Tìm kiếm khách hàng
                            </span>
                            <JobAgentInfo
                              form={form}
                              mode="customer"
                              users={customers}
                              searchValue={customerSearch}
                              setSearchValue={setCustomerSearch}
                              selectedAgent={customerSelected}
                              setselectedAgent={setCustomerSelected}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                              name="amount"
                              label={
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Tổng đơn
                                </span>
                              }
                              className="!mb-0"
                            >
                              <InputNumber
                                className="w-full !rounded-lg !border-slate-200"
                                placeholder="0"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, "") as any}
                                style={{ width: "100%" }}
                              />
                            </Form.Item>

                            <Form.Item
                              name="prepayment"
                              label={
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Tạm ứng
                                </span>
                              }
                              className="!mb-0"
                            >
                              <InputNumber
                                className="w-full !rounded-lg !border-slate-200"
                                placeholder="0"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, "") as any}
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </div>

                          {customerSelected && (
                            <button
                              type="button"
                              onClick={handlePrint}
                              className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-none bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                              🖨️ In Báo Giá / Bill
                            </button>
                          )}
                        </div>
                      </div>
                    </Stack>
                  </div>

                  {docsCommentsSection}
                  {materialsSection}
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
