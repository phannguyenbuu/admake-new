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
  ClipboardList,
  Check,
  X,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    step: 1,
    label: "1. Khảo Sát",
    icon: ClipboardList,
    bgColor: "#1E88E5", // Blue (from 2020)
    hoverColor: "#1976D2",
    lineColor: "#1E88E5",
  },
  {
    step: 2,
    label: "2. Mô hình 3D",
    icon: Box,
    bgColor: "#42A5F5", // Sky Blue (from 2021)
    hoverColor: "#2196F3",
    lineColor: "#42A5F5",
  },
  {
    step: 3,
    label: "3. Chọn Vật Liệu",
    icon: Layers,
    bgColor: "#66BB6A", // Green (from 2022)
    hoverColor: "#4CAF50",
    lineColor: "#66BB6A",
  },
  {
    step: 4,
    label: "4. Chỉnh Sửa",
    icon: Edit3,
    bgColor: "#FFA726", // Amber / Orange (from 2023)
    hoverColor: "#FB8C00",
    lineColor: "#FFA726",
  },
  {
    step: 5,
    label: "5. Render GenAI",
    icon: ImageIcon,
    bgColor: "#EF5350", // Salmon / Coral (from 2024)
    hoverColor: "#E53935",
    lineColor: "#EF5350",
  },
  {
    step: 6,
    label: "6. Báo Giá AI",
    icon: FileSpreadsheet,
    bgColor: "#E53935", // Crimson Red (from 2025)
    hoverColor: "#D32F2F",
    lineColor: "#E53935",
  },
];

export interface Signboard3DStudioProps {
  onClose?: () => void;
}

