import React, { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import { AppstoreOutlined, RobotOutlined, CopyOutlined } from "@ant-design/icons";
import { AIPricingForm } from "./AIPricingForm";
import { AIPricingResultCard } from "./AIPricingResultCard";
import { AIPromptResultCard } from "./AIPromptResultCard";
import { QuotationPdfModal } from "./QuotationPdfModal";
import { AiPricingHeader } from "./AiPricingHeader";
import { AiPricingFollowUpChat } from "./AiPricingFollowUpChat";
import { AiPricingConfigModal } from "./AiPricingConfigModal";
import {
  calculateSignboardQuote,
  generateAIPromptResponse,
  generateFullPrompt,
  formatVND,
  COMPANY_INFO,
  getStoredAIApiKey,
  saveStoredAIApiKey,
  callClientGemini,
  getAIVariantQuote,
  type SignboardInput,
  type SignboardQuoteResult,
  type AIVariantQuoteResult
} from "../../services/aiPricingEngine";
import { useApiHost } from "../../common/hooks/useApiHost";

const DEFAULT_INPUT: SignboardInput = {
  width: 4,
  height: 1.5,
  iron_type: "vuong_20",
  surface_type: "bat_hiflex",
  has_sheet_backing: true,
  has_reinforce_iron: false,
  reinforce_qty: 0,
  reinforce_length: 0,
  location: "outdoor",
  use_scaffolding: false,
  scaffolding_sets: 1,
  scaffolding_days: 1,
  profit_margin: 30,
};

export const AIPricingSplitView: React.FC = () => {
  const apiHost = useApiHost();
  const [currentInput, setCurrentInput] = useState<SignboardInput>(DEFAULT_INPUT);
  const [quoteResult, setQuoteResult] = useState<SignboardQuoteResult>(() =>
    calculateSignboardQuote(DEFAULT_INPUT)
  );

  // Tính báo giá thẩm định AI độc lập (chênh lệch khách quan 0 - 6% so với định mức kỹ thuật)
  const aiQuoteResult: AIVariantQuoteResult = useMemo(() => {
    return getAIVariantQuote(quoteResult);
  }, [quoteResult]);

  const [aiPromptText, setAiPromptText] = useState<string>(() => {
    const base = calculateSignboardQuote(DEFAULT_INPUT);
    const variant = getAIVariantQuote(base);
    return generateAIPromptResponse(DEFAULT_INPUT, variant);
  });
  const [aiSource, setAiSource] = useState<"gemini" | "openai" | "expert_engine">("expert_engine");

  const [viewMode, setViewMode] = useState<"split" | "current_only" | "ai_only">("split");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI Config Modal state
  const [isAiConfigModalOpen, setIsAiConfigModalOpen] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  // AI chat messages on right column
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [isChatSending, setIsChatSending] = useState(false);

  // Check backend AI status on mount
  useEffect(() => {
    fetch(`${apiHost}/ai/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.active_engine === "gemini") setAiSource("gemini");
          else if (data.active_engine === "openai") setAiSource("openai");
        }
      })
      .catch(() => {
        /* backend offline or not ready, fallback to client-side storage */
        const stored = getStoredAIApiKey();
        if (stored) setAiSource("gemini");
      });
  }, [apiHost]);

  const handleApplyInput = async (newInput: SignboardInput) => {
    setLoading(true);
    setCurrentInput(newInput);

    // 1. Tính toán chuẩn số học theo định mức xưởng
    const localCalc = calculateSignboardQuote(newInput);
    setQuoteResult(localCalc);
    const localVariant = getAIVariantQuote(localCalc);

    const storedKey = getStoredAIApiKey();

    // 2. Thử gọi backend AI
    try {
      const res = await fetch(`${apiHost}/ai/signboard-quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedKey ? { "x-ai-api-key": storedKey } : {}),
        },
        body: JSON.stringify({ ...newInput, api_key: storedKey }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) setQuoteResult(json.data);
        if (json.ai_prompt_text) {
          setAiPromptText(json.ai_prompt_text);
          setAiSource(json.ai_source || (storedKey ? "gemini" : "expert_engine"));
          setLoading(false);
          message.success("Đã cập nhật tính toán và bóc tách cả 2 bảng!");
          return;
        }
      }
    } catch {
      /* fallback to client-side */
    }

    // 3. Nếu backend không trả về LLM, thử gọi trực tiếp Gemini từ Client (nếu có key)
    if (storedKey) {
      try {
        const fullPrompt = generateFullPrompt(newInput);
        const geminiText = await callClientGemini(
          fullPrompt,
          storedKey,
          "BẠN LÀ CHUYÊN GIA BÓC TÁCH VẬT TƯ & BÁO GIÁ NGÀNH QUẢNG CÁO TẠI XƯỞNG ADMAKE. Hãy phân tích bóc tách định mức và cảnh báo kỹ thuật theo quy chuẩn."
        );
        if (geminiText) {
          setAiPromptText(geminiText);
          setAiSource("gemini");
          setLoading(false);
          message.success("Đã phân tích qua Google Gemini AI thành công!");
          return;
        }
      } catch {
        /* fallback to deterministic engine */
      }
    }

    // 4. Fallback cuối cùng: Chuyên gia định mức chuẩn có chênh lệch khách quan
    setAiPromptText(generateAIPromptResponse(newInput, localVariant));
    setAiSource("expert_engine");
    setLoading(false);
    message.success("Đã cập nhật tính toán và bóc tách cả 2 bảng!");
  };

  const handleQuickPromptClick = () => {
    setShowConfigForm(true);
    message.info("Mời bạn điều chỉnh các thông số và bấm 'Bóc tách & Báo giá ngay'!");
  };

  const handleSaveApiKey = async (newKey: string) => {
    const key = newKey.trim();
    saveStoredAIApiKey(key);

    // Also sync to backend if reachable
    try {
      await fetch(`${apiHost}/ai/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_key: key }),
      });
    } catch {
      /* ignore */
    }

    if (key) {
      setAiSource("gemini");
      message.success("Đã lưu API Key! Hệ thống sẽ ưu tiên gửi prompt trực tiếp đến Google Gemini AI.");
    } else {
      setAiSource("expert_engine");
      message.info("Đã xóa API Key. Hệ thống sử dụng Engine Xưởng Chuyên Gia (Nội bộ / Chuẩn 100%).");
    }
    setIsAiConfigModalOpen(false);
  };

  const handleTestApiKey = async (testKey: string) => {
    const key = testKey.trim();
    if (!key) {
      message.warning("Vui lòng nhập API Key để kiểm tra!");
      return;
    }
    setIsTestingKey(true);
    try {
      const res = await callClientGemini("Xin chào! Hãy trả lời trong 1 câu: Bạn là AI gì?", key);
      if (res) {
        message.success(`Kết nối Gemini AI thành công! Phản hồi: "${res.slice(0, 60)}..."`);
      } else {
        message.error("Không thể kết nối đến Gemini API. Vui lòng kiểm tra lại API Key.");
      }
    } catch (e: any) {
      message.error(`Lỗi kết nối: ${e.message || "Key không hợp lệ"}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleCopyZalo = () => {
    const text = `📋 BÁO GIÁ THI CÔNG BẢNG HIỆU - ${COMPANY_INFO.name}
- Quy cách: ${quoteResult.dimensions.width}m x ${quoteResult.dimensions.height}m (${quoteResult.dimensions.area} m²)
- Chất liệu mặt: ${quoteResult.materials.surface.name}
- Khung sắt: ${quoteResult.materials.iron_frame.name}
- Tôn lót mặt sau: ${quoteResult.materials.sheet_backing.active ? "Có lót tôn bảo vệ" : "Không lót tôn"}
- V nhôm viền: ${quoteResult.materials.aluminum_trim.name}
- Nhân công & Vận chuyển: Trọn gói hoàn thiện

👉 TỔNG GIÁ BÁO: ${formatVND(quoteResult.summary.quote_price)}
(Đơn giá tương đương: ${formatVND(quoteResult.summary.price_per_sqm)} / m²)
* Hotline liên hệ: ${COMPANY_INFO.hotline} - CSKH: ${COMPANY_INFO.phone}`;

    navigator.clipboard.writeText(text);
    message.success("Đã sao chép báo giá gửi Zalo kèm thông tin công ty!");
  };

  const handleCopyFullPrompt = () => {
    const prompt = generateFullPrompt(currentInput);
    navigator.clipboard.writeText(prompt);
    message.success("Đã sao chép nội dung prompt đầy đủ vào clipboard!");
  };

  const handleSendFollowUp = async (text: string) => {
    const q = text.trim();
    if (!q) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    setIsChatSending(true);

    const storedKey = getStoredAIApiKey();

    // 1. Thử gọi backend chat
    try {
      const res = await fetch(`${apiHost}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedKey ? { "x-ai-api-key": storedKey } : {}),
        },
        body: JSON.stringify({
          message: q,
          current_quote: currentInput,
          api_key: storedKey,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setChatMessages((prev) => [...prev, { sender: "ai", text: json.reply }]);
        setIsChatSending(false);
        return;
      }
    } catch {
      /* fallback */
    }

    // 2. Thử gọi Gemini client-side nếu có key
    if (storedKey) {
      try {
        const geminiReply = await callClientGemini(
          `Thông số bảng hiệu: ${currentInput.width}m x ${currentInput.height}m, mặt ${quoteResult.materials.surface.name}, tổng giá vốn ${formatVND(quoteResult.summary.cost_price)}. Câu hỏi của khách: "${q}". Hãy tư vấn súc tích, chuyên nghiệp cho thợ quảng cáo.`,
          storedKey
        );
        if (geminiReply) {
          setChatMessages((prev) => [...prev, { sender: "ai", text: geminiReply }]);
          setIsChatSending(false);
          return;
        }
      } catch {
        /* fallback to rule engine */
      }
    }

    // 3. Fallback câu trả lời thông minh nội bộ
    let fallbackReply = "";
    const upper = q.toUpperCase();
    if (upper.includes("GIẢM") || upper.includes("CHIẾT KHẤU") || upper.includes("BỚT")) {
      fallbackReply = "💡 **Gợi ý tối ưu chi phí từ Chuyên gia AI:**\n- Nếu khách muốn giảm giá, bạn có thể điều chỉnh tỷ lệ lợi nhuận kỳ vọng từ 30% xuống 20-25%.\n- Hoặc chuyển từ bạt 3M/không gân sang bạt 2 da xám (tiết kiệm được từ 125.000 - 400.000 đ/m²).\n- Nếu khách tự lắp đặt tại xưởng, có thể trừ chi phí nhân công (120k/m²) và xe vận chuyển (200k).";
    } else if (upper.includes("VAT") || upper.includes("THUẾ")) {
      fallbackReply = "📄 **Tính thuế VAT:**\n- Thuế suất thông dụng cho ngành quảng cáo/thi công là **8%** hoặc **10%**.\n- Bạn có thể chọn bật tính VAT trong modal 'Xuất Báo Giá PDF' ở góc trên màn hình để hệ thống tự động cộng vào tổng thanh toán.";
    } else {
      fallbackReply = `Chuyên gia AI đã nhận được câu hỏi: "${q}". Với bảng hiệu ${currentInput.width}m x ${currentInput.height}m hiện tại (tổng giá vốn ${formatVND(quoteResult.summary.cost_price)}), bạn có thể xuất file PDF chính thức để gửi khách hàng duyệt.`;
    }

    setChatMessages((prev) => [...prev, { sender: "ai", text: fallbackReply }]);
    setIsChatSending(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 text-slate-800 space-y-3 pb-6">
      {/* Top Header Bar */}
      <AiPricingHeader
        aiSource={aiSource}
        viewMode={viewMode}
        showConfigForm={showConfigForm}
        onQuickPromptClick={handleQuickPromptClick}
        onOpenAiConfig={() => setIsAiConfigModalOpen(true)}
        onToggleViewMode={(mode) => setViewMode(mode)}
        onToggleConfigForm={() => setShowConfigForm((prev) => !prev)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onCopyZalo={handleCopyZalo}
      />

      {/* Khung Khai báo thông số nhanh */}
      {showConfigForm && (
        <div className="animate-in fade-in duration-200">
          <AIPricingForm
            initialValues={currentInput}
            onSubmit={(vals) => {
              handleApplyInput(vals);
              setShowConfigForm(false);
            }}
            loading={loading}
          />
        </div>
      )}

      {/* SPLIT SCREEN CONTAINER: 1 BÊN HIỆN TẠI - 1 BÊN DO AI PROMPT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
        {/* ======================================================== */}
        {/* CỘT 1: BẢNG KẾT QUẢ HIỆN TẠI (ĐỊNH MỨC & GIÁ VỐN KỸ THUẬT) */}
        {/* ======================================================== */}
        {(viewMode === "split" || viewMode === "current_only") && (
          <div
            className={`flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${
              viewMode === "current_only" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Header Cột 1 */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AppstoreOutlined className="text-cyan-400 text-base" />
                <div>
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white m-0">
                    Bảng kết quả hiện tại (Định mức & Giá vốn kỹ thuật)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Bóc tách số học chính xác 100% theo quy chuẩn Hình 1, 2, 3
                  </span>
                </div>
              </div>
              <div className="text-xs text-cyan-300 font-mono font-bold">
                {quoteResult.dimensions.width}m x {quoteResult.dimensions.height}m ({quoteResult.dimensions.area} m²)
              </div>
            </div>

            {/* Body Cột 1 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AIPricingResultCard
                result={quoteResult}
                onReset={() => setShowConfigForm(true)}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CỘT 2: BẢNG KẾT QUẢ DO AI PROMPT (CHUYÊN GIA BÓC TÁCH AI) */}
        {/* ======================================================== */}
        {(viewMode === "split" || viewMode === "ai_only") && (
          <div
            className={`flex flex-col bg-white rounded-2xl border border-cyan-200 shadow-sm overflow-hidden ${
              viewMode === "ai_only" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Header Cột 2 */}
            <div className="px-4 py-3 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RobotOutlined className="text-amber-300 text-base" />
                <div>
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white m-0">
                    Bảng kết quả do AI Prompt (Chuyên gia Báo giá AI)
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {aiSource === "gemini" ? (
                      <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-bold text-amber-200">
                        ⚡ Google Gemini Live
                      </span>
                    ) : aiSource === "openai" ? (
                      <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-bold text-sky-200">
                        ⚡ AI Engine Live
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-bold text-teal-100">
                        🛡️ Engine Xưởng Chuẩn
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyFullPrompt}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-all border border-white/30 cursor-pointer flex items-center gap-1"
                >
                  <CopyOutlined /> Copy Prompt
                </button>
              </div>
            </div>

            {/* Body Cột 2: Trình bày chỉn chu theo thẻ & bảng y hệt Cột 1 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <AIPromptResultCard
                  result={aiQuoteResult}
                  rawAiText={aiPromptText}
                  aiSource={aiSource}
                  onCopyZalo={handleCopyZalo}
                  onCopyPrompt={handleCopyFullPrompt}
                  onOpenConfigModal={() => setIsAiConfigModalOpen(true)}
                />
              </div>

              {/* Chat trao đổi tiếp nối với AI */}
              <AiPricingFollowUpChat
                chatMessages={chatMessages}
                isChatSending={isChatSending}
                onSendMessage={handleSendFollowUp}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal Cấu hình AI Key (Gemini / OpenAI) */}
      <AiPricingConfigModal
        open={isAiConfigModalOpen}
        onCancel={() => setIsAiConfigModalOpen(false)}
        onSave={handleSaveApiKey}
        onTest={handleTestApiKey}
        isTesting={isTestingKey}
        initialKey={getStoredAIApiKey()}
      />

      {/* Modal Xuất Báo Giá PDF Chuyên Nghiệp (Có đầy đủ thông tin công ty B-One / ADMAKE) */}
      <QuotationPdfModal
        open={isPdfModalOpen}
        onCancel={() => setIsPdfModalOpen(false)}
        quoteResult={quoteResult}
      />
    </div>
  );
};
