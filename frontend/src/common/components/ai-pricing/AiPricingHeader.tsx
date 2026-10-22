import React from "react";
import { Tooltip, Tag } from "antd";
import {
  RobotOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ColumnWidthOutlined,
  SlidersOutlined,
  FilePdfOutlined,
  CopyOutlined
} from "@ant-design/icons";
import { COMPANY_INFO } from "../../services/aiPricingEngine";

interface AiPricingHeaderProps {
  aiSource: "gemini" | "openai" | "expert_engine";
  viewMode: "split" | "current_only" | "ai_only";
  showConfigForm: boolean;
  onQuickPromptClick: () => void;
  onOpenAiConfig: () => void;
  onToggleViewMode: (mode: "split" | "current_only" | "ai_only") => void;
  onToggleConfigForm: () => void;
  onOpenPdfModal: () => void;
  onCopyZalo: () => void;
}

export const AiPricingHeader: React.FC<AiPricingHeaderProps> = ({
  aiSource,
  viewMode,
  showConfigForm,
  onQuickPromptClick,
  onOpenAiConfig,
  onToggleViewMode,
  onToggleConfigForm,
  onOpenPdfModal,
  onCopyZalo,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 md:px-5 md:py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Left: Brand & Prompt Button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-xs">
            <RobotOutlined className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black text-slate-900 m-0 leading-tight">
                AI Báo Giá Bảng Hiệu
              </h2>
              <Tag color="cyan" className="!text-[10px] !font-bold !m-0 !px-1.5 !rounded-full">
                Chia đôi màn hình
              </Tag>
            </div>
            <span className="text-xs text-slate-400">
              {COMPANY_INFO.name} ({COMPANY_INFO.brand})
            </span>
          </div>
        </div>

        {/* Nút hỏi nhanh "BẠN MUỐN HỎI GIÁ BẢNG HIỆU?" */}
        <button
          type="button"
          onClick={onQuickPromptClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all cursor-pointer border-none active:scale-95"
        >
          <ThunderboltOutlined className="text-amber-300" />
          <span>BẠN MUỐN HỎI GIÁ BẢNG HIỆU?</span>
        </button>
      </div>

      {/* Right: View mode controls, AI Engine Status, PDF Export */}
      <div className="flex flex-wrap items-center gap-2">
        {/* AI Engine Status Badge & Config */}
        <Tooltip title="Nhấp để cấu hình API Key AI">
          <button
            type="button"
            onClick={onOpenAiConfig}
            className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-700 transition-all"
          >
            {aiSource === "gemini" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <ApiOutlined /> Gemini AI Live
              </span>
            ) : aiSource === "openai" ? (
              <span className="inline-flex items-center gap-1 text-sky-600 font-bold">
                <ApiOutlined /> AI Engine Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-teal-600 font-bold">
                <CheckCircleOutlined /> AI Xưởng Chuẩn 100%
              </span>
            )}
            <SettingOutlined className="text-slate-400 hover:text-slate-600 text-xs" />
          </button>
        </Tooltip>

        {/* View mode toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => onToggleViewMode("split")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
              viewMode === "split"
                ? "bg-white text-cyan-700 shadow-xs"
                : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ColumnWidthOutlined /> Chia đôi (50-50)
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode("current_only")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
              viewMode === "current_only"
                ? "bg-white text-cyan-700 shadow-xs"
                : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Bảng định mức
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode("ai_only")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
              viewMode === "ai_only"
                ? "bg-white text-cyan-700 shadow-xs"
                : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Bảng AI Prompt
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleConfigForm}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
            showConfigForm
              ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:border-cyan-400"
          }`}
        >
          <SlidersOutlined />
          <span>Khai báo thông số</span>
        </button>

        {/* NÚT XUẤT BÁO GIÁ PDF KÈM THÔNG TIN CÔNG TY */}
        <button
          type="button"
          onClick={onOpenPdfModal}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-extrabold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none"
        >
          <FilePdfOutlined className="text-sm" />
          <span>Xuất Báo Giá PDF</span>
        </button>

        <button
          type="button"
          onClick={onCopyZalo}
          className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <CopyOutlined />
          <span>Zalo</span>
        </button>
      </div>
    </div>
  );
};
