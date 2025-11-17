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
import DeleteConfirm from "../../../DeleteConfirm";
import { InputNumber } from 'antd';
import bankList from "./banklist.json";

import 'dayjs/locale/vi';


dayjs.locale('vi'); // thiết lập locale

interface JobAssetProps {
  title?: string;
  type?: string; // là ứng tiền hay hình ảnh tham khảo công trình
  readOnly?: boolean;
}

const JobAsset: React.FC<JobAssetProps> = ({ title, type, readOnly = false }) => {
  
  const {taskDetail, setTaskDetail} = useTaskContext();
  const {userId, username, isMobile} = useUser();
  const [messageAssets, setMessageAssets] = useState<MessageTypeProps[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MessageTypeProps[]>([]);
  const [thumbLoading, setThumbLoading] = useState(false);

  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  
  const formatDate = (date: Date): string => {
    const pad = (n: number) => (n < 10 ? "0" + n : n);
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      "_" +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  };

  useEffect(()=>{
    if(!taskDetail || !taskDetail.assets)
    {
      setFilteredAssets([]);
      setMessageAssets([]);
      return;
    } 

    const imgList = taskDetail.assets.filter(el => el.type === type && el.file_url && el.file_url != '');

    const msgList = taskDetail.assets.filter(el => el.type === type && el.text && el.text != '');
    
    
    console.log('JobAsset taskdetail:', imgList.length, msgList.length);
    // console.log(msgList);

    setFilteredAssets(imgList);
    setMessageAssets(msgList);
  },[taskDetail]);

  const handleSend = async (file: File) => {
    setThumbLoading(true);
    const now = new Date();
    const dateTimeStr = formatDate(now);

    const formData = new FormData();
    formData.append("time", dateTimeStr);
    formData.append("type", type || '');
    formData.append("file", file);
    formData.append("user_id", userId || '');
    formData.append("type", type || '');
    formData.append("task_id", taskDetail?.id.toString() ?? '');

    // console.log('Upload', type, Object.fromEntries(formData.entries()));

    try {
      const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/upload`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      notification.success({ message: "Đã upload thành công!", description: result });
      // console.log('success is image?',result.filename,isImageFile(result.filename));
      setFilteredAssets(prev => prev ? [...prev, result.message] : [result.message]);
      setTaskDetail(prev => {
        if (prev === null) return null; // handle null case explicitly

        return {
          ...prev,
          assets: [...prev.assets, result.message],
          // ensure all required fields like title, description exist in prev,
          // or provide defaults here if needed to satisfy the type
        };
      });


    } catch (err: any) {
      notification.error({ message: "Lỗi upload ảnh:", description: err.message });
    } finally {
      setThumbLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!taskDetail || !taskDetail?.id) return;

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // setSelectedFile(file);
      handleSend(file);
    }
  };


  function getFilenameFromUrl(url: string) {
    return url.substring(url.lastIndexOf('/') + 1);
  }

  
  const handleDelete = (message_id: string) => {
    fetch(`${useApiHost()}/message/${message_id}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) 
        notification.error({message:'Failed to delete message', description:message_id});
      else
      {
        notification.success({message:'Message deleted successfully', description:message_id});
        setFilteredAssets(prev => prev.filter(asset => asset.message_id !== message_id));
        setTaskDetail(prev => {
            if (prev === null) return null;
            
            return{
            ...prev,
            assets: prev.assets.filter(item => item.message_id !== message_id)
          }
        });
      }
    })
    .catch(error => {
      console.error('Error deleting message:', error);
    });
  };

  const handleMessageSend = async (text: string) => {
    setThumbLoading(true);
    const now = new Date();
    const dateTimeStr = formatDate(now);

    const formData = new FormData();
    formData.append("time", dateTimeStr);
    formData.append("type", type || '');
    formData.append("user_id", userId || '');
    formData.append("username", username || '');
    formData.append("type", type || '');
    formData.append("text", text || '');
    formData.append("task_id", taskDetail?.id.toString() ?? '');

    // console.log('Upload', type, Object.fromEntries(formData.entries()));
    

    try {
      const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/message`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      notification.success({ message: "Đã gửi comment thành công!", description: result });
      // console.log('success is image?',result.filename,isImageFile(result.filename));
      setMessageAssets(prev => prev ? [...prev, result.message] : [result.message]);
      setTaskDetail(prev => {
        if (prev === null) return null; // handle null case explicitly

        return {
          ...prev,
          assets: [...prev.assets, result.message],
          // ensure all required fields like title, description exist in prev,
          // or provide defaults here if needed to satisfy the type
        };
      });

    } catch (err: any) {
      notification.error({ message: "Lỗi gửi comment:", description: err.message });
    } finally {
      setThumbLoading(false);
    }
  };

  
  const handleMessageDelete = (message_id: string) => {
    


    fetch(`${useApiHost()}/message/${message_id}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) 
        notification.error({message:'Failed to delete message', description:message_id});
      else
      {
        setMessageAssets(prev => prev.filter(asset => asset.message_id !== message_id));
        setTaskDetail(prev => {
            if (prev === null) return null;
            
            return{
            ...prev,
            assets: prev.assets.filter(item => item.message_id !== message_id)
          }
        });
        notification.success({message:'Message deleted successfully', description:message_id});
      }
    })
    .catch(error => {
      console.error('Error deleting message:', error);
    });
  };

  const handleChangeFavourite = (message_id: string, checked: boolean) => {
    setMessageAssets(prevMessages =>
      prevMessages.map(m =>
        m.message_id === message_id
          ? { ...m, is_favourite: checked }
          : m
      )
    );

    fetch(`${useApiHost()}/message/${message_id}/favourite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }, // phải có header này
      body: JSON.stringify({ favourite: checked }) // stringify đối tượng JSON
    })
      .then(response => {
        if (!response.ok) {
          notification.error({ message: 'Failed to check message', description: checked });
        } else {
          notification.success({ message: 'Message check successfully', description: checked });
        }
      })
      .catch(error => {
        console.error('Error deleting message:', error);
      });
  };

  
  return (
    <>
    <Stack style={{maxWidth: isMobile? 300: '100%'}}>
      {!readOnly && 
      <Stack direction="row" sx= {{width:'100%'}}>
        <label htmlFor={`upload-image-file-${type}`}>
          <IconButton color="primary" component="span"
            aria-label="upload picture" size="small"
            sx={{ border: "1px dashed #3f51b5", width: 40, height: 40,}} >
            <AddIcon />
          </IconButton>
        </label>

        <ChatInput onSend={handleMessageSend} 
                  title={title ?? ''} 
                  isCash={type?.includes('cash')}
                  isChoose={false}/>
      </Stack>}

      {messageAssets.map((el, index) => 
        <Stack direction="row" key={index} spacing={1} alignItems="center">
          {title === "Thông tin admin đưa ra" &&
            <input
              type="checkbox"
              checked={el.is_favourite}
              onChange={(e) => handleChangeFavourite(el.message_id, e.target.checked)}/>}
          
          <Typography style={{ fontSize: 12, fontWeight: 700 }}>
            {el.username}:
          </Typography>
          <Typography style={{ fontSize: 10, fontWeight: 500 }}>
            { type?.includes("cash") ? `${el.text.split('/')[0]}[${el.text.split('/')[el.text.split('/').length - 1]}]` : el.text }
          </Typography>

          {!readOnly && <DeleteConfirm elId={el.message_id} onDelete={handleMessageDelete} text='tin nhắn'/>}
        </Stack>
      )}



      <Stack direction="row" spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: 'wrap', overflowY: 'auto', height: 150, width: '100%', minHeight: 200 }} // Thêm thuộc tính flexWrap để xuống dòng
        >


        {filteredAssets.map((el, index) => {
            const url = el.file_url ? getFilenameFromUrl(el.file_url) :  null;

            return (
              <Stack key={index} direction="column" alignItems="center" spacing={1} sx={{ width: 'calc(33.33% - 8px)' }}>
                {url && <FileUploadWithPreview handleSend={handleSend} message={el}/>}

                <Stack direction="row" gap={0}>
                  {!readOnly && <DeleteConfirm elId={el.message_id} onDelete={handleDelete} text='tài liệu'/>}
                  <Typography fontSize={12} sx={{ maxWidth: 100, whiteSpace: 'nowrap' }}>
                    {url && url.length > 9 ? `${url.substring(0, 9)}...` : url}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}

        </Stack>

        <input
          key={`file-change-${type}`}
          accept="image/*"
          style={{ display: "none" }}
          id={`upload-image-file-${type}`}
          type="file"
          onChange={handleFileChange}
        />
        
      </Stack>
    </Stack>



        
        
    </>
  );
};

export default JobAsset;

interface ChatInputProps {
  title: string;
  onSend: (message: string) => void;
  isCash?: boolean;
  isChoose? : boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ title, onSend, isCash, isChoose }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const {userId, username, isMobile} = useUser();

  const handleSend = () => {
    if(isCash)
      setFormOpen(true);
    else {
      if (message.trim() === '') return;
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleDialogClose = (value: string | null) => {
    console.log('Send', value);
    onSend(value ?? '');
    setMessage('');
  }

  return (
    <>
      <Box display="flex" alignItems="center" padding={1} borderTop="1px solid #ccc">
        <TextField
          placeholder={title}
          multiline
          maxRows={4}
          fullWidth
          variant="standard"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ marginRight: 1, minWidth: isMobile ? 200: 300 }}
        />
        <IconButton key="send" color="primary" onClick={handleSend} aria-label="send message">
          <SendIcon />
        </IconButton>
      </Box>
      <TransferFormModal 
        open={formOpen} 
        setOpen={setFormOpen} 
        onClose={handleDialogClose}
        rewardContent={isChoose? ["Thưởng", "Phạt"]:[]}/>
    </>
  );
};



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

interface TransferFormModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: (value: string | null) => void; 
  rewardContent?: string[];
}

function TransferFormModal({ open, setOpen, onClose, rewardContent }: TransferFormModalProps) {
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


  // useEffect(()=> {
  //   console.log('Values', values);
  // },[values]);

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
