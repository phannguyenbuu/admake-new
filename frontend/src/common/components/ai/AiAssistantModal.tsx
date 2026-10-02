import React, { useState, useEffect, useRef } from "react";
import { Modal, Tooltip, notification } from "antd";
import { Send, Bot, User, Trash2, Sparkles, X, ExternalLink } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

const STORAGE_KEY = "ADMAKE_AI_CHAT_HISTORY";

const DEFAULT_WELCOME_MSG: ChatMessage = {
  id: "welcome-1",
  sender: "assistant",
  text: "Xin chào! Tôi là Trợ lý AI Admake. Tôi có thể hỗ trợ bạn tra cứu thông tin tồn kho, báo cáo kế toán, chấm công, bảng lương và quy trình quản lý vật tư. Bạn cần trợ giúp gì hôm nay?",
  timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
};

const SUGGESTIONS = [
  { label: "📦 Xem tồn kho vật tư chi tiết", query: "Cho tôi xem tồn kho vật tư chi tiết" },
  { label: "📊 Báo cáo tồn kho theo từng kho", query: "Cách xem Báo cáo tồn kho" },
  { label: "📐 Biến thể quy cách (1/2 tấm, 1/4 tấm)", query: "Cách xem biến thể 1/2 tấm, 1/4 tấm vật tư" },
  { label: "💵 Hướng dẫn ứng tiền nhân viên", query: "Cách làm phiếu ứng tiền nhân viên" },
];

