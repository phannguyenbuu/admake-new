import React, { useRef, useState, useEffect } from "react";
import { Button, Spin, Progress, Tooltip } from "antd";
import { X, Sparkles, Type, Magnet, Globe, Compass, RotateCcw, Trash2, Undo2, Image as ImageIcon, FileText } from "lucide-react";
import { Signboard3DCanvas, type Signboard3DCanvasHandle } from "../Signboard3DCanvas";
import { STUDIO_CHEVRON_TABS } from "./types";
import { formatVND } from "../../../services/aiPricingEngine";
import { RenderAiModal } from "./RenderAiModal";
import { Canvas2DOverlay } from "./Canvas2DOverlay";
import { CanvasQuoteSheet } from "./CanvasQuoteSheet";
import type { useCanvas2DOverlay } from "./useCanvas2DOverlay";
import type { StudioQuoteResult } from "./studioQuote";
import type { Signboard3DModel, GenAIJob, InpaintPin } from "../../../services/genaiSignboard.service";
import type { TransformMode, CoordinateSpace, SelectedMeshInfo } from "../editor3d/editorTypes";

type VisualTab = "3d" | "genai" | "ruby";

interface StudioVisualizerProps {
  currentStep: number; setCurrentStep: (step: number) => void;
  activeVisualTab: VisualTab; setActiveVisualTab: (tab: VisualTab) => void;
  activeRenderUrl: string | null; setActiveRenderUrl: (url: string) => void;
  generatedRubyCode: string; aiAnalysisText?: string; genAiJob: GenAIJob | null;
  handleApplyRubyToMesh: () => Promise<void>; handleCopyRubyCode: () => void; handleDownloadRubyFile: () => void;
  addPinAt: (xPct: number, yPct: number) => void; isPinMode: boolean; pins: InpaintPin[];
  isRendering: boolean; isEditing: boolean; cancelRender: () => void;
  handleRenderGenAI?: (overridePrompt?: string, overrideAspectRatio?: string, overrideSnapshot?: string) => void;
  onOpenAddTextModal?: () => void; model3D: Signboard3DModel | null; applyParsedModelToMesh?: (m: Signboard3DModel) => void;
  canvasRef: React.RefObject<Signboard3DCanvasHandle | null>; renderHistory: string[]; quoteResult: StudioQuoteResult | null;
  onSelectionChange?: (sel: SelectedMeshInfo | null) => void;
  externalMode?: TransformMode; externalSpace?: CoordinateSpace; setExternalSpace?: (s: CoordinateSpace) => void;
  externalSnap?: boolean; setExternalSnap?: (v: boolean) => void;
  snapToSurface?: boolean; onToggleSnapSurface?: () => void; onResetTransform?: () => void; onDeleteSelected?: () => void;
  onUndo?: () => void;
  hasSelection?: boolean; overlay?: ReturnType<typeof useCanvas2DOverlay>; profitMargin?: number;
}

const CLIP_FIRST = "polygon(0% 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 0% 100%)";
const CLIP_REST = "polygon(0% 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 0% 100%, 13px 50%)";

