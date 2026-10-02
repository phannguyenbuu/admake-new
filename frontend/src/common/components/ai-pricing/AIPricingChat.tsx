import React, { useState, useRef, useEffect } from "react";
import { Avatar, Input, Tooltip, message, Tag } from "antd";
import {
  SendOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  UserOutlined,
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { AIPricingForm } from "./AIPricingForm";
import { AIPricingResultCard } from "./AIPricingResultCard";
import {
  calculateSignboardQuote,
  type SignboardInput,
  type SignboardQuoteResult,
  PRICING_STANDARDS
} from "../../services/aiPricingEngine";
import { useApiHost } from "../../common/hooks/useApiHost";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  timestamp: Date;
  content?: string;
  type?: "text" | "interactive_form" | "quote_result";
  formData?: SignboardInput;
  quoteResult?: SignboardQuoteResult;
}

const DEFAULT_PROMPT_TRIGGER = "BẠN MUỐN HỎI GIÁ BẢNG HIỆU?";

const AI_STANDARD_INTRO = `Dạ chào bạn! Tôi là **Chuyên gia Bóc tách Vật tư & Báo giá ngành Quảng cáo**.

Nhiệm vụ của tôi là tính toán định mức vật tư, chi phí vận hành và tổng giá trị cho hạng mục **Bảng hiệu**, tuân thủ 100% quy tắc nhà xưởng:

📋 **1. BẢNG GIÁ VẬT TƯ ĐẦU VÀO CỐ ĐỊNH:**
• **Sắt vuông**: 20x20 (75.000 đ/cây 6m) | 25x25 (95.000 đ/cây 6m) | 30x30 (135.000 đ/cây 6m)
• **Mặt bạt**: Hiflex thường (27.000 đ/m²) | 2 da xám (45.000 đ/m²) | Không gân UV (170.000 đ/m²) | 3M UV (450.000 đ/m²)
• **Tấm phẳng**: Tấm Alu 3mm 0.10 (480.000 đ/tấm) | Tấm Mica (690.000 đ/tấm) (Khổ chuẩn 1.22m x 2.44m)
• **Tôn lót mặt sau**: Khổ 1.2m (75.000 đ/mét tới)
• **V nhôm bọc viền**: Cây 3m (35.000 đ/cây)
• **Vật tư phụ** (keo, vít, que hàn...): Khoán 100.000 đ/công trình

⚙️ **2. BẢNG CHI PHÍ VẬN HÀNH:**
• Nhân công thi công: **120.000 đ/m²**
• Vận chuyển: **200.000 đ/chuyến**
• Dàn giáo: **50.000 đ/bộ/ngày**

⚠️ **3. HỆ THỐNG CẢNH BÁO BẮT BUỘC:**
• **Nối bạt**: Khổ tối đa 3.1m. Nếu cả 2 cạnh đều > 3.1m, bắt buộc tính thêm chi phí nối bạt là **15.000 đ/mét dài** (cạnh ngắn hơn).
• **Khổ Alu/Mica**: Khổ chuẩn 1.22m x 2.44m, kích thước lỡ cỡ sẽ tính làm tròn thêm 1 tấm nguyên.
• **Từ chối bảo hành**: Bảng bạt không lót tôn $\\rightarrow$ *KHÔNG BẢO HÀNH rách do gió bão*. Alu gương vàng ngoài trời $\\rightarrow$ *KHÔNG BẢO HÀNH bay màu*.

👇 **Mời bạn nhấp vào các thông số bên dưới để khai báo nhanh cho bảng hiệu:**`;

