import React, { useState, useEffect } from "react";
import { Typography, Stack, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ProjectOutlined } from "@ant-design/icons"; // Nếu bạn muốn giữ
import type { Task } from "../../../../@types/work-space.type";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { notification } from "antd";
import DescriptionIcon from "@mui/icons-material/Description"; // icon tài liệu
import { CircularProgress } from '@mui/material';
import { useUser } from "../../../../common/hooks/useUser";

const isImageFile = (filename: string) => {
  // console.log('f',filename);
  if (!filename) return false;
  const ext = filename.split('#')[0].split('.').pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "bmp" || ext === "webp";
};

interface JobAssetProps {
  title?: string;
  role?: string; // là ứng tiền hay hình ảnh tham khảo công trình
  taskDetail?: Task;
}

const JobAsset: React.FC<JobAssetProps> = ({ title, role, taskDetail }) => {
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assets, setAssets] = useState<string[]>(taskDetail?.assets ?? []);
  const [filteredAssets, setFilteredAssets] = useState<string[]>([]);
  const [thumbLoading, setThumbLoading] = useState(false);
  const {isMobile} = useUser();

  // console.log('JobAsset role:', role, 'title:', title);

  useEffect(()=>{
    if(!assets) return;
    setFilteredAssets(assets.filter(el => el && el.includes('#' + role)));
  },[assets, role]);

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
    if(!taskDetail) return;
    setAssets(taskDetail?.assets);
    console.log('JobAsset taskdetail:', role, 'title:', title);
    // setSelectedFile(null);
  },[taskDetail]);

  
  // useEffect(() => {
    
  // }, [taskDetail]);

  const handleSend = async (file: File) => {
    setThumbLoading(true);
    const now = new Date();
    const dateTimeStr = formatDate(now);

    const formData = new FormData();
    formData.append("time", dateTimeStr);
    formData.append("role", role || '');
    formData.append("file", file);
    formData.append("user_id", taskDetail?.id.toString() ?? '');

    console.log('Upload', role, Object.fromEntries(formData.entries()));

    try {
      const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/upload`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      notification.success({ message: "Đã upload thành công!", description: result });
      console.log('success is image?',result.filename,isImageFile(result.filename));
      setFilteredAssets(prev => prev ? [...prev, result.filename] : [result.filename]);
      // setFilteredAssets(assets.filter(el => el && el.includes('#' + role)));
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


  

  return (
    <Stack style={{maxWidth: isMobile? 300: '100%'}}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <label htmlFor={`upload-image-file-${role}`}>
          <IconButton color="primary" component="span"
            aria-label="upload picture" size="small"
            sx={{ border: "1px dashed #3f51b5", width: 40, height: 40,}} >
            <AddIcon />
          </IconButton>
        </label>
        <Typography className="!text-gray-800 !text-sm sm:!text-base" fontWeight="bold">
          {title}
        </Typography>
      </div>

      <Stack direction="row" spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: 'wrap', overflowY: 'auto', height: 150 }} // Thêm thuộc tính flexWrap để xuống dòng
        >

        {filteredAssets.map((el, index) => (
          <Stack key={index} direction="column" alignItems="center" spacing={1}>
            {isImageFile(el) ? 
              thumbLoading && index === filteredAssets.length - 1 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
            <CircularProgress size={24} /> {/* import từ @mui/material */}
          </div>
        ) : (
              <a href={`${useApiStatic()}/${el.split('#')[0]}`} target="_blank" rel="noreferrer">
                <img
                  src={`${useApiStatic()}/${el.split('#')[0]}`}
                  alt={`asset-${index}`}
                  style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4 }}
                />
              </a>
            ) : (
              <DescriptionIcon fontSize="large" />
            )}
            <Typography fontSize={12} sx={{ maxWidth: 100, wordBreak: 'break-word' }}>
              {el.length > 9 ? `${el.substring(0, 9)}...` : el}
            </Typography>
          </Stack>
        ))
      }

        </Stack>

        <input
          key={`file-change-${role}`}
          accept="image/*"
          style={{ display: "none" }}
          id={`upload-image-file-${role}`}
          type="file"
          onChange={handleFileChange}
        />
        
      </Stack>
    </Stack>
  );
};

export default JobAsset;
