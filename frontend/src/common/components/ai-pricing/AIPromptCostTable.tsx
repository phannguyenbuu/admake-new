import React from "react";
import { AppstoreOutlined } from "@ant-design/icons";
import {
  formatVND,
  type SignboardQuoteResult,
  type AIVariantQuoteResult
} from "../../services/aiPricingEngine";

interface AIPromptCostTableProps {
  materials: (SignboardQuoteResult | AIVariantQuoteResult)["materials"];
  operations: (SignboardQuoteResult | AIVariantQuoteResult)["operations"];
  summary: (SignboardQuoteResult | AIVariantQuoteResult)["summary"];
}

export const AIPromptCostTable: React.FC<AIPromptCostTableProps> = ({
  materials,
  operations,
  summary
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <AppstoreOutlined className="text-slate-700 text-base" />
          <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wide m-0">
            2. BẢNG CHI TIẾT GIÁ VỐN (COST PRICE)
          </h4>
        </div>
        <span className="text-xs font-bold text-slate-800">
          Tổng giá vốn: <b className="text-cyan-700 text-sm">{formatVND(summary.cost_price)}</b>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
              <th className="p-2.5 font-bold rounded-l-lg">Hạng mục</th>
              <th className="p-2.5 font-bold">Quy cách / Định mức</th>
              <th className="p-2.5 font-bold text-right">Khối lượng</th>
              <th className="p-2.5 font-bold text-right">Đơn giá</th>
              <th className="p-2.5 font-bold text-right rounded-r-lg">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Nhóm A */}
            <tr className="bg-cyan-50/60 text-cyan-950 font-black">
              <td colSpan={5} className="p-2 text-[11px] uppercase tracking-wider">
                A. VẬT TƯ ĐẦU VÀO (Tổng: {formatVND(materials.total_materials_cost)})
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-slate-800">1. Sắt hộp khung chính</td>
              <td className="p-2.5 text-slate-500">{materials.iron_frame.name}</td>
              <td className="p-2.5 text-right font-medium">{materials.iron_frame.quantity} cây 6m</td>
              <td className="p-2.5 text-right text-slate-500">{formatVND(materials.iron_frame.unit_price || 0)}</td>
              <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.iron_frame.total)}</td>
            </tr>
            {materials.reinforce_iron.active && (
              <tr>
                <td className="p-2.5 font-semibold text-slate-800">2. Sắt gia cố thêm</td>
                <td className="p-2.5 text-slate-500">{materials.reinforce_iron.name}</td>
                <td className="p-2.5 text-right font-medium">{materials.reinforce_iron.quantity} cây 6m</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(materials.reinforce_iron.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.reinforce_iron.total)}</td>
              </tr>
            )}
            <tr>
              <td className="p-2.5 font-semibold text-slate-800">3. Mặt bảng quảng cáo</td>
              <td className="p-2.5 text-slate-500">{materials.surface.name}</td>
              <td className="p-2.5 text-right font-medium">{materials.surface.quantity ? `${materials.surface.quantity} m²` : "-"}</td>
              <td className="p-2.5 text-right text-slate-500">{formatVND(materials.surface.unit_price || 0)}</td>
              <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.surface.total)}</td>
            </tr>
            {materials.sheet_backing.active && (
              <tr>
                <td className="p-2.5 font-semibold text-slate-800">4. Tôn lót mặt đáy</td>
                <td className="p-2.5 text-slate-500">{materials.sheet_backing.name}</td>
                <td className="p-2.5 text-right font-medium">{materials.sheet_backing.quantity} mét tới</td>
                <td className="p-2.5 text-right text-slate-500">{formatVND(materials.sheet_backing.unit_price || 0)}</td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.sheet_backing.total)}</td>
              </tr>
            )}
            <tr>
              <td className="p-2.5 font-semibold text-slate-800">5. V nhôm bọc viền</td>
              <td className="p-2.5 text-slate-500">Cây dài 3m</td>
              <td className="p-2.5 text-right font-medium">{materials.aluminum_trim.quantity} cây</td>
              <td className="p-2.5 text-right text-slate-500">{formatVND(materials.aluminum_trim.unit_price || 0)}</td>
              <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.aluminum_trim.total)}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-slate-800">6. Vật tư phụ</td>
              <td className="p-2.5 text-slate-500">Keo, vít, que hàn...</td>
              <td className="p-2.5 text-right font-medium">1 khoán</td>
              <td className="p-2.5 text-right text-slate-500">{formatVND(materials.accessories.unit_price || 0)}</td>
              <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(materials.accessories.total)}</td>
            </tr>

            {/* Nhóm B */}
            <tr className="bg-teal-50/60 text-teal-950 font-black">
              <td colSpan={5} className="p-2 text-[11px] uppercase tracking-wider">
                B. CHI PHÍ VẬN HÀNH & THI CÔNG (Tổng: {formatVND(operations.total_operations_cost)})
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-slate-800">1. Nhân công thi công</td>
              <td className="p-2.5 text-slate-500">120.000 đ/m²</td>
              <td className="p-2.5 text-right font-medium">{operations.labor.quantity} m²</td>
              <td className="p-2.5 text-right text-slate-500">120.000 đ</td>
              <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.labor.total)}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-slate-800">2. Xe vận chuyển</td>
              <td className="p-2.5 text-slate-500">Trọn gói chuyến</td>
              <td className="p-2.5 text-right font-medium">1 chuyến</td>
              <td className="p-2.5 text-right text-slate-500">200.000 đ</td>
              <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.transport.total)}</td>
            </tr>
            {operations.scaffolding.active && (
              <tr>
                <td className="p-2.5 font-semibold text-slate-800">3. Dàn giáo thi công</td>
                <td className="p-2.5 text-slate-500">50.000 đ/bộ/ngày</td>
                <td className="p-2.5 text-right font-medium">{operations.scaffolding.quantity} bộ.ngày</td>
                <td className="p-2.5 text-right text-slate-500">50.000 đ</td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.scaffolding.total)}</td>
              </tr>
            )}
            {operations.canvas_seam.active && (
              <tr>
                <td className="p-2.5 font-semibold text-slate-800">4. Nhân công nối bạt</td>
                <td className="p-2.5 text-slate-500">15.000 đ/m dài (Cả 2 chiều &gt; 3.1m)</td>
                <td className="p-2.5 text-right font-medium">{operations.canvas_seam.quantity} m</td>
                <td className="p-2.5 text-right text-slate-500">15.000 đ</td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(operations.canvas_seam.total)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-black text-xs border-t-2 border-slate-300">
              <td colSpan={4} className="p-2.5 text-right uppercase text-slate-900">
                TỔNG GIÁ VỐN TOÀN BỘ (A + B):
              </td>
              <td className="p-2.5 text-right text-cyan-800 text-sm font-black">
                {formatVND(summary.cost_price)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