export default function AiAssistantModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [DEFAULT_WELCOME_MSG];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [open, messages, isTyping]);

  const handleClearHistory = () => {
    setMessages([DEFAULT_WELCOME_MSG]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      notification.success({ message: "Đã xóa toàn bộ lịch sử chat AI" });
    } catch {
      /* ignore */
    }
  };

  const generateReply = (userQuery: string): ChatMessage => {
    const q = userQuery.toLowerCase();
    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    // Inventory / Tồn kho queries
    if (q.includes("tồn kho") || q.includes("vật tư") || q.includes("materials") || q.includes("biến thể") || q.includes("1/2") || q.includes("1/4")) {
      return {
        id: Math.random().toString(36).substring(2),
        sender: "assistant",
        text: `📦 **HƯỚNG DẪN XEM TỒN KHO CHI TIẾT TẠI MỤC /MATERIALS:**

Để xem chuyên sâu dữ liệu Kho & Tồn kho trên trang Quản lý vật liệu:

1. **Xem Báo cáo tồn kho theo Kho & Nhóm vật tư**:
   - Truy cập trang **/materials** -> Bấm vào thẻ tab **"Báo cáo tồn kho"** ở thanh điều hướng trên cùng.
   - Tại đây hệ thống liệt kê tổng số lượng tồn, giá trị tồn kho (VND) phân theo từng kho cắt giữ và nhóm vật tư.

2. **Xem Biến thể quy cách (1/2 tấm, 1/4 tấm, màu sắc, đơn giá)**:
   - Tại tab **"Vật tư"**, bấm vào **dấu mũi tên mở rộng (▶ / ▼)** ở đầu mỗi dòng vật tư (hoặc bấm trực tiếp vào tên vật tư).
   - Dòng phụ bên dưới sẽ mở ra bảng Ma trận Quy cách (Spec Grid): Hiển thị chi tiết từng biến thể (nguyên tấm, 1/2 tấm, 1/4 tấm), màu sắc, đơn giá từng loại và số lượng tồn hiện tại.

3. **Xem Lịch sử Giao dịch Kho (Nhập / Xuất / Điều chỉnh)**:
   - Chuyển sang tab **"Giao dịch kho"** để xem toàn bộ nhật ký phiếu nhập mua, phiếu xuất công trình và chuyển kho.`,
        actionUrl: "/materials",
        actionLabel: "Truy cập ngay /materials",
        timestamp: timeStr,
      };
    }

    // Advance Salary / Ứng tiền queries
    if (q.includes("ứng tiền") || q.includes("tạm ứng") || q.includes("advance")) {
      return {
        id: Math.random().toString(36).substring(2),
        sender: "assistant",
        text: `💵 **HƯỚNG DẪN TẠM ỨNG LƯƠNG:**

- **Nhân viên tự gửi yêu cầu**: Truy cập màn hình Chấm công (** /point **), chọn thẻ **Tạm ứng lương**, nhập số tiền (hỗ trợ nhập gõ tắt: 500k, 2tr, 2.000.000) và ngân hàng thụ hưởng (hỗ trợ Vietcombank, MB, Ví MoMo, v.v.).
- **Kế toán nhập/đồng bộ**: Truy cập Kế toán (** /accounting **) -> Thẻ **Bảng lương**. Dữ liệu tạm ứng từ Nhân viên và Kế toán được đồng bộ tự động realtime 100%.`,
        actionUrl: "/point",
        actionLabel: "Đến trang Ứng lương /point",
        timestamp: timeStr,
      };
    }

    // Attendance / Workpoint queries
    if (q.includes("chấm công") || q.includes("tăng ca") || q.includes("giờ") || q.includes("workpoint")) {
      return {
        id: Math.random().toString(36).substring(2),
        sender: "assistant",
        text: `🕒 **HƯỚNG DẪN CHẤM CÔNG & TĂNG CA:**

- **Điểm danh camera**: Vào trang **/point**, bấm nút điểm danh và chụp ảnh khuôn mặt. Hệ thống tự động ghi nhận giờ vào/ra và tính ca làm việc.
- **Tính tăng ca**: Hệ thống giới hạn tối đa 6.0 giờ tăng ca/ca để đảm bảo chính xác khi quên check-out. Kế toán xem tổng quan giờ công tại **/accounting** -> Thẻ **Bảng lương**.`,
        actionUrl: "/point",
        actionLabel: "Trang Điểm danh /point",
        timestamp: timeStr,
      };
    }

    // Default fallback answer
    return {
      id: Math.random().toString(36).substring(2),
      sender: "assistant",
      text: `🤖 Tôi đã ghi nhận yêu cầu: "${userQuery}".\n\nBạn có thể tra cứu các mục sau trên hệ thống Admake:\n- **Quản lý vật liệu & Tồn kho**: /materials\n- **Bảng lương & Kế toán**: /accounting\n- **Điểm danh & Tạm ứng**: /point\n- **Quản lý công việc & Lead**: /work-tables`,
      timestamp: timeStr,
    };
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q) return;

    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      sender: "user",
      text: q,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateReply(q);
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      destroyOnClose={false}
      className="ai-assistant-modal"
      modalRender={() => (
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-base flex items-center gap-2">
                  <span>Trợ lý AI Admake</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-normal">
                    Ctrl+K
                  </span>
                </div>
                <div className="text-xs text-teal-100">
                  Giải đáp thắc mắc tồn kho, kế toán, bảng lương & công việc
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip title="Xóa lịch sử chat">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="h-[460px] overflow-y-auto p-5 bg-slate-50 flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    msg.sender === "user"
                      ? "bg-teal-600 text-white"
                      : "bg-cyan-600 text-white"
                  }`}
                >
                  {msg.sender === "user" ? <User size={15} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-teal-600 text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {msg.actionUrl && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center">
                      <a
                        href={msg.actionUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs transition-colors"
                        onClick={onClose}
                      >
                        <span>{msg.actionLabel || "Xem chi tiết"}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  <div
                    className={`mt-1 text-[10px] ${
                      msg.sender === "user" ? "text-teal-200 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 mr-auto">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white text-xs">
                  <Bot size={16} />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white border border-slate-200 px-4 py-3 text-xs text-slate-400 animate-pulse flex items-center gap-1">
                  <span>AI đang suy nghĩ</span>
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Gợi ý:</span>
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(item.query)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-[11px] text-slate-600 transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi tra cứu tồn kho, lương, chấm công..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    />
  );
}
