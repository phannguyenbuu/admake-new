import React from "react";
import { Box, Layers, Calculator } from "lucide-react";
import { PRICING_STANDARDS, formatVND } from "../../../services/aiPricingEngine";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";
import { EditorToolbar3dsMax } from "../editor3d/EditorToolbar3dsMax";
import { EditorInspectorPanel } from "../editor3d/EditorInspectorPanel";
import { ElementDetailPricing } from "./ElementDetailPricing";
import { OverallPricingBreakdown } from "./OverallPricingBreakdown";
import { WholeModelSizePanel } from "./WholeModelSizePanel";
import type { StudioQuoteResult } from "./studioQuote";
import type { TransformMode, CoordinateSpace, SelectedMeshInfo } from "../editor3d/editorTypes";

interface StudioMaterialStepsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  model3D: Signboard3DModel | null;
  quoteResult?: StudioQuoteResult | null;
  onUpdateModelDimensions?: (w: number, h: number, d: number) => void;
  selectedIron: string;
  selectedSurface: string;
  hasLed: boolean;
  setHasLed: (val: boolean) => void;
  hasSheetBacking: boolean;
  setHasSheetBacking: (val: boolean) => void;
  handleMaterialChange: (type: "iron" | "surface", key: string) => void;
  handleRenderGenAI: () => void;
  isRendering: boolean;
  subTab?: "editor" | "pricing" | "materials";
  setSubTab?: (t: "editor" | "pricing" | "materials") => void;
  // 3D Editor 3ds Max props
  editorMode: TransformMode;
  setEditorMode: (m: TransformMode) => void;
  editorSpace: CoordinateSpace;
  setEditorSpace: (s: CoordinateSpace) => void;
  editorSnap: boolean;
  setEditorSnap: (v: boolean) => void;
  editorSelection: SelectedMeshInfo | null;
  onUpdateTransform: (pos: [number, number, number], rot: [number, number, number], scale: [number, number, number]) => void;
  onApplyMaterial: (materialId: string) => void;
  onUpdateMaterialProperties?: (props: any) => void;
  onOpenAddTextModal: () => void;
  onOpenEditTextModal: () => void;
  onDeleteSelected: () => void;
  onResetTransform: () => void;
  onDeselect: () => void;
  onUpdateTextParams?: (params: any) => void;
}

