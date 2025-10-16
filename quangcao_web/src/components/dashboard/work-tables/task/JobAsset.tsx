import React, { useState, useEffect } from "react";
import { Typography, Stack, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ProjectOutlined } from "@ant-design/icons"; // Nếu bạn muốn giữ
import type { Task } from "../../../../@types/work-space.type";
import { useApiHost, useApiStatic } from "../../../../common/hooks/useApiHost";
import { notification } from "antd";
import DescriptionIcon from "@mui/icons-material/Description"; // icon tài liệu

const isImageFile = (filename: string) => {
  // console.log('f',filename);
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "bmp" || ext === "webp";
};

interface JobAssetProps {
  taskDetail: Task | null;
}

const JobAsset: React.FC<JobAssetProps> = ({ taskDetail }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assets, setAssets] = useState<string[]>(taskDetail?.assets ?? []);

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
  },[taskDetail]);

  const handleSend = async (file: File) => {
    

    const now = new Date();
    const dateTimeStr = formatDate(now);

    const formData = new FormData();
    formData.append("time", dateTimeStr);
    formData.append("role", "task");
    formData.append("file", file);
    formData.append("user_id", taskDetail?.id.toString() ?? '');

    try {
      const response = await fetch(`${useApiHost()}/task/${taskDetail?.id}/upload`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      notification.success({ message: "Đã upload thành công!", description: result.filename });

      setAssets(prev => prev ? [...prev, result.filename] : [result.filename]);
    } catch (err: any) {
      notification.error({ message: "Lỗi upload ảnh:", description: err.message });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!taskDetail || !taskDetail?.id) return;

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleSend(file);
    }
  };

  useEffect(() => {
    setSelectedFile(null);
  }, [taskDetail]);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 flex items-center justify-center">
          <ProjectOutlined className="!text-cyan-600 !text-xs sm:!text-sm" />
        </div>
        <Typography className="!text-gray-800 !text-sm sm:!text-base" fontWeight="bold">
          Tài liệu
        </Typography>
      </div>
      <Stack direction="row" spacing={1}>
        <Stack direction="row" spacing={1}>
        {
          assets && assets.map((el, index) => (
            <Stack key={index} direction="column" alignItems="center" spacing={1}>
              {isImageFile(el) ? (
                <a href={`${useApiStatic()}/${el}`} target="_blank" rel="noreferrer">
              
                <img
                  src={`${useApiStatic()}/${el}`}
                  alt={`asset-${index}`}
                  style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4 }}
                />
                </a>
              ) : (
                <DescriptionIcon fontSize="large" />
              )}
              <Typography fontSize={12} sx={{ maxWidth: 100, wordBreak: 'break-word' }}>
                {el}
              </Typography>
            </Stack>
          ))
        }
        </Stack>

        <input
          accept="image/*"
          style={{ display: "none" }}
          id="upload-image-file"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="upload-image-file">
          <IconButton
            color="primary"
            component="span"
            aria-label="upload picture"
            size="small"
            sx={{
              border: "1px dashed #3f51b5",
              width: 40,
              height: 40,
            }}
          >
            <AddIcon />
          </IconButton>
        </label>
{/* 
        {selectedFile && (
          <Typography variant="body2" sx={{ ml: 1 }}>
            {selectedFile.name}
          </Typography>
        )} */}

        
      </Stack>
    </div>
  );
};

export default JobAsset;
