
import type { IPage } from "../../../@types/common.type";
import React, { useState } from "react";
import PayrollSummaryTab from "./PayrollSummaryTab";

const tabs = [
  { key: "bang-luong", label: "Bảng lương nhân sự" },
  { key: "tai-khoan", label: "Tài khoản kế toán" },
  { key: "chung-tu", label: "Chứng từ kế toán" },
  { key: "quy-tac", label: "Quy tắc chỉnh sửa & Kiểm soát dữ liệu" },
  { key: "kiem-tra", label: "Báo cáo kiểm tra" },
  { key: "tong-quan", label: "Thống kê tổng quan" },
];

const accountRows = [
  { code: "1111", name: "Tiền mặt", level: "Con", nature: "Tài sản", track: "Kho", status: "Active" },
  { code: "1112", name: "Tiền gửi ngân hàng", level: "Con", nature: "Tài sản", track: "", status: "Active" },
  { code: "", name: "+ Tiền", level: "Cha", nature: "Tài sản", track: "", status: "Active" },
  { code: "121", name: "Tiền", level: "Con", nature: "Tài sản", track: "Kho", status: "Active" },
  { code: "131", name: "Đầu tư chứng khoán ngắn hạn", level: "Con", nature: "Tài sản", track: "", status: "Active" },
  { code: "131", name: "Phải thu khách hàng", level: "Con", nature: "Tài sản", track: "", status: "Active" },
  { code: "331", name: "Phải trả nhà cung cấp", level: "Con", nature: "Nợ phải trả", track: "---", status: "Active" },
  { code: "511", name: "Doanh thu bán hàng", level: "Cha", nature: "Doanh thu", track: "", status: "Active" },
  { code: "632", name: "Giá vốn hàng bán", level: "Cha", nature: "Chi phí", track: "", status: "Active" },
];

