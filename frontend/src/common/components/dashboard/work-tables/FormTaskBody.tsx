import React from "react";
import {
  Form,
  InputNumber,
  Tag,
  Select,
  Button,
  Upload,
  Typography,
} from "antd";
import {
  FileTextOutlined,
  InboxOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Stack } from "@mui/material";
import type { FormInstance } from "antd";
import type { UserSearchProps, ZipUserSearchProps } from "../../../@types/work-space.type";
import type { UseFormTaskReturn } from "./useFormTask";
import JobAgentInfo from "./task/JobAgentInfo";
import JobAsset from "./task/JobAsset";
import JobDescription from "./task/JobDescription";
import JobInfoCard from "./task/JobInfoCard";
import JobTimeAndProcess from "./task/JobTimeAndProcess ";
import MaterialsTab from "./task/MaterialsTab";
import dayjs from "dayjs";

const { Text } = Typography;

// ---------------------------------------------------------------------------
// UserItem – small subcomponent (only used here)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FormTaskBody props
// ---------------------------------------------------------------------------

export interface FormTaskBodyProps
  extends Pick<
    UseFormTaskReturn,
    | "form"
    | "formSessionId"
    | "uploadIconRef"
    | "isMobile"
    | "taskDetail"
    | "apiHost"
    | "computedWorkDays"
    | "computedTotalSalary"
    | "computedMaterialsCost"
    | "userList"
    | "userSearch"
    | "setUserSearch"
    | "userSelected"
    | "setUserSelected"
    | "onUserDelete"
    | "customerSearch"
    | "setCustomerSearch"
    | "customerSelected"
    | "setCustomerSelected"
    | "globalCustomers"
    | "isAddingPayment"
    | "setIsAddingPayment"
    | "newPaymentAmount"
    | "setNewPaymentAmount"
    | "newPaymentMethod"
    | "setNewPaymentMethod"
    | "newPaymentNote"
    | "setNewPaymentNote"
    | "newPaymentFile"
    | "setNewPaymentFile"
    | "isSavingPayment"
    | "resetAddPaymentState"
    | "handleSavePayment"
    | "handleDeletePayment"
    | "handlePrint"
    | "setIsEditingCompanyInfo"
    | "workspaceId"
  > {
  users: UserSearchProps[];
}

// ---------------------------------------------------------------------------
// FormTaskBody
// ---------------------------------------------------------------------------

