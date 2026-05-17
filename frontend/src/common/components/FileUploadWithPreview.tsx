import React, { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import DescriptionIcon from "@mui/icons-material/Description";
import Modal from "antd/es/modal/Modal";
import type { MessageTypeProps } from "../@types/chat.type";
import { useApiStatic } from "../common/hooks/useApiHost";

interface FileUploadWithPreviewProps {
  message: MessageTypeProps;
  handleSend: (file: File) => void;
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const FileUploadWithPreview: React.FC<FileUploadWithPreviewProps> = ({ message }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const staticBase = useApiStatic();

  const buildStaticUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }
    if (path.startsWith("/")) {
      return path;
    }
    return `${staticBase}/${path}`;
  };

  const getOriginalImagePath = (path?: string | null) => {
    if (!path) return "";
    return path.startsWith("thumbs/thumb_")
      ? path.replace("thumbs/thumb_", "")
      : path;
  };

  useEffect(() => {
    if (message.thumb_url) {
      setThumbnail(message.thumb_url);
      setIsImage(true);
      setLoading(false);
      return;
    }

    if (message.file_url) {
      const ext = message.file_url.split(".").pop()?.toLowerCase() || "";
      if (IMAGE_EXTENSIONS.includes(ext)) {
        setThumbnail(message.file_url);
        setIsImage(true);
      } else {
        setThumbnail(null);
        setIsImage(false);
      }
      setLoading(false);
      return;
    }

    setThumbnail(null);
    setIsImage(false);
    setLoading(false);
  }, [message]);

  const previewFileSrc = buildStaticUrl(getOriginalImagePath(message.file_url));
  const previewImageSrc = buildStaticUrl(
    getOriginalImagePath(message.file_url || message.thumb_url || thumbnail)
  );

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isImage) return;
    event.preventDefault();
    setPreviewOpen(true);
  };

  return (
    <>
      <div style={{ position: "relative", width: 100, height: 70 }}>
        <a
          href={previewFileSrc}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            cursor: isImage ? "zoom-in" : "pointer",
          }}
        >
          {thumbnail ? (
            <>
              <ThumbImageObj thumbUrl={message.thumb_url || thumbnail} />
              {loading && (
                <CircularProgress
                  size={24}
                  style={{
                    position: "absolute",
                    top: "calc(50% - 12px)",
                    left: "calc(50% - 12px)",
                  }}
                />
              )}
            </>
          ) : (
            !isImage && <DescriptionIcon fontSize="large" style={{ width: 100, height: 70 }} />
          )}
        </a>
      </div>

      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width="auto"
        centered
      >
        <img
          src={previewFileSrc || previewImageSrc}
          alt="preview"
          style={{ maxWidth: "80vw", maxHeight: "80vh", display: "block" }}
        />
      </Modal>
    </>
  );
};

export default FileUploadWithPreview;

const ThumbImageObj = ({ thumbUrl }: { thumbUrl?: string }) => {
  const staticBase = useApiStatic();

  const src = !thumbUrl
    ? ""
    : thumbUrl.startsWith("data:image/")
      ? thumbUrl
      : thumbUrl.startsWith("http://") || thumbUrl.startsWith("https://") || thumbUrl.startsWith("/")
        ? thumbUrl
        : `${staticBase}/${thumbUrl}`;

  return (
    <img
      src={src}
      alt="thumbnail"
      style={{ width: 100, height: 70, objectFit: "cover", opacity: 0.5 }}
    />
  );
};
