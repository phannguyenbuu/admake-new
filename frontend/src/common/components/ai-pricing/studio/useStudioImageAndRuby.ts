import { useState, useEffect, useRef } from "react";
import axiosClient from "../../../services/axiosClient";
import { message } from "antd";
import type { AttachedImage } from "./types";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";
import { getErrorMessage, isAbortError, sanitizeBrand } from "./aiText";

interface UseStudioImageAndRubyProps {
  isActive: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  clientPrompt: string;
  model3D: Signboard3DModel | null;
  applyParsedModelToMesh: (m: Signboard3DModel) => void;
  setActiveVisualTab: (tab: "3d" | "genai" | "ruby") => void;
  handleGenerate3D: () => Promise<void>;
}

const VISION_MAX_WAIT_MS = 240000;
const VISION_POLL_MS = 2000;
const VISION_MAX_NET_ERRORS = 8;

const BASE_RUBY_PROMPT =
  "Bạn là Chuyên gia Kỹ thuật Kết cấu 3D, Kiến trúc & Kỹ sư Lập trình SketchUp Ruby API hàng đầu của ADMAKE.\n" +
  "Nhiệm vụ: Dựa vào hình ảnh đính kèm và yêu cầu, hãy nhận diện chính xác loại công trình (biển hiệu quảng cáo, quầy kệ, kiosk, hoặc công trình kiến trúc biệt thự, nhà ở, hồ bơi, cảnh quan) và thực hiện đầy đủ 2 phần bắt buộc:\n\n" +
  "PHẦN 1: BẢNG ĐÁNH GIÁ CẤU KIỆN & BÓC TÁCH VẬT TƯ THI CÔNG CHI TIẾT (BOM)\n" +
  "Đánh giá chính xác mô hình gồm bao nhiêu cấu kiện, tên gọi, kích thước chi tiết (Dài x Rộng x Cao/Dày hoặc Tiết diện) và quy cách vật tư để tính dự toán báo giá chính xác, không hời hợt:\n" +
  "Trình bày bảng Markdown rõ ràng với các cột:\n" +
  "| STT | Tên Cấu Kiện | Kích Thước (Quy Cách Kỹ Thuật) | Số Lượng | Đơn Vị | Quy Cách Vật Tư / Ghi Chú |\n\n" +
  "PHẦN 2: MÃ NGUỒN RUBY (.RB) HOÀN CHỈNH CHO SKETCHUP\n" +
  "- QUY TẮC BẮT BUỘC:\n" +
  "  1. TUYỆT ĐỐI KHÔNG TẠO FILE DOWNLOAD / FILE ĐÍNH KÈM / KHÔNG DÙNG PYTHON ĐỂ TẠO FILE. Toàn bộ mã nguồn Ruby BẮT BUỘC phải in trực tiếp dạng text trong khối ```ruby ... ```.\n" +
  "  2. TUYỆT ĐỐI DÙNG CÚ PHÁP RUBY 100%: KHÔNG viết nhầm cú pháp Python như 'for i in range(...):' hay thiếu 'end'. Trong Ruby luôn dùng '(1..n).each do |i| ... end' hoặc 'n.times do |i| ... end'.\n" +
  "  3. BẮT BUỘC chèn lại BẢNG THỐNG KÊ CẤU KIỆN Ở TRÊN vào KHỐI COMMENT NGAY ĐẦU TIÊN của khối Ruby để người dùng mở code là đọc được ngay.\n" +
  "  4. BẮT BUỘC viết đầy đủ 100% mã nguồn Ruby, đóng đủ tất cả các cặp def...end, module...end. TUYỆT ĐỐI KHÔNG ĐƯỢC VIẾT DỞ DANG, KHÔNG dùng 'load' file ngoài.\n" +
  "  5. Toàn bộ mã nguồn Ruby SketchUp hoàn chỉnh đặt trong duy nhất một khối ```ruby ... ```.";

class JobFailedError extends Error {}

function scoreRubyCode(code: string): number {
  if (!code) return -99999;
  let score = code.length;
  if (/entities|add_group|add_face|pushpull/.test(code)) score += 20000;
  if (/Sketchup|require 'sketchup\.rb'/.test(code)) score += 10000;
  if (/def\s+/.test(code) && /end/.test(code)) score += 5000;
  if (/^\s*load\s+/i.test(code) && code.length < 150) score -= 30000;
  return score;
}