export default function FormTaskBody({
  form,
  formSessionId,
  uploadIconRef,
  isMobile,
  taskDetail,
  apiHost,
  computedWorkDays,
  computedTotalSalary,
  computedMaterialsCost,
  userList,
  userSearch,
  setUserSearch,
  userSelected,
  setUserSelected,
  onUserDelete,
  customerSearch,
  setCustomerSearch,
  customerSelected,
  setCustomerSelected,
  globalCustomers,
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
  setIsEditingCompanyInfo,
  workspaceId,
  users,
}: FormTaskBodyProps) {
  return (
    <>
      {/* Hidden form fields */}
      <Form.Item name="workspace_id" initialValue={workspaceId} hidden />
      <Form.Item name="assign_ids" initialValue={userList?.map((u) => u.id)} hidden />
      <Form.Item name="icon" hidden />
      <Form.Item name="materials" hidden />
      <Form.Item name="customer_id" hidden />
      <Form.Item name="customer" hidden />

      <div className="mb-4 w-full">
        <div className="min-h-[520px] border-t border-slate-200 bg-[#f3f2f1] px-4 py-4 pb-8 sm:px-6 sm:py-6 sm:pb-12">
          <div className="mx-auto flex w-full flex-col gap-4 lg:flex-row">

            {/* ── LEFT COLUMN ── */}
            <Stack spacing={4} className="h-full min-w-0 flex-1 w-full">
              <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Stack key={`${taskDetail?.id || "new"}-${formSessionId}`} spacing={3} className="w-full flex-grow">
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

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <InboxOutlined /> Danh sách vật liệu
                </div>
                <MaterialsTab form={form} />
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <FileTextOutlined /> Tài liệu đính kèm
                </div>
                <JobAsset title="" type="task" />
              </div>
            </Stack>

            {/* ── RIGHT COLUMN ── */}
            <Stack spacing={4} className="h-fit min-w-0 w-full shrink-0 lg:w-[420px]">

              {/* Staff panel */}
              <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
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
                </div>

                {/* Stats row */}
                <div className="mb-4 grid grid-cols-3 gap-2 w-full">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1.5 text-center">
                    <span className="text-[15px] font-bold leading-tight text-indigo-700">
                      {computedWorkDays}
                    </span>
                    <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-indigo-500">
                      Số công
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-center">
                    <span
                      className="text-[13px] font-bold leading-tight text-emerald-700 truncate max-w-full"
                      title={computedTotalSalary > 0 ? `${new Intl.NumberFormat("vi-VN").format(Math.round(computedTotalSalary))}₫` : "—"}
                    >
                      {computedTotalSalary > 0
                        ? `${new Intl.NumberFormat("vi-VN").format(Math.round(computedTotalSalary))}₫`
                        : "—"}
                    </span>
                    <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-emerald-500">
                      Số lương
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5 text-center">
                    <span
                      className="text-[13px] font-bold leading-tight text-amber-700 truncate max-w-full"
                      title={computedMaterialsCost > 0 ? `${new Intl.NumberFormat("vi-VN").format(Math.round(computedMaterialsCost))}₫` : "—"}
                    >
                      {computedMaterialsCost > 0
                        ? `${new Intl.NumberFormat("vi-VN").format(Math.round(computedMaterialsCost))}₫`
                        : "—"}
                    </span>
                    <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-amber-500">
                      Tiền vật tư
                    </span>
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

              {/* Customer & Payment card */}
              <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-r from-teal-100 to-teal-200 sm:h-6 sm:w-6">
                      <span className="flex items-center justify-center text-xs leading-none text-teal-600 sm:text-sm">
                        💰
                      </span>
                    </div>
                    <Text strong className="!text-sm !text-slate-800 sm:!text-base whitespace-nowrap">
                      Khách hàng &amp; Thanh toán
                    </Text>
                    {taskDetail?.id && (
                      <Tag
                        color={taskDetail.invoice?.status === "paid" ? "success" : "warning"}
                        className="!m-0 !font-semibold"
                      >
                        {taskDetail.invoice?.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
                      </Tag>
                    )}
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
                      users={globalCustomers}
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
                        disabled={true}
                      />
                    </Form.Item>
                  </div>

                  {customerSelected && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-none bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
                      >
                        🖨️ In Báo Giá / Bill
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingCompanyInfo(true)}
                        title="Cấu hình thông tin công ty in báo giá"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all duration-200 cursor-pointer text-sm shadow-sm"
                      >
                        ⚙️
                        <span>Cấu hình CTY</span>
                      </button>
                    </div>
                  )}

                  {/* Payment history */}
                  {taskDetail?.id && customerSelected && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Lịch sử thanh toán
                        </span>
                        <Button
                          type="primary"
                          size="small"
                          className="!rounded-md !bg-teal-600 hover:!bg-teal-700"
                          onClick={() => setIsAddingPayment(true)}
                        >
                          + Thêm thanh toán
                        </Button>
                      </div>

                      {/* Inline add payment form */}
                      {isAddingPayment && (
                        <div className="mb-4 rounded-lg border border-teal-100 bg-teal-50/20 p-3">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <span className="block mb-1 text-[11px] font-semibold text-slate-500">Số tiền *</span>
                              <InputNumber
                                className="w-full !rounded-md"
                                placeholder="Nhập số tiền"
                                value={newPaymentAmount}
                                onChange={(val) => setNewPaymentAmount(val)}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, "") as any}
                              />
                            </div>
                            <div>
                              <span className="block mb-1 text-[11px] font-semibold text-slate-500">Hình thức</span>
                              <Select
                                className="w-full"
                                value={newPaymentMethod}
                                onChange={(val) => setNewPaymentMethod(val)}
                                options={[
                                  { value: "bank", label: "Chuyển khoản" },
                                  { value: "cash", label: "Tiền mặt" },
                                ]}
                              />
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="block mb-1 text-[11px] font-semibold text-slate-500">Ghi chú</span>
                            <input
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-teal-500"
                              placeholder="Nhập ghi chú"
                              value={newPaymentNote}
                              onChange={(e) => setNewPaymentNote(e.target.value)}
                            />
                          </div>
                          <div className="mb-3">
                            <span className="block mb-1 text-[11px] font-semibold text-slate-500">Ảnh chứng từ</span>
                            <Upload
                              beforeUpload={(file) => {
                                setNewPaymentFile(file);
                                return false;
                              }}
                              onRemove={() => setNewPaymentFile(null)}
                              fileList={newPaymentFile ? [newPaymentFile as any] : []}
                              maxCount={1}
                              listType="picture"
                            >
                              <Button size="small" icon={<span>📁</span>}>Chọn ảnh</Button>
                            </Upload>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button size="small" onClick={() => resetAddPaymentState()}>Hủy</Button>
                            <Button
                              type="primary"
                              size="small"
                              loading={isSavingPayment}
                              onClick={handleSavePayment}
                              className="!bg-teal-600 hover:!bg-teal-700"
                            >
                              Lưu
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Payment list */}
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {taskDetail.invoice?.payments && taskDetail.invoice.payments.length > 0 ? (
                          taskDetail.invoice.payments.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2">
                              <div className="flex items-center gap-2">
                                {p.file_url ? (
                                  <a
                                    href={`${apiHost.replace("/api", "")}/static/uploads/${p.file_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white"
                                  >
                                    <img
                                      src={`${apiHost.replace("/api", "")}/static/uploads/${p.file_url}`}
                                      alt="receipt"
                                      className="h-full w-full object-cover"
                                    />
                                  </a>
                                ) : (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-slate-200 bg-white text-xs text-slate-400">
                                    Không ảnh
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="block text-xs font-bold text-slate-700">
                                    {p.amount?.toLocaleString()} VNĐ
                                  </span>
                                  <span className="block text-[10px] text-slate-400">
                                    {p.payment_method === "bank" ? "Chuyển khoản" : "Tiền mặt"} •{" "}
                                    {dayjs(p.payment_date).format("DD/MM/YYYY")}
                                  </span>
                                  {p.note && (
                                    <span
                                      className="block text-[10px] text-slate-500 truncate max-w-[180px]"
                                      title={p.note}
                                    >
                                      {p.note}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="text"
                                danger
                                size="small"
                                onClick={() => handleDeletePayment(p.id)}
                                icon={<span>🗑️</span>}
                                className="hover:!bg-red-50"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-400 italic">
                            Chưa có khoản thanh toán nào.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex-grow mt-4">
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <MessageOutlined /> Bình luận
                </div>
                <JobAsset title="" type="comment" />
              </div>
            </Stack>
          </div>
        </div>
      </div>
    </>
  );
}
