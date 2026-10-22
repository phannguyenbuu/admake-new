/**
 * Text3DModal.tsx - Hộp thoại tạo và chỉnh sửa Chữ 3D (100 Font, Extrude, Bevel Edges)
 */

import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Slider, Radio, Row, Col, Divider, Tag, Tooltip } from "antd";
import { Type, Sparkles, Sliders, Bold, Italic, Baseline, FileText, Ruler, Box, Layers } from "lucide-react";
import type { Text3DParams, BevelType, FontOption } from "./editorTypes";
import { CORE_100_FONTS, fetchAllSignageFonts } from "./fontCatalog";
import { SIGNBOARD_MATERIALS } from "./materialsCatalog";

interface Text3DModalProps {
  open: boolean;
  initialParams?: Text3DParams;
  onConfirm: (params: Text3DParams) => void;
  onCancel: () => void;
}

export const Text3DModal: React.FC<Text3DModalProps> = ({
  open,
  initialParams,
  onConfirm,
  onCancel,
}) => {
  const [fonts, setFonts] = useState<FontOption[]>(CORE_100_FONTS);
  const [text, setText] = useState<string>("DUSEK DESIGN");
  const [fontFamily, setFontFamily] = useState<string>("be-vietnam-pro");
  const [fontSize, setFontSize] = useState<number>(0.25); // mét (25cm)
  const [extrude, setExtrude] = useState<number>(0.04); // mét (40mm)
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("bold");
  const [bevelType, setBevelType] = useState<BevelType>("round");
  const [bevelSize, setBevelSize] = useState<number>(0.008); // mét
  const [materialId, setMaterialId] = useState<string>("inox_gold_mirror");
  const [color, setColor] = useState<string>("#d97706");
  const [glow, setGlow] = useState<boolean>(false);

  useEffect(() => {
    fetchAllSignageFonts().then(setFonts);
  }, []);

  useEffect(() => {
    if (initialParams) {
      setText(initialParams.text || "DUSEK DESIGN");
      setFontFamily(initialParams.fontFamily || "be-vietnam-pro");
      setFontSize(initialParams.fontSize || 0.25);
      setExtrude(initialParams.extrude || 0.04);
      setFontStyle(initialParams.fontStyle || "normal");
      setFontWeight((initialParams.fontWeight as any) || "bold");
      setBevelType(initialParams.bevelType || "round");
      setBevelSize(initialParams.bevelSize || 0.008);
      setMaterialId(initialParams.materialId || "inox_gold_mirror");
      setColor(initialParams.color || "#d97706");
      setGlow(Boolean(initialParams.glow));
    }
  }, [initialParams, open]);

  const handleMaterialChange = (matId: string) => {
    setMaterialId(matId);
    const found = SIGNBOARD_MATERIALS.find((m) => m.id === matId);
    if (found) {
      setColor(found.color);
      setGlow(Boolean(found.glow));
    }
  };

  const handleOk = () => {
    if (!text.trim()) return;
    onConfirm({
      text: text.trim(),
      fontFamily,
      fontSize,
      extrude,
      fontStyle,
      fontWeight,
      bevelType,
      bevelSize,
      color,
      materialId,
      glow,
    });
  };

  // Nhóm font theo phân loại chuyên môn
  const groupedFonts = [
    { label: "✨ Không Chân Hiện Đại (Sans-serif)", options: fonts.filter((f) => f.category === "sans-serif") },
    { label: "👑 Chữ Nổi Biển Hiệu & CNC (Display)", options: fonts.filter((f) => f.category === "display") },
    { label: "🏛️ Có Chân Sang Trọng & Spa (Serif)", options: fonts.filter((f) => f.category === "serif") },
    { label: "✒️ Uốn Lượn & Nghệ Thuật (Script)", options: fonts.filter((f) => f.category === "script") },
    { label: "🏗️ Khối Hộp Công Nghiệp (Slab)", options: fonts.filter((f) => f.category === "slab") },
    { label: "📦 Font Tuỳ Chỉnh Backend", options: fonts.filter((f) => f.category === "custom") },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800 text-sm sm:text-base font-bold">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Type className="w-5 h-5" />
          </div>
          <span>Tạo & Chỉnh Sửa Chữ Nổi 3D (100 Font, Extrude, Bevel)</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Xác nhận & Dựng khối 3D"
      cancelText="Hủy"
      width={720}
      className="custom-modal"
      centered
    >
      <div className="space-y-4 py-2 text-xs text-slate-700">
        {/* 1. Nội dung chữ */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Nội dung chữ nổi (Tiếng Việt đầy đủ):</label>
          <Input
            size="large"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập tên thương hiệu, chữ bảng hiệu..."
            className="font-bold text-base"
          />
        </div>

        {/* 2. Chọn 100 Font chữ chuyên dụng */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-800">Bộ 100 Font chữ chuyên ngành Biển Hiệu & CNC:</label>
            <Tag color="blue">100 fonts</Tag>
          </div>
          <Select
            size="middle"
            value={fontFamily}
            onChange={setFontFamily}
            showSearch
            optionFilterProp="label"
            className="w-full"
            options={groupedFonts.map((g) => ({
              label: g.label,
              options: g.options.map((f) => ({
                label: `${f.name} - ${f.best_for}`,
                value: f.id,
              })),
            }))}
          />
        </div>

        {/* 3. Font Style & Weight - 100% Icon */}
        <Row gutter={16}>
          <Col span={12}>
            <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span>Kiểu dáng (Font Style):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Tooltip title="Đứng thẳng (Normal / Upright)">
                <button
                  type="button"
                  onClick={() => setFontStyle("normal")}
                  className={`h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${
                    fontStyle === "normal"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                  }`}
                >
                  <Type className="w-4 h-4" />
                </button>
              </Tooltip>

              <Tooltip title="Nghiêng (Italic)">
                <button
                  type="button"
                  onClick={() => setFontStyle("italic")}
                  className={`h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${
                    fontStyle === "italic"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </Col>

          <Col span={12}>
            <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Bold className="w-3.5 h-3.5 text-slate-500" />
              <span>Độ đậm (Font Weight):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Tooltip title="Vừa (Regular)">
                <button
                  type="button"
                  onClick={() => setFontWeight("normal")}
                  className={`h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${
                    fontWeight === "normal"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                  }`}
                >
                  <Baseline className="w-4 h-4" />
                </button>
              </Tooltip>

              <Tooltip title="Đậm (Bold)">
                <button
                  type="button"
                  onClick={() => setFontWeight("bold")}
                  className={`h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${
                    fontWeight === "bold"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </Col>
        </Row>

        <Divider className="my-2" />

        {/* 4. Kích thước (FontSize) & Độ dày chân chữ (Extrude Depth) */}
        <Row gutter={16}>
          <Col span={12}>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                <span>Chiều cao chữ (Font Size):</span>
              </label>
              <span className="font-bold text-indigo-600">{Math.round(fontSize * 100)} cm ({Math.round(fontSize * 1000)}mm)</span>
            </div>
            <Slider
              min={0.05}
              max={1.5}
              step={0.01}
              value={fontSize}
              onChange={setFontSize}
            />
          </Col>
          <Col span={12}>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-amber-500" />
                <span>Độ dày chân chữ (Extrude Depth):</span>
              </label>
              <span className="font-bold text-amber-600">{Math.round(extrude * 1000)} mm ({Number((extrude * 100).toFixed(1))}cm)</span>
            </div>
            <Slider
              min={0.01}
              max={0.2}
              step={0.005}
              value={extrude}
              onChange={setExtrude}
            />
          </Col>
        </Row>

        {/* 5. Bo viền cạnh chữ (Bevel Edge) - 100% Icon */}
        <div>
          <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Kiểu Bo Viền Cạnh Chữ (Bevel Edge):</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                value: "round" as BevelType,
                title: "Bo Tròn (Round) - Mép chữ cong tự nhiên",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19V12a7 7 0 0 1 7-7h7" />
                  </svg>
                ),
              },
              {
                value: "chamfer" as BevelType,
                title: "Vát Chéo (Chamfer) - Cạnh vát 45° kim loại",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19V13L13 5H19" />
                  </svg>
                ),
              },
              {
                value: "round_soft" as BevelType,
                title: "Round Mềm - Bo cong 8 phân đoạn mịn",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19v-5c0-3 3-5 6-5s6-2 6-4h2" />
                  </svg>
                ),
              },
              {
                value: "none" as BevelType,
                title: "Vuông Phẳng - Sắc cạnh không bo",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19V5h14" />
                  </svg>
                ),
              },
            ].map((b) => {
              const isSelected = bevelType === b.value;
              return (
                <Tooltip key={b.value} title={b.title}>
                  <button
                    type="button"
                    onClick={() => setBevelType(b.value)}
                    className={`h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                    }`}
                  >
                    {b.icon}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* 6. Chọn vật liệu bảng hiệu */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Vật liệu mặt chữ (Theo danh mục Admake):</label>
          <Select
            size="middle"
            value={materialId}
            onChange={handleMaterialChange}
            className="w-full"
            options={[
              {
                label: "👑 INOX CHỮ NỔI",
                options: SIGNBOARD_MATERIALS.filter((m) => m.category === "inox").map((m) => ({
                  label: m.name,
                  value: m.id,
                })),
              },
              {
                label: "🎨 MICA ĐÀI LOAN HỘP",
                options: SIGNBOARD_MATERIALS.filter((m) => m.category === "mica").map((m) => ({
                  label: m.name,
                  value: m.id,
                })),
              },
              {
                label: "💡 ĐÈN LED PHÁT SÁNG",
                options: SIGNBOARD_MATERIALS.filter((m) => m.category === "led").map((m) => ({
                  label: m.name,
                  value: m.id,
                })),
              },
              {
                label: "✨ MẶT DỰNG ALU",
                options: SIGNBOARD_MATERIALS.filter((m) => m.category === "alu").map((m) => ({
                  label: m.name,
                  value: m.id,
                })),
              },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
};
