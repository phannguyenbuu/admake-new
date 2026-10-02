import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Form, Modal, notification } from "antd";
import dayjs from "dayjs";
import type { Task, UserSearchProps, ZipUserSearchProps } from "../../../@types/work-space.type";
import { UpdateButtonContext } from "../../../common/hooks/useUpdateButtonTask";
import { useApiHost } from "../../../common/hooks/useApiHost";
import { useTaskContext } from "../../../common/hooks/useTask";
import { useUser } from "../../../common/hooks/useUser";
import { fixedColumns } from "./Managerment";
import { useCustomerQuery } from "../../../common/hooks/customer.hook";
import type { UploadIconButtonHandle } from "./task/UploadIconButton";
import { useQuery } from "@tanstack/react-query";
import { InventoryService, type InventoryItem } from "../../../services/inventory.service";
import { LeadService, type CompanyInfoData } from "../../../services/lead.service";

// ---------------------------------------------------------------------------
// File-local helpers
// ---------------------------------------------------------------------------

function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

function getMaterialRowPrice(row: any, items: any[]): number {
  for (const item of items) {
    const specs = item.spec_rows || [];
    if (specs.length > 0) {
      for (const spec of specs) {
        const specStr = [spec.color, spec.spec].filter(Boolean).join(" - ");
        const formattedName = `${item.name} - ${specStr}`;
        if (
          row.ten === formattedName ||
          (row.ten === item.name && row.quy_cach === specStr)
        ) {
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

// ---------------------------------------------------------------------------
// Hook interface
// ---------------------------------------------------------------------------

export interface UseFormTaskProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  users: UserSearchProps[];
  customers?: UserSearchProps[];
  currentColumn: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFormTask({
  open,
  onCancel,
  onSuccess,
  users,
  customers = [],
  currentColumn,
}: UseFormTaskProps) {
  const {
    userLeadId,
    workspaceId,
    isMobile,
    tmpTaskCreatedAssets,
    tmpTaskCreatedMessages,
    setTmpTaskCreatedAssets,
    setTmpTaskCreatedMessages,
  } = useUser();
  const { taskDetail, setTaskDetail } = useTaskContext();

  const { data: customerRes } = useCustomerQuery({ limit: 1000 });
  const globalCustomers = useMemo(() => {
    const rawList = customerRes?.data?.data || [];
    return rawList.map((c: any) => ({
      fullName: c.fullName || c.name || "",
      user_id: c.owner_id || c.id || c.user_id || "",
      role: c.role || "customer",
      phone: c.phone || "",
      workAddress: c.workAddress || c.address || "",
      email: c.email || "",
    })) as UserSearchProps[];
  }, [customerRes]);

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
  const [customerSelected, setCustomerSelected] =
    useState<UserSearchProps | null>(null);
  const [userSelected, setUserSelected] = useState<UserSearchProps | null>(
    null
  );
  const [userList, setUserList] = useState<ZipUserSearchProps[]>([]);

  // Company info
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false);
  const [isSavingCompanyInfo, setIsSavingCompanyInfo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoData>({
    brand_name: "DECOR B-ONE",
    company: "CÔNG TY TNHH DECOR B-ONE",
    tax_code: "",
    address: "96 Đường số 1, KDC Cityland, Phường 7, Gò Vấp, TP.HCM",
    phone: "0909 123 456",
    email: "contact@b-onedecor.vn",
    logo_url: "",
  });

  useEffect(() => {
    if (userLeadId > 0) {
      LeadService.getCompanyInfo(userLeadId)
        .then((res) => {
          if (res?.data) {
            setCompanyInfo({
              brand_name: res.data.brand_name || "DECOR B-ONE",
              company: res.data.company || "CÔNG TY TNHH DECOR B-ONE",
              tax_code: res.data.tax_code || "",
              address:
                res.data.address ||
                "96 Đường số 1, KDC Cityland, Phường 7, Gò Vấp, TP.HCM",
              phone: res.data.phone || "0909 123 456",
              email: res.data.email || "contact@b-onedecor.vn",
              logo_url: res.data.logo_url || "",
            });
          }
        })
        .catch((err) => console.error("Error fetching company info:", err));
    }
  }, [userLeadId]);

  const handleUploadLogo = async (file: File) => {
    if (userLeadId <= 0) return;
    setIsUploadingLogo(true);
    try {
      const res = await LeadService.uploadLogo(file, userLeadId);
      if (res?.data?.logo_url) {
        setCompanyInfo((prev) => ({ ...prev, logo_url: res.data.logo_url }));
        notification.success({ message: "Tải ảnh logo công ty thành công!" });
      }
    } catch (err: any) {
      notification.error({
        message: "Lỗi tải ảnh logo: " + (err?.message || err),
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    if (userLeadId <= 0) return;
    setIsSavingCompanyInfo(true);
    try {
      await LeadService.updateCompanyInfo({
        lead_id: userLeadId,
        ...companyInfo,
      });
      notification.success({ message: "Đã lưu thông tin công ty in báo giá!" });
      setIsEditingCompanyInfo(false);
    } catch (err: any) {
      notification.error({
        message: "Lỗi lưu thông tin công ty: " + (err?.message || err),
      });
    } finally {
      setIsSavingCompanyInfo(false);
    }
  };

  const clearTemporaryTaskDraft = useCallback(() => {
    setTmpTaskCreatedAssets([]);
    setTmpTaskCreatedMessages([]);
  }, [setTmpTaskCreatedAssets, setTmpTaskCreatedMessages]);

  const [formSessionId, setFormSessionId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setFormSessionId(Math.random().toString(36).substring(2, 9));
    }
  }, [open]);

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
      const exists = prevUserList.some(
        (user) => user.id === userSelected.user_id
      );
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

  // Payment management states & handlers
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>("bank");
  const [newPaymentNote, setNewPaymentNote] = useState<string>("");
  const [newPaymentFile, setNewPaymentFile] = useState<any>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const resetAddPaymentState = () => {
    setIsAddingPayment(false);
    setNewPaymentAmount(null);
    setNewPaymentMethod("bank");
    setNewPaymentNote("");
    setNewPaymentFile(null);
  };

  const apiHost = useApiHost();

  const handleSavePayment = async () => {
    if (!newPaymentAmount || newPaymentAmount <= 0) {
      notification.error({ message: "Vui lòng nhập số tiền hợp lệ!" });
      return;
    }
    setIsSavingPayment(true);
    try {
      const formData = new FormData();
      formData.append("amount", newPaymentAmount.toString());
      formData.append("payment_method", newPaymentMethod);
      formData.append("note", newPaymentNote);
      formData.append(
        "task_amount",
        (form.getFieldValue("amount") || 0).toString()
      );
      formData.append(
        "customer_id",
        form.getFieldValue("customer_id") || ""
      );
      if (newPaymentFile) {
        formData.append("file", newPaymentFile);
      }

      const token = getAccessToken();
      const response = await fetch(
        `${apiHost}/task/${taskDetail?.id}/payments`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.description || "Lưu thanh toán thất bại");
      }

      const resJson = await response.json();
      if (resJson.data) {
        setTaskDetail(resJson.data);
        form.setFieldsValue({ prepayment: resJson.data.prepayment });
      }
      notification.success({ message: "Đã thêm khoản thanh toán thành công!" });
      resetAddPaymentState();
    } catch (error: any) {
      notification.error({
        message: "Lỗi lưu thanh toán",
        description: error.message,
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa khoản thanh toán này?",
      onOk: async () => {
        try {
          const token = getAccessToken();
          const response = await fetch(
            `${apiHost}/task/${taskDetail?.id}/payments/${paymentId}`,
            {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );

          if (!response.ok) {
            const errJson = await response.json();
            throw new Error(errJson.description || "Xóa thanh toán thất bại");
          }

          const resJson = await response.json();
          if (resJson.data) {
            setTaskDetail(resJson.data);
            form.setFieldsValue({ prepayment: resJson.data.prepayment });
          }
          notification.success({
            message: "Đã xóa khoản thanh toán thành công!",
          });
        } catch (error: any) {
          notification.error({
            message: "Lỗi xóa thanh toán",
            description: error.message,
          });
        }
      },
    });
  };

  /** Flush pending draft messages/assets to server for an existing task */
  const flushDraftsForExistingTask = useCallback(
    async (taskId: string, accessToken: string) => {
      const headers: Record<string, string> = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};

      // 1. Upload pending draft assets (files are already on server, just link them to the task)
      for (const draftAsset of tmpTaskCreatedAssets) {
        try {
          const formData = new FormData();
          formData.append("time", new Date().toISOString());
          formData.append("type", draftAsset.type || "task");
          formData.append("user_id", draftAsset.user_id || "");
          formData.append("task_id", taskId);
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
        start_time: values.start_time
          ? values.start_time.format("YYYY-MM-DD")
          : null,
        end_time: values.end_time
          ? values.end_time.format("YYYY-MM-DD")
          : null,
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
        const hasDrafts =
          tmpTaskCreatedAssets.length > 0 ||
          tmpTaskCreatedMessages.length > 0;
        if (hasDrafts && taskDetail.id) {
          await flushDraftsForExistingTask(
            taskDetail.id.toString(),
            accessToken
          );
        }

        notification.success({ message: "Cập nhật công việc thành công!" });
      } else {
        preparedValues["status"] = fixedColumns[currentColumn].type;
        preparedValues["icon"] = preparedValues["icon"] || null;
        preparedValues["assets"] = [
          ...tmpTaskCreatedAssets.filter((item) => item.type !== "icon"),
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
    queryFn: async () =>
      (await InventoryService.listItems({ lead: userLeadId, limit: 1000 }))
        .data?.data as InventoryItem[],
  });

  const materials = Form.useWatch("materials", form) || [];
  const computedMaterialsCost = useMemo(() => {
    if (!resItems || !materials.length) return 0;
    return getTaskMaterialCost(materials, resItems);
  }, [materials, resItems]);

  const handlePrint = () => {
    if (!taskDetail || !customerSelected) return;

    const taskTitle =
      form.getFieldValue("title") || taskDetail.title || "Đơn hàng";
    const rawAmount = form.getFieldValue("amount");
    const prepaymentVal = Number(
      form.getFieldValue("prepayment") ?? taskDetail?.prepayment ?? 0
    );

    const materialsList = form.getFieldValue("materials") || [];
    let materialsTotal = 0;
    (materialsList || []).forEach((row: any) => {
      const price = getMaterialRowPrice(row, resItems || []);
      const qty = parseFloat(row.so_luong) || 0;
      materialsTotal += qty * price;
    });

    const rewardCost = Number(
      form.getFieldValue("reward") ?? taskDetail?.reward ?? 0
    );
    const parsedRawAmount = Number(rawAmount ?? taskDetail?.amount ?? 0);

    // Calculate effective total order value
    let amountVal = parsedRawAmount;
    const computedSum = Math.round(materialsTotal + rewardCost);
    if (!amountVal || amountVal < materialsTotal) {
      amountVal = computedSum > 0 ? computedSum : parsedRawAmount;
    }

    const balanceVal = Math.max(0, amountVal - prepaymentVal);
    const dateStr = dayjs().format("DD/MM/YYYY");

    const materialRowsHtml = (materialsList || [])
      .map((row: any, index: number) => {
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
      })
      .join("");

    const brandName = companyInfo.brand_name || "DECOR B-ONE";
    const compName = companyInfo.company || "CÔNG TY TNHH DECOR B-ONE";
    const compAddr = companyInfo.address || "";
    const compPhone = companyInfo.phone || "";
    const compEmail = companyInfo.email || "";
    const compTax = companyInfo.tax_code
      ? `MST: ${companyInfo.tax_code}<br/>`
      : "";

    const rawLogoUrl = companyInfo.logo_url || "";
    const fullLogoUrl = rawLogoUrl
      ? rawLogoUrl.startsWith("http")
        ? rawLogoUrl
        : `${apiHost}${rawLogoUrl.startsWith("/") ? "" : "/"}${rawLogoUrl}`
      : "";

    const logoHtml = fullLogoUrl
      ? `<img src="${fullLogoUrl}" style="max-height: 60px; max-width: 220px; object-fit: contain;" alt="${brandName}" />`
      : `<div class="header-logo">${brandName}</div>`;

    const printHtml = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Báo giá / Bill - ${taskTitle}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, Tahoma, sans-serif; margin: 0; padding: 0; color: #334155; font-size: 14px; line-height: 1.6; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .header-logo { font-size: 24px; font-weight: 800; color: #0f766e; letter-spacing: 0.5px; }
          .header-company-info { text-align: right; font-size: 11.5px; color: #64748b; line-height: 1.5; }
          .title-section { text-align: center; margin-bottom: 30px; }
          .title-section h1 { margin: 0; font-size: 24px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .info-table td { padding: 8px 4px; vertical-align: top; border-bottom: 1px dashed #f1f5f9; }
          .main-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .main-table th { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 10px; font-weight: 700; text-align: center; font-size: 13px; color: #475569; }
          .summary-table { width: 50%; margin-left: auto; border-collapse: collapse; margin-bottom: 40px; }
          .summary-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
          .summary-table tr:last-child td { border-bottom: 2px solid #0f766e; font-weight: bold; font-size: 16px; color: #0f766e; }
          .signature-section { width: 100%; margin-top: 60px; page-break-inside: avoid; }
          .signature-box { text-align: center; width: 50%; float: left; box-sizing: border-box; }
          .signature-space { height: 100px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="vertical-align: middle;">${logoHtml}</td>
            <td class="header-company-info">
              <strong>${compName}</strong><br/>
              ${compTax}
              Địa chỉ: ${compAddr}<br/>
              Hotline: ${compPhone} | Email: ${compEmail}
            </td>
          </tr>
        </table>

        <div class="title-section">
          <h1>BẢNG BÁO GIÁ &amp; ĐƠN ĐẶT HÀNG</h1>
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
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${new Intl.NumberFormat("vi-VN").format(Math.round(materialsTotal))}₫</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Chi phí thực hiện (nhân công):</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${new Intl.NumberFormat("vi-VN").format(rewardCost)}₫</td>
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

  // Fetch detailed task info when modal opens to get latest invoice/payment data
  useEffect(() => {
    if (open && taskDetail?.id) {
      const fetchDetail = async () => {
        try {
          const token = getAccessToken();
          const response = await fetch(`${apiHost}/task/${taskDetail.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const json = await response.json();
          if (json.data) {
            setTaskDetail(json.data);
          }
        } catch (error) {
          console.error("Failed to fetch task details:", error);
        }
      };
      fetchDetail();
    }
  }, [open, taskDetail?.id, apiHost, setTaskDetail]);

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
      const custId =
        typeof custObj === "object" && custObj
          ? custObj.id
          : custObj ?? null;

      const matchedCustomer = globalCustomers.find(
        (c) => c.user_id === custId
      );
      const custName =
        typeof custObj === "object" && custObj
          ? custObj.name
          : matchedCustomer?.fullName ?? null;

      form.setFieldsValue({
        workspace_id: workspaceId,
        work_days: (taskDetail as any)?.work_days ?? 0,
        icon: taskDetail?.icon ?? null,
        amount: taskDetail?.amount ?? null,
        prepayment: taskDetail?.prepayment ?? null,
        customer_id: custId,
        customer: custName,
      });

      if (custId) {
        setCustomerSelected({
          user_id: custId,
          fullName: custName ?? "",
          phone:
            typeof custObj === "object" && custObj
              ? custObj.phone
              : matchedCustomer?.phone ?? "",
          workAddress:
            typeof custObj === "object" && custObj
              ? custObj.address
              : matchedCustomer?.workAddress ?? "",
          email:
            typeof custObj === "object" && custObj
              ? custObj.email
              : matchedCustomer?.email ?? "",
        } as any);
      } else {
        setCustomerSelected(null);
      }
    }
  }, [clearTemporaryTaskDraft, form, open, taskDetail, workspaceId, globalCustomers]);

  useEffect(() => {
    if (customerSelected) {
      form.setFieldsValue({
        customer_id: customerSelected.user_id,
        customer: customerSelected.fullName || "",
      });
    } else {
      form.setFieldsValue({ customer_id: null, customer: null });
    }
  }, [customerSelected, form]);

  const handleModalCancel = useCallback(() => {
    const hasPendingDrafts =
      tmpTaskCreatedAssets.length > 0 || tmpTaskCreatedMessages.length > 0;

    if (hasPendingDrafts) {
      Modal.confirm({
        title: "Bạn có thay đổi chưa lưu",
        content:
          "Các tài liệu và bình luận vừa thêm sẽ bị mất nếu đóng. Bạn có muốn tiếp tục?",
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
  }, [
    clearTemporaryTaskDraft,
    onCancel,
    tmpTaskCreatedAssets.length,
    tmpTaskCreatedMessages.length,
  ]);

  // Intercept phone native Back button when FormTask modal is open
  useEffect(() => {
    if (!open) return;

    window.history.pushState({ modalOpen: "formTask" }, "");

    const handlePopState = () => {
      handleModalCancel();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open, handleModalCancel]);

  return {
    // form
    form,
    activeTabKey,
    formSessionId,
    uploadIconRef,
    isMobile,
    workspaceId,

    // data
    taskDetail,
    globalCustomers,
    apiHost,

    // computed
    computedWorkDays,
    computedTotalSalary,
    computedMaterialsCost,

    // user management
    userList,
    userSearch,
    setUserSearch,
    userSelected,
    setUserSelected,
    onUserDelete,

    // customer
    customerSearch,
    setCustomerSearch,
    customerSelected,
    setCustomerSelected,

    // payment
    isAddingPayment,
    setIsAddingPayment,
    newPaymentAmount,
    setNewPaymentAmount,
    newPaymentMethod,
    setNewPaymentMethod,
    newPaymentNote,
    setNewPaymentNote,
    newPaymentFile,
    setNewPaymentFile,
    isSavingPayment,
    resetAddPaymentState,
    handleSavePayment,
    handleDeletePayment,
    handlePrint,

    // company info modal
    isEditingCompanyInfo,
    setIsEditingCompanyInfo,
    isSavingCompanyInfo,
    isUploadingLogo,
    companyInfo,
    setCompanyInfo,
    handleSaveCompanyInfo,
    handleUploadLogo,

    // main handlers
    handleUpdate,
    handleModalCancel,
    isUpdating,
  };
}

/** Re-export type for consumers */
export type UseFormTaskReturn = ReturnType<typeof useFormTask>;
