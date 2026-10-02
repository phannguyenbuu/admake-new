import React, { useState, useEffect } from "react";
import { Modal, Input, Button, notification, Card, Tag, Statistic, Tooltip } from "antd";
import {
  GiftOutlined,
  CopyOutlined,
  QrcodeOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  UsergroupAddOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useUser } from "../../hooks/useUser";
import { useApiStatic } from "../../hooks/useApiHost";

interface AffiliateModalProps {
  open: boolean;
  onCancel: () => void;
}

export default function AffiliateModal({ open, onCancel }: AffiliateModalProps) {
  const { userLeadId, username, fullName } = useUser();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [stats, setStats] = useState({
    refCode: "",
    clicks: 0,
    leadsCount: 0,
    totalRevenue: 0,
    commissionRate: 10, // 10%
    earnedCommission: 0,
  });

  // Unique Affiliate Referral Link
  const refCode = userLeadId ? `REF-${userLeadId}` : (username || "ADMAKE");
  const affiliateUrl = `${window.location.origin}/login?ref=${refCode}`;
  const qrUrl = `https://img.vietqr.io/image/COOPBANK-6600300837884477-compact2.png?addInfo=REF-${refCode}`;

  useEffect(() => {
    if (open) {
      // Fetch user affiliate stats from API if available
      setStats((prev) => ({
        ...prev,
        refCode: refCode,
      }));
    }
  }, [open, refCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setCopied(true);
    notification.success({
      message: "Đã sao chép link Affiliate!",
      description: "Hãy gửi link này cho bạn bè, đối tác để nhận 10% hoa hồng.",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareText = `Trải nghiệm phần mềm quản lý sản xuất & kinh doanh ADMAKE tối ưu nhất! Đăng ký ngay qua link này để nhận ưu đãi 5%: ${affiliateUrl}`;

  const handleShareZalo = () => {
    const url = `https://zalo.me/share?url=${encodeURIComponent(affiliateUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={640}
      centered
      destroyOnClose
      styles={{ body: { padding: 0 } }}
    >
      {/* Header Banner với Gradient nghệ thuật */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-slate-900 via-teal-900 to-cyan-900 p-6 text-white shadow-md">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-400 text-2xl text-slate-950 shadow-lg">
              <GiftOutlined />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">ADMAKE PARTNER PROGRAM</h3>
                <Tag color="gold" className="font-bold border-none px-2 py-0.5 rounded-full">
                  HOA HỒNG 10%
                </Tag>
              </div>
              <p className="text-xs text-slate-300">
                Chia sẻ link giới thiệu Admake cho đối tác & nhận 10% hoa hồng trực tiếp.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5 bg-slate-50/50 rounded-b-2xl">
        {/* Khung Link Affiliate 1-Click Copy */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <RocketOutlined className="text-cyan-600" /> Link giới thiệu cá nhân của bạn
            </span>
            <Tag color="cyan" className="font-mono text-[11px] font-semibold">
              Mã: {refCode}
            </Tag>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Input
              value={affiliateUrl}
              readOnly
              className="font-mono text-xs border-slate-300 bg-slate-50 text-slate-700 focus:border-cyan-500 rounded-lg !h-10"
            />
            <Button
              type="primary"
              onClick={handleCopy}
              icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
              className="!h-10 px-4 font-bold rounded-lg shadow-sm"
              style={{ backgroundColor: copied ? "#16a34a" : "#00B4B6", borderColor: "transparent" }}
            >
              {copied ? "Đã chép" : "Sao chép"}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Chia sẻ nhanh qua:</span>
            <div className="flex items-center gap-2">
              <Button
                size="small"
                onClick={handleShareZalo}
                className="text-xs font-semibold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md"
              >
                📲 Zalo Share
              </Button>
              <Button
                size="small"
                onClick={() => setShowQr(!showQr)}
                icon={<QrcodeOutlined />}
                className="text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-md"
              >
                {showQr ? "Ẩn QR" : "Tạo Mã QR"}
              </Button>
            </div>
          </div>

          {/* QR Code popup nếu bật */}
          {showQr && (
            <div className="mt-3 flex flex-col items-center justify-center p-4 border border-cyan-200 bg-cyan-50/40 rounded-xl gap-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(affiliateUrl)}`}
                alt="Affiliate QR Code"
                className="w-40 h-40 rounded-lg border border-white shadow-md bg-white p-2"
              />
              <span className="text-xs font-semibold text-cyan-800">
                Quét mã QR để truy cập link giới thiệu
              </span>
            </div>
          )}
        </div>

        {/* Dashboard Thống kê Hoa hồng Mini */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col items-center text-center">
            <UsergroupAddOutlined className="text-xl text-blue-600 mb-1" />
            <span className="text-[11px] text-slate-500 font-medium">Khách giới thiệu</span>
            <span className="text-lg font-extrabold text-slate-800">{stats.leadsCount} đối tác</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col items-center text-center">
            <DollarCircleOutlined className="text-xl text-emerald-600 mb-1" />
            <span className="text-[11px] text-slate-500 font-medium">Tỷ lệ Hoa hồng</span>
            <span className="text-lg font-extrabold text-emerald-600">10% / Đơn</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col items-center text-center">
            <GiftOutlined className="text-xl text-amber-500 mb-1" />
            <span className="text-[11px] text-slate-500 font-medium">Hoa hồng tích lũy</span>
            <span className="text-lg font-extrabold text-amber-600">
              {stats.earnedCommission.toLocaleString()}đ
            </span>
          </div>
        </div>

        {/* Thể lệ chương trình ngắn gọn */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 leading-relaxed flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1 text-amber-900">
            🌟 Quyền lợi Đối tác Affiliate Admake:
          </span>
          <ul className="list-disc pl-4 space-y-1 text-amber-800">
            <li>Nhận ngay <strong>10% giá trị hợp đồng</strong> bằng tiền mặt hoặc trừ trực tiếp vào phí gia hạn gói Admake.</li>
            <li>Khách hàng đăng ký qua link của bạn được ưu đãi <strong>giảm ngay 5%</strong> trị giá dịch vụ.</li>
            <li>Hoa hồng được đối soát tự động & duyệt minh bạch tại hệ thống quản lý.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
