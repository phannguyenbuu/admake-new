/**
 * useStudioRenderGenAI.ts - Quản lý render phối cảnh thực tế GenAI và chỉnh sửa liên tục
 */

import { useState, useRef, useEffect } from "react";
import { message } from "antd";
import {
  genAISignboardService,
  type Signboard3DModel,
  type GenAIJob,
  type InpaintPin,
} from "../../../services/genaiSignboard.service";
import type { Signboard3DCanvasHandle } from "../Signboard3DCanvas";
import { getErrorMessage, isAbortError } from "./aiText";

const RENDER_TIMEOUT_MS = 240000;

interface UseStudioRenderGenAIProps {
  model3D: Signboard3DModel | null;
  clientPrompt: string;
  canvasRef: React.RefObject<Signboard3DCanvasHandle | null>;
  setActiveVisualTab: (tab: "3d" | "genai" | "ruby") => void;
  setCurrentStep: (step: number) => void;
}

export function useStudioRenderGenAI({
  model3D,
  clientPrompt,
  canvasRef,
  setActiveVisualTab,
  setCurrentStep,
}: UseStudioRenderGenAIProps) {
  const [genAiJob, setGenAiJob] = useState<GenAIJob | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [renderStyle, setRenderStyle] = useState<string>("Photorealistic Architectural");
  const [customEditPrompt, setCustomEditPrompt] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [renderHistory, setRenderHistory] = useState<string[]>([]);
  const [activeRenderUrl, setActiveRenderUrl] = useState<string | null>(null);

  const [pins, setPins] = useState<InpaintPin[]>([]);
  const [isPinMode, setIsPinMode] = useState<boolean>(false);

  const renderAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      renderAbortRef.current?.abort();
    };
  }, []);

  const startRenderController = () => {
    renderAbortRef.current?.abort();
    const controller = new AbortController();
    renderAbortRef.current = controller;
    return controller;
  };

  const finishRender = (finalJob: GenAIJob, msgKey: string, successText: string) => {
    if (!finalJob.result_image_url) throw new Error("GenAI không trả về ảnh kết quả");
    setActiveRenderUrl(finalJob.result_image_url);
    setRenderHistory((prev) => [finalJob.result_image_url!, ...prev.filter((u) => u !== finalJob.result_image_url)].slice(0, 20));
    setActiveVisualTab("genai");
    message.success({ content: successText, key: msgKey });
  };

  const handleRenderGenAI = async (overridePrompt?: string, overrideAspectRatio?: string, overrideSnapshot?: string) => {
    if (!model3D) {
      message.warning("Vui lòng tạo mô hình 3D trước khi render");
      return;
    }
    if (isRendering || isEditing) return;

    if (overrideAspectRatio) setAspectRatio(overrideAspectRatio);
    const controller = startRenderController();
    const targetRatio = overrideAspectRatio || aspectRatio;
    const renderPrompt =
      (typeof overridePrompt === "string" && overridePrompt.trim()) ||
      customEditPrompt.trim() ||
      model3D.render_prompt ||
      `Commercial architectural photograph of ${clientPrompt}, high-end modern street store, photorealistic, 8k resolution, crisp details, natural ambient daylight.`;

    setIsRendering(true);
    setGenAiJob(null);
    setActiveVisualTab("genai");
    setCurrentStep(5);
    message.loading({ content: "Đang gửi tác vụ đến GenAI Bridge...", key: "render", duration: 0 });

    try {
      const snapshot = overrideSnapshot || canvasRef.current?.captureSnapshot(0.9) || null;
      let job: GenAIJob;
      if (snapshot) {
        try {
          job = await genAISignboardService.editFullRenderJob({
            prompt: `${renderPrompt}\nGiữ nguyên hình khối, tỷ lệ và bố cục bảng hiệu như ảnh 3D tham chiếu, biến thành ảnh chụp thực tế.`,
            reference_images: [snapshot],
            style: renderStyle,
            aspect_ratio: targetRatio,
            new_chat: true,
          });
        } catch {
          job = await genAISignboardService.createRenderJob({ prompt: renderPrompt, style: renderStyle, aspect_ratio: targetRatio, new_chat: true });
        }
      } else {
        job = await genAISignboardService.createRenderJob({ prompt: renderPrompt, style: renderStyle, aspect_ratio: targetRatio, new_chat: true });
      }
      if (!job?.id) throw new Error((job as any)?.error || "GenAI không tạo được tác vụ render");
      if (!mountedRef.current) return;
      setGenAiJob(job);

      const finalJob = await genAISignboardService.waitForJob(
        job.id,
        (p) => mountedRef.current && setGenAiJob({ ...p }),
        RENDER_TIMEOUT_MS,
        controller.signal
      );
      if (!mountedRef.current) return;
      finishRender(finalJob, "render", "🎉 Render phối cảnh thực tế hoàn tất!");
    } catch (err) {
      if (isAbortError(err)) {
        message.destroy("render");
        return;
      }
      message.error({ content: getErrorMessage(err, "Lỗi khi render phối cảnh"), key: "render" });
    } finally {
      if (renderAbortRef.current === controller) renderAbortRef.current = null;
      if (mountedRef.current) setIsRendering(false);
    }
  };

  const handleContinuousEdit = async () => {
    if (!activeRenderUrl) {
      await handleRenderGenAI();
      return;
    }
    if (!customEditPrompt.trim() && pins.length === 0) {
      message.warning("Vui lòng nhập mô tả chỉnh sửa hoặc cắm mốc ghi chú (pins) trên ảnh");
      return;
    }
    if (isRendering || isEditing) return;

    const controller = startRenderController();
    setIsEditing(true);
    setActiveVisualTab("genai");
    setCurrentStep(5);
    message.loading({ content: "Đang tiến hành chỉnh sửa ảnh qua GenAI...", key: "edit", duration: 0 });

    try {
      const job =
        pins.length > 0
          ? await genAISignboardService.editInpaintRenderJob({
              prompt: customEditPrompt,
              reference_images: [activeRenderUrl],
              pins,
              preserve_surroundings: true,
              style: renderStyle,
              aspect_ratio: aspectRatio,
            })
          : await genAISignboardService.editFullRenderJob({
              prompt: customEditPrompt,
              reference_images: [activeRenderUrl],
              style: renderStyle,
              aspect_ratio: aspectRatio,
            });
      if (!job?.id) throw new Error((job as any)?.error || "GenAI không tạo được tác vụ chỉnh sửa");
      if (!mountedRef.current) return;
      setGenAiJob(job);

      const finalJob = await genAISignboardService.waitForJob(
        job.id,
        (p) => mountedRef.current && setGenAiJob({ ...p }),
        RENDER_TIMEOUT_MS,
        controller.signal
      );
      if (!mountedRef.current) return;
      finishRender(finalJob, "edit", "✨ Đã hoàn thiện bản render mới!");
      setPins([]);
      setCustomEditPrompt("");
      setIsPinMode(false);
    } catch (err) {
      if (isAbortError(err)) {
        message.destroy("edit");
        return;
      }
      message.error({ content: getErrorMessage(err, "Lỗi khi chỉnh sửa phối cảnh"), key: "edit" });
    } finally {
      if (renderAbortRef.current === controller) renderAbortRef.current = null;
      if (mountedRef.current) setIsEditing(false);
    }
  };

  const cancelRender = () => renderAbortRef.current?.abort();

  const addPinAt = (xPct: number, yPct: number) => {
    if (!isPinMode) return;
    const note = window.prompt("Nhập nội dung cần chỉnh sửa tại vị trí này:");
    if (!note || !note.trim()) return;
    const x = Math.min(100, Math.max(0, Math.round(xPct)));
    const y = Math.min(100, Math.max(0, Math.round(yPct)));
    setPins((prev) => [...prev, { order: prev.length + 1, xFormatted: `${x}%`, yFormatted: `${y}%`, text: note.trim() }]);
  };

  return {
    genAiJob,
    isRendering,
    aspectRatio,
    setAspectRatio,
    renderStyle,
    setRenderStyle,
    customEditPrompt,
    setCustomEditPrompt,
    isEditing,
    renderHistory,
    activeRenderUrl,
    setActiveRenderUrl,
    pins,
    setPins,
    isPinMode,
    setIsPinMode,
    handleRenderGenAI,
    handleContinuousEdit,
    cancelRender,
    addPinAt,
  };
}
