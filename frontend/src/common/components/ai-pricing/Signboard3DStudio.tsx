import React, { useState, useEffect } from "react";
import { Sparkles, X, Box, Calculator, Layers } from "lucide-react";
import { useSignboardStudio } from "./studio/useSignboardStudio";
import { useCanvas2DOverlay } from "./studio/useCanvas2DOverlay";
import { StudioSurveyStep } from "./studio/StudioSurveyStep";
import { StudioMaterialSteps } from "./studio/StudioMaterialSteps";
import { StudioRenderSteps } from "./studio/StudioRenderSteps";
import { StudioVisualizer } from "./studio/StudioVisualizer";
import type { Signboard3DStudioProps, SignSampleItem } from "./studio/types";

export type { SignSampleItem, Signboard3DStudioProps };

export const Signboard3DStudio: React.FC<Signboard3DStudioProps> = ({ onClose, open }) => {
  const studio = useSignboardStudio(open ?? true);
  const [subTab, setSubTab] = useState<"editor" | "pricing" | "materials">("editor");

  useEffect(() => {
    if (studio.currentStep === 3) setSubTab("materials");
    else if (studio.currentStep === 2 && subTab === "materials") setSubTab("editor");
  }, [studio.currentStep]);

  const overlay = useCanvas2DOverlay({
    model3D: studio.model3D,
    quoteResult: studio.quoteResult,
    activeRenderUrl: studio.activeRenderUrl,
    canvasRef: studio.canvasRef,
    profitMargin: studio.profitMargin,
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 text-slate-800 rounded-none border-0 p-2 sm:p-2.5 shadow-none overflow-hidden">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 w-full flex-1 min-h-0 overflow-hidden">
        {/* Cột trái: Header Admake AI Studio + Điều khiển các bước (fit trang & tự cuộn êm bên trong) */}
        <div className="lg:col-span-5 flex flex-col bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 w-full h-full overflow-hidden shadow-xs">
          {/* Cụm Fit On Top: Nút [X] + 3 Subtabs (Hình 2 luôn cố định ở trên cùng) */}
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors border border-slate-200 shrink-0 shadow-2xs"
              title="Đóng trang (Close)"
            >
              <X className="w-4 h-4" />
            </button>

            {(studio.currentStep === 2 || studio.currentStep === 3) ? (
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-xl flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => { setSubTab("editor"); studio.setCurrentStep(2); }}
                  className={`py-1 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    subTab === "editor"
                      ? "bg-white text-[#00b4b6] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Box className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">🛠️ Công Cụ 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSubTab("pricing"); studio.setCurrentStep(2); }}
                  className={`py-1 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    subTab === "pricing"
                      ? "bg-white text-emerald-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">💰 Bảng Giá Tổng</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSubTab("materials"); studio.setCurrentStep(3); }}
                  className={`py-1 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    subTab === "materials"
                      ? "bg-white text-amber-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">🎨 Vật Liệu Kho</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-1">
                <span className="text-xs font-bold text-slate-700 truncate">
                  Khảo Sát & Nạp Mô Hình 3D
                </span>
              </div>
            )}
          </div>

          {/* Vùng nội dung các bước */}
          <div className="flex-1 min-h-0 overflow-y-auto visible-scrollbar custom-scrollbar pr-0.5 space-y-2.5">
            {studio.currentStep === 1 && (
            <StudioSurveyStep
              attachedImage={studio.attachedImage}
              setAttachedImage={studio.setAttachedImage}
              fileInputRef={studio.fileInputRef}
              processImageFile={studio.processImageFile}
              clientPrompt={studio.clientPrompt}
              setClientPrompt={studio.setClientPrompt}
              isGenerating3D={studio.isGenerating3D}
              isAnalyzingVision={studio.isAnalyzingVision}
              handleAnalyze={studio.handleAnalyze}
              cancelAnalyze={studio.cancelAnalyze}
              signSamples={studio.signSamples}
              selectedSampleId={studio.selectedSampleId}
              selectedSample={studio.selectedSample}
              attachSampleImage={studio.attachSampleImage}
              sampleCategoryFilter={studio.sampleCategoryFilter}
              setSampleCategoryFilter={studio.setSampleCategoryFilter}
              handleSelectSignSample={studio.handleSelectSignSample}
            />
          )}

          {(studio.currentStep === 2 || studio.currentStep === 3) && (
            <StudioMaterialSteps
              currentStep={studio.currentStep}
              setCurrentStep={studio.setCurrentStep}
              subTab={subTab}
              setSubTab={setSubTab}
              model3D={studio.model3D}
              quoteResult={studio.quoteResult}
              onUpdateModelDimensions={studio.handleUpdateModelDimensions}
              selectedIron={studio.selectedIron}
              selectedSurface={studio.selectedSurface}
              hasLed={studio.hasLed}
              setHasLed={studio.setHasLed}
              hasSheetBacking={studio.hasSheetBacking}
              setHasSheetBacking={studio.setHasSheetBacking}
              handleMaterialChange={studio.handleMaterialChange}
              handleRenderGenAI={studio.handleRenderGenAI}
              isRendering={studio.isRendering}
              // 3D Editor 3ds Max props (Cột trái đồng bộ theme)
              editorMode={studio.editorMode}
              setEditorMode={studio.setEditorMode}
              editorSpace={studio.editorSpace}
              setEditorSpace={studio.setEditorSpace}
              editorSnap={studio.editorSnap}
              setEditorSnap={studio.setEditorSnap}
              editorSelection={studio.editorSelection}
              onUpdateTransform={studio.handleUpdateTransform}
              onApplyMaterial={studio.handleApplyMaterialToSelection}
              onUpdateMaterialProperties={studio.handleUpdateMaterialProperties}
              onOpenAddTextModal={studio.handleOpenAddTextModal}
              onOpenEditTextModal={studio.handleOpenEditTextModal}
              onDeleteSelected={studio.handleDeleteSelected}
              onResetTransform={studio.handleResetTransform}
              onDeselect={studio.handleDeselect}
              onUpdateTextParams={studio.handleUpdateTextParams}
            />
          )}

          {studio.currentStep >= 4 && (
            <StudioRenderSteps
              currentStep={studio.currentStep}
              setCurrentStep={studio.setCurrentStep}
              aspectRatio={studio.aspectRatio}
              setAspectRatio={studio.setAspectRatio}
              renderStyle={studio.renderStyle}
              setRenderStyle={studio.setRenderStyle}
              customEditPrompt={studio.customEditPrompt}
              setCustomEditPrompt={studio.setCustomEditPrompt}
              pins={studio.pins}
              setPins={studio.setPins}
              isPinMode={studio.isPinMode}
              setIsPinMode={studio.setIsPinMode}
              isEditing={studio.isEditing}
              isRendering={studio.isRendering}
              activeRenderUrl={studio.activeRenderUrl}
              handleContinuousEdit={studio.handleContinuousEdit}
              handleRenderGenAI={studio.handleRenderGenAI}
              genAiJob={studio.genAiJob}
              cancelRender={studio.cancelRender}
              model3D={studio.model3D}
              quoteResult={studio.quoteResult}
              selectedIron={studio.selectedIron}
              selectedSurface={studio.selectedSurface}
              onMaterialChange={studio.handleMaterialChange}
              profitMargin={studio.profitMargin}
              setProfitMargin={studio.setProfitMargin}
              handleCopyZaloQuote={studio.handleCopyZaloQuote}
              handlePrintQuote={studio.handlePrintQuote}
              onExportTwoPagePdf={overlay.handleExportTwoPagePdf}
            />
          )}
          </div>
        </div>

        {/* Cột phải: Visualizer 3D Canvas / GenAI Render / Ruby Code */}
        <StudioVisualizer
          currentStep={studio.currentStep}
          setCurrentStep={studio.setCurrentStep}
          activeVisualTab={studio.activeVisualTab}
          setActiveVisualTab={studio.setActiveVisualTab}
          activeRenderUrl={studio.activeRenderUrl}
          setActiveRenderUrl={studio.setActiveRenderUrl}
          generatedRubyCode={studio.generatedRubyCode}
          aiAnalysisText={studio.aiAnalysisText}
          genAiJob={studio.genAiJob}
          handleApplyRubyToMesh={studio.handleApplyRubyToMesh}
          handleCopyRubyCode={studio.handleCopyRubyCode}
          handleDownloadRubyFile={studio.handleDownloadRubyFile}
          addPinAt={studio.addPinAt}
          isPinMode={studio.isPinMode}
          pins={studio.pins}
          isRendering={studio.isRendering}
          isEditing={studio.isEditing}
          cancelRender={studio.cancelRender}
          handleRenderGenAI={studio.handleRenderGenAI}
          model3D={studio.model3D}
          applyParsedModelToMesh={studio.applyParsedModelToMesh}
          canvasRef={studio.canvasRef}
          renderHistory={studio.renderHistory}
          quoteResult={studio.quoteResult}
          profitMargin={studio.profitMargin}
          overlay={overlay}
          // 3D Editor props for Canvas (Viewport thông thoáng)
          onOpenAddTextModal={studio.handleOpenAddTextModal}
          onSelectionChange={studio.setEditorSelection}
          externalMode={studio.editorMode}
          externalSpace={studio.editorSpace}
          setExternalSpace={studio.setEditorSpace}
          externalSnap={studio.editorSnap}
          setExternalSnap={studio.setEditorSnap}
          snapToSurface={studio.snapToSurface}
          onToggleSnapSurface={studio.handleToggleSnapToSurface}
          onResetTransform={studio.handleResetTransform}
          onUndo={studio.handleUndo}
          onDeleteSelected={studio.handleDeleteSelected}
          hasSelection={!!studio.editorSelection}
        />
      </div>
    </div>
  );
};
