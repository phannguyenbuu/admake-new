import React, { useState, useEffect } from "react";
import { Typography, Stack, IconButton, Box, TextField, Switch } from "@mui/material";
import { Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { notification } from "antd";
import DescriptionIcon from "@mui/icons-material/Description"; // icon tài liệu
import { CircularProgress } from '@mui/material';
import { useUser } from "../../../../common/hooks/useUser";
import { useTaskContext } from "../../../../common/hooks/useTask";
import CloseIcon from '@mui/icons-material/Close';
import type { MessageTypeProps } from "../../../../@types/chat.type";
import SendIcon from '@mui/icons-material/Send';
import FileUploadWithPreview from "../../../FileUploadWithPreview";
import { Modal } from "antd";
import {Button,Checkbox,FormControlLabel,} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs, { Dayjs } from "dayjs";
import 'dayjs/locale/vi';

import DeleteConfirm from "../../../DeleteConfirm";
import { InputNumber } from 'antd';
import bankList from "./banklist.json";

const styleModal = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

interface FormValues {
  content: string;
  amount: string;
  isChecked: boolean;
  
  bankAccount: string;
  bankName: string;
  transferContent: string;
  transferDate: Dayjs | null;
}

interface BankTransferModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: (value: string | null) => void; 
  rewardContent?: string[];
}

function BankTransferModal({ open, setOpen, onClose, rewardContent }: BankTransferModalProps) {
  const [errors, setErrors] = useState<{[key: string]: boolean}>({});

  const [values, setValues] = useState<FormValues>({
    content: "",
    amount: "",
    isChecked: true,
    bankAccount: "",
    bankName: "",
    transferContent: "",
    transferDate: dayjs(),
  });

  const handleClose = () => {
    // Truyền null hoặc giá trị nếu muốn khi đóng mà không lưu
    onClose(null);
    setOpen(false);
  };

  const handleChange =
    (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "isChecked" ? event.target.checked : event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };

  const handleDateChange = (newValue: Dayjs | null) => {
    setValues((prev) => ({ ...prev, transferDate: newValue }));
  };

  const handleSubmit = () => {
    const newErrors: {[key: string]: boolean} = {};

    if (values.isChecked) {
      if (!values.bankAccount.trim()) newErrors.bankAccount = true;
      if (!values.bankName.trim()) newErrors.bankName = true;
      if (!values.transferContent.trim()) newErrors.transferContent = true;
      if (!values.transferDate === null) newErrors.transferDate = true;
    }
    if (!values.content.trim()) newErrors.content = true;
    if (!values.amount.trim()) newErrors.amount = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Dừng submit nếu có lỗi
    }

    setErrors({}); // Xóa lỗi khi submit thành công

    if (!values.isChecked) {
      values.bankAccount = "";
      values.bankName = "";
      values.transferContent = "";
      values.transferDate = null;
    }

    // const rawAmount = parseInt(values.amount.replace(/\./g, ''), 10);

    console.log("Form submitted with values:", {
      ...values,
      transferDate: values.transferDate?.format("YYYY-MM-DD"),
    });

    
    let cleanStr = values.amount.replace(/[^\d.-]/g, '');
    let amountNum = Number(cleanStr);

    const formattedDate = values.transferDate ? values?.transferDate.format('DD-MM-YYYY'):'';

    const parts = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).formatToParts(amountNum);

    const formatted = parts
      .filter(part => part.type !== 'currency')  // loại bỏ phần currency symbol
      .map(part => part.value)
      .join('');
    

    onClose(`${ rewardContent?.length && rewardContent?.length > 0 
      && values.isChecked ? "+":"-"}${formatted}/${values.content}/${values.bankAccount}/${values.bankName}/${values.transferContent}/${formattedDate}`);

    setValues({
      content: "",
      amount: "",
      isChecked: true,
      bankAccount: "",
      bankName: "",
      transferContent: "",
      transferDate: dayjs(),
    });
    setOpen(false);
  };


  const handleCancel = () => {
    setOpen(false);
  }




  return (
    <>
      <Modal open={open} 
        onOk={handleClose} 
        onCancel={handleCancel}
        // closable={false}
        footer={null}>
        
          <Typography id="modal-title" variant="h6" mb={2}>
            Nhập thông tin chuyển khoản
          </Typography>
          <Stack spacing={2}>
            <TextField variant = "standard"
  label="Nội dung"
  value={values.content}
  onChange={handleChange("content")}
  fullWidth
  error={Boolean(errors.content)}
  helperText={errors.content ? "Vui lòng nhập nội dung" : ""}
/>


            

    <InputNumber
  min={'0'}
  style={{ width: '100%' }}
  value={values.amount}
  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
  parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
  onChange={(value) => {
    // value là số hoặc string đã được parser
    handleChange("amount")({
      target: { value: value?.toString() || '' }
    } as React.ChangeEvent<HTMLInputElement>);
  }}
  
  placeholder="Nhập số tiền"
/>

{rewardContent && rewardContent.length > 0 &&
            <FormControlLabel
              control={
                <Switch
                  checked={values.isChecked}
                  onChange={handleChange("isChecked")}
                />
              }
              label={values.isChecked ? rewardContent[0] : rewardContent[1]}
            />}

{values.isChecked && <>
  <TextField variant = "standard"
    label="Tài khoản ngân hàng"
    value={values.bankAccount}
    onChange={handleChange("bankAccount")}
    fullWidth
    error={Boolean(errors.bankAccount)}
    helperText={errors.bankAccount ? "Vui lòng nhập tài khoản ngân hàng" : ""}
  />
  <FormControl fullWidth error={Boolean(errors.bankName)}>
    <InputLabel id="bank-select-label">Tên ngân hàng</InputLabel>
    <Select  variant = "standard"
      labelId="bank-select-label"
      id="bank-select"
      value={values.bankName}
      label="Tên ngân hàng"
      onChange={(e) => handleChange("bankName")({
        target: { value: e.target.value }
      } as React.ChangeEvent<HTMLInputElement>)}
    >
      {bankList.map((bank) => (
        <MenuItem key={bank.code} value={bank.code}>
          {bank.name}
        </MenuItem>
      ))}
    </Select>
    {errors.bankName && <Typography color="error" variant="caption">Vui lòng chọn ngân hàng</Typography>}
  </FormControl>
  
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      enableAccessibleFieldDOMStructure={false}
      label="Ngày chuyển khoản"
      value={values.transferDate}
      onChange={handleDateChange}
      slots={{ textField: TextField }}
      slotProps={{
        textField: {
          variant: "standard",
          fullWidth: true,
          placeholder: 'dd/MM/yyyy',
          //@ts-ignore
          format: 'DD/MM/YYYY',   // format đặt đây
        }
      }}
    />
    
  </LocalizationProvider>

  <TextField 
    label="Nội dung chuyển khoản"
    value={values.transferContent}
    onChange={handleChange("transferContent")}
    fullWidth
    multiline
    rows={3}
    error={Boolean(errors.transferContent)}
    helperText={errors.transferContent ? "Vui lòng nhập nội dung chuyển khoản" : ""}
  />
</>}


            <Box textAlign="right">
              <Button variant="contained" onClick={handleSubmit}>
                OK
              </Button>
              {/* <Button onClick={handleClose} sx={{ mr: 1 }}>
                Hủy
              </Button> */}
            </Box> 
          </Stack>

      </Modal>
    </>
  );
}

export default BankTransferModal;