import type { IPage } from "../../../@types/common.type";
import React from "react";

const InvoiceDashboard: IPage["Component"] = () => {
  const productCards = [
    {
      title: "BẢNG QUẢNG CÁO",
      imageLabel: "SIGN",
      materials: "Led, mica, alu, ...",
      size: "Lớn",
      factory: "Xưởng",
    },
    {
      title: "NHÔM KÍNH",
      imageLabel: "ALU",
      materials: "Nhôm, kính, ...",
      size: "Lớn",
      factory: "Xưởng",
    },
    {
      title: "GỖ CÔNG NGHIỆP",
      imageLabel: "WOOD",
      materials: "MDF, MFC, Laminate...",
      size: "Lớn",
      factory: "Xưởng",
    },
  ];

  const recentPreview = [
    { label: "Sửa gần nhất", value: "28.01.2026" },
    { label: "Vật tư", value: "Led, mica, alu, ..." },
    { label: "Kích thước", value: "Lớn" },
    { label: "Sản xuất tại", value: "Xưởng" },
  ];

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <section className="bg-white/90 rounded-2xl shadow-md border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-700">Báo giá</h2>
          <div className="text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2">
            B-One Decor / LEAD
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[24px_1fr_24px] gap-4 items-center">
          <button className="hidden xl:flex items-center justify-center text-slate-400">◀</button>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {productCards.map((card) => (
              <div key={card.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-slate-700 via-slate-500 to-slate-300 text-white flex items-center justify-center">
                  <div className="text-lg font-semibold tracking-widest">{card.imageLabel}</div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-sm font-semibold text-slate-700">{card.title}</div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-sm text-slate-600 items-center">
                    <span>Mẫu sẵn có:</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">Sample 1, Sample 2</div>
                    <span>Vật tư:</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">{card.materials}</div>
                    <span>Kích thước:</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">{card.size}</div>
                    <span>Sản xuất tại:</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">{card.factory}</div>
                  </div>
                  <button className="w-full bg-slate-600 text-white text-sm font-semibold rounded-lg py-2">
                    CHỌN
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="hidden xl:flex items-center justify-center text-slate-400">▶</button>
        </div>
      </section>

      <section className="bg-white/90 rounded-2xl shadow-md border border-slate-100 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_180px] gap-4">
              <div className="rounded-xl bg-gradient-to-br from-slate-700 to-slate-400 text-white flex items-center justify-center h-40">
                SIGN
              </div>
              <div className="space-y-3">
                {recentPreview.map((row) => (
                  <div key={row.label} className="grid grid-cols-[110px_1fr] gap-2 text-sm">
                    <span className="text-slate-500">{row.label}</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700">
                      {row.value}
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-full bg-slate-600 text-white">QUẢNG CÁO</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">BẢNG HIỆU CAFE</span>
                </div>
              </div>
              <div className="grid grid-rows-2 gap-2">
                <div className="rounded-xl bg-gradient-to-br from-slate-300 to-slate-100" />
                <div className="rounded-xl bg-gradient-to-br from-slate-200 to-slate-50" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="text-sm font-semibold text-slate-600 mb-3">DỰ ÁN GẦN ĐÂY</div>
              <div className="text-3xl font-semibold text-slate-700">72.500.000</div>
              <div className="text-sm text-slate-400 mb-4">~ 2 - 3 Days</div>
              <div className="flex gap-2 text-xs">
                <button className="flex-1 border border-slate-200 rounded-lg py-2 text-slate-600">Export PDF</button>
                <button className="flex-1 border border-slate-200 rounded-lg py-2 text-slate-600">Share</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-rose-500 text-white rounded-lg py-2 text-sm font-semibold">SỬA FILE NÀY</button>
              <button className="flex-1 bg-slate-700 text-white rounded-lg py-2 text-sm font-semibold">NHÂN BẢN</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvoiceDashboard;
