import React from "react";
import { Modal, Image, Empty } from "antd";

interface ImagePreviewModalProps {
  open: boolean;
  onCancel: () => void;
  imageUrl?: string | null;
  title?: string;
  width?: number;
  maxHeight?: number;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  open,
  onCancel,
  imageUrl,
  title = "Xem ảnh",
  width = 680,
  maxHeight = 520,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={width}
      title={<span className="font-semibold text-gray-800">{title}</span>}
      destroyOnClose
      centered
      className="image-preview-modal"
    >
      {imageUrl ? (
        <div className="flex justify-center">
          <Image
            src={import.meta.env.VITE_API_IMAGE + imageUrl}
            alt={title}
            style={{
              maxHeight: maxHeight,
              objectFit: "contain",
              borderRadius: 8,
              maxWidth: "100%",
            }}
            className="shadow-lg"
          />
        </div>
      ) : (
        <Empty
          description="Không có ảnh"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Modal>
  );
};

export default ImagePreviewModal;