export const StudioVisualizer: React.FC<StudioVisualizerProps> = (props) => {
  const {
    currentStep, setCurrentStep, activeVisualTab, setActiveVisualTab, activeRenderUrl, setActiveRenderUrl,
    generatedRubyCode, aiAnalysisText, genAiJob, handleApplyRubyToMesh, handleCopyRubyCode, handleDownloadRubyFile,
    addPinAt, isPinMode, pins, isRendering, isEditing, cancelRender, handleRenderGenAI, onOpenAddTextModal,
    model3D, applyParsedModelToMesh, canvasRef, renderHistory, onSelectionChange, externalMode, externalSpace,
    setExternalSpace, externalSnap, setExternalSnap, snapToSurface, onToggleSnapSurface, onResetTransform,
    onDeleteSelected, onUndo, hasSelection, overlay, profitMargin,
  } = props;
  const imgRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const busy = isRendering || isEditing;
  const showRender = activeVisualTab === "genai" && !!activeRenderUrl;
  const canvasHidden = showRender;

  // 1. Quản lý Môi trường 3D & Modal Render AI
  const [timeOfDay, setTimeOfDay] = useState<string>("buổi chiều");
  const [direction, setDirection] = useState<string>("tây nam");
  const [environment, setEnvironment] = useState<string>("đô thị lớn");
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false);

  // Tọa độ pin tính theo CHÍNH ẢNH (không theo khung bao có viền đen object-contain)
  const handleImgClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPinMode || busy) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    addPinAt(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <div className="lg:col-span-7 flex flex-col min-h-[420px] lg:min-h-0 h-full w-full">
      <div className="relative flex-1 w-full h-full min-h-0 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-xs flex flex-col group">
        {/* 1. Thanh Chevron: Khảo Sát > 3D Editor > Báo Giá (100% width, không vạch đứng) */}
        <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-4 z-30 flex items-center">
          <div className="relative flex items-center select-none w-full filter drop-shadow-md">
            {STUDIO_CHEVRON_TABS.map((item, index) => {
              const Icon = item.icon;
              const isFinalScreen = currentStep >= 5;
              const isActive =
                (item.key === "survey" && currentStep === 1) ||
                (item.key === "editor3d" && (currentStep >= 2 && currentStep <= 4) && !isFinalScreen) ||
                (item.key === "quote" && isFinalScreen);

              return (
                <div key={item.key} className="relative flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.key === "survey") { setCurrentStep(1); setActiveVisualTab("3d"); }
                      else if (item.key === "editor3d") { setCurrentStep(2); setActiveVisualTab("3d"); }
                      else if (item.key === "quote") { setCurrentStep(5); }
                    }}
                    style={{
                      background: isActive
                        ? "linear-gradient(90deg, #00b4b6 0%, #0284c7 100%)"
                        : "#64748b",
                      clipPath: index === 0 ? CLIP_FIRST : CLIP_REST,
                      marginLeft: index === 0 ? "0px" : "-10px",
                      zIndex: isActive ? 20 : 10 - index,
                      filter: "drop-shadow(2px 0 0 white) drop-shadow(-1px 0 0 white)",
                    }}
                    className={`w-full relative flex items-center justify-center gap-1.5 h-9 sm:h-10 pl-4 sm:pl-6 pr-4 sm:pr-6 text-white text-xs sm:text-[13px] whitespace-nowrap cursor-pointer transition-all duration-150 ${
                      isActive
                        ? "font-black tracking-wide scale-[1.01] shadow-md brightness-105"
                        : "opacity-85 hover:opacity-100 hover:brightness-110 font-bold"
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center justify-center leading-tight min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-white shadow-xs animate-pulse inline-block mr-0.5 shrink-0" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 opacity-90 shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kích thước: W x L x H canh ngay chính giữa, text màu đen no fill, font-weight 300 */}
        {!canvasHidden && !(overlay && Boolean(activeRenderUrl) && (currentStep >= 5 || activeVisualTab === "genai" || overlay.activeCanvasPage === "quote")) && model3D?.dimensions && (
          <div className="absolute top-14 sm:top-15 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none text-center">
            <span className="text-slate-900 font-light text-xs sm:text-[13px] tracking-wide" style={{ fontWeight: 300 }}>
              {model3D.dimensions.width}m × {model3D.dimensions.height}m ×{" "}
              {Number(model3D.dimensions.depth || 0.12) >= 1
                ? `${model3D.dimensions.depth}m`
                : `${Math.round(Number(model3D.dimensions.depth || 0.12) * 100)}cm`}
            </span>
          </div>
        )}

        {/* Bộ chọn Trang 1 / Trang 2 đưa lên TRÊN (ngay dưới thanh chevron) */}
        {overlay && Boolean(activeRenderUrl) && (currentStep >= 5 || activeVisualTab === "genai" || overlay.activeCanvasPage === "quote") && (
          <div className="absolute top-14 sm:top-15 left-1/2 -translate-x-1/2 z-30 select-none pointer-events-auto">
            <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-lg text-xs font-medium">
              <button
                type="button" onClick={() => { overlay.setActiveCanvasPage("render"); if (activeRenderUrl) setActiveVisualTab("genai"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${overlay.activeCanvasPage === "render" ? "bg-gradient-to-r from-[#00b4b6] to-[#0284c7] text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
              >
                <ImageIcon className="w-3.5 h-3.5" /><span>Trang 1: Phối Cảnh</span>
              </button>
              <button
                type="button" onClick={() => overlay.setActiveCanvasPage("quote")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${overlay.activeCanvasPage === "quote" ? "bg-gradient-to-r from-[#00b4b6] to-[#0284c7] text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
              >
                <FileText className="w-3.5 h-3.5" /><span>Trang 2: Báo Giá</span>
              </button>
            </div>
          </div>
        )}

        {/* Tiến độ Render nếu có */}
        {genAiJob && busy && (
          <div className="absolute top-16 right-3 sm:right-4 z-30 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-xl text-[11px] text-white border border-white/20 shadow-md">
            <span className="truncate max-w-[200px]">{genAiJob.current_step || "Đang xử lý"}</span>
            <span className="text-emerald-300 font-bold">({genAiJob.progress || 0}%)</span>
          </div>
        )}

        {/* 2. Nội dung: Canvas 3D luôn được giữ mount (không tạo lại WebGL context), các view khác phủ lên trên */}
        <div ref={viewportRef} className="relative w-full flex-1 min-h-0">
          <div className={`absolute inset-0 ${canvasHidden || overlay?.activeCanvasPage === "quote" ? "invisible" : "visible"}`}>
            <Signboard3DCanvas
              ref={canvasRef}
              model={model3D}
              paused={canvasHidden || overlay?.activeCanvasPage === "quote"}
              className="w-full h-full"
              onSelectionChange={onSelectionChange}
              externalMode={externalMode}
              externalSpace={externalSpace}
              externalSnap={externalSnap}
              timeOfDay={timeOfDay}
              lightDirection={direction}
              environmentType={environment}
            />
          </div>

          {showRender && overlay?.activeCanvasPage !== "quote" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950 p-3 pt-16 pb-24">
              <div className="relative inline-block max-w-full max-h-full">
                <img
                  ref={imgRef}
                  src={activeRenderUrl!}
                  alt="GenAI Phối Cảnh Thực Tế"
                  onClick={handleImgClick}
                  className={`block max-w-full max-h-[calc(100vh-260px)] w-auto h-auto object-contain select-none rounded-xl ${isPinMode ? "cursor-crosshair" : "cursor-default"}`}
                  draggable={false}
                />
                {pins.map((pin) => (
                  <div
                    key={pin.order}
                    style={{ left: pin.xFormatted, top: pin.yFormatted }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    title={pin.text}
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg">
                      {pin.order}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Xem trước Bảng Báo Giá Trang 2 trên Canvas */}
          {overlay?.activeCanvasPage === "quote" && (
            <div className="absolute inset-0 z-10 flex flex-col bg-slate-900 pt-10">
              <CanvasQuoteSheet model3D={model3D} quoteResult={props.quoteResult} profitMargin={profitMargin || 30} orientation={overlay.orientation} />
            </div>
          )}

          {/* Canvas 2D Overlay (Logo + Text kéo thả) CHỈ XUẤT HIỆN SAU KHI RENDER XONG */}
          {overlay && Boolean(activeRenderUrl) && (currentStep === 5 || activeVisualTab === "genai" || overlay.activeCanvasPage === "quote") && (
            <Canvas2DOverlay
              activeCanvasPage={overlay.activeCanvasPage} setActiveCanvasPage={overlay.setActiveCanvasPage}
              logo={overlay.logo} onUploadLogo={overlay.handleUploadLogo} onRemoveLogo={overlay.handleRemoveLogo} onUpdateLogo={overlay.updateLogo}
              textItems={overlay.textItems} onAddTextItem={overlay.addTextItem} onUpdateTextItem={overlay.updateTextItem} onDeleteTextItem={overlay.deleteTextItem}
              selectedItemId={overlay.selectedItemId} setSelectedItemId={overlay.setSelectedItemId}
              containerRef={viewportRef} renderHistory={renderHistory} activeRenderUrl={activeRenderUrl} setActiveRenderUrl={setActiveRenderUrl}
              onExportPdf={overlay.handleExportTwoPagePdf} orientation={overlay.orientation} setOrientation={overlay.setOrientation}
            />
          )}

          {/* Overlay tiến độ cho MỌI lần render/sửa (kể cả lần đầu chưa có ảnh) */}
          {busy && (
            <div className="absolute inset-0 z-20 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4">
              <Spin size="large" />
              <div className="text-sm font-bold text-white text-center max-w-md">{genAiJob?.current_step || "Đang xử lý qua GenAI..."}</div>
              <Progress percent={genAiJob?.progress || 10} status="active" strokeColor={{ "0%": "#00B4B6", "100%": "#10b981" }} className="w-64" showInfo={false} />
              <Button size="small" onClick={cancelRender} icon={<X className="w-3.5 h-3.5" />} className="rounded-lg">Hủy</Button>
            </div>
          )}
        </div>

        {/* Thanh công cụ 3D Viewport: Luôn hiện khi đang xem 3D Canvas */}
        {(!canvasHidden && overlay?.activeCanvasPage !== "quote" && currentStep < 5) && (
          <div className="absolute bottom-3 inset-x-0 z-30 pointer-events-none flex justify-center px-3">
            <div className="pointer-events-auto flex items-center justify-start sm:justify-center gap-1.5 max-w-full overflow-x-auto select-none py-1 px-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg">
              {/* 1. Nút Tạo Chữ 3D */}
              {onOpenAddTextModal && (
                <button type="button" onClick={onOpenAddTextModal} className="flex items-center gap-1.5 px-3 h-7 rounded-xl bg-gradient-to-r from-[#00b4b6] to-[#0284c7] hover:from-[#00a2a4] hover:to-[#0275b0] text-white border-none text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0" title="Tạo khối chữ nổi 3D (Mica, Inox, Alu...)">
                  <Type className="w-3.5 h-3.5 text-white" />
                  <span>Tạo chữ 3D</span>
                </button>
              )}

              {/* 2. World & Snap */}
              {setExternalSpace && (
                <Tooltip title={`Hệ tọa độ: ${externalSpace === "world" ? "World" : "Local"}`}>
                  <button type="button" onClick={() => setExternalSpace(externalSpace === "world" ? "local" : "world")} className="flex items-center gap-1 px-2 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer shadow-2xs transition-colors shrink-0">
                    {externalSpace === "world" ? <Globe className="w-3 h-3 text-sky-600" /> : <Compass className="w-3 h-3 text-emerald-600" />}
                    <span className="uppercase">{externalSpace || "world"}</span>
                  </button>
                </Tooltip>
              )}
              {setExternalSnap && (
                <Tooltip title={`Bắt điểm Snap (0.05m / 15°): ${externalSnap ? "BẬT" : "TẮT"}`}>
                  <button type="button" onClick={() => setExternalSnap(!externalSnap)} className={`flex items-center gap-1 px-2 h-7 rounded-xl border font-semibold text-[11px] cursor-pointer shadow-2xs transition-all shrink-0 ${externalSnap ? "bg-teal-50 border-[#00b4b6] text-[#00b4b6]" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"}`}>
                    <Magnet className="w-3 h-3" /><span>Snap</span>
                  </button>
                </Tooltip>
              )}
              {onToggleSnapSurface && (
                <Tooltip title={snapToSurface ? "Bám bề mặt: BẬT" : "Bám bề mặt: TẮT"}>
                  <button type="button" onClick={onToggleSnapSurface} className={`w-7 h-7 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 ${snapToSurface ? "bg-teal-50 border-[#00b4b6] text-[#00b4b6] shadow-2xs" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500"}`}>
                    <Magnet className="w-3 h-3" />
                  </button>
                </Tooltip>
              )}

              {/* 3. Undo / Reset / Xóa */}
              {onUndo && (
                <Tooltip title="Hoàn tác thao tác 3D vừa thực hiện (Ctrl+Z / Undo)">
                  <button type="button" onClick={onUndo} className="flex items-center gap-1 px-2 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer shadow-2xs transition-colors shrink-0">
                    <Undo2 className="w-3 h-3 text-slate-600" /><span>Undo</span>
                  </button>
                </Tooltip>
              )}
              {onResetTransform && hasSelection && (
                <Tooltip title="Đặt lại gốc tọa độ & kích thước (Reset)">
                  <button type="button" onClick={onResetTransform} className="flex items-center gap-1 px-2 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[11px] cursor-pointer shadow-2xs transition-colors shrink-0">
                    <RotateCcw className="w-3 h-3 text-slate-600" /><span>Reset</span>
                  </button>
                </Tooltip>
              )}
              {onDeleteSelected && hasSelection && (
                <Tooltip title="Xóa vật thể đang chọn (Delete)">
                  <button type="button" onClick={onDeleteSelected} className="flex items-center gap-1 px-2 h-7 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-semibold text-[11px] cursor-pointer shadow-2xs transition-colors shrink-0">
                    <Trash2 className="w-3 h-3 text-red-600" /><span>Xoá</span>
                  </button>
                </Tooltip>
              )}

              {/* 4. Nút RENDER AI */}
              {handleRenderGenAI && (
                <button
                  type="button" onClick={() => setIsRenderModalOpen(true)} disabled={busy}
                  className="flex items-center gap-1.5 px-3.5 h-7 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none text-xs font-bold shadow-xs cursor-pointer transition-all hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title="Mở bảng điều khiển Render AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" /><span>Render AI</span>
                </button>
              )}
            </div>
          </div>
        )}

        <RenderAiModal
          open={isRenderModalOpen} onClose={() => setIsRenderModalOpen(false)} model3D={model3D}
          timeOfDay={timeOfDay} setTimeOfDay={setTimeOfDay} direction={direction} setDirection={setDirection}
          environment={environment} setEnvironment={setEnvironment}
          onCaptureSnapshot={() => canvasRef.current?.captureSnapshot(0.9) || null}
          onStartRender={(params) => handleRenderGenAI?.(params.prompt, params.aspectRatio, params.snapshot || undefined)}
          isRendering={busy}
        />
      </div>
    </div>
  );
};
