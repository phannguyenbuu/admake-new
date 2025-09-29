import React, { useState } from 'react';

function FileUpload() {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${process.env.REACT_APP_API_URL}/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        setMessage('Upload thành công!');
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
      {progress > 0 && <progress value={progress} max="100">{progress}%</progress>}
      {message && <p>{message}</p>}
    </div>
  );
}

export default FileUpload;
