import React from "react";
import { Form, Modal, Input, Button, Upload } from "antd";
import { SettingOutlined, UploadOutlined } from "@ant-design/icons";
import type { UserSearchProps } from "../../../@types/work-space.type";
import type { Task } from "../../../@types/work-space.type";
import TaskHeader from "./task/FormTaskHeader";
import FormTaskBody from "./FormTaskBody";
import { useFormTask } from "./useFormTask";

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
  const ctx = useFormTask({ open, onCancel, onSuccess, users, customers, currentColumn });

  return (
    <Modal
      open={open}
      onCancel={ctx.handleModalCancel}
      closable={false}
      footer={null}
      width={1300}
      centered
      style={{ top: 12 }}
      styles={{ body: { padding: 0 } }}
    >
      <TaskHeader
        onUpdate={ctx.handleUpdate}
        onSuccess={onSuccess}
        onCancel={ctx.handleModalCancel}
      />

      <Form
        form={ctx.form}
        style={{
          overflowX: "hidden",
          maxHeight: "calc(100vh - 120px)",
          minHeight: ctx.isMobile ? "auto" : "min(80vh, calc(100vh - 160px))",
          overflowY: "auto",
          paddingBottom: "32px",
        }}
      >
        <FormTaskBody
          form={ctx.form}
          formSessionId={ctx.formSessionId}
          uploadIconRef={ctx.uploadIconRef}
          isMobile={ctx.isMobile}
          taskDetail={ctx.taskDetail}
          apiHost={ctx.apiHost}
          computedWorkDays={ctx.computedWorkDays}
          computedTotalSalary={ctx.computedTotalSalary}
          computedMaterialsCost={ctx.computedMaterialsCost}
          userList={ctx.userList}
          userSearch={ctx.userSearch}
          setUserSearch={ctx.setUserSearch}
          userSelected={ctx.userSelected}
          setUserSelected={ctx.setUserSelected}
          onUserDelete={ctx.onUserDelete}
          customerSearch={ctx.customerSearch}
          setCustomerSearch={ctx.setCustomerSearch}
          customerSelected={ctx.customerSelected}
          setCustomerSelected={ctx.setCustomerSelected}
          globalCustomers={ctx.globalCustomers}
          isAddingPayment={ctx.isAddingPayment}
          setIsAddingPayment={ctx.setIsAddingPayment}
          newPaymentAmount={ctx.newPaymentAmount}
          setNewPaymentAmount={ctx.setNewPaymentAmount}
          newPaymentMethod={ctx.newPaymentMethod}
          setNewPaymentMethod={ctx.setNewPaymentMethod}
          newPaymentNote={ctx.newPaymentNote}
          setNewPaymentNote={ctx.setNewPaymentNote}
          newPaymentFile={ctx.newPaymentFile}
          setNewPaymentFile={ctx.setNewPaymentFile}
          isSavingPayment={ctx.isSavingPayment}
          resetAddPaymentState={ctx.resetAddPaymentState}
          handleSavePayment={ctx.handleSavePayment}
          handleDeletePayment={ctx.handleDeletePayment}
          handlePrint={ctx.handlePrint}
          setIsEditingCompanyInfo={ctx.setIsEditingCompanyInfo}
          workspaceId={ctx.workspaceId}
          users={users}
        />
      </Form>

      {/* Company info config modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <SettingOutlined className="text-teal-600" />
            <span className="font-bold text-slate-800">Cấu hình thông tin công ty in báo giá &amp; bill</span>
          </div>
        }
        open={ctx.isEditingCompanyInfo}
        onCancel={() => ctx.setIsEditingCompanyInfo(false)}
        onOk={ctx.handleSaveCompanyInfo}
        confirmLoading={ctx.isSavingCompanyInfo}
        okText="Lưu bền hệ thống"
        cancelText="Hủy"
        centered
        width={520}
      >
        <div className="space-y-3.5 py-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Ảnh Logo công ty (In báo giá &amp; Bill):</label>
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              {ctx.companyInfo.logo_url ? (
                <div className="relative group flex items-center justify-center w-24 h-14 bg-white rounded border border-slate-200 p-1 overflow-hidden">
                  <img
                    src={
                      ctx.companyInfo.logo_url.startsWith("http")
                        ? ctx.companyInfo.logo_url
                        : `${ctx.apiHost}${ctx.companyInfo.logo_url.startsWith("/") ? "" : "/"}${ctx.companyInfo.logo_url}`
                    }
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => ctx.setCompanyInfo((prev) => ({ ...prev, logo_url: "" }))}
                    className="absolute inset-0 bg-slate-900/60 text-white text-xs font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                  >
                    Xóa logo
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-24 h-14 bg-slate-100 rounded border border-dashed border-slate-300 text-slate-400 text-xs font-medium">
                  Chưa có logo
                </div>
              )}
              <Upload
                beforeUpload={(file) => {
                  ctx.handleUploadLogo(file);
                  return false;
                }}
                showUploadList={false}
                accept="image/*"
              >
                <Button loading={ctx.isUploadingLogo} icon={<UploadOutlined />} size="small" className="!rounded-md">
                  {ctx.companyInfo.logo_url ? "Thay đổi ảnh logo..." : "Tải ảnh logo..."}
                </Button>
              </Upload>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Tên thương hiệu (Logo text):</label>
            <Input
              value={ctx.companyInfo.brand_name}
              onChange={(e) => ctx.setCompanyInfo({ ...ctx.companyInfo, brand_name: e.target.value })}
              placeholder="Ví dụ: DECOR B-ONE"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Tên công ty / Đơn vị:</label>
            <Input
              value={ctx.companyInfo.company}
              onChange={(e) => ctx.setCompanyInfo({ ...ctx.companyInfo, company: e.target.value })}
              placeholder="Ví dụ: CÔNG TY TNHH DECOR B-ONE"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Mã số thuế (MST):</label>
            <Input
              value={ctx.companyInfo.tax_code}
              onChange={(e) => ctx.setCompanyInfo({ ...ctx.companyInfo, tax_code: e.target.value })}
              placeholder="Ví dụ: 0312345678"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Địa chỉ trụ sở:</label>
            <Input.TextArea
              rows={2}
              value={ctx.companyInfo.address}
              onChange={(e) => ctx.setCompanyInfo({ ...ctx.companyInfo, address: e.target.value })}
              placeholder="Nhập địa chỉ trụ sở công ty..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Hotline / Điện thoại:</label>
              <Input
                value={ctx.companyInfo.phone}
                onChange={(e) => ctx.setCompanyInfo({ ...ctx.companyInfo, phone: e.target.value })}
                placeholder="0909 123 456"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email liên hệ:</label>
              <Input
                value={ctx.companyInfo.email}
                onChange={(e) => ctx.setCompanyInfo({ ...ctx.companyInfo, email: e.target.value })}
                placeholder="contact@company.vn"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