export const AIPricingChat: React.FC = () => {
  const apiHost = useApiHost();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "ai",
      timestamp: new Date(),
      type: "text",
      content: `Xin chào! Tôi là **Trợ lý AI Bóc tách & Báo giá Bảng hiệu ADMAKE**.

Thay vì phải sao chép mẫu lệnh dài dòng, bạn chỉ cần nhấp vào gợi ý dưới đây hoặc gửi câu hỏi:
👉 **"${DEFAULT_PROMPT_TRIGGER}"**

Tôi sẽ hiển thị đầy đủ quy tắc định mức và mở các tuỳ chọn để bạn nhấp vào khai báo thông số ngay!`
    }
  ]);

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTriggerPrompt = (text: string = DEFAULT_PROMPT_TRIGGER) => {
    const userMsgId = `usr-${Date.now()}`;
    const aiIntroId = `ai-intro-${Date.now()}`;
    const aiFormId = `ai-form-${Date.now()}`;

    // 1. User message
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      timestamp: new Date(),
      type: "text",
      content: text,
    };

    // 2. AI standard introduction message
    const aiIntroMsg: ChatMessage = {
      id: aiIntroId,
      sender: "ai",
      timestamp: new Date(),
      type: "text",
      content: AI_STANDARD_INTRO,
    };

    // 3. Interactive Form card
    const aiFormMsg: ChatMessage = {
      id: aiFormId,
      sender: "ai",
      timestamp: new Date(),
      type: "interactive_form",
    };

    setMessages((prev) => [...prev, userMsg, aiIntroMsg, aiFormMsg]);
  };

  const handleFormSubmit = async (values: SignboardInput) => {
    setLoading(true);

    // Add user action confirmation message
    const userActionMsg: ChatMessage = {
      id: `usr-submit-${Date.now()}`,
      sender: "user",
      timestamp: new Date(),
      type: "text",
      content: `Yêu cầu bóc tách bảng hiệu kích thước ${values.width}m x ${values.height}m (${values.surface_type}, sắt ${values.iron_type}, lợi nhuận ${values.profit_margin}%)`,
    };

    // Try backend calculation endpoint first, fallback to client-side engine
    let quoteResult: SignboardQuoteResult;
    try {
      const res = await fetch(`${apiHost}/ai/signboard-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const json = await res.json();
        quoteResult = json.data;
      } else {
        quoteResult = calculateSignboardQuote(values);
      }
    } catch {
      quoteResult = calculateSignboardQuote(values);
    }

    const aiResultMsg: ChatMessage = {
      id: `ai-result-${Date.now()}`,
      sender: "ai",
      timestamp: new Date(),
      type: "quote_result",
      quoteResult,
    };

    setMessages((prev) => [...prev, userActionMsg, aiResultMsg]);
    setLoading(false);
  };

  const handleSendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;

    setInputValue("");

    const upperText = text.toUpperCase();
    if (
      upperText.includes("GIÁ BẢNG HIỆU") ||
      upperText.includes("BẢNG HIỆU") ||
      upperText.includes("BÁO GIÁ") ||
      upperText.includes("BÓC TÁCH") ||
      upperText.includes("HỎI GIÁ")
    ) {
      handleTriggerPrompt(text);
    } else {
      // General question answering
      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: "user",
        timestamp: new Date(),
        type: "text",
        content: text,
      };

      let answer = "";
      if (upperText.includes("NỐI BẠT")) {
        answer = `**Quy tắc Nối bạt chuẩn nhà xưởng:**\n• Khổ bạt tối đa thông dụng là **3.1m**.\n• Nếu **CẢ 2 CẠNH** (ngang và cao) đều vượt quá 3.1m: Bắt buộc tính thêm chi phí nhân công nối bạt là **15.000 đ/mét dài** (tính theo chiều của cạnh ngắn hơn).\n• Nếu một trong hai cạnh ≤ 3.1m: Có thể xoay chiều cuộn bạt để in liền khổ không cần nối mí.\n\nNhấp vào nút **"${DEFAULT_PROMPT_TRIGGER}"** bên dưới để mở bộ bóc tách tự động!`;
      } else if (upperText.includes("ALU") || upperText.includes("MICA")) {
        answer = `**Quy chuẩn Khổ tấm Alu / Mica:**\n• Khổ tấm chuẩn là **1.22m x 2.44m**.\n• Đơn giá mặc định: Tấm Alu 3mm 0.10: **480.000 đ/tấm** | Tấm Mica: **690.000 đ/tấm**.\n• Nếu kích thước lỡ cỡ (ví dụ 1.26m x 2.48m), bắt buộc tính làm tròn thêm 1 tấm nguyên. Nhân viên nên tư vấn khách thu nhỏ lại để tiết kiệm chi phí!`;
      } else if (upperText.includes("BẢO HÀNH")) {
        answer = `**Quy tắc Từ chối Bảo hành Bảng hiệu:**\n• **Bảng bạt không lót tôn**: *CẢNH BÁO: Bảng bạt không lót tôn, KHÔNG BẢO HÀNH rách do gió bão*.\n• **Alu đồng gương vàng ngoài trời**: *CẢNH BÁO: Alu gương vàng ngoài trời KHÔNG BẢO HÀNH bay màu*.`;
      } else {
        answer = `Tôi đã nhận câu hỏi của bạn: "${text}".\n\nBạn có muốn tính toán giá và bóc tách định mức cho hạng mục bảng hiệu không? Vui lòng bấm vào gợi ý: **"${DEFAULT_PROMPT_TRIGGER}"** để bắt đầu ngay!`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        content: answer,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome-msg",
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        content: `Xin chào! Tôi là **Trợ lý AI Bóc tách & Báo giá Bảng hiệu ADMAKE**.\n\nNhấp vào gợi ý dưới đây để mở công cụ khai báo báo giá tức thì:\n👉 **"${DEFAULT_PROMPT_TRIGGER}"**`
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              size={40}
              className="bg-gradient-to-tr from-cyan-600 to-teal-500 text-white font-bold shadow-sm"
              icon={<RobotOutlined />}
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 m-0 leading-none">
                AI Bóc Tách & Báo Giá Bảng Hiệu
              </h3>
              <Tag color="cyan" className="!text-[10px] !font-bold !m-0 !px-1.5 !rounded-full">
                Beta (Thử nghiệm)
              </Tag>
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Trợ lý thông minh theo chuẩn định mức xưởng ADMAKE
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          title="Xoá lịch sử hội thoại"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer"
        >
          <ClearOutlined className="text-base" />
        </button>
      </div>

      {/* Suggested Prompt Chips Bar */}
      <div className="px-4 py-2 bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 border-b border-cyan-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-cyan-900 flex items-center gap-1">
          <BulbOutlined className="text-amber-500" /> Gợi ý nhanh:
        </span>

        {/* The main requested button */}
        <button
          type="button"
          onClick={() => handleTriggerPrompt(DEFAULT_PROMPT_TRIGGER)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-sm hover:shadow-md transition-all cursor-pointer border-none active:scale-95"
        >
          <ThunderboltOutlined className="text-amber-300" />
          <span>{DEFAULT_PROMPT_TRIGGER}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTriggerPrompt("Bóc tách bảng hiệu bạt Hiflex")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer"
        >
          <span>Bảng hiệu bạt Hiflex</span>
        </button>

        <button
          type="button"
          onClick={() => handleTriggerPrompt("Bóc tách bảng hiệu Alu / Mica")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer"
        >
          <span>Bảng hiệu Alu / Mica</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          if (msg.type === "interactive_form") {
            return (
              <div key={msg.id} className="max-w-3xl my-2">
                <AIPricingForm onSubmit={handleFormSubmit} loading={loading} />
              </div>
            );
          }

          if (msg.type === "quote_result" && msg.quoteResult) {
            return (
              <div key={msg.id} className="max-w-4xl my-2">
                <AIPricingResultCard
                  result={msg.quoteResult}
                  onReset={() => handleTriggerPrompt(DEFAULT_PROMPT_TRIGGER)}
                />
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar
                size={34}
                className={
                  isUser
                    ? "bg-slate-700 text-white text-xs"
                    : "bg-gradient-to-tr from-cyan-600 to-teal-500 text-white text-xs shadow-xs"
                }
                icon={isUser ? <UserOutlined /> : <RobotOutlined />}
              />

              <div
                className={`max-w-2xl rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-slate-800 text-white rounded-tr-xs"
                    : "bg-white text-slate-800 rounded-tl-xs border border-slate-200/80"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                <div
                  className={`text-[10px] mt-1.5 ${
                    isUser ? "text-slate-300 text-right" : "text-slate-400"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Field */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            size="large"
            placeholder="Nhập câu hỏi hoặc gõ 'BẠN MUỐN HỎI GIÁ BẢNG HIỆU?'..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="rounded-xl !border-slate-200 focus:!border-cyan-500 text-xs sm:text-sm"
          />

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="h-10 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 text-white font-semibold transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border-none shrink-0"
          >
            <SendOutlined className="text-sm" />
          </button>
        </form>
      </div>
    </div>
  );
};