function extractRuby(jobData: any): { ruby: string; text: string } {
  const text: string = jobData?.result_text || jobData?.text || jobData?.reply || "";
  const candidates: string[] = [];

  if (jobData?.ruby_code) candidates.push(jobData.ruby_code);

  const blocks: any[] = jobData?.result_code_blocks || jobData?.code_blocks || [];
  blocks.forEach((b) => {
    if (b?.code) candidates.push(String(b.code).trim());
  });

  if (text) {
    const matches = Array.from(text.matchAll(/```(?:ruby|rb)?\s*([\s\S]*?)```/gi));
    matches.forEach((m) => {
      if (m[1]) candidates.push(m[1].trim());
    });
  }

  let ruby = "";
  if (candidates.length > 0) {
    candidates.sort((a, b) => scoreRubyCode(b) - scoreRubyCode(a));
    ruby = candidates[0];
  }

  return { ruby, text };
}

export function useStudioImageAndRuby({
  isActive,
  currentStep,
  setCurrentStep,
  clientPrompt,
  model3D,
  applyParsedModelToMesh,
  setActiveVisualTab,
  handleGenerate3D,
}: UseStudioImageAndRubyProps) {
  // Ảnh khảo sát do NGƯỜI DÙNG tự đính kèm / dán. Ảnh mẫu thư viện không còn tự gán vào đây.
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [generatedRubyCode, setGeneratedRubyCode] = useState<string>("");
  const [aiAnalysisText, setAiAnalysisText] = useState<string>("");
  const [isAnalyzingVision, setIsAnalyzingVision] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Nén và chuẩn hóa ảnh tối ưu cho AI Vision
  const optimizeImageForVision = (dataUrl: string, maxDim = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        try {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Xử lý nạp ảnh từ File hoặc Blob
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chỉ chọn hoặc dán file hình ảnh (PNG, JPG, WEBP,...)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return;
      const optimizedUrl = await optimizeImageForVision(rawDataUrl);
      if (!mountedRef.current) return;
      setAttachedImage({
        dataUrl: optimizedUrl,
        name: file.name || "clipboard_image.jpg",
        size: Math.round((optimizedUrl.length * 3) / 4),
      });
      message.success("Đã nhận hình ảnh khảo sát!");
    };
    reader.onerror = () => message.error("Không đọc được file ảnh");
    reader.readAsDataURL(file);
  };

  // Dùng ảnh mẫu thư viện làm ảnh phân tích (chỉ khi người dùng chủ động bấm)
  const attachSampleImage = async (url: string, name: string) => {
    const dataUrl = await ensureImageAsBase64(url);
    const optimized = dataUrl.startsWith("data:") ? await optimizeImageForVision(dataUrl) : dataUrl;
    if (!mountedRef.current) return;
    setAttachedImage({ dataUrl: optimized, name, size: Math.round((optimized.length * 3) / 4) });
  };

  // Ctrl+V: CHỈ lắng nghe khi Studio đang mở và ở Bước 1 → không cướp ảnh dán ở các màn hình khác
  useEffect(() => {
    if (!isActive || currentStep !== 1) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isActive, currentStep]);

  // Hàm chuyển URL ảnh bất kỳ thành Base64 DataURL
  const ensureImageAsBase64 = async (imageInput: string): Promise<string> => {
    if (!imageInput) return "";
    if (imageInput.startsWith("data:")) return imageInput;
    try {
      const res = await fetch(imageInput);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(typeof reader.result === "string" && reader.result.startsWith("data:") ? reader.result : imageInput);
        reader.onerror = () => resolve(imageInput);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Không thể chuyển ảnh sang Base64:", e);
      return imageInput;
    }
  };

  // Phân tích mã Ruby (.rb) sang cấu trúc 3D Mesh
  const parseAndLoadRubyToMesh = async (rubyCode: string): Promise<Signboard3DModel | null> => {
    if (!rubyCode.trim()) return null;
    try {
      const res = await axiosClient.post("/ai/signboard/parse-rb-mesh", { ruby_code: rubyCode }, { timeout: 30000 });
      if (res.data?.success && res.data?.model3d) {
        const m = res.data.model3d as Signboard3DModel;
        if (mountedRef.current) applyParsedModelToMesh(m);
        return m;
      }
      if (res.data?.error) {
        throw new Error(res.data.error);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || "Lỗi khi biên dịch mã Ruby sang 3D";
      console.warn("Lỗi khi parse mã Ruby sang 3D:", errMsg);
      throw new Error(errMsg);
    }
    return null;
  };

  const sleep = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const t = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      signal.addEventListener("abort", onAbort, { once: true });
    });

  // Polling job Vision: thoát ngay khi failed, chịu được lỗi mạng tạm thời, hủy được khi đóng Studio
  const pollVisionJob = async (jobId: string, signal: AbortSignal): Promise<any> => {
    const start = Date.now();
    let netErrors = 0;
    while (Date.now() - start < VISION_MAX_WAIT_MS) {
      await sleep(netErrors > 0 ? VISION_POLL_MS * 1.5 : VISION_POLL_MS, signal);
      let jobData: any;
      try {
        const jobRes = await axiosClient.get(`/jobs/${jobId}`, { signal, timeout: 15000 });
        jobData = jobRes.data;
        netErrors = 0;
      } catch (err) {
        if (isAbortError(err)) throw err;
        netErrors += 1;
        console.warn(`[AI Vision] Lỗi kiểm tra job (${netErrors}/${VISION_MAX_NET_ERRORS})`, err);
        if (netErrors >= VISION_MAX_NET_ERRORS) {
          throw new Error("Mất kết nối tới máy chủ AI quá nhiều lần, vui lòng thử lại");
        }
        continue;
      }

      if (jobData?.status === "completed") return jobData;
      if (jobData?.status === "failed") {
        throw new JobFailedError(sanitizeBrand(jobData.error || jobData.current_step) || "Hệ thống AI gặp sự cố khi xử lý tác vụ.");
      }
      if (jobData?.current_step) console.log("[AI Vision Progress]", sanitizeBrand(jobData.current_step));
    }
    return null;
  };

  // Phân tích: có ảnh khảo sát → AI Vision sinh mã Ruby; không có → Gemini tạo 3D từ mô tả
  const handleAnalyze = async () => {
    if (isAnalyzingVision) return;
    if (!attachedImage) {
      await handleGenerate3D();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzingVision(true);
    message.loading({ content: "Đang phân tích hình ảnh và xây dựng mô hình 3D...", key: "ai_analyze_progress", duration: 0 });

    try {
      const finalPrompt = clientPrompt.trim()
        ? `${BASE_RUBY_PROMPT}\n\nYêu cầu bổ sung của khách hàng: ${clientPrompt.trim()}`
        : BASE_RUBY_PROMPT;

      const cleanBase64Image = await ensureImageAsBase64(attachedImage.dataUrl);

      const createRes = await axiosClient.post(
        "/ai/toolx/chat",
        { prompt: finalPrompt, images: [cleanBase64Image], new_chat: false, wait: false },
        { signal: controller.signal, timeout: 45000 }
      );

      const jobId = createRes.data?.job_id || createRes.data?.id;
      if (!jobId) {
        throw new Error(sanitizeBrand(createRes.data?.error) || "Không thể khởi tạo tác vụ phân tích hình ảnh.");
      }
      console.log("[AI Vision] Đã khởi tạo job:", jobId);

      const jobData = await pollVisionJob(jobId, controller.signal);
      if (!mountedRef.current) return;

      if (!jobData) {
        message.warning({
          content: "Tác vụ mất nhiều thời gian hơn dự kiến. Vui lòng kiểm tra AI Vision Bridge rồi thử lại.",
          key: "ai_analyze_progress",
        });
        return;
      }

      const { ruby, text } = extractRuby(jobData);
      if (!ruby && !text) throw new Error("AI không trả về nội dung nào");

      setAiAnalysisText(text);
      setGeneratedRubyCode(ruby || text);

      let loaded = false;
      let loadError: string | null = jobData.model3d_error || null;

      if (jobData.model3d && jobData.model3d.elements && jobData.model3d.elements.length > 0) {
        applyParsedModelToMesh(jobData.model3d);
        loaded = true;
      } else if (ruby) {
        try {
          const m = await parseAndLoadRubyToMesh(ruby);
          loaded = Boolean(m && m.elements && m.elements.length > 0);
        } catch (e: any) {
          loadError = e?.message || "Lỗi biên dịch mô hình 3D";
        }
      }

      if (loaded) {
        // Chỉ khi mô hình 3D thực sự được dựng thành công mới chuyển sang Bước 2: 3D Editor
        setActiveVisualTab("3d");
        setCurrentStep(2);
        message.success({
          content: "✨ Đã phân tích ảnh và dựng thành công mô hình 3D thực tế!",
          key: "ai_analyze_progress",
        });
      } else {
        message.error({
          content: `❌ ${loadError || "Mô hình do AI sinh ra không dựng được khối 3D nào. Vui lòng thử lại với góc ảnh khác!"}`,
          key: "ai_analyze_progress",
          duration: 6,
        });
      }
    } catch (err) {
      if (isAbortError(err)) {
        message.destroy("ai_analyze_progress");
        return;
      }
      console.error("Lỗi khi phân tích hình ảnh qua AI Vision:", err);
      message.error({
        content: getErrorMessage(err, "Không thể phân tích hình ảnh qua AI Vision Bridge. Vui lòng thử lại."),
        key: "ai_analyze_progress",
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      if (mountedRef.current) setIsAnalyzingVision(false);
    }
  };

  const cancelAnalyze = () => abortRef.current?.abort();

  // Nạp mô hình hiện tại vào 3D Mesh
  const handleApplyRubyToMesh = async () => {
    if (!generatedRubyCode.trim()) {
      message.warning("Chưa có dữ liệu mô hình để nạp vào 3D!");
      return;
    }
    message.loading({ content: "Đang nạp mô hình vào không gian 3D...", key: "load_3d" });
    const m = await parseAndLoadRubyToMesh(generatedRubyCode);
    if (m && m.elements && m.elements.length > 0) {
      try {
        localStorage.removeItem("admake_pricing_item_overrides");
      } catch {}
      window.dispatchEvent(
        new CustomEvent("admake_sync_pricing", {
          detail: { components: m.components, dimensions: m.dimensions, logistics: m.logistics },
        })
      );
      applyParsedModelToMesh(m);
      setActiveVisualTab("3d");
      setCurrentStep(2);
      message.success({ content: `✨ Đã nạp thành công ${m.elements.length} khối kết cấu vào 3D!`, key: "load_3d" });
    } else {
      message.error({ content: "Không thể phân tích mô hình này sang không gian 3D.", key: "load_3d" });
    }
  };

  // Xuất dữ liệu từ Mô hình 3D Mesh hiện tại
  const handleExportRubyFrom3D = async () => {
    if (!model3D) {
      message.warning("Chưa có mô hình 3D!");
      return;
    }
    message.loading({ content: "Đang xử lý dữ liệu mô hình 3D...", key: "export_3d" });
    try {
      const res = await axiosClient.post("/ai/signboard/generate-rb", { model: model3D }, { timeout: 30000 });
      if (res.data?.success && res.data?.ruby_code) {
        setGeneratedRubyCode(res.data.ruby_code);
        message.success({ content: "✨ Đã đồng bộ mô hình 3D thành công!", key: "export_3d" });
      } else {
        throw new Error(res.data?.error || "Không thể đồng bộ mô hình 3D.");
      }
    } catch (err) {
      message.error({ content: getErrorMessage(err, "Lỗi khi xử lý mô hình 3D"), key: "export_3d" });
    }
  };

  const handleCopyRubyCode = async () => {
    if (!generatedRubyCode) return;
    try {
      await navigator.clipboard.writeText(generatedRubyCode);
      message.success("Đã sao chép thông tin mô hình vào bộ nhớ tạm!");
    } catch {
      message.error("Trình duyệt chặn quyền sao chép, vui lòng bôi đen và Ctrl+C");
    }
  };

  const handleDownloadRubyFile = () => {
    if (!generatedRubyCode) return;
    const blob = new Blob([generatedRubyCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signboard_sketchup_${Date.now()}.rb`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message.success("Đã tải mã nguồn SketchUp Ruby (.rb) về máy!");
  };

  return {
    attachedImage,
    setAttachedImage,
    generatedRubyCode,
    setGeneratedRubyCode,
    aiAnalysisText,
    setAiAnalysisText,
    isAnalyzingVision,
    fileInputRef,
    processImageFile,
    attachSampleImage,
    handleAnalyze,
    cancelAnalyze,
    handleApplyRubyToMesh,
    handleExportRubyFrom3D,
    handleCopyRubyCode,
    handleDownloadRubyFile,
  };
}