const AccountingDashboard: IPage["Component"] = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <section className="bg-white/90 rounded-2xl shadow-md border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-teal-600">Nhập liệu kế toán</h2>
            <div className="text-sm text-slate-500">Hệ thống tài khoản kế toán</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 text-sm text-slate-500 min-w-[200px]">
              <span className="text-slate-400">🔍</span>
              Tìm kiếm...
            </div>
            <button className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold">+ Thêm tài khoản</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 ${
                activeTab === tab.key
                  ? "bg-teal-50 text-teal-600 border-teal-200"
                  : "bg-white text-slate-500 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "bang-luong" && <PayrollSummaryTab />}

        {activeTab === "tai-khoan" && (
          <>
            <div className="text-sm text-slate-500 mb-4">
              Quản lý hệ thống tài khoản kế toán sử dụng để hạch toán kế toán cho doanh nghiệp của bạn.
            </div>

            <div className="flex flex-wrap gap-3 items-center mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Loại tài khoản</span>
                <div className="border border-slate-200 rounded-lg px-3 py-2">Tất cả</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Chi tiết theo</span>
                <div className="border border-slate-200 rounded-lg px-3 py-2">Tất cả</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-[200px]">
                <span>Tìm kiếm tài khoản kế toán...</span>
                <div className="border border-slate-200 rounded-lg px-3 py-2">🔍</div>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-xs border-b">
                    <th className="py-3 px-3">Mã TK</th>
                    <th className="py-3 px-3">Tên tài khoản</th>
                    <th className="py-3 px-3">Cấp TK</th>
                    <th className="py-3 px-3">Tính chất</th>
                    <th className="py-3 px-3">Cho phép hạch toán</th>
                    <th className="py-3 px-3">Theo dõi chi tiết theo</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {accountRows.map((row, index) => (
                    <tr key={`${row.code}-${index}`} className="border-b last:border-0">
                      <td className="py-3 px-3 text-slate-700">{row.code}</td>
                      <td className="py-3 px-3 text-slate-700">{row.name}</td>
                      <td className="py-3 px-3 text-slate-500">{row.level}</td>
                      <td className="py-3 px-3 text-slate-500">{row.nature}</td>
                      <td className="py-3 px-3 text-emerald-500 font-semibold">✓</td>
                      <td className="py-3 px-3 text-slate-500">{row.track}</td>
                      <td className="py-3 px-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">✎</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
              <span>Hiển thị 1 - 8 trong 100 tài khoản</span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border border-slate-200 rounded">«</button>
                <button className="px-2 py-1 border border-slate-200 rounded">1</button>
                <button className="px-2 py-1 border border-slate-200 rounded">2</button>
                <button className="px-2 py-1 border border-slate-200 rounded">3</button>
                <button className="px-2 py-1 border border-slate-200 rounded">›</button>
              </div>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-slate-600">
              <div className="font-semibold mb-2">Edit rule:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Không cho sửa mã TK nếu đã phát sinh</li>
                <li>Chỉ cho đổi tên / ghi chú</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === "chung-tu" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h3 className="text-lg font-semibold text-teal-600">Chứng từ kế toán</h3>
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 text-sm text-slate-500 min-w-[200px]">
                  <span className="text-slate-400">🔍</span>
                  Tìm kiếm...
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="text-sm font-semibold text-slate-600 mb-3">Thông tin chung</div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 text-sm">
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="CT00001" />
                    <div className="flex gap-2">
                      <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="24/04/2024" />
                      <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="24/04/2024" />
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">Loại chứng từ</div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                    {["Thu", "Chi", "Mua", "Bán", "Kết chuyển"].map((label) => (
                      <label key={label} className="flex items-center gap-2">
                        <input type="radio" name="voucherType" />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-slate-600">Loại chứng từ</div>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    defaultValue="Thanh toán tiền mua vật tư"
                  />
                  <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                    <span className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">Đính kèm file: don-hang-123.pdf</span>
                    <button className="px-3 py-2 border border-slate-200 rounded-lg">✕</button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="text-sm font-semibold text-slate-600 mb-3">Chi tiết hạch toán</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="331" />
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="1111" />
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="10,000,000 đ" />
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="Nhà cung cấp ABC" />
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="Kho Hà Nội" />
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="Thanh toán đơn hàng số 123" />
                  </div>
                  <div className="mt-3 text-sm text-slate-600">Tổng: <span className="font-semibold">10,000,000 đ</span></div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm">Tổng</button>
                    <button className="px-3 py-2 bg-teal-500 text-white rounded-lg text-sm">Lưu chứng từ</button>
                    <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm">+ Thêm dòng</button>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-slate-600">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tổng Nợ phải bằng Tổng Có</li>
                  <li>Không cho dùng TK không cho hạch toán</li>
                  <li>Không cho nhập âm (trừ nghiệp vụ đặc biệt)</li>
                  <li>Cảnh báo ngày chứng từ nhỏ hơn ngày khóa sổ</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "quy-tac" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-teal-600">
                  Quy tắc chỉnh sửa & Kiểm soát dữ liệu <span className="text-slate-400 text-sm">(cực quan trọng)</span>
                </h3>
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 text-sm text-slate-500 min-w-[200px]">
                  <span className="text-slate-400">🔍</span>
                  Tìm kiếm...
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                <div className="text-sm font-semibold text-slate-600 mb-3">5. Quy tắc chỉnh sửa (Business Rules)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-xs border-b">
                        <th className="py-2">Trạng thái</th>
                        <th className="py-2">Sửa</th>
                        <th className="py-2">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { status: "Draft", edit: "✓", del: "✓" },
                        { status: "Posted", edit: "⚠ (có log)", del: "✕" },
                        { status: "Locked", edit: "✕", del: "✕" },
                      ].map((row) => (
                        <tr key={row.status} className="border-b last:border-0">
                          <td className="py-3 text-slate-700">{row.status}</td>
                          <td className="py-3 text-slate-600">{row.edit}</td>
                          <td className="py-3 text-slate-600">{row.del}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-600">6. Audit log</div>
                  <button className="text-xs text-teal-500">Xem đầy đủ</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-xs border-b">
                        <th className="py-2">Ai sửa</th>
                        <th className="py-2">Sửa lúc nào</th>
                        <th className="py-2">Trước / Sau</th>
                        <th className="py-2">IP / thiết bị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Nguyễn Hồng Hải", time: "16/04/2025 15:42", diff: "5,500,000 đ → 600,000 đ", device: "192.168.1.10 / MacBook Pro" },
                        { name: "Nguyễn Hồng Hải", time: "16/04/2025 12:08", diff: "5,500,000 đ → 650,000 đ", device: "192.168.1.10 / MacBook Pro" },
                        { name: "Nguyễn Hồng Hải", time: "16/04/2025 09:20", diff: "5,500,000 đ → 650,000 đ", device: "192.168.1.10 / MacBook Pro" },
                        { name: "Nguyễn Hồng Hải", time: "15/04/2025 20:13", diff: "5,500,000 đ → 650,000 đ", device: "192.168.1.10 / MacBook Pro" },
                        { name: "Nguyễn Hồng Hải", time: "15/04/2025 15:03", diff: "5,500,000 đ → 650,000 đ", device: "192.168.1.10 / MacBook Pro" },
                      ].map((row) => (
                        <tr key={`${row.time}-${row.diff}`} className="border-b last:border-0">
                          <td className="py-3 text-slate-700">{row.name}</td>
                          <td className="py-3 text-slate-500">{row.time}</td>
                          <td className="py-3 text-teal-600">{row.diff}</td>
                          <td className="py-3 text-slate-500">{row.device}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-right">
                  <button className="text-xs text-teal-500">Xem đầy đủ</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="text-sm font-semibold text-slate-600 mb-3">7. Khóa sổ</div>
                  <div className="flex items-center gap-3 mb-3 text-sm text-slate-500">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="lockType" defaultChecked />
                      Ngày
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="lockType" />
                      Tháng
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2" defaultValue="20/04/2025" />
                    <button className="px-4 py-2 bg-teal-500 text-white rounded-lg">Khóa</button>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500">Mở khóa</button>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Không cho nhập / sửa trước ngày khóa</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="text-sm font-semibold text-slate-600 mb-3">7. Khóa sổ</div>
                  <div className="flex items-center gap-3 mb-3 text-sm text-slate-500">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="lockType2" defaultChecked />
                      Ngày
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="lockType2" />
                      Tháng
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2" defaultValue="20/04/2025" />
                    <button className="px-4 py-2 bg-teal-500 text-white rounded-lg">Khóa</button>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Không cho nhập / sửa trước ngày khóa</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "kiem-tra" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-teal-600">IV. Báo cáo kiểm tra</h3>
                  <div className="text-sm text-slate-500">Phục vụ nhập liệu đúng</div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 text-sm text-slate-500 min-w-[200px]">
                  <span className="text-slate-400">🔍</span>
                  Tìm kiếm...
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                {[
                  { label: "Sổ nhật ký chung", sub: "Sổ nhật ký chung" },
                  { label: "Sổ cái", sub: "Sổ nhật ký chung" },
                  { label: "Bảng cân đối phát sinh", sub: "Bảng cân đối phát sinh" },
                  { label: "Công nợ phải thu/ phải trả", sub: "Công nợ phải thu / phải trả" },
                  { label: "Báo cáo tồn kho", sub: "Báo cáo tồn kho" },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                    <div className="text-sm font-semibold text-slate-700 mb-2">{card.label}</div>
                    <div className="text-xs text-slate-500">{card.sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-600">Danh sách phát hiện lỗi nhập liệu</div>
                  <div className="text-xs text-slate-500">Tầm 1/2</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-xs border-b">
                        <th className="py-2">Ngày ghi sổ</th>
                        <th className="py-2">Đối tượng</th>
                        <th className="py-2">Sổ</th>
                        <th className="py-2">Mô tả lỗi</th>
                        <th className="py-2">Biện pháp khắc phục</th>
                        <th className="py-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: "19/04/2025", person: "NGUYỄN HỒNG HẢI", book: "Sổ nhật ký chung", issue: "Chưa có tài khoản đối ứng", fix: "Bổ sung tài khoản đối ứng", status: "Chưa xử lý" },
                        { date: "19/04/2025", person: "Nguyễn Văn A", book: "Sổ cái", issue: "Chênh lệch số dư TK", fix: "Kiểm tra lại số dư TK", status: "Chưa xử lý" },
                        { date: "17/04/2025", person: "Công ty ABC", book: "Bảng cân đối phát sinh", issue: "Công nợ chưa khớp", fix: "Đối chiếu lại số chi tiết", status: "Chưa xử lý" },
                        { date: "16/04/2025", person: "Phạm Thanh An", book: "Công nợ phải thu / phải trả", issue: "Thiếu số hóa đơn", fix: "Bổ sung hóa đơn còn thiếu", status: "Bổ xử lý" },
                        { date: "15/04/2025", person: "Kho hàng HN", book: "Báo cáo tồn kho", issue: "Số lượng tồn kho âm", fix: "Kiểm tra và điều chỉnh tồn", status: "Chưa xử lý" },
                      ].map((row) => (
                        <tr key={`${row.date}-${row.person}`} className="border-b last:border-0">
                          <td className="py-3 text-slate-600">{row.date}</td>
                          <td className="py-3 text-slate-700">{row.person}</td>
                          <td className="py-3 text-slate-600">{row.book}</td>
                          <td className="py-3 text-slate-500">{row.issue}</td>
                          <td className="py-3 text-slate-500">{row.fix}</td>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === "Bổ xử lý" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-3">
                  <button className="text-xs text-teal-500">Xem chi tiết</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tong-quan" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-teal-600">Thống kê tổng quan</h3>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 text-sm text-slate-500 min-w-[200px]">
                  <span className="text-slate-400">🔍</span>
                  Tìm kiếm...
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Tổng phát sinh theo kỳ</div>
                  <span className="text-slate-400">›</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tổng</span>
                    <span className="text-teal-600 font-semibold">8,850,000 đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tổng Có</span>
                    <span className="text-teal-600 font-semibold">8,500,000 đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Chênh lệch</span>
                    <span className="text-teal-600 font-semibold">0 đ</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-600">Tổng số chứng từ</div>
                    <span className="text-slate-400">›</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Số chứng từ phát sinh</div><div className="text-right">350</div>
                    <div>Số chứng từ Draft</div><div className="text-right">15</div>
                    <div>Số chứng từ Posted</div><div className="text-right">320</div>
                    <div>Số chứng từ Điều chỉnh</div><div className="text-right">15</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-600">Tổng tiền theo loại chứng từ</div>
                    <span className="text-slate-400">›</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <div>Loại</div><div>Dư đầu kỳ</div><div>Phát sinh Nợ</div><div>Phát sinh Có</div>
                    <div>Thu</div><div>4,200,000,000 đ</div><div>3,600,000,000 đ</div><div>2,200,000 đ</div>
                    <div>Chi</div><div>3,600,000,000 đ</div><div>1,500,000,000 đ</div><div>1,500,000 đ</div>
                    <div>Mua</div><div>1,500,000,000 đ</div><div>3,400,000,000 đ</div><div>3,400,000 đ</div>
                    <div>Bán</div><div>3,400,000,000 đ</div><div>400,000,000 đ</div><div>90,000 đ</div>
                    <div>Kết chuyển</div><div>400,000,000 đ</div><div>0 đ</div><div>30,000 đ</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-600">Thống kê công nợ</div>
                    <span className="text-slate-400">›</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Công nợ phải thu (131)</span><span>11,500,000,000 đ</span></div>
                    <div className="flex justify-between"><span>Tổng phải thu</span><span>4,800,000,000 đ</span></div>
                    <div className="flex justify-between"><span>Đã thu</span><span>6,500,000,000 đ</span></div>
                    <div className="flex justify-between"><span>Còn phải thu</span><span>2,100,000,000 đ</span></div>
                    <div className="flex justify-between text-rose-500"><span>Quá hạn</span><span>2,100,000,000 đ</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-600">Thống kê thuế</div>
                    <span className="text-slate-400">›</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Thuế GTGT</span><span>370,000,000 đ</span></div>
                    <div className="flex justify-between"><span>Thuế đầu ra</span><span>370,000,000 đ</span></div>
                    <div className="flex justify-between"><span>Thuế đầu vào</span><span>286,000,000 đ</span></div>
                    <div className="flex justify-between"><span>Thuế phải nộp</span><span>84,000,000 đ</span></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-600">Top tài khoản phát sinh lớn</div>
                    <span className="text-slate-400">›</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>131 Tiền mặt</span><span>4,500,000,000 đ</span></div>
                    <div className="flex justify-between"><span>112 Tiền gửi NH</span><span>3,600,000,000 đ</span></div>
                    <div className="flex justify-between"><span>311 Phải thu KH</span><span>3,400,000,000 đ</span></div>
                    <div className="flex justify-between"><span>111 Tiền mặt</span><span>3,200,000,000 đ</span></div>
                    <div className="flex justify-between"><span>112 Tiền gửi NH</span><span>2,900,000,000 đ</span></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-600">Thống kê tiền & thanh khoản</div>
                    <span className="text-slate-400">›</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-rose-500"><span>Số dư tiền mặt (111)</span><span>0 đ</span></div>
                    <div className="flex justify-between"><span>Số dư ngân hàng (112)</span><span>2,900,000,000 đ</span></div>
                    <div className="flex justify-between"><span>Hóa đơn bất thường</span><span>0</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== "bang-luong" &&
          activeTab !== "tai-khoan" &&
          activeTab !== "chung-tu" &&
          activeTab !== "quy-tac" &&
          activeTab !== "kiem-tra" &&
          activeTab !== "tong-quan" && (
            <div className="text-sm text-slate-500">Đang phát triển nội dung cho tab này...</div>
          )}
      </section>
    </div>
  );
};

export default AccountingDashboard;
