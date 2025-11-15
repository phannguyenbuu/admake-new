import React, { useState } from 'react';
import { useApiHost } from '../../../../common/hooks/useApiHost';

interface FileUploadProps {
  apiUrl: string; // url upload file
  onUploadSuccess?: (response: any) => void; // callback khi upload thành công
  maxFileSizeMB?: number; // giới hạn kích thước file
}

const FileUpload: React.FC<FileUploadProps> = ({
  apiUrl,
  onUploadSuccess,
  maxFileSizeMB = 100
}) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      setMessage(`Kích thước file vượt quá ${maxFileSizeMB}MB, vui lòng chọn file nhỏ hơn.`);
      return;
    }

    setMessage('');
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        setMessage('Upload thành công!');
        onUploadSuccess && onUploadSuccess(JSON.parse(xhr.responseText));
      } else {
        setMessage('Upload thất bại!');
      }
      setProgress(0);
    };

    xhr.onerror = () => {
      setMessage('Lỗi khi upload file');
      setProgress(0);
    };

    xhr.send(formData);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {progress > 0 && <progress value={progress} max={100}>{progress}%</progress>}
      {message && <p>{message}</p>}
    </div>
  );
};

export default FileUpload;