export const Signboard3DStudio: React.FC<Signboard3DStudioProps> = ({ onClose }) => {
  // Navigation Steps
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Request & Hints
  const [clientPrompt, setClientPrompt] = useState<string>(
    "Biển vẫy hộp đèn chữ nhật gắn tường 2 mặt phát sáng màu vàng rực rỡ kích thước 1.2m x 0.5m, khung nhôm đen sang trọng, chữ đen BEAUTIFUL SIGNBOARD gắn mặt tiền shop."
  );
  const [hints, setHints] = useState<SignboardHint[]>([]);
  const [selectedHintId, setSelectedHintId] = useState<string>("sample_blade_yellow");
  const [isGenerating3D, setIsGenerating3D] = useState<boolean>(false);

  // Step 2 & 3: 3D Model & Materials
  const [model3D, setModel3D] = useState<Signboard3DModel | null>(null);
  const [selectedIron, setSelectedIron] = useState<string>("vuong_20");
  const [selectedSurface, setSelectedSurface] = useState<string>("mica_2_3mm");
  const [hasSheetBacking, setHasSheetBacking] = useState<boolean>(false);
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

  // Áp dụng trực tiếp Mẫu vào mô hình 3D thực tế
  const applySampleTo3D = (hint: SignboardHint) => {
    setSelectedHintId(hint.id);
    setClientPrompt(hint.prompt);

    if (hint.elements && hint.elements.length > 0) {
      const initialModel: Signboard3DModel = {
        name: hint.title,
        category: hint.category,
        category_label: hint.badge,
        description: hint.description,
        dimensions: hint.dimensions,
        elements: hint.elements,
        materials_spec: {
          iron_type: hint.materials.iron_type,
          surface_type: hint.materials.surface_type,
          has_led: hint.materials.has_led,
          has_sheet_backing: hint.materials.has_sheet_backing,
        },
        render_prompt: hint.prompt,
      };

      setModel3D(initialModel);
      setSelectedIron(hint.materials.iron_type);
      setSelectedSurface(hint.materials.surface_type);
      setHasLed(hint.materials.has_led);
      setHasSheetBacking(hint.materials.has_sheet_backing);

      updateQuote(
        hint.dimensions.width,
        hint.dimensions.height,
        hint.materials.iron_type,
        hint.materials.surface_type,
        profitMargin
      );
    }
  };

  // Load Hints ban đầu và tự động nạp mẫu đầu tiên
  useEffect(() => {
    genAISignboardService.getSignboardHints().then((list) => {
      setHints(list);
      if (list.length > 0 && !model3D) {
        applySampleTo3D(list[0]);
      }
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

  // 4 & 5. Ra ảnh render phối cảnh bằng GenAI API (Bước 5)
  const handleRenderGenAI = async () => {
    if (!model3D) {
      message.warning("Vui lòng tạo mô hình 3D trước khi render");
      return;
    }

    setIsRendering(true);
    setCurrentStep(5);
    try {
      const renderPrompt =
        customEditPrompt.trim() ||
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

  // 5. Chỉnh sửa liên tục bằng GenAI (Full hoặc Inpaint) - Chuyển sang Bước 5 hiển thị
  const handleContinuousEdit = async () => {
    if (!activeRenderUrl) {
      message.info("Chưa có bản render trước, đang tiến hành tạo render đầu tiên...");
      await handleRenderGenAI();
      return;
    }
    if (!customEditPrompt.trim() && pins.length === 0) {
      message.warning("Vui lòng nhập mô tả chỉnh sửa hoặc cắm mốc ghi chú (pins) trên ảnh");
      return;
    }

    setIsEditing(true);
    setCurrentStep(5);
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
      {/* Chevron Arrow Timeline Stepper (Timeline phong cách mũi tên đa sắc) */}
      <div className="flex items-center justify-between w-full pb-3 border-b border-slate-200">
        <div className="flex-1 flex items-center justify-center overflow-x-auto py-1 px-1">
          <div className="flex items-center">
            {WORKFLOW_STEPS.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <div key={item.step} className="relative flex flex-col items-center">
                  {/* Top Guideline Marker (Đường gióng timeline trên) */}
                  <div
                    className={`w-0.5 transition-all ${
                      isActive ? "h-2 w-1 opacity-100" : "h-1 opacity-35"
                    }`}
                    style={{ backgroundColor: item.lineColor }}
                  />

                  {/* Chevron Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(item.step)}
                    style={{
                      backgroundColor: item.bgColor,
                      clipPath:
                        "polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)",
                      marginLeft: index === 0 ? "0px" : "-10px",
                      zIndex: isActive ? 30 : 20 - index,
                    }}
                    className={`relative flex items-center justify-center gap-1.5 h-9 md:h-10 pl-5 md:pl-6 pr-4 md:pr-5 text-white text-xs md:text-[13px] whitespace-nowrap cursor-pointer transition-all duration-200 select-none ${
                      isActive
                        ? "scale-105 shadow-md brightness-110 ring-2 ring-white/90 font-black tracking-wide"
                        : isCompleted
                        ? "opacity-90 hover:opacity-100 hover:brightness-105 font-bold"
                        : "opacity-75 hover:opacity-100 hover:brightness-105 font-medium"
                    }`}
                    title={`Bước ${item.step}: ${item.label}`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-white shadow-xs animate-pulse inline-block mr-0.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 opacity-90" />
                    )}
                    <span>{item.label}</span>
                  </button>

                  {/* Bottom Guideline Marker (Đường gióng timeline dưới) */}
                  <div
                    className={`w-0.5 transition-all ${
                      isActive ? "h-2 w-1 opacity-100" : "h-1 opacity-35"
                    }`}
                    style={{ backgroundColor: item.lineColor }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-3 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 cursor-pointer shrink-0"
            title="Đóng AI Studio"
          >
            <X className="w-4 h-4 font-bold" />
          </button>
        )}
      </div>

      {/* Main Content Area based on currentStep */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column (Controls & Inputs) */}
        <div className="lg:col-span-5 flex flex-col space-y-5 bg-slate-50/70 p-4 md:p-5 rounded-2xl border border-slate-200">
          {/* STEP 1: KHẢO SÁT & YÊU CẦU KHÁCH HÀNG */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" /> 1. Khảo Sát Yêu Cầu Khách Hàng
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

              {/* Categorized Sample Signboards List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-600 font-semibold block">
                    Hoặc chọn nhanh từ Thư viện Mẫu Bảng Hiệu Tham Khảo:
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">({hints.length} mẫu)</span>
                </div>
                <div className="max-h-[440px] overflow-y-auto grid grid-cols-2 gap-2.5 pr-1 custom-scrollbar">
                  {hints.map((hint) => {
                    const isSelected = selectedHintId === hint.id;
                    return (
                      <div
                        key={hint.id}
                        onClick={() => applySampleTo3D(hint)}
                        title={hint.title}
                        className={`group relative p-2 rounded-xl border text-xs cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? "bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-400/60"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 hover:shadow-2xs"
                        }`}
                      >
                        {/* Hình ảnh bảng hiệu to rõ */}
                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200/70 shrink-0">
                          {hint.image_url ? (
                            <img
                              src={hint.image_url}
                              alt={hint.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-100">
                              3D
                            </div>
                          )}

                          {/* Dấu tích chọn */}
                          {isSelected && (
                            <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs z-10">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}

                          {/* Badge phân loại */}
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-black/60 backdrop-blur-xs text-white shadow-2xs">
                              {hint.badge}
                            </span>
                          </div>
                        </div>

                        {/* Thông tin: Tiêu đề & Kích thước (Ẩn phần hint mô tả theo yêu cầu) */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div
                            className={`font-bold text-[12px] line-clamp-2 leading-snug transition-colors ${
                              isSelected ? "text-blue-900" : "text-slate-800 group-hover:text-blue-600"
                            }`}
                          >
                            {hint.title}
                          </div>
                          <div className="text-[10px] text-blue-600 font-semibold mt-1.5 flex items-center gap-1">
                            <span>📐 {hint.dimensions.width}m × {hint.dimensions.height}m</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

          {/* STEP 2: MÔ HÌNH 3D & KẾT CẤU WEBGL */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="w-4 h-4" /> 2. Mô Hình 3D & Kết Cấu WebGL
                </span>
                <Tag color="cyan">Khung Không Gian 3D</Tag>
              </div>

              {/* Thông số kích thước thực tế */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2.5 shadow-2xs">
                <div className="font-bold text-slate-800 text-[13px]">
                  {model3D?.name || "Mô hình bảng hiệu 3D"}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
                  <div>
                    Kích thước: <strong className="text-slate-800">{model3D?.dimensions.width || 6}m × {model3D?.dimensions.height || 2.5}m</strong>
                  </div>
                  <div>
                    Độ dày hộp: <strong className="text-slate-800">{model3D?.dimensions.depth || 0.25}m</strong>
                  </div>
                  <div>
                    Diện tích mặt: <strong className="text-blue-600 font-bold">{((model3D?.dimensions.width || 6) * (model3D?.dimensions.height || 2.5)).toFixed(1)} m²</strong>
                  </div>
                  <div>
                    Phân loại: <strong className="text-slate-800">{model3D?.category_label || "Mặt tiền"}</strong>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn tương tác 3D */}
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100 text-xs text-sky-800 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-sky-900">
                  💡 Thao tác trực tiếp trên khung 3D bên phải:
                </div>
                <p className="m-0 text-[11px] leading-relaxed text-sky-700">
                  • <strong>Kéo chuột trái:</strong> Xoay góc nhìn 360 độ.<br />
                  • <strong>Lăn chuột giữa:</strong> Phóng to / Thu nhỏ chi tiết.<br />
                  • <strong>Kéo chuột phải:</strong> Di chuyển vị trí góc quan sát.<br />
                  • <strong>Nút Chụp 3D:</strong> Lưu góc phối cảnh làm hình ảnh tham chiếu.
                </p>
              </div>

              {/* Nút chuyển sang Bước 3 */}
              <Button
                type="primary"
                size="large"
                onClick={() => setCurrentStep(3)}
                className="w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 font-bold h-11 rounded-xl shadow-xs text-white border-none cursor-pointer"
              >
                Tiến Hành Chọn Vật Liệu (Bước 3) →
              </Button>
            </div>
          )}

          {/* STEP 3: CHỌN VẬT LIỆU ADMAKE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> 3. Chọn Vật Liệu Từ Kho Admake
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
                      ? "bg-blue-50 border-blue-500 text-blue-800 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🛡️ Tôn Lót Mặt Sau: {hasSheetBacking ? "Có" : "Không"}
                </button>
              </div>

              {/* Nút chuyển sang Bước 4 (Chỉnh Sửa) hoặc Render ngay (Bước 5) */}
              <div className="space-y-2 pt-2">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setCurrentStep(4)}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 font-bold h-11 rounded-xl shadow-xs text-white border-none cursor-pointer"
                >
                  Tiến Hành Chỉnh Sửa Phối Cảnh (Bước 4) →
                </Button>
                <Button
                  onClick={handleRenderGenAI}
                  loading={isRendering}
                  className="w-full bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-bold h-10 rounded-xl"
                >
                  ⚡ Hoặc Render Ngay (Bước 5) →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: CHỈNH SỬA PHỐI CẢNH & CHI TIẾT */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" /> 4. Chỉnh Sửa Phối Cảnh & Chi Tiết
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
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:border-blue-500 font-medium"
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
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:border-blue-500 font-medium"
                  >
                    <option value="Photorealistic Architectural">Kiến trúc chân thực ban ngày</option>
                    <option value="Night Lights Neon">Đêm rực rỡ đèn LED</option>
                    <option value="Golden Hour Sunset">Hoàng hôn nắng vàng</option>
                    <option value="Commercial High-end">Thương mại cao cấp sang trọng</option>
                  </select>
                </div>
              </div>

              {/* Input Chỉnh Sửa Tiếp */}
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">
                  Nhập yêu cầu sửa ảnh (Prompt Update):
                </label>
                <Input.TextArea
                  rows={3}
                  value={customEditPrompt}
                  onChange={(e) => setCustomEditPrompt(e.target.value)}
                  placeholder="VD: Đổi chữ nổi sang màu vàng gold sáng bóng, led hắt chân màu vàng ấm, thêm cây xanh trang trí mặt tiền..."
                  className="bg-white border-slate-300 text-slate-800 rounded-xl focus:border-blue-500 text-xs"
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

              {/* Nút Render Phối Cảnh sang Bước 5 */}
              <Button
                type="primary"
                size="large"
                loading={isEditing || isRendering}
                onClick={async () => {
                  if (activeRenderUrl && (customEditPrompt.trim() || pins.length > 0)) {
                    await handleContinuousEdit();
                  } else {
                    await handleRenderGenAI();
                  }
                }}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 font-bold h-11 rounded-xl shadow-xs text-white border-none cursor-pointer"
              >
                🎨 Tiến Hành Render Phối Cảnh Thực Tế (Bước 5) →
              </Button>

              <div className="flex justify-between items-center pt-1 text-xs">
                <Button onClick={() => setCurrentStep(3)} className="text-slate-600">
                  ← Quay lại Chọn Vật Liệu (Bước 3)
                </Button>
                {activeRenderUrl && (
                  <Button onClick={() => setCurrentStep(5)} type="link" className="text-blue-600 font-semibold p-0">
                    Xem kết quả Render gần nhất →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: KẾT QUẢ RENDER PHỐI CẢNH GENAI */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> 5. Kết Quả Render Phối Cảnh GenAI
                </span>
                <Tag color="green">GenAI 4K Ultra HD</Tag>
              </div>

              {/* Trạng thái công việc render */}
              {genAiJob && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Trạng thái:</span>
                    <strong className="text-blue-600">{genAiJob.current_step || "Đang xử lý"}</strong>
                  </div>
                  <Progress
                    percent={genAiJob.progress || 20}
                    status={genAiJob.status === "completed" ? "success" : "active"}
                    strokeColor={{ "0%": "#2563eb", "100%": "#10b981" }}
                  />
                </div>
              )}

              {/* Thông số phối cảnh */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700 shadow-2xs">
                <div className="font-bold text-slate-800">Thông số bản render:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
                  <div>Tỷ lệ: <strong className="text-slate-800">{aspectRatio}</strong></div>
                  <div>Độ nét: <strong className="text-emerald-600">4K Ultra HD (300 DPI)</strong></div>
                  <div className="col-span-2">Phong cách: <strong className="text-slate-800">{renderStyle}</strong></div>
                </div>
              </div>

              {/* Thao tác Render & Chuyển bước */}
              <div className="space-y-2 pt-2">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setCurrentStep(6)}
                  className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-red-700 hover:from-rose-500 hover:to-red-600 font-bold h-11 rounded-xl shadow-xs text-white border-none cursor-pointer"
                >
                  💰 Tiến Hành Báo Giá & Dự Toán (Bước 6) →
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setCurrentStep(4)}
                    className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-bold rounded-xl h-10"
                  >
                    ✏️ Chỉnh Sửa Tiếp (Bước 4)
                  </Button>
                  <Button
                    onClick={handleRenderGenAI}
                    loading={isRendering}
                    className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-bold rounded-xl h-10"
                  >
                    🔄 Render Lại Bản Khác
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DỰ TOÁN BÁO GIÁ VÀ LỢI NHUẬN */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> 6. Báo Giá & Điều Chỉnh Lợi Nhuận
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

              <div className="text-center pt-2">
                <Button onClick={() => setCurrentStep(5)} type="link" className="text-xs text-blue-600">
                  ← Xem lại Bản Render Phối Cảnh (Bước 5)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Visual Display: 3D Canvas / GenAI Render / Result Card) */}
        <div className="lg:col-span-7 flex flex-col min-h-[580px] lg:min-h-[660px]">
          {/* Main Visualizer Box - Mở Canvas tràn viền 100% không border, các thông tin dùng floater nền xanh rêu Admake 75% */}
          <div className="relative flex-1 w-full h-full min-h-[580px] lg:min-h-[660px] rounded-2xl overflow-hidden border-0 bg-slate-900 shadow-md flex flex-col group">
            
            {/* 1. Floater Góc Trên Trái: Chuyển Đổi Tab & Badge Thông Số Kích Thước Thực */}
            <div
              className="absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-2 p-1.5 rounded-2xl shadow-lg backdrop-blur-md border border-white/30 text-white"
              style={{ backgroundColor: "rgba(0, 180, 182, 0.75)" }}
            >
              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentStep <= 3
                      ? "bg-white text-[#006e70] shadow-sm font-extrabold"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>🧊</span>
                  <span>Mô Hình 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(activeRenderUrl ? 5 : 4)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentStep >= 4
                      ? "bg-white text-[#006e70] shadow-sm font-extrabold"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>🎨</span>
                  <span>Phối Cảnh GenAI</span>
                </button>
              </div>

              {/* Dimension Specs Badge */}
              {model3D && (
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="font-extrabold uppercase text-[11px] tracking-wide text-white">
                    {model3D.category_label || "Bảng hiệu 3D"}
                  </span>
                  <span className="text-white/95 font-mono text-[11px]">
                    {model3D.dimensions.width}m × {model3D.dimensions.height}m × {Math.round(model3D.dimensions.depth * 1000)}mm
                  </span>
                  <span className="bg-white/25 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {(model3D.dimensions.width * model3D.dimensions.height).toFixed(1)} m²
                  </span>
                </div>
              )}

              {/* GenAI status if job is processing */}
              {genAiJob && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/25 rounded-lg text-[11px] text-white">
                  <span>{genAiJob.current_step}</span>
                  <span className="text-emerald-300 font-bold">({genAiJob.progress}%)</span>
                </div>
              )}
            </div>

            {/* 2. Content: 3D Canvas hoặc GenAI Image Display (Tràn viền 100%) */}
            <div className="relative w-full h-full flex-1 flex items-center justify-center">
              {currentStep <= 3 || !activeRenderUrl ? (
                // Three.js 3D Viewer tràn viền 100%
                <div className="w-full h-full flex-1">
                  <Signboard3DCanvas
                    model={model3D}
                    onSnapshot={(dataUrl) => {
                      setCaptured3DSnapshot(dataUrl);
                      message.success("Đã chụp lại góc nhìn 3D làm hình ảnh tham chiếu!");
                    }}
                    className="w-full h-full min-h-[580px] lg:min-h-[660px]"
                  />
                </div>
              ) : (
                // GenAI Rendered Image Display with Inpainting Pin support
                <div
                  onClick={handleImageClick}
                  className={`relative w-full h-full min-h-[580px] lg:min-h-[660px] flex items-center justify-center bg-slate-950 ${
                    isPinMode ? "cursor-crosshair" : "cursor-default"
                  }`}
                >
                  <img
                    src={activeRenderUrl}
                    alt="GenAI Phối Cảnh Thực Tế"
                    className="max-h-[640px] w-auto max-w-full object-contain block select-none rounded-xl"
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
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 p-4 z-30">
                      <Spin size="large" />
                      <div className="text-sm font-bold text-white">
                        {genAiJob?.current_step || "Đang xử lý qua GenAI..."}
                      </div>
                      <Progress
                        percent={genAiJob?.progress || 20}
                        status="active"
                        strokeColor={{ "0%": "#00B4B6", "100%": "#10b981" }}
                        className="w-64"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Floater Lịch Sử Render Carousel (khi xem GenAI và có lịch sử) */}
            {renderHistory.length > 0 && currentStep >= 4 && (
              <div
                className="absolute bottom-20 left-3.5 z-20 p-2 rounded-xl border border-white/30 shadow-lg backdrop-blur-md flex items-center gap-2 overflow-x-auto max-w-[85%]"
                style={{ backgroundColor: "rgba(0, 180, 182, 0.75)" }}
              >
                <span className="text-[11px] text-white font-bold shrink-0">Lịch sử:</span>
                {renderHistory.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveRenderUrl(url)}
                    className={`h-12 w-16 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                      activeRenderUrl === url ? "border-white scale-105 shadow-md" : "border-white/40 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* 4. Floater Dưới Đáy: Quy Cách & Báo Giá Nhanh */}
            {quoteResult && (
              <div
                className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md border border-white/30 text-white"
                style={{ backgroundColor: "rgba(0, 180, 182, 0.75)" }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/80 font-medium">Quy cách:</span>
                  <span className="font-extrabold text-white">{quoteResult.materials.surface.name}</span>
                  <span className="text-white/60">•</span>
                  <span className="font-extrabold text-white">{quoteResult.materials.iron_frame.name}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="hidden md:inline text-white/90">
                    Đơn giá/m²: <strong className="text-amber-200 font-mono font-bold">{formatVND(quoteResult.summary.price_per_sqm)}</strong>
                  </span>
                  <span>
                    Tổng thành tiền: <strong className="text-white text-sm sm:text-base font-black font-mono drop-shadow-xs">{formatVND(quoteResult.summary.quote_price)}</strong>
                  </span>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setCurrentStep(6)}
                    className="bg-white hover:bg-slate-100 text-[#006e70] font-black rounded-xl border-none shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all text-xs h-8 px-3"
                  >
                    Xem Báo Giá
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
