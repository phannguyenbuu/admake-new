import React, { useState, useEffect } from "react";
import {
  Signboard3DCanvas,
} from "./Signboard3DCanvas";
import {
  genAISignboardService,
  type Signboard3DModel,
  type SignboardHint,
  type GenAIJob,
  type InpaintPin,
} from "../../services/genaiSignboard.service";
import {
  PRICING_STANDARDS,
  formatVND,
  calculateSignboardQuote,
  generateAIPromptResponse,
  type SignboardQuoteResult,
} from "../../services/aiPricingEngine";
import {
  Input,
  Button,
  Tag,
  Tooltip,
  Progress,
  message,
  Tabs,
  Slider,
  Spin,
  Modal,
} from "antd";
import {
  Sparkles,
  Layers,
  Box,
  Image as ImageIcon,
  Edit3,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Printer,
  ChevronRight,
  RefreshCw,
  Send,
  Sliders,
  MapPin,
  ExternalLink,
  Download,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export const Signboard3DStudio: React.FC = () => {
  // Navigation Steps
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Request & Hints
  const [clientPrompt, setClientPrompt] = useState<string>(
    "Thiết kế bảng hiệu cafe Highlands mặt tiền 6m x 2.5m, ốp alu đen nhám, chữ nổi mica led sáng mặt"
  );
  const [hints, setHints] = useState<SignboardHint[]>([]);
  const [selectedHintId, setSelectedHintId] = useState<string>("store_alu_mica_led");
  const [isGenerating3D, setIsGenerating3D] = useState<boolean>(false);

  // Step 2 & 3: 3D Model & Materials
  const [model3D, setModel3D] = useState<Signboard3DModel | null>(null);
  const [selectedIron, setSelectedIron] = useState<string>("vuong_25");
  const [selectedSurface, setSelectedSurface] = useState<string>("alu_3mm");
  const [hasSheetBacking, setHasSheetBacking] = useState<boolean>(true);
  const [hasLed, setHasLed] = useState<boolean>(true);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [captured3DSnapshot, setCaptured3DSnapshot] = useState<string | null>(null);

  // Step 4 & 5: GenAI Rendering & Continuous Editing
  const [genAiJob, setGenAiJob] = useState<GenAIJob | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [renderStyle, setRenderStyle] = useState<string>("Photorealistic Architectural");
  const [customEditPrompt, setCustomEditPrompt] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [renderHistory, setRenderHistory] = useState<string[]>([]);
  const [activeRenderUrl, setActiveRenderUrl] = useState<string | null>(null);

  // Inpaint Pins
  const [pins, setPins] = useState<InpaintPin[]>([]);
  const [isPinMode, setIsPinMode] = useState<boolean>(false);

  // Step 6: Calculation Result
  const [quoteResult, setQuoteResult] = useState<SignboardQuoteResult | null>(null);

  // Load Hints ban đầu
  useEffect(() => {
    genAISignboardService.getSignboardHints().then((list) => {
      setHints(list);
    });
  }, []);

  // 1. Sinh mô hình 3D từ Gemini API
  const handleGenerate3D = async (hint?: SignboardHint) => {
    const promptToUse = hint ? hint.prompt : clientPrompt;
    if (!promptToUse.trim()) {
      message.warning("Vui lòng nhập mô tả yêu cầu hoặc chọn một mẫu bảng hiệu!");
      return;
    }

    setIsGenerating3D(true);
    try {
      const generated = await genAISignboardService.generate3DModel({
        prompt: promptToUse,
        hint_id: hint ? hint.id : selectedHintId,
      });

      setModel3D(generated);
      setSelectedIron(generated.materials_spec?.iron_type || "vuong_25");
      setSelectedSurface(generated.materials_spec?.surface_type || "alu_3mm");
      setHasLed(Boolean(generated.materials_spec?.has_led));
      setHasSheetBacking(Boolean(generated.materials_spec?.has_sheet_backing));

      // Tính dự toán ban đầu
      updateQuote(
        generated.dimensions.width,
        generated.dimensions.height,
        generated.materials_spec?.iron_type || "vuong_25",
        generated.materials_spec?.surface_type || "alu_3mm",
        profitMargin
      );

      message.success("✨ Đã tạo mô hình 3D thành công bằng Gemini AI!");
      setCurrentStep(2);
    } catch (err: any) {
      message.error(err.message || "Lỗi khi sinh mô hình 3D");
    } finally {
      setIsGenerating3D(false);
    }
  };

  // Cập nhật lại báo giá khi đổi vật tư hoặc kích thước
  const updateQuote = (
    w: number,
    h: number,
    ironType: string,
    surfaceType: string,
    margin: number
  ) => {
    const res = calculateSignboardQuote({
      width: w,
      height: h,
      iron_type: ironType,
      surface_type: surfaceType,
      has_sheet_backing: hasSheetBacking,
      has_reinforce_iron: w >= 8,
      location: "outdoor",
      use_scaffolding: h >= 3,
      profit_margin: margin,
    });
    setQuoteResult(res);
  };

  // Đổi vật liệu trực tiếp từ kho Admake
  const handleMaterialChange = (type: "iron" | "surface", key: string) => {
    if (type === "iron") setSelectedIron(key);
    if (type === "surface") setSelectedSurface(key);

    if (model3D) {
      const updatedElements = model3D.elements.map((el) => {
        if (type === "surface" && (el.name.includes("Mặt") || el.name.includes("bảng"))) {
          const colorMap: Record<string, string> = {
            bat_hiflex: "#e2e8f0",
            bat_2da: "#64748b",
            bat_khong_gan_uv: "#f8fafc",
            bat_3m_uv: "#0284c7",
            alu_3mm: "#1e293b",
            alu_guong_vang: "#d97706",
            mica_2_3mm: "#dc2626",
          };
          return { ...el, color: colorMap[key] || el.color };
        }
        return el;
      });

      setModel3D({
        ...model3D,
        elements: updatedElements,
        materials_spec: {
          ...model3D.materials_spec,
          iron_type: type === "iron" ? key : selectedIron,
          surface_type: type === "surface" ? key : selectedSurface,
        },
      });

      updateQuote(
        model3D.dimensions.width,
        model3D.dimensions.height,
        type === "iron" ? key : selectedIron,
        type === "surface" ? key : selectedSurface,
        profitMargin
      );
      message.info("Đã cập nhật vật liệu trên mô hình 3D & chi phí dự toán");
    }
  };

  // 4. Ra ảnh render phối cảnh bằng GenAI API
  const handleRenderGenAI = async () => {
    if (!model3D) {
      message.warning("Vui lòng tạo mô hình 3D trước khi render");
      return;
    }

    setIsRendering(true);
    setCurrentStep(4);
    try {
      const renderPrompt =
        model3D.render_prompt ||
        `Commercial architectural photograph of ${clientPrompt}, high-end modern street store, photorealistic, 8k resolution, crisp details, natural ambient daylight.`;

      message.loading({ content: "Đang gửi tác vụ đến GenAI Toolxprint Bridge...", key: "render" });
      const job = await genAISignboardService.createRenderJob({
        prompt: renderPrompt,
        style: renderStyle,
        aspect_ratio: aspectRatio,
      });

      setGenAiJob(job);

      // Polling chờ kết quả
      const finalJob = await genAISignboardService.waitForJob(job.id, (progressJob) => {
        setGenAiJob({ ...progressJob });
      });

      if (finalJob.result_image_url) {
        setActiveRenderUrl(finalJob.result_image_url);
        setRenderHistory((prev) => [finalJob.result_image_url!, ...prev]);
        message.success({ content: "🎉 Render phối cảnh thực tế hoàn tất!", key: "render" });
      }
    } catch (err: any) {
      message.error({ content: err.message || "Lỗi khi render phối cảnh", key: "render" });
    } finally {
      setIsRendering(false);
    }
  };

  // 5. Chỉnh sửa liên tục bằng GenAI (Full hoặc Inpaint)
  const handleContinuousEdit = async () => {
    if (!activeRenderUrl) {
      message.warning("Chưa có ảnh phối cảnh để chỉnh sửa");
      return;
    }
    if (!customEditPrompt.trim() && pins.length === 0) {
      message.warning("Vui lòng nhập mô tả chỉnh sửa hoặc cắm mốc ghi chú (pins) trên ảnh");
      return;
    }

    setIsEditing(true);
    try {
      let job: GenAIJob;
      message.loading({ content: "Đang tiến hành chỉnh sửa ảnh qua GenAI...", key: "edit" });

      if (pins.length > 0) {
        // Chỉnh sửa cục bộ theo pins (Inpainting)
        job = await genAISignboardService.editInpaintRenderJob({
          prompt: customEditPrompt,
          reference_images: [activeRenderUrl],
          pins: pins,
          preserve_surroundings: true,
          style: renderStyle,
          aspect_ratio: aspectRatio,
        });
      } else {
        // Chỉnh sửa toàn bộ
        job = await genAISignboardService.editFullRenderJob({
          prompt: customEditPrompt,
          reference_images: [activeRenderUrl],
          style: renderStyle,
          aspect_ratio: aspectRatio,
        });
      }

      setGenAiJob(job);

      const finalJob = await genAISignboardService.waitForJob(job.id, (p) => setGenAiJob({ ...p }));
      if (finalJob.result_image_url) {
        setActiveRenderUrl(finalJob.result_image_url);
        setRenderHistory((prev) => [finalJob.result_image_url!, ...prev]);
        setPins([]);
        setCustomEditPrompt("");
        message.success({ content: "✨ Đã hoàn thiện bản render mới!", key: "edit" });
      }
    } catch (err: any) {
      message.error({ content: err.message || "Lỗi khi chỉnh sửa phối cảnh", key: "edit" });
    } finally {
      setIsEditing(false);
    }
  };

  // Thêm pin khi click lên ảnh ở chế độ Inpaint Pin
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const note = window.prompt("Nhập nội dung cần chỉnh sửa tại vị trí này:");
    if (!note || !note.trim()) return;

    const newPin: InpaintPin = {
      order: pins.length + 1,
      xFormatted: `${x}%`,
      yFormatted: `${y}%`,
      text: note.trim(),
    };
    setPins([...pins, newPin]);
    message.success(`Đã đánh dấu điểm #${newPin.order}: ${newPin.text}`);
  };

  // Copy Báo giá gửi Zalo
  const handleCopyZaloQuote = () => {
    if (!quoteResult || !model3D) return;
    const text = generateAIPromptResponse(
      {
        width: model3D.dimensions.width,
        height: model3D.dimensions.height,
        iron_type: selectedIron,
        surface_type: selectedSurface,
        has_sheet_backing: hasSheetBacking,
        has_reinforce_iron: model3D.dimensions.width >= 8,
        location: "outdoor",
        use_scaffolding: model3D.dimensions.height >= 3,
        profit_margin: profitMargin,
      },
      quoteResult
    );
    navigator.clipboard.writeText(text);
    message.success("Đã sao chép bảng báo giá chi tiết để gửi Zalo cho khách hàng!");
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 rounded-2xl border border-slate-200 p-4 md:p-6 shadow-xs space-y-6">
      {/* Header Studio & Workflow Stepper */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Admake Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-xs border border-slate-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <img src="/ADMAKE.svg" alt="ADMAKE" className="h-7" />
              <h1 className="text-base md:text-lg font-black text-slate-800 tracking-tight m-0">
                3D SIGNBOARD AI STUDIO
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                GENAI 4K
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0">
              Quy trình tự động hóa: Hint Quảng Cáo → Mô Hình 3D → Vật Liệu Admake → Render GenAI → Tinh Chỉnh → Báo Giá
            </p>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
          {[
            { step: 1, label: "1. Khảo sát & Hint", icon: Lightbulb },
            { step: 2, label: "2. Mô hình 3D", icon: Box },
            { step: 3, label: "3. Chọn Vật Liệu", icon: Layers },
            { step: 4, label: "4. Render GenAI", icon: ImageIcon },
            { step: 5, label: "5. Sửa Liên Tục", icon: Edit3 },
            { step: 6, label: "6. Báo Giá AI", icon: FileSpreadsheet },
          ].map((item) => {
            const Icon = item.icon;
            const active = currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area based on currentStep */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column (Controls & Inputs) */}
        <div className="lg:col-span-5 flex flex-col space-y-5 bg-slate-50/70 p-4 md:p-5 rounded-2xl border border-slate-200">
          {/* STEP 1: YÊU CẦU & HINT CHUYÊN DỤNG */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> 1. Yêu Cầu Khách Hàng & Hint Quảng Cáo
                </span>
                <Tag color="blue">Từ Bảng Nhỏ Đến Billboard</Tag>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">
                  Nhập tự do yêu cầu của khách hàng:
                </label>
                <Input.TextArea
                  rows={3}
                  value={clientPrompt}
                  onChange={(e) => setClientPrompt(e.target.value)}
                  placeholder="VD: Làm bảng hiệu cafe Highlands mặt tiền 6m x 2.5m, ốp alu đen nhám, chữ nổi mica led sáng mặt..."
                  className="bg-white border-slate-300 text-slate-800 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Categorized Hints List */}
              <div className="space-y-2">
                <label className="text-xs text-slate-600 font-semibold block">
                  Hoặc chọn nhanh từ Thư viện Hint chuyên dụng:
                </label>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {hints.map((hint) => (
                    <div
                      key={hint.id}
                      onClick={() => {
                        setSelectedHintId(hint.id);
                        setClientPrompt(hint.prompt);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedHintId === hint.id
                          ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-300"
                          : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{hint.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-slate-100 text-slate-700">
                          {hint.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 m-0 line-clamp-2">{hint.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                loading={isGenerating3D}
                onClick={() => handleGenerate3D()}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 font-bold h-11 rounded-xl shadow-xs border-none cursor-pointer"
              >
                ⚡ Phân Tích & Sinh Mô Hình 3D (Gemini AI)
              </Button>
            </div>
          )}

          {/* STEP 2 & 3: MÔ HÌNH 3D & CHỌN VẬT LIỆU ADMAKE */}
          {(currentStep === 2 || currentStep === 3) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Chọn Vật Liệu Từ Kho Admake
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {model3D?.dimensions.width}m × {model3D?.dimensions.height}m
                </span>
              </div>

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
                          ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs font-bold"
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
                          ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs font-bold"
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
              <div className="flex flex-wrap gap-2 pt-2">
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
                      ? "bg-blue-50 border-blue-500 text-blue-800 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🛡️ Tôn Lót Mặt Sau: {hasSheetBacking ? "Có" : "Không"}
                </button>
              </div>

              {/* Nút Render GenAI */}
              <div className="pt-2">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleRenderGenAI}
                  loading={isRendering}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 font-bold h-11 rounded-xl shadow-xs text-white border-none cursor-pointer"
                >
                  🎨 Tiến Hành Render Phối Cảnh Thực Tế Bằng GenAI
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 & 5: GENAI RENDER & CHỈNH SỬA LIÊN TỤC */}
          {(currentStep === 4 || currentStep === 5) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" /> Chỉnh Sửa Phối Cảnh Liên Tục (GenAI)
                </span>
                <Tag color={isPinMode ? "orange" : "blue"}>{isPinMode ? "Đang Cắm Mốc (Pins)" : "Sửa Toàn Bộ"}</Tag>
              </div>

              {/* Tùy chọn Tỷ lệ & Phong cách */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 mb-1 block font-semibold">Tỷ lệ khung hình:</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:border-blue-500"
                  >
                    <option value="16:9">16:9 (Toàn cảnh rộng)</option>
                    <option value="4:3">4:3 (Tiêu chuẩn)</option>
                    <option value="1:1">1:1 (Vuông)</option>
                    <option value="9:16">9:16 (Dọc Story/TikTok)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 mb-1 block font-semibold">Ánh sáng / Phối cảnh:</label>
                  <select
                    value={renderStyle}
                    onChange={(e) => setRenderStyle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:border-blue-500"
                  >
                    <option value="Photorealistic Architectural">Kiến trúc chân thực</option>
                    <option value="Night Lights Neon">Đêm rực rỡ đèn LED</option>
                    <option value="Golden Hour Sunset">Hoàng hôn nắng vàng</option>
                    <option value="Commercial High-end">Thương mại cao cấp</option>
                  </select>
                </div>
              </div>

              {/* Input Chỉnh Sửa Tiếp */}
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">
                  Nhập yêu cầu sửa ảnh (Prompt Update):
                </label>
                <Input.TextArea
                  rows={2}
                  value={customEditPrompt}
                  onChange={(e) => setCustomEditPrompt(e.target.value)}
                  placeholder="VD: Đổi chữ nổi sang màu vàng gold, thêm xe cộ và người đi bộ trên vỉa hè..."
                  className="bg-white border-slate-300 text-slate-800 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Nút bật chế độ Cắm mốc (Inpainting Pins) */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-700">
                  Cắm mốc sửa cục bộ: <span className="font-bold text-amber-600">{pins.length} điểm</span>
                </span>
                <div className="flex gap-2">
                  {pins.length > 0 && (
                    <Button size="small" danger onClick={() => setPins([])}>
                      Xóa mốc
                    </Button>
                  )}
                  <Button
                    size="small"
                    type={isPinMode ? "primary" : "default"}
                    onClick={() => setIsPinMode(!isPinMode)}
                  >
                    {isPinMode ? "Tắt cắm mốc" : "Bật cắm mốc (Pins)"}
                  </Button>
                </div>
              </div>

              {/* Nút Chỉnh Sửa Tiếp Bằng GenAI */}
              <Button
                type="primary"
                size="large"
                loading={isEditing || isRendering}
                onClick={handleContinuousEdit}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold h-11 rounded-xl shadow-xs text-white border-none cursor-pointer"
              >
                ✨ Áp Dụng Thay Đổi & Sinh Bản Mới (GenAI)
              </Button>
            </div>
          )}

          {/* STEP 6: DỰ TOÁN BÁO GIÁ VÀ LỢI NHUẬN */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> Báo Giá & Điều Chỉnh Lợi Nhuận
                </span>
                <Tag color="green">Dự Toán AI</Tag>
              </div>

              {/* Điều chỉnh Tỷ Lệ Lợi Nhuận */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-semibold">Tỷ lệ lợi nhuận kỳ vọng:</span>
                  <span className="font-bold text-amber-600">{profitMargin}%</span>
                </div>
                <Slider
                  min={10}
                  max={60}
                  value={profitMargin}
                  onChange={(val) => {
                    setProfitMargin(val);
                    if (model3D) {
                      updateQuote(
                        model3D.dimensions.width,
                        model3D.dimensions.height,
                        selectedIron,
                        selectedSurface,
                        val
                      );
                    }
                  }}
                />
              </div>

              {/* Tóm Tắt Chi Phí */}
              {quoteResult && (
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs text-slate-700">
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng Chi Phí Vật Tư (A):</span>
                    <span className="font-mono font-semibold">{formatVND(quoteResult.materials.total_materials_cost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng Chi Phí Nhân Công (B):</span>
                    <span className="font-mono font-semibold">{formatVND(quoteResult.operations.total_operations_cost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                    <span>Giá Vốn Sản Xuất (A + B):</span>
                    <span className="font-mono font-bold text-slate-800">{formatVND(quoteResult.summary.cost_price)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Lợi Nhuận Kỳ Vọng ({profitMargin}%):</span>
                    <span className="font-mono">+{formatVND(quoteResult.summary.profit_amount)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-extrabold text-base border-t border-slate-200 pt-2">
                    <span>Tổng Giá Báo Khách:</span>
                    <span className="font-mono text-base">{formatVND(quoteResult.summary.quote_price)}</span>
                  </div>
                </div>
              )}

              {/* Thao Tác Báo Giá */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  onClick={handleCopyZaloQuote}
                  className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-blue-500 hover:text-blue-600 font-bold rounded-xl h-10 shadow-2xs"
                >
                  📋 Sao Chép Báo Giá
                </Button>
                <Button
                  type="primary"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-10 text-white shadow-xs"
                >
                  🖨️ In Bảng Dự Toán
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Visual Display: 3D Canvas / GenAI Render / Result Card) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Main Visualizer Box */}
          <div className="relative flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[480px]">
            {/* View Switcher Tabs: 3D View vs. GenAI Render */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    currentStep <= 3
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🧊 Mô Hình 3D WebGL
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    currentStep >= 4
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🎨 Phối Cảnh Thực Tế GenAI
                </button>
              </div>

              {genAiJob && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    Trạng thái: <strong className="text-blue-600">{genAiJob.current_step}</strong>
                  </span>
                  <span className="text-slate-400">({genAiJob.progress}%)</span>
                </div>
              )}
            </div>

            {/* Content: 3D Canvas hoặc GenAI Image Display */}
            <div className="relative flex-1 flex items-center justify-center p-3">
              {currentStep <= 3 || !activeRenderUrl ? (
                // Three.js 3D Viewer
                <div className="w-full h-full flex flex-col">
                  <Signboard3DCanvas
                    model={model3D}
                    onSnapshot={(dataUrl) => {
                      setCaptured3DSnapshot(dataUrl);
                      message.success("Đã chụp lại góc nhìn 3D làm hình ảnh tham chiếu!");
                    }}
                    className="w-full h-[460px]"
                  />
                </div>
              ) : (
                // GenAI Rendered Image Display with Inpainting Pin support
                <div
                  onClick={handleImageClick}
                  className={`relative max-w-full max-h-[500px] rounded-xl overflow-hidden shadow-md border border-slate-200 ${
                    isPinMode ? "cursor-crosshair" : "cursor-default"
                  }`}
                >
                  <img
                    src={activeRenderUrl}
                    alt="GenAI Phối Cảnh Thực Tế"
                    className="max-h-[480px] w-auto object-contain block rounded-lg select-none"
                  />

                  {/* Render Pins on Image */}
                  {pins.map((pin) => (
                    <div
                      key={pin.order}
                      style={{ left: pin.xFormatted, top: pin.yFormatted }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg animate-bounce">
                        {pin.order}
                      </div>
                    </div>
                  ))}

                  {/* Progress overlay when rendering */}
                  {(isRendering || isEditing) && (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 p-4">
                      <Spin size="large" />
                      <div className="text-sm font-bold text-blue-600">
                        {genAiJob?.current_step || "Đang xử lý qua GenAI..."}
                      </div>
                      <Progress
                        percent={genAiJob?.progress || 20}
                        status="active"
                        strokeColor={{ "0%": "#2563eb", "100%": "#10b981" }}
                        className="w-64"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History Thumbnails Carousel */}
            {renderHistory.length > 0 && (
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] text-slate-500 font-bold shrink-0">Lịch sử render:</span>
                {renderHistory.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveRenderUrl(url)}
                    className={`h-14 w-20 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                      activeRenderUrl === url ? "border-blue-600 scale-105" : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Summary Pill at Bottom */}
          {quoteResult && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Quy cách:</span>
                <span className="font-bold text-slate-800">{quoteResult.materials.surface.name}</span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-slate-800">{quoteResult.materials.iron_frame.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>
                  Đơn giá/m²: <strong className="text-amber-600">{formatVND(quoteResult.summary.price_per_sqm)}</strong>
                </span>
                <span>
                  Tổng thành tiền: <strong className="text-blue-700 text-sm font-bold">{formatVND(quoteResult.summary.quote_price)}</strong>
                </span>
                <Button size="small" type="primary" onClick={() => setCurrentStep(6)} className="bg-blue-600">
                  Xem Báo Giá
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
