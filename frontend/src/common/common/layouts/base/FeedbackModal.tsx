import React, { useState, useRef, useEffect, useCallback } from "react";
import { Modal, Input, notification, Button, Tooltip, Spin } from "antd";
import {
  FormOutlined,
  SendOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import axiosClient from "../../../services/axiosClient";
import RichTextEditor from "../../../components/dashboard/work-tables/task/RichTextEditor";
import ImageViewerModal from "../../../components/modal/ImageViewerModal";
import { useApiStatic } from "../../hooks/useApiHost";

interface FeedbackModalProps {
  open: boolean;
  onCancel: () => void;
}

export default function FeedbackModal({ open, onCancel }: FeedbackModalProps) {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Image Viewer state
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const staticBase = useApiStatic();

  // Reset state when opening modal
  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setImages([]);
      setUploading(false);
      setSubmitting(false);
    }
  }, [open]);

  // Upload single file function
  const uploadSingleFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axiosClient.post("/feedback/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.file_url || res.data?.link || res.data?.thumb_url;
      return url || null;
    } catch (err) {
      console.error("Upload file error:", err);
      return null;
    }
  };

  // Handle file select from file input
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const url = await uploadSingleFile(files[i]);
      if (url) newUploadedUrls.push(url);
    }

    if (newUploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...newUploadedUrls]);
      notification.success({ message: `Đã tải lên ${newUploadedUrls.length} ảnh/tệp!` });
    } else {
      notification.error({ message: "Không thể tải lên tập tin" });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle paste image from clipboard
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const filesToUpload: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) filesToUpload.push(file);
      }
    }

    if (filesToUpload.length === 0) return;

    setUploading(true);
    const newUploadedUrls: string[] = [];
    for (const file of filesToUpload) {
      const url = await uploadSingleFile(file);
      if (url) newUploadedUrls.push(url);
    }

    if (newUploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...newUploadedUrls]);
      notification.success({ message: "Đã dán ảnh từ clipboard thành công!" });
    }
    setUploading(false);
  }, []);

  // Remove image from gallery
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Build full image URL for preview
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    return `${staticBase}/${url}`;
  };

  // Open Image Viewer Modal
  const handlePreviewImage = (url: string) => {
    setViewerUrl(url);
    setViewerOpen(true);
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent && images.length === 0) {
      notification.warning({ message: "Vui lòng nhập tiêu đề, nội dung hoặc đính kèm ảnh góp ý!" });
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post("/feedback/", {
        title: trimmedTitle,
        content: trimmedContent,
        images: images,
      });
      notification.success({
        message: "Gửi góp ý thành công!",
        description: "Cảm ơn bạn đã đóng góp ý kiến cho hệ thống Admake!",
      });
      onCancel();
    } catch (err: any) {
      notification.error({
        message: "Gửi góp ý thất bại",
        description: err?.response?.data?.message || err?.message || "Đã có lỗi xảy ra",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        title={
          <div className="flex items-center gap-2 text-base font-bold text-slate-800 border-b pb-3">
            <FormOutlined className="text-cyan-600" />
            <span>Góp ý & Phản hồi cho Admake</span>
          </div>
        }
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            icon={<SendOutlined />}
            style={{ backgroundColor: "#00B4B6", borderColor: "transparent" }}
          >
            Gửi góp ý
          </Button>,
        ]}
        width={720}
        centered
        destroyOnClose
      >
        <div className="py-3 flex flex-col gap-4" onPaste={handlePaste}>
          {/* 1. Tiêu đề Góp ý / Gợi ý Nhà cung cấp - HIGHLIGHT VÀNG SÁNG GÂY CHÚ Ý */}
          <div className="flex flex-col gap-1.5 bg-yellow-100/90 border-2 border-yellow-400 p-3 rounded-xl shadow-sm">
            <label className="text-xs font-extrabold text-yellow-950 uppercase tracking-wide flex items-center gap-1.5">
              💡 GỢI Ý ĐƠN VỊ CUNG CẤP / TIÊU ĐỀ GÓP Ý:
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="GỢI Ý ĐƠN VỊ CUNG CẤP / TIÊU ĐỀ GÓP Ý..."
              className="w-full !h-10 !text-sm !rounded-lg !border-2 !border-yellow-300 !bg-white focus:!border-yellow-500 !font-extrabold !text-yellow-950 uppercase tracking-wide shadow-inner"
            />
          </div>

          {/* 2. Gallery Ảnh đính kèm & Tải ảnh/Paste */}
          <div className="flex flex-col gap-2 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <PaperClipOutlined className="text-cyan-600" /> Hình ảnh / Tệp đính kèm ({images.length})
              </span>
              <span className="text-[11px] text-slate-400">
                (Dán ảnh trực tiếp từ Clipboard bằng Ctrl+V)
              </span>
            </div>

            {/* Display Image Cards Grid */}
            <div className="flex flex-wrap gap-3 mt-1">
              {images.map((imgUrl, index) => {
                const fullUrl = getImageUrl(imgUrl);
                return (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs w-28 h-28 flex items-center justify-center p-1"
                  >
                    <img
                      src={fullUrl}
                      alt={`upload-${index}`}
                      className="w-full h-full object-contain rounded"
                    />

                    {/* Action buttons overlay (matching reference image!) */}
                    <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                      <button
                        type="button"
                        onClick={() => handlePreviewImage(imgUrl)}
                        className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                        title="Xem phóng to ảnh"
                      >
                        <EyeOutlined className="text-xs text-blue-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="h-7 w-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                        title="Xóa ảnh"
                      >
                        <DeleteOutlined className="text-xs" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Upload Button Box */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-28 h-28 rounded-lg border-2 border-dashed border-slate-300 hover:border-cyan-500 bg-white hover:bg-cyan-50/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-slate-500 hover:text-cyan-600"
              >
                {uploading ? (
                  <Spin size="small" />
                ) : (
                  <>
                    <CloudUploadOutlined className="text-2xl" />
                    <span className="text-[11px] font-semibold">Tải ảnh lên</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* 3. Mô tả Góp ý với RichTextEditor */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                📝 Mô tả góp ý
              </span>
            </div>
            <div className="w-full rounded-xl border border-slate-300 overflow-hidden bg-white">
              <RichTextEditor
                value={content}
                onChange={(html) => setContent(html)}
                placeholder="Nhập nội dung chi tiết góp ý hoặc phản hồi cho Admake..."
                onPasteImage={async (file) => {
                  const url = await uploadSingleFile(file);
                  if (url) {
                    setImages((prev) => [...prev, url]);
                    notification.success({ message: "Đã đính kèm ảnh dán từ editor!" });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Image Viewer Modal */}
      <ImageViewerModal
        open={viewerOpen}
        onCancel={() => setViewerOpen(false)}
        imageUrl={viewerUrl}
        title="Xem chi tiết ảnh góp ý"
      />
    </>
  );
}
