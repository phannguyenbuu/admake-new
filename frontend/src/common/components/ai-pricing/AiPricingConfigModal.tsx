import React, { useState, useEffect } from "react";
import { Modal, Input, Button } from "antd";
import { KeyOutlined } from "@ant-design/icons";

interface AiPricingConfigModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (key: string) => void;
  onTest: (key: string) => Promise<void>;
  isTesting: boolean;
  initialKey: string;
}

export const AiPricingConfigModal: React.FC<AiPricingConfigModalProps> = ({
  open,
  onCancel,
  onSave,
  onTest,
  isTesting,
  initialKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(initialKey);

  useEffect(() => {
    if (open) {
      setApiKeyInput(initialKey);
    }
  }, [open, initialKey]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <KeyOutlined className="text-cyan-600" />
          <span>Cấu hình AI API Key</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={550}
    >
      <div className="space-y-4 pt-2">
        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
          💡 Hệ thống hỗ trợ kết nối trực tiếp đến <b>Google Gemini API</b> (Gemini 2.5 / 2.0 / 1.5 Flash) hoặc <b>AI Engine API</b>.
          Nếu không có API key, hệ thống sẽ tự động dùng <b>Engine Xưởng Chuyên Gia ADMAKE</b> tính toán chuẩn xác 100% không bị ảo giác số học.
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Google Gemini API Key (hoặc AI API Key):
          </label>
          <Input.Password
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Dán API Key (AIzaSy... hoặc sk-...)"
            className="rounded-xl"
          />
          <div className="text-[11px] text-slate-400 mt-1">
            Khóa API được lưu an toàn trong trình duyệt của bạn (localStorage) và gửi trực tiếp qua HTTPS.
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button
            onClick={() => onTest(apiKeyInput)}
            loading={isTesting}
            disabled={!apiKeyInput.trim()}
            className="rounded-xl text-xs"
          >
            Kiểm tra kết nối
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={onCancel} className="rounded-xl text-xs">
              Đóng
            </Button>
            <Button
              type="primary"
              onClick={() => onSave(apiKeyInput)}
              className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold"
            >
              Lưu & Kích hoạt
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
