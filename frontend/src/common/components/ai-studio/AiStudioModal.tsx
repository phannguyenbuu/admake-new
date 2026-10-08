import React, { useState, useEffect } from "react";
import { Modal, Tooltip, message } from "antd";
import {
  ScissorOutlined,
  CommentOutlined,
  CloseOutlined,
  CheckCircleFilled,
  WarningFilled,
  PictureOutlined,
} from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import { useApiHost } from "../../common/hooks/useApiHost";
import type { AiStudioImageItem, StudioStatus } from "./types";
import { AiCreateTab } from "./tabs/AiCreateTab";
import { AiEditTab } from "./tabs/AiEditTab";
import { AiChatTab } from "./tabs/AiChatTab";
import { AiGallery } from "./components/AiGallery";
import { AiViewerModal } from "./components/AiViewerModal";
import { Signboard3DStudio } from "../ai-pricing/Signboard3DStudio";

interface AiStudioModalProps {
  open: boolean;
  onCancel: () => void;
}

const STORAGE_GALLERY_KEY = "ADMAKE_AI_STUDIO_GALLERY";

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ open, onCancel }) => {
  const apiHost = useApiHost();
  const [activeTab, setActiveTab] = useState<"3d_workflow" | "chat" | "create" | "edit">("3d_workflow");
  const [status, setStatus] = useState<StudioStatus>({
    hasGeminiKey: true,
    hasGptKey: true,
  });

  // Quản lý danh sách ảnh trong Thư viện
  const [galleryImages, setGalleryImages] = useState<AiStudioImageItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_GALLERY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return [];
  });

  // Ảnh đang chọn để xem phóng to 4K
  const [viewingImage, setViewingImage] = useState<AiStudioImageItem | null>(null);

  // Ảnh được chọn để chuyển sang Tab Sửa ảnh (Inpainting)
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<AiStudioImageItem | null>(null);

  // Prompt chuyển từ Tab Chat sang Tab Tạo ảnh
  const [promptFromChat, setPromptFromChat] = useState<string>("");

  // Nạp trạng thái Keys từ Backend
  useEffect(() => {
    if (!open) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${apiHost}/ai/studio-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStatus({
              hasGeminiKey: data.has_gemini_key,
              hasGptKey: data.has_gpt_key,
              geminiPreview: data.gemini_preview,
              gptPreview: data.gpt_preview,
            });
          }
        }
      } catch {
        /* fallback default true */
      }
    };
    fetchStatus();
  }, [open, apiHost]);

  // Lưu ảnh vào sessionStorage khi có thay đổi
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(galleryImages));
    } catch {
      /* ignore */
    }
  }, [galleryImages]);

  const handleImageCreated = (newImg: AiStudioImageItem) => {
    setGalleryImages((prev) => [newImg, ...prev]);
  };

  const handleDeleteImage = (id: string) => {
    setGalleryImages((prev) => prev.filter((i) => i.id !== id));
    message.success("Đã xóa ảnh khỏi thư viện");
  };

  const handleSendToEdit = (img: AiStudioImageItem) => {
    setSelectedImageForEdit(img);
    setActiveTab("edit");
    message.info("Đã chuyển thiết kế sang Tab Sửa Thiết Kế!");
  };

  const handleUseChatPrompt = (promptText: string) => {
    setPromptFromChat(promptText);
    setActiveTab("create");
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width="96vw"
        centered
        destroyOnClose
        styles={{
          content: {
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          },
          body: {
            padding: 0,
            height: "90vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f8fafc",
          },
        }}
        title={null}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 text-slate-800">
          {/* Logo & Brand Admake */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Admake Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-xs border border-slate-200"
            />
            <div className="flex items-center gap-2">
              <img src="/ADMAKE.svg" alt="ADMAKE" className="h-7" />
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                AI STUDIO
              </span>
            </div>
          </div>

          {/* Tab Navigation Center: 1. 3D & Báo Giá (GenAI), 2. Hội Thoại AI, 3. Tạo Thiết Kế, 4. Sửa Thiết Kế */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("3d_workflow")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "3d_workflow"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>🧊 3D & Báo Giá (GenAI)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "chat"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CommentOutlined />
              <span>💬 Hội Thoại AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "create"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Tạo Thiết Kế</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "edit"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ScissorOutlined />
              <span>🎨 Sửa Thiết Kế</span>
            </button>
          </div>

          {/* Close Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200"
            >
              <CloseOutlined className="text-sm" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        {activeTab === "3d_workflow" ? (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            <Signboard3DStudio />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50">
            {/* Cột Trái: Tab Nội Dung Đang Kích Hoạt (5/12) */}
            <div className="lg:col-span-5 h-full overflow-y-auto pr-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              {activeTab === "create" && (
                <AiCreateTab
                  apiHost={apiHost}
                  hasGeminiKey={status.hasGeminiKey}
                  hasGptKey={status.hasGptKey}
                  onImageCreated={handleImageCreated}
                  externalPrompt={promptFromChat}
                />
              )}

              {activeTab === "edit" && (
                <AiEditTab
                  apiHost={apiHost}
                  sourceImage={selectedImageForEdit}
                  onImageCreated={handleImageCreated}
                />
              )}

              {activeTab === "chat" && (
                <AiChatTab
                  apiHost={apiHost}
                  hasGeminiKey={status.hasGeminiKey}
                  hasGptKey={status.hasGptKey}
                  onUseAsPrompt={handleUseChatPrompt}
                />
              )}
            </div>

            {/* Cột Phải: Thư Viện Ảnh & Xem Trước (7/12) */}
            <div className="lg:col-span-7 h-full overflow-hidden">
              <AiGallery
                images={galleryImages}
                onSelectImage={(img) => setViewingImage(img)}
                onSendToEdit={handleSendToEdit}
                onDeleteImage={handleDeleteImage}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Xem Phóng To Siêu Nét 4K */}
      <AiViewerModal
        image={viewingImage}
        open={Boolean(viewingImage)}
        onClose={() => setViewingImage(null)}
        onSendToEdit={handleSendToEdit}
      />
    </>
  );
};
