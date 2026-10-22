import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axiosClient from "../../../services/axiosClient";
import {
  genAISignboardService,
  type Signboard3DModel,
} from "../../../services/genaiSignboard.service";
import { message } from "antd";
import type { SignSampleItem } from "./types";
import type { Signboard3DCanvasHandle } from "../Signboard3DCanvas";
import { useStudioImageAndRuby } from "./useStudioImageAndRuby";
import { useStudioRenderGenAI } from "./useStudioRenderGenAI";
import { getErrorMessage, sanitizeSample } from "./aiText";
import { computeStudioQuote, buildZaloQuoteText, printStudioQuote, type StudioQuoteParams } from "./studioQuote";
import type { TransformMode, CoordinateSpace, SelectedMeshInfo, Text3DParams } from "../editor3d/editorTypes";

// Màu hiển thị theo loại mặt bảng
const SURFACE_COLOR: Record<string, string> = {
  bat_hiflex: "#e2e8f0",
  bat_2da: "#64748b",
  bat_khong_gan_uv: "#f8fafc",
  bat_3m_uv: "#0284c7",
  alu_3mm: "#1e293b",
  alu_guong_vang: "#d97706",
  mica_2_3mm: "#dc2626",
};
const FACE_RE = /(mặt|bảng|pano|bạt|face|panel|board|banner|sign\s*face|cabinet|mat\s*bien|mat\s*bang|mat\s*dung)/i;

