import type { IPage } from "../../../@types/common.type";
import React, { useState } from "react";

const tabs = [
  { key: "kho-hang", label: "KHO HÀNG" },
  { key: "tao-vat-lieu", label: "TẠO VẬT LIỆU" },
];

const supplierRows = [
  { name: "Hưng Phú Gia Group", date: "24/04/2024", unit: "Tấm", price: "200,000 đ", qty: 200 },
  { name: "Minh Phúc", date: "16/04/2024", unit: "Tấm", price: "800,000 đ", qty: 150 },
  { name: "HOÀNG GIA ANH", date: "10/04/2024", unit: "Tấm", price: "350,000 đ", qty: 300 },
  { name: "Mica Hải Đăng", date: "26/08/2024", unit: "Tấm", price: "300,000 đ", qty: 40 },
  { name: "Lam Chắn Nắng CAA", date: "10/03/2024", unit: "Tấm", price: "600,000 đ", qty: 100 },
  { name: "Mộc Hy", date: "01/03/2024", unit: "Tấm", price: "250,000 đ", qty: 300 },
];

const stockRows = [
  { name: "Alu đồng", code: "CON/123", initial: "100 Kg", inQty: "0 Kg", outQty: "0 Kg", stock: "43,000 Kg", date: "23/04/2024" },
  { name: "Pima xám xi măng", code: "ACLLC003", initial: "2,000 Kg", inQty: "2,000 Kg", outQty: "800 Kg", stock: "30,000 Kg", date: "23/04/2024" },
  { name: "Mica trắng", code: "XPSF2002", initial: "8,000 Kg", inQty: "8,000 Kg", outQty: "3,000 Kg", stock: "14,500 Kg", date: "23/04/2024" },
  { name: "Kính màu", code: "BMP0005", initial: "2,000 Kg", inQty: "780 Kg", outQty: "3,000 Kg", stock: "10,000 Kg", date: "23/04/2024" },
];