export const StudioMaterialSteps: React.FC<StudioMaterialStepsProps> = ({
  currentStep,
  setCurrentStep,
  model3D,
  quoteResult,
  onUpdateModelDimensions,
  selectedIron,
  selectedSurface,
  hasLed,
  setHasLed,
  hasSheetBacking,
  setHasSheetBacking,
  handleMaterialChange,
  handleRenderGenAI,
  isRendering,
  subTab: propSubTab,
  setSubTab: propSetSubTab,
  editorMode,
  setEditorMode,
  editorSpace,
  setEditorSpace,
  editorSnap,
  setEditorSnap,
  editorSelection,
  onUpdateTransform,
  onApplyMaterial,
  onUpdateMaterialProperties,
  onOpenAddTextModal,
  onOpenEditTextModal,
  onDeleteSelected,
  onResetTransform,
  onDeselect,
  onUpdateTextParams,
}) => {
  const [internalSubTab, setInternalSubTab] = React.useState<"editor" | "pricing" | "materials">(
    currentStep === 3 ? "materials" : "editor"
  );
  const subTab = propSubTab || internalSubTab;
  const setSubTab = propSetSubTab || setInternalSubTab;

  React.useEffect(() => {
    if (currentStep === 3) setSubTab("materials");
    else if (currentStep === 2 && subTab === "materials") setSubTab("editor");
  }, [currentStep]);

  return (
    <>
      {/* BƯỚC 2 & 3: 3D EDITOR, BẢNG GIÁ TỔNG & VẬT LIỆU ADMAKE */}
      {(currentStep === 2 || currentStep === 3) && (
        <div className="space-y-2.5">
          {/* NỘI DUNG SUBTAB 1: BỘ CÔNG CỤ 3D (3DS MAX) */}
          {subTab === "editor" && (
            <div className="space-y-3">
              <EditorToolbar3dsMax
                mode={editorMode}
                setMode={setEditorMode}
                space={editorSpace}
                setSpace={setEditorSpace}
                snap={editorSnap}
                setSnap={setEditorSnap}
                hasSelection={!!editorSelection}
                onAddText={onOpenAddTextModal}
                onDeleteSelected={onDeleteSelected}
                onResetTransform={onResetTransform}
                onDeselect={onDeselect}
              />

              {/* Chi tiết thuộc tính (Properties) & Dự toán: KHI CÓ CHỌN VẬT THỂ */}
              {editorSelection && (
                <ElementDetailPricing
                  selection={editorSelection}
                  model3D={model3D}
                  onDeselect={onDeselect}
                  onUpdateTextParams={onUpdateTextParams}
                />
              )}

              {/* Bảng Biến Đổi (X, Y, Z) & Vật Liệu PBR: KHI CÓ CHỌN VẬT THỂ */}
              {editorSelection && (
                <EditorInspectorPanel
                  selection={editorSelection}
                  onUpdateTransform={onUpdateTransform}
                  onApplyMaterial={onApplyMaterial}
                  onUpdateMaterialProperties={onUpdateMaterialProperties}
                  onClose={onDeselect}
                />
              )}

              {/* KHI KHÔNG CHỌN VẬT THỂ: BẢNG ĐIỀU CHỈNH KÍCH THƯỚC TOÀN KHỐI 3 CHIỀU */}
              {!editorSelection && onUpdateModelDimensions && (
                <WholeModelSizePanel
                  model3D={model3D}
                  onUpdateDimensions={onUpdateModelDimensions}
                />
              )}
            </div>
          )}

          {/* NỘI DUNG SUBTAB 2: BẢNG GIÁ TỔNG THỂ DỰ TOÁN (Giữ mounted để đồng bộ live khi scale/resize 3D) */}
          <div className={subTab === "pricing" ? "space-y-3" : "hidden"}>
            <OverallPricingBreakdown
              model3D={model3D}
              quoteResult={quoteResult || null}
              selectedIron={selectedIron}
              selectedSurface={selectedSurface}
              onMaterialChange={handleMaterialChange}
              selectedMesh={editorSelection}
            />
          </div>

          {/* NỘI DUNG SUBTAB 2: CHỌN VẬT LIỆU ADMAKE */}
          {subTab === "materials" && (
            <div className="space-y-3.5">
              {/* Báo hiệu nếu đang chọn vật thể trên 3D */}
              {editorSelection && (
                <div className="p-2.5 bg-teal-50 border border-teal-200/90 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2 text-teal-900 truncate pr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00b4b6] animate-pulse shrink-0" />
                    <span className="truncate">Đang chọn: <strong>{editorSelection.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSubTab("editor"); setCurrentStep(2); }}
                    className="px-2.5 py-1 bg-gradient-to-r from-[#00b4b6] to-[#0284c7] hover:from-[#00a2a4] hover:to-[#0275b0] text-white rounded-lg font-bold text-[11px] cursor-pointer shrink-0 shadow-2xs transition-all"
                  >
                    Mở Bộ Công Cụ 3D →
                  </button>
                </div>
              )}

              {/* Chọn Khung Sắt */}
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1.5 block">
                  1. Khung chịu lực & Trụ đỡ:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRICING_STANDARDS.iron_bars.map((iron) => (
                    <button
                      key={iron.key}
                      type="button"
                      onClick={() => handleMaterialChange("iron", iron.key)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        selectedIron === iron.key
                          ? "bg-teal-50/80 border-[#00b4b6] text-teal-950 shadow-xs font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold">{iron.name}</div>
                      <div className="text-[10px] text-slate-500">{formatVND(iron.unitPrice)}/cây</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Mặt Bảng */}
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1.5 block">
                  2. Mặt bảng & Ốp dựng:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {PRICING_STANDARDS.surfaces.map((surf) => (
                    <button
                      key={surf.key}
                      type="button"
                      onClick={() => handleMaterialChange("surface", surf.key)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        selectedSurface === surf.key
                          ? "bg-teal-50/80 border-[#00b4b6] text-teal-950 shadow-xs font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold truncate">{surf.name}</div>
                      <div className="text-[10px] text-slate-500">{formatVND(surf.unitPrice)}/{surf.unit}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phụ Kiện Tùy Chọn */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHasLed(!hasLed)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    hasLed
                      ? "bg-amber-50 border-amber-500 text-amber-800 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  💡 Đèn LED Chiếu Sáng: {hasLed ? "Bật" : "Tắt"}
                </button>
                <button
                  type="button"
                  onClick={() => setHasSheetBacking(!hasSheetBacking)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    hasSheetBacking
                      ? "bg-teal-50 border-[#00b4b6] text-teal-800 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🛡️ Tôn Lót Mặt Sau: {hasSheetBacking ? "Có" : "Không"}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSubTab("pricing")}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết Bảng Giá Tổng Thể →</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