export function useSignboardStudio(isActive: boolean = true) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [signSamples, setSignSamples] = useState<SignSampleItem[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  const [sampleCategoryFilter, setSampleCategoryFilter] = useState<string>("all");

  // Step 1: Request
  const [clientPrompt, setClientPrompt] = useState<string>("");
  const [isGenerating3D, setIsGenerating3D] = useState<boolean>(false);

  // Step 2 & 3: 3D Model & Materials
  const [model3D, setModel3D] = useState<Signboard3DModel | null>(null);
  const [selectedIron, setSelectedIron] = useState<string>("vuong_20");
  const [selectedSurface, setSelectedSurface] = useState<string>("mica_2_3mm");
  const [hasSheetBacking, setHasSheetBacking] = useState<boolean>(false);
  const [hasLed, setHasLed] = useState<boolean>(true);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const canvasRef = useRef<Signboard3DCanvasHandle | null>(null);

  // 3D Editor State (3ds Max Transform Gizmos & Inspector)
  const [editorMode, setEditorMode] = useState<TransformMode>("translate");
  const [editorSpace, setEditorSpace] = useState<CoordinateSpace>("world");
  const [editorSnap, setEditorSnap] = useState<boolean>(false);
  const [editorSelection, setEditorSelection] = useState<SelectedMeshInfo | null>(null);

  const handleSetEditorMode = useCallback((m: TransformMode) => {
    setEditorMode(m);
    canvasRef.current?.setMode(m);
  }, []);

  const handleSetEditorSpace = useCallback((s: CoordinateSpace) => {
    setEditorSpace(s);
    canvasRef.current?.setSpace(s);
  }, []);

  const handleSetEditorSnap = useCallback((v: boolean) => {
    setEditorSnap(v);
    canvasRef.current?.setSnap(v);
  }, []);

  const handleUpdateTransform = useCallback(
    (pos: [number, number, number], rot: [number, number, number], sc: [number, number, number]) => {
      canvasRef.current?.updateTransform(pos, rot, sc);
    },
    []
  );

  const handleApplyMaterialToSelection = useCallback((matId: string) => {
    canvasRef.current?.applyMaterialToSelection(matId);
  }, []);

  const handleUpdateMaterialProperties = useCallback((props: any) => {
    canvasRef.current?.updateMaterialProperties(props);
  }, []);

  const handleOpenAddTextModal = useCallback(() => {
    canvasRef.current?.openAddTextModal();
  }, []);

  const handleOpenEditTextModal = useCallback(() => {
    canvasRef.current?.openEditTextModal();
  }, []);

  const [snapToSurface, setSnapToSurface] = useState<boolean>(true);
  const handleToggleSnapToSurface = useCallback(() => {
    setSnapToSurface((prev) => {
      const next = !prev;
      canvasRef.current?.setSnapToSurface(next);
      return next;
    });
  }, []);

  const handleUpdateTextParams = useCallback((params: Text3DParams) => {
    canvasRef.current?.updateTextParams(params);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    canvasRef.current?.deleteSelected();
  }, []);

  const handleResetTransform = useCallback(() => {
    canvasRef.current?.resetTransform();
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const handleDeselect = useCallback(() => {
    canvasRef.current?.deselect();
  }, []);

  const [activeVisualTab, setActiveVisualTab] = useState<"3d" | "genai" | "ruby">("3d");
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Báo giá: MỘT nguồn duy nhất, tự tính lại khi bất kỳ tham số nào đổi
  const quoteParams: StudioQuoteParams | null = useMemo(() => {
    if (!model3D) return null;
    return {
      width: Number(model3D.dimensions?.width) || 0,
      height: Number(model3D.dimensions?.height) || 0,
      ironType: selectedIron,
      surfaceType: selectedSurface,
      hasSheetBacking,
      hasLed,
      profitMargin,
    };
  }, [model3D, selectedIron, selectedSurface, hasSheetBacking, hasLed, profitMargin]);

  const quoteResult = useMemo(() => (quoteParams ? computeStudioQuote(quoteParams) : null), [quoteParams]);

  // Nạp model vào canvas + đồng bộ vật liệu
  const modelLoadedRef = useRef<boolean>(false);
  const applyParsedModelToMesh = useCallback((m: Signboard3DModel) => {
    modelLoadedRef.current = true;
    setModel3D(m);
    setSelectedIron(m.materials_spec?.iron_type || "vuong_25");
    setSelectedSurface(m.materials_spec?.surface_type || "alu_3mm");
    setHasLed(Boolean(m.materials_spec?.has_led));
    setHasSheetBacking(Boolean(m.materials_spec?.has_sheet_backing));
  }, []);

  // Sinh mô hình 3D từ ChatGPT Vision/Ruby API
  const handleGenerate3D = async () => {
    setIsGenerating3D(true);
    try {
      const generated = await genAISignboardService.generate3DModel({ prompt: clientPrompt.trim() });
      if (!mountedRef.current) return;
      applyParsedModelToMesh(generated);
      setSelectedSampleId("");
      message.success("✨ Đã tạo mô hình 3D thành công!");
      setActiveVisualTab("3d");
      setCurrentStep(2);
    } catch (err) {
      setModel3D(null);
      message.error(getErrorMessage(err, "Lỗi khi sinh mô hình 3D"));
    } finally {
      if (mountedRef.current) setIsGenerating3D(false);
    }
  };

  const imageAndRuby = useStudioImageAndRuby({
    isActive,
    currentStep,
    setCurrentStep,
    clientPrompt,
    model3D,
    applyParsedModelToMesh,
    setActiveVisualTab,
    handleGenerate3D,
  });

  // (1) Mặc định nạp file signboard_sketchup_1791878469884.rb khi mở Studio
  const defaultRubyLoadedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isActive || defaultRubyLoadedRef.current || model3D) return;
    defaultRubyLoadedRef.current = true;
    let cancelled = false;

    const loadDefaultSign = async () => {
      try {
        const res = await axiosClient.get("/ai/signs/default-rb", { timeout: 25000 });
        if (cancelled) return;
        if (res.data?.success && res.data?.ruby_code) {
          const rbCode = res.data.ruby_code;
          imageAndRuby.setGeneratedRubyCode(rbCode);
          if (res.data?.model3d?.elements?.length) {
            applyParsedModelToMesh(res.data.model3d);
            setActiveVisualTab("3d");
            return;
          }
          const parseRes = await axiosClient.post("/ai/signboard/parse-rb-mesh", { ruby_code: rbCode }, { timeout: 35000 });
          if (!cancelled && parseRes.data?.success && parseRes.data?.model3d) {
            applyParsedModelToMesh(parseRes.data.model3d);
            setActiveVisualTab("3d");
          }
        }
      } catch (err) {
        try {
          const fRes = await fetch("/signs/signboard_sketchup_1791878469884.rb");
          if (!cancelled && fRes.ok) {
            const code = await fRes.text();
            if (code) {
              imageAndRuby.setGeneratedRubyCode(code);
              const parseRes = await axiosClient.post("/ai/signboard/parse-rb-mesh", { ruby_code: code }, { timeout: 35000 });
              if (!cancelled && parseRes.data?.success && parseRes.data?.model3d) {
                applyParsedModelToMesh(parseRes.data.model3d);
                setActiveVisualTab("3d");
              }
            }
          }
        } catch (e) {
          console.warn("[SignboardStudio] Không thể tải mã Ruby mặc định:", e);
        }
      }
    };

    loadDefaultSign();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Hook Render GenAI & Chỉnh sửa liên tục
  const renderGenAI = useStudioRenderGenAI({
    model3D,
    clientPrompt,
    canvasRef,
    setActiveVisualTab,
    setCurrentStep,
  });

  // Chọn mẫu thư viện: chỉ nạp 3D + mã Ruby
  const sampleMeshCacheRef = useRef<Map<string, Signboard3DModel>>(new Map());
  const sampleReqRef = useRef<string>("");
  const handleSelectSignSample = useCallback((sample: SignSampleItem) => {
    setSelectedSampleId(sample.id);
    setClientPrompt(sample.prompt);
    imageAndRuby.setGeneratedRubyCode(sample.ruby_code || "");

    const baseModel: Signboard3DModel = {
      name: sample.title,
      category: sample.category as Signboard3DModel["category"],
      category_label: sample.badge,
      description: sample.description,
      dimensions: sample.dimensions,
      elements: sample.elements || [],
      materials_spec: sample.materials,
      render_prompt: sample.prompt,
    };
    const cached = sampleMeshCacheRef.current.get(sample.id);
    applyParsedModelToMesh(cached || baseModel);
    setActiveVisualTab("3d");
    if (cached || !sample.ruby_code) return;

    sampleReqRef.current = sample.id;
    axiosClient
      .post("/ai/signboard/parse-rb-mesh", { ruby_code: sample.ruby_code }, { timeout: 30000 })
      .then((res) => {
        const m: Signboard3DModel | undefined = res.data?.model3d || res.data?.model_3d || res.data?.model;
        if (!m?.elements?.length || m.source !== "ruby_interpreter") return;
        const real: Signboard3DModel = { ...baseModel, elements: m.elements, dimensions: m.dimensions || baseModel.dimensions, source: m.source, warnings: m.warnings };
        sampleMeshCacheRef.current.set(sample.id, real);
        if (!mountedRef.current || sampleReqRef.current !== sample.id) return;
        applyParsedModelToMesh(real);
      })
      .catch((e) => console.warn("[Signboard3D] Không dựng được từ mã Ruby, dùng mô hình catalog:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyParsedModelToMesh]);

  // Load catalog mẫu
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let data: SignSampleItem[] = [];
      try {
        const res = await fetch("/signs/signs_catalog.json", { cache: "no-cache" });
        if (res.ok) data = await res.json();
      } catch (e) {
        console.warn("[Signboard3D] Không tải được catalog tĩnh:", e);
      }
      if (!Array.isArray(data) || data.length === 0) {
        try {
          const res = await axiosClient.get("/ai/signs/catalog", { timeout: 15000 });
          data = res.data?.catalog || [];
        } catch (e) {
          console.warn("[Signboard3D] Không tải được catalog API:", e);
        }
      }
      if (cancelled || !Array.isArray(data) || data.length === 0) return;
      const clean = data.map(sanitizeSample);
      setSignSamples(clean);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [handleSelectSignSample]);

  // Đổi vật liệu: cập nhật màu trên 3D
  const handleMaterialChange = (type: "iron" | "surface", key: string) => {
    if (type === "iron") setSelectedIron(key);
    if (type === "surface") setSelectedSurface(key);
    if (!model3D) return;

    const elements =
      type === "surface"
        ? model3D.elements.map((el) =>
            el.type !== "text" && el.type !== "line" && FACE_RE.test(el.name || "") ? { ...el, color: SURFACE_COLOR[key] || el.color } : el
          )
        : model3D.elements;

    setModel3D({
      ...model3D,
      elements,
      materials_spec: {
        ...model3D.materials_spec,
        iron_type: type === "iron" ? key : selectedIron,
        surface_type: type === "surface" ? key : selectedSurface,
      },
    });
  };

  // Điều chỉnh kích thước toàn khối 3 chiều (X, Y, Z) khi không chọn vật thể
  const handleUpdateModelDimensions = useCallback((newW: number, newH: number, newD: number) => {
    setModel3D((prev) => {
      if (!prev) return null;
      const oldW = Number(prev.dimensions?.width) || 1, oldH = Number(prev.dimensions?.height) || 1, oldD = Number(prev.dimensions?.depth) || 0.1;
      const safeW = Math.max(0.1, Number(newW) || 0.1), safeH = Math.max(0.1, Number(newH) || 0.1), safeD = Math.max(0.01, Number(newD) || 0.01);
      const rx = safeW / oldW, ry = safeH / oldH, rz = safeD / oldD;
      const scaledElements = (prev.elements || []).map((el) => ({
        ...el,
        position: el.position ? [Number((el.position[0] * rx).toFixed(4)), Number((el.position[1] * ry).toFixed(4)), Number((el.position[2] * rz).toFixed(4))] as [number, number, number] : el.position,
        scale: el.scale ? [Number((el.scale[0] * rx).toFixed(4)), Number((el.scale[1] * ry).toFixed(4)), Number((el.scale[2] * rz).toFixed(4))] as [number, number, number] : el.scale,
        base: el.base?.map((pt) => [Number((pt[0] * rx).toFixed(4)), Number((pt[1] * ry).toFixed(4)), Number((pt[2] * rz).toFixed(4))] as [number, number, number]),
        extrude: el.extrude ? [Number((el.extrude[0] * rx).toFixed(4)), Number((el.extrude[1] * ry).toFixed(4)), Number((el.extrude[2] * rz).toFixed(4))] as [number, number, number] : el.extrude,
      }));
      const scaledComponents = prev.components?.map((c) => {
        const u = (c.unit || "").toLowerCase();
        let m = 1;
        if (u.includes("m²") || u.includes("m2") || u.includes("tấm")) m = rx * ry;
        else if (u.includes("m³") || u.includes("m3") || u.includes("hố")) m = rx * ry * rz;
        else if (u.includes("m") || u.includes("mét dài") || u.includes("cây")) m = Math.max(rx, ry);
        const q = Number((c.quantity * m).toFixed(2));
        return { ...c, quantity: q > 0 ? q : c.quantity, total: c.unitPrice ? Math.round(q * c.unitPrice) : c.total };
      });
      const scaledLogistics = prev.logistics ? {
        ...prev.logistics,
        package_dimensions: `${safeW.toFixed(1)}m × ${safeH.toFixed(1)}m × ${safeD.toFixed(2)}m`,
        shipping_weight_text: prev.logistics.shipping_weight_kg ? `${Math.round(prev.logistics.shipping_weight_kg * rx * ry)} kg` : prev.logistics.shipping_weight_text,
      } : undefined;
      const nextM: Signboard3DModel = {
        ...prev,
        dimensions: { width: Number(safeW.toFixed(2)), height: Number(safeH.toFixed(2)), depth: Number(safeD.toFixed(3)) },
        elements: scaledElements,
        components: scaledComponents,
        logistics: scaledLogistics,
      };
      try { localStorage.removeItem("admake_pricing_item_overrides"); } catch {}
      window.dispatchEvent(new CustomEvent("admake_sync_pricing", { detail: { components: scaledComponents, dimensions: nextM.dimensions, logistics: scaledLogistics } }));
      return nextM;
    });
  }, []);

  const handleCopyZaloQuote = async () => {
    if (!quoteResult || !quoteParams) return;
    try {
      await navigator.clipboard.writeText(buildZaloQuoteText(quoteParams, quoteResult));
      message.success("Đã sao chép bảng báo giá chi tiết để gửi Zalo cho khách hàng!");
    } catch {
      message.error("Trình duyệt chặn quyền sao chép");
    }
  };

  const handlePrintQuote = () => {
    if (!quoteResult) return;
    printStudioQuote(model3D?.name || "Báo giá bảng hiệu", quoteResult);
  };

  const selectedSample = useMemo(
    () => signSamples.find((s) => s.id === selectedSampleId) || null,
    [signSamples, selectedSampleId]
  );

  return {
    currentStep,
    setCurrentStep,
    clientPrompt,
    setClientPrompt,
    isGenerating3D,
    handleGenerate3D,
    model3D,
    applyParsedModelToMesh,
    selectedIron,
    selectedSurface,
    hasLed,
    setHasLed,
    hasSheetBacking,
    setHasSheetBacking,
    handleMaterialChange,
    profitMargin,
    setProfitMargin,
    quoteResult,
    handleCopyZaloQuote,
    handlePrintQuote,
    canvasRef,
    activeVisualTab,
    setActiveVisualTab,
    signSamples,
    selectedSampleId,
    selectedSample,
    sampleCategoryFilter,
    setSampleCategoryFilter,
    handleSelectSignSample,
    // GenAI Render
    genAiJob: renderGenAI.genAiJob,
    isRendering: renderGenAI.isRendering,
    aspectRatio: renderGenAI.aspectRatio,
    setAspectRatio: renderGenAI.setAspectRatio,
    renderStyle: renderGenAI.renderStyle,
    setRenderStyle: renderGenAI.setRenderStyle,
    customEditPrompt: renderGenAI.customEditPrompt,
    setCustomEditPrompt: renderGenAI.setCustomEditPrompt,
    isEditing: renderGenAI.isEditing,
    renderHistory: renderGenAI.renderHistory,
    activeRenderUrl: renderGenAI.activeRenderUrl,
    setActiveRenderUrl: renderGenAI.setActiveRenderUrl,
    pins: renderGenAI.pins,
    setPins: renderGenAI.setPins,
    isPinMode: renderGenAI.isPinMode,
    setIsPinMode: renderGenAI.setIsPinMode,
    handleRenderGenAI: renderGenAI.handleRenderGenAI,
    handleContinuousEdit: renderGenAI.handleContinuousEdit,
    cancelRender: renderGenAI.cancelRender,
    addPinAt: renderGenAI.addPinAt,
    // Image & Ruby
    attachedImage: imageAndRuby.attachedImage,
    setAttachedImage: imageAndRuby.setAttachedImage,
    generatedRubyCode: imageAndRuby.generatedRubyCode,
    aiAnalysisText: imageAndRuby.aiAnalysisText,
    isAnalyzingVision: imageAndRuby.isAnalyzingVision,
    handleAnalyze: imageAndRuby.handleAnalyze,
    cancelAnalyze: imageAndRuby.cancelAnalyze,
    fileInputRef: imageAndRuby.fileInputRef,
    processImageFile: imageAndRuby.processImageFile,
    attachSampleImage: imageAndRuby.attachSampleImage,
    handleApplyRubyToMesh: imageAndRuby.handleApplyRubyToMesh,
    handleExportRubyFrom3D: imageAndRuby.handleExportRubyFrom3D,
    handleCopyRubyCode: imageAndRuby.handleCopyRubyCode,
    handleDownloadRubyFile: imageAndRuby.handleDownloadRubyFile,
    // 3D Editor 3ds Max Controls
    editorMode,
    setEditorMode: handleSetEditorMode,
    editorSpace,
    setEditorSpace: handleSetEditorSpace,
    editorSnap,
    setEditorSnap: handleSetEditorSnap,
    editorSelection,
    setEditorSelection,
    handleUpdateTransform,
    handleApplyMaterialToSelection,
    handleUpdateMaterialProperties,
    handleOpenAddTextModal,
    handleOpenEditTextModal,
    handleUpdateTextParams,
    snapToSurface,
    handleToggleSnapToSurface,
    handleDeleteSelected,
    handleResetTransform,
    handleUndo,
    handleDeselect,
    handleUpdateModelDimensions,
  };
}