const MaterialsDashboard: IPage["Component"] = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <section className="bg-white/90 rounded-2xl shadow-md border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  activeTab === tab.key
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 text-sm text-slate-500 min-w-[200px]">
            <span className="text-slate-400">🔍</span>
            Tìm kiếm ...
          </div>
        </div>

        {activeTab === "kho-hang" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="text-sm font-semibold text-slate-600 mb-3">TẤM ALU GIẢ ĐỒNG</div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl bg-gradient-to-br from-amber-700 to-amber-300 h-20" />
                  ))}
                </div>
                <div className="bg-slate-800 rounded-2xl p-3 text-xs text-slate-200">
                  {[
                    "Ambient",
                    "Diffuse",
                    "Specular",
                    "Glossiness",
                    "Self-illumination",
                    "Opacity",
                    "Filter Color",
                    "Bump",
                    "Reflection",
                    "Refraction",
                    "Displacement",
                  ].map((label) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                      <span>{label}</span>
                      <span className="bg-slate-600 px-3 py-1 rounded-full">20</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Tổng giá trị tồn", value: "2,345,800,000 đ" },
                    { label: "Hết hàng", value: "1" },
                    { label: "Nhập gần nhất", value: "+5" },
                  ].map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <div className="text-xs text-slate-400">{card.label}</div>
                      <div className="text-lg font-semibold text-teal-600">{card.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-slate-600">Nhà phân phối</div>
                    <button className="text-xs text-teal-500">Xem tất cả</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="text-slate-400 text-xs border-b">
                          <th className="py-2">Nhà phân phối</th>
                          <th className="py-2">Ngày báo giá</th>
                          <th className="py-2">Đơn vị tính</th>
                          <th className="py-2">Giá nhập (VND)</th>
                          <th className="py-2">Số lượng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierRows.map((row) => (
                          <tr key={row.name} className="border-b last:border-0">
                            <td className="py-3 text-slate-600 font-medium">{row.name}</td>
                            <td className="py-3 text-slate-500">{row.date}</td>
                            <td className="py-3 text-slate-500">{row.unit}</td>
                            <td className="py-3 text-slate-600">{row.price}</td>
                            <td className="py-3 text-slate-500">{row.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-200 h-44" />
                  </div>
                  <div className="bg-slate-800 text-white rounded-2xl shadow-sm p-4">
                    <div className="text-sm font-semibold mb-3">Chi tiết thay đổi</div>
                    <div className="space-y-2 text-xs">
                      {[
                        { date: "23/04/2024", inOut: "-20", stock: "1,200" },
                        { date: "12/04/2024", inOut: "-100", stock: "1,190" },
                        { date: "05/04/2024", inOut: "+300", stock: "1,250" },
                        { date: "15/03/2024", inOut: "+200", stock: "930" },
                        { date: "29/03/2024", inOut: "-50", stock: "760" },
                        { date: "10/02/2024", inOut: "-200", stock: "830" },
                      ].map((row) => (
                        <div key={row.date} className="flex items-center justify-between border-b border-slate-700 pb-2">
                          <span>{row.date}</span>
                          <span className={row.inOut.startsWith("+") ? "text-emerald-300" : "text-rose-300"}>
                            {row.inOut}
                          </span>
                          <span>{row.stock}</span>
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 w-full bg-teal-500 rounded-lg py-2 text-sm font-semibold">Đóng</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tao-vat-lieu" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-200 h-40 mb-3" />
                <button className="w-full bg-teal-500 text-white rounded-lg py-2 text-sm font-semibold">Hiển thị</button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Tổng số vật liệu", value: "203", extra: "+3 Hôm nay" },
                    { label: "Tổng khối lượng", value: "43,200 Kg", extra: "" },
                    { label: "Tổng giá trị tồn kho", value: "742,570,000 đ", extra: "" },
                  ].map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <div className="text-xs text-slate-400">{card.label}</div>
                      <div className="text-lg font-semibold text-teal-600">{card.value}</div>
                      {card.extra && <div className="text-xs text-teal-500">{card.extra}</div>}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 text-sm">
                    <div className="font-semibold text-slate-600">Tên vật liệu</div>
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Nhập tên..." />
                    <div className="font-semibold text-slate-600">Code</div>
                    <div className="border border-slate-200 rounded-lg px-3 py-2">Tấm alu</div>
                    <div className="font-semibold text-slate-600">Khối lượng / Số lượng</div>
                    <div className="border border-slate-200 rounded-lg px-3 py-2">0 Kg</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 text-sm">
                    <div className="font-semibold text-slate-600">Thuộc tính cơ bản</div>
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Màu sắc" />
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Độ dày" />
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Độ dày nhôm" />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 text-sm">
                    <div className="font-semibold text-slate-600">Màu sắc</div>
                    <div className="w-10 h-6 rounded bg-red-500" />
                    <div className="font-semibold text-slate-600">Xuất xứ</div>
                    <div className="border border-slate-200 rounded-lg px-3 py-2">Việt Nam</div>
                    <div className="font-semibold text-slate-600">ISO</div>
                    <div className="border border-slate-200 rounded-lg px-3 py-2">ISO 9001</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500">Hủy bỏ</button>
                  <button className="px-4 py-2 rounded-lg bg-teal-500 text-white">+ Thêm vật liệu</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-slate-700">Quản lý kho hàng & vật liệu</div>
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 text-sm text-slate-500 min-w-[200px]">
                  <span className="text-slate-400">🔍</span>
                  Tìm kiếm...
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b">
                      <th className="py-2">Tên vật liệu</th>
                      <th className="py-2">Mã vật liệu</th>
                      <th className="py-2">Số lượng ban đầu</th>
                      <th className="py-2">Số lượng nhập</th>
                      <th className="py-2">Số lượng xuất</th>
                      <th className="py-2">Tồn kho</th>
                      <th className="py-2">Thay đổi gần đây</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockRows.map((row) => (
                      <tr key={row.name} className="border-b last:border-0">
                        <td className="py-3 text-slate-600 font-medium">{row.name}</td>
                        <td className="py-3 text-slate-500">{row.code}</td>
                        <td className="py-3 text-slate-500">{row.initial}</td>
                        <td className="py-3 text-slate-500">{row.inQty}</td>
                        <td className="py-3 text-slate-500">{row.outQty}</td>
                        <td className="py-3 text-teal-600 font-semibold">{row.stock}</td>
                        <td className="py-3 text-slate-500">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MaterialsDashboard;
