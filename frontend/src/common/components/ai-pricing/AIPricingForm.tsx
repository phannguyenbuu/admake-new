import React, { useState } from "react";
import { Button, InputNumber, Radio, Switch, Tooltip, message } from "antd";
import {
  CalculatorOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import {
  PRICING_STANDARDS,
  formatVND,
  generateFullPrompt,
  type SignboardInput
} from "../../services/aiPricingEngine";

interface AIPricingFormProps {
  initialValues?: Partial<SignboardInput>;
  onSubmit: (values: SignboardInput) => void;
  loading?: boolean;
}

const PRESET_SIZES = [
  { label: "3m x 1m (Cửa hàng nhỏ)", w: 3, h: 1 },
  { label: "4m x 1.2m (Chuẩn khổ)", w: 4, h: 1.2 },
  { label: "5m x 1.5m (Mặt tiền)", w: 5, h: 1.5 },
  { label: "6m x 2m (Nhà xưởng)", w: 6, h: 2 },
  { label: "8m x 3.5m (Thử nối bạt >3.1m)", w: 8, h: 3.5 },
];

const PROFIT_PRESETS = [15, 20, 25, 30, 35, 40];

export const AIPricingForm: React.FC<AIPricingFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
}) => {
  const [width, setWidth] = useState<number>(initialValues?.width ?? 3);
  const [height, setHeight] = useState<number>(initialValues?.height ?? 1);
  const [ironType, setIronType] = useState<string>(initialValues?.iron_type ?? "vuong_20");
  const [surfaceType, setSurfaceType] = useState<string>(initialValues?.surface_type ?? "bat_hiflex");
  const [hasSheetBacking, setHasSheetBacking] = useState<boolean>(initialValues?.has_sheet_backing ?? true);
  const [hasReinforceIron, setHasReinforceIron] = useState<boolean>(initialValues?.has_reinforce_iron ?? false);
  const [reinforceQty, setReinforceQty] = useState<number>(initialValues?.reinforce_qty ?? 2);
  const [reinforceLength, setReinforceLength] = useState<number>(initialValues?.reinforce_length ?? 3);
  const [location, setLocation] = useState<string>(initialValues?.location ?? "outdoor");
  const [useScaffolding, setUseScaffolding] = useState<boolean>(initialValues?.use_scaffolding ?? false);
  const [scaffoldingSets, setScaffoldingSets] = useState<number>(initialValues?.scaffolding_sets ?? 1);
  const [scaffoldingDays, setScaffoldingDays] = useState<number>(initialValues?.scaffolding_days ?? 1);
  const [profitMargin, setProfitMargin] = useState<number>(initialValues?.profit_margin ?? 30);

  const getCurrentInput = (): SignboardInput => ({
    width: Number(width) || 1,
    height: Number(height) || 1,
    iron_type: ironType,
    surface_type: surfaceType,
    has_sheet_backing: hasSheetBacking,
    has_reinforce_iron: hasReinforceIron,
    reinforce_qty: hasReinforceIron ? reinforceQty : 0,
    reinforce_length: hasReinforceIron ? reinforceLength : 0,
    location,
    use_scaffolding: useScaffolding,
    scaffolding_sets: useScaffolding ? scaffoldingSets : 1,
    scaffolding_days: useScaffolding ? scaffoldingDays : 1,
    profit_margin: Number(profitMargin) || 30,
  });

  const handleSubmit = () => {
    if (!width || width <= 0 || !height || height <= 0) {
      message.error("Vui lòng nhập kích thước bảng hiệu hợp lệ!");
      return;
    }
    onSubmit(getCurrentInput());
  };

  const handleCopyPrompt = () => {
    const prompt = generateFullPrompt(getCurrentInput());
    navigator.clipboard.writeText(prompt);
    message.success("Đã sao chép prompt đầy đủ vào clipboard để gửi ChatGPT/Gemini!");
  };

  const isCanvas = surfaceType.startsWith("bat_");

  return (
    <div className="bg-gradient-to-br from-cyan-50/50 via-white to-sky-50/40 rounded-2xl border-2 border-cyan-300/80 p-4 md:p-6 shadow-md text-slate-800 space-y-5">
      {/* Header Form */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            AI
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 m-0 leading-tight">
              Bảng Khai Báo Thông Số Bảng Hiệu
            </h3>
            <span className="text-xs text-slate-500">
              Nhấp chọn các thông số bên dưới để AI tự động bóc tách định mức & báo giá
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyPrompt}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-700 bg-cyan-100/70 hover:bg-cyan-200 transition-all border border-cyan-200 cursor-pointer"
        >
          <CopyOutlined />
          <span>Sao chép prompt đầy đủ</span>
        </button>
      </div>

      {/* 1. Kích thước mặt bảng */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs flex items-center justify-center font-bold">1</span>
            Kích thước mặt bảng (Dài x Cao / Rộng)
          </label>
          <span className="text-xs text-slate-500 font-medium">
            Diện tích: <b className="text-cyan-600 font-bold">{Math.round(width * height * 100) / 100} m²</b> | Chu vi: <b className="text-cyan-600">{Math.round(2 * (width + height) * 100) / 100} m</b>
          </span>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SIZES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setWidth(preset.w);
                setHeight(preset.h);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                width === preset.w && height === preset.h
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Numeric inputs */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 focus-within:border-cyan-500 shadow-2xs">
            <span className="text-xs text-slate-400 block font-medium">Chiều Dài / Ngang (m)</span>
            <div className="flex items-center gap-2 mt-0.5">
              <InputNumber
                min={0.2}
                max={50}
                step={0.1}
                value={width}
                onChange={(val) => setWidth(val || 1)}
                className="w-full !border-none !shadow-none font-bold text-base text-slate-700"
              />
              <span className="text-xs font-semibold text-slate-400">mét</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 focus-within:border-cyan-500 shadow-2xs">
            <span className="text-xs text-slate-400 block font-medium">Chiều Cao / Rộng (m)</span>
            <div className="flex items-center gap-2 mt-0.5">
              <InputNumber
                min={0.2}
                max={50}
                step={0.1}
                value={height}
                onChange={(val) => setHeight(val || 1)}
                className="w-full !border-none !shadow-none font-bold text-base text-slate-700"
              />
              <span className="text-xs font-semibold text-slate-400">mét</span>
            </div>
          </div>
        </div>

        {/* Live Warning Notice for Canvas Seam */}
        {isCanvas && width > 3.1 && height > 3.1 && (
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-800 text-xs">
            <WarningOutlined className="text-amber-500 text-base mt-0.5" />
            <div>
              <b>Cảnh báo nối bạt:</b> Cả 2 cạnh ({width}m x {height}m) đều &gt; 3.1m. Hệ thống sẽ tự động cộng thêm chi phí nối bạt <b>15.000 đ/m dài</b> ({Math.min(width, height)}m = {formatVND(Math.min(width, height) * 15000)}).
            </div>
          </div>
        )}
      </div>

      {/* 2. Chất liệu mặt bảng */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs flex items-center justify-center font-bold">2</span>
          Chất liệu mặt bảng
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRICING_STANDARDS.surfaces.map((s) => {
            const isSelected = surfaceType === s.key;
            return (
              <div
                key={s.key}
                onClick={() => setSurfaceType(s.key)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-cyan-50/80 border-cyan-500 ring-2 ring-cyan-400/30 shadow-xs"
                    : "bg-white border-slate-200 hover:border-cyan-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? "text-cyan-800" : "text-slate-700"}`}>
                    {s.name}
                  </span>
                  {isSelected && <CheckOutlined className="text-cyan-600 text-xs" />}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-slate-400">{s.desc}</span>
                  <span className="font-bold text-cyan-600">{formatVND(s.unitPrice)}/{s.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Loại sắt sử dụng */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs flex items-center justify-center font-bold">3</span>
          Loại sắt hộp đan khung
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRICING_STANDARDS.iron_bars.map((iron) => {
            const isSelected = ironType === iron.key;
            return (
              <div
                key={iron.key}
                onClick={() => setIronType(iron.key)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-cyan-50/80 border-cyan-500 ring-2 ring-cyan-400/30 shadow-xs"
                    : "bg-white border-slate-200 hover:border-cyan-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? "text-cyan-800" : "text-slate-700"}`}>
                    {iron.name}
                  </span>
                  {isSelected && <CheckOutlined className="text-cyan-600 text-xs" />}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-slate-400">Đan nhịp 1m - 1.2m</span>
                  <span className="font-bold text-cyan-600">{formatVND(iron.unitPrice)}/cây</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Các tuỳ chọn bổ sung (Tôn lót, Sắt gia cố, Vị trí, Dàn giáo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Tôn lót */}
        <div className={`p-3 rounded-xl border transition-all ${hasSheetBacking ? "bg-white border-slate-200" : "bg-rose-50/40 border-rose-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Tôn lót mặt sau</span>
              <span className="text-[11px] text-slate-400">Khổ 1.2m (75.000 đ/mét tới)</span>
            </div>
            <Switch
              checked={hasSheetBacking}
              onChange={setHasSheetBacking}
              checkedChildren="Có"
              unCheckedChildren="Không"
            />
          </div>
          {!hasSheetBacking && isCanvas && (
            <div className="mt-2 text-[11px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded-lg border border-rose-200 flex items-center gap-1">
              <WarningOutlined /> Không lót tôn: Từ chối bảo hành rách gió bão!
            </div>
          )}
        </div>

        {/* Vị trí lắp đặt */}
        <div className="p-3 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Vị trí lắp đặt</span>
              <span className="text-[11px] text-slate-400">Trong nhà / Ngoài trời</span>
            </div>
            <Radio.Group
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="outdoor">Ngoài trời</Radio.Button>
              <Radio.Button value="indoor">Trong nhà</Radio.Button>
            </Radio.Group>
          </div>
          {surfaceType === "alu_guong_vang" && location === "outdoor" && (
            <div className="mt-2 text-[11px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded-lg border border-rose-200 flex items-center gap-1">
              <WarningOutlined /> Alu gương ngoài trời: Không bảo hành bay màu!
            </div>
          )}
        </div>

        {/* Sắt chống gia cố */}
        <div className="p-3 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Sắt chống gia cố</span>
              <span className="text-[11px] text-slate-400">Gia cố chân / giằng chịu lực</span>
            </div>
            <Switch
              checked={hasReinforceIron}
              onChange={setHasReinforceIron}
              checkedChildren="Có"
              unCheckedChildren="Không"
            />
          </div>
          {hasReinforceIron && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Số lượng (cây chống)</span>
                <InputNumber
                  min={1}
                  max={20}
                  value={reinforceQty}
                  onChange={(val) => setReinforceQty(val || 1)}
                  className="w-full !border-none !shadow-none font-bold text-xs"
                />
              </div>
              <div className="flex-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Chiều dài/cây (m)</span>
                <InputNumber
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={reinforceLength}
                  onChange={(val) => setReinforceLength(val || 1)}
                  className="w-full !border-none !shadow-none font-bold text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Dàn giáo */}
        <div className="p-3 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Sử dụng dàn giáo</span>
              <span className="text-[11px] text-slate-400">50.000 đ/bộ/ngày</span>
            </div>
            <Switch
              checked={useScaffolding}
              onChange={setUseScaffolding}
              checkedChildren="Có"
              unCheckedChildren="Không"
            />
          </div>
          {useScaffolding && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Số bộ</span>
                <InputNumber
                  min={1}
                  max={20}
                  value={scaffoldingSets}
                  onChange={(val) => setScaffoldingSets(val || 1)}
                  className="w-full !border-none !shadow-none font-bold text-xs"
                />
              </div>
              <div className="flex-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Số ngày</span>
                <InputNumber
                  min={1}
                  max={60}
                  value={scaffoldingDays}
                  onChange={(val) => setScaffoldingDays(val || 1)}
                  className="w-full !border-none !shadow-none font-bold text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Tỷ lệ lợi nhuận kỳ vọng */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs flex items-center justify-center font-bold">4</span>
            Tỷ lệ lợi nhuận kỳ vọng
          </label>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium">Mức lợi nhuận:</span>
            <span className="text-emerald-600 font-bold text-sm">+{profitMargin}%</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PROFIT_PRESETS.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setProfitMargin(pct)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                profitMargin === pct
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40"
              }`}
            >
              {pct}%
            </button>
          ))}
          <div className="flex items-center gap-1.5 ml-auto bg-white px-2 py-1 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-400 font-medium">Tự nhập:</span>
            <InputNumber
              min={0}
              max={200}
              value={profitMargin}
              onChange={(val) => setProfitMargin(val || 0)}
              className="!w-20 !border-none !shadow-none font-bold text-xs text-emerald-700"
            />
            <span className="text-xs font-bold text-emerald-600">%</span>
          </div>
        </div>
      </div>

      {/* Action Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-700 hover:via-teal-700 hover:to-emerald-700 text-white font-bold text-base shadow-lg shadow-cyan-600/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <ThunderboltOutlined className="text-lg animate-pulse" />
          <span>{loading ? "Đang tính toán..." : "BÓC TÁCH & TÍNH BÁO GIÁ NGAY"}</span>
        </button>
      </div>
    </div>
  );
};
