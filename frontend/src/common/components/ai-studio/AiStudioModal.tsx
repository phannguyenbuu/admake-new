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

interface AiStudioModalProps {
  open: boolean;
  onCancel: () => void;
}

const STORAGE_GALLERY_KEY = "ADMAKE_AI_STUDIO_GALLERY";

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ open, onCancel }) => {
  const apiHost = useApiHost();
  const [activeTab, setActiveTab] = useState<"chat" | "create" | "edit">("chat");
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
            backgroundColor: "#030712",
            border: "1px solid #1f2937",
            borderRadius: "24px",
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85)",
          },
          body: {
            padding: 0,
            height: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        title={null}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 text-slate-100">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-violet-900/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400 tracking-wide">
                  ADMAKE AI STUDIO
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-widest">
                  PRO 4K
                </span>
              </div>
              <p className="text-[11px] text-slate-400 m-0">
                Hội Thoại Chuyên Gia • Tạo Thiết Kế 4K • Sửa Thiết Kế Inpainting
              </p>
            </div>
          </div>

          {/* Tab Navigation Center: 1. Hội Thoại AI, 2. Tạo Thiết Kế, 3. Sửa Thiết Kế */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "chat"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-slate-200"
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
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-slate-200"
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
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-slate-200"
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
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
            >
              <CloseOutlined className="text-sm" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Content (2 Cột) */}
        <div className="flex-1 overflow-hidden p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-950">
          {/* Cột Trái: Tab Nội Dung Đang Kích Hoạt (5/12) */}
          <div className="lg:col-span-5 h-full overflow-y-auto pr-1 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-4">
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
