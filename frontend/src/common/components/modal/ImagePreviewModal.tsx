import React from "react";
import ImageViewerModal from "./ImageViewerModal";

export interface ImagePreviewModalProps {
  open: boolean;
  onCancel: () => void;
  imageUrl?: string | null;
  title?: string;
  width?: number | string;
  maxHeight?: number | string;
  alt?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = (props) => {
  return <ImageViewerModal {...props} />;
};

export default ImagePreviewModal;
