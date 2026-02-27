import type { IPage } from "../../../@types/common.type";
import React from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";

const tabs = [
  { key: "cong-viec", label: "Thống kê công việc" },
  { key: "chi-phi", label: "Thống kê chi phí" },
  { key: "nhan-su", label: "Thống kê nhân sự/khách hàng" },
];

const StatisticDashboard: IPage["Component"] = () => {
  const [activeTab, setActiveTab] = React.useState(tabs[0].key);
  const completion = 71;
  const taskStatusData = [
    { id: 0, value: 23.8, label: "Đơn hàng", color: "#F87171" },
    { id: 1, value: 26.7, label: "Phân việc", color: "#FBBF24" },
    { id: 2, value: 24.0, label: "Đang thực hiện", color: "#22C55E" },
    { id: 3, value: 25.5, label: "Hoàn thiện", color: "#60A5FA" },
  ];

  const monthlyXAxis = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6"];
  const monthlySeries = [
    { label: "Đơn hàng", data: [1200, 1800, 2400, 3100, 3900, 4200], stack: "total", color: "#F87171" },
    { label: "Phân việc", data: [800, 1200, 1700, 2100, 2600, 3000], stack: "total", color: "#FBBF24" },
    { label: "Đang thực hiện", data: [600, 900, 1200, 1500, 1900, 2100], stack: "total", color: "#22C55E" },
    { label: "Hoàn thiện", data: [900, 1300, 1600, 2000, 2500, 2800], stack: "total", color: "#60A5FA" },
  ];

  const lineXAxis = ["Thg 1", "Thg 2", "Thg 3", "Thg 4"];
  const salarySeries = [
    { label: "Tổng lương", data: [12, 20, 28, 36], color: "#22C55E" },
    { label: "Chi phí", data: [8, 14, 18, 26], color: "#3B82F6" },
  ];

  const topCustomers = [
    { name: "Huyền Minh Quân", phone: "098876431" },
    { name: "Hoàng Thái Bảo", phone: "098567423" },
    { name: "Nguyễn Trần Long", phone: "096346755" },
  ];

  const topStaff = [
    { name: "Lê Hoàng Tân", salary: "10,000,000 đ", tasks: 7, customers: 6 },
    { name: "Phan Thanh Ân", salary: "8,000,000 đ", tasks: 5, customers: 4 },
    { name: "Nguyễn Hồng Hải", salary: "2,000,000 đ", tasks: 4, customers: 3 },
  ];

  const taskRows = [
    {
      name: "BẢNG XINHAN MENU LẮC CÓ CHÂN BẾP MEMORY",
      type: "Thi công",
      status: "Hoàn thiện",
      start: "01/03/2024",
      due: "17/03/2024",
      end: "17/03/2024",
    },
    {
      name: "BỘ CHỮ SÁNG ĐÈN XE KENCOFFEE",
      type: "Khác",
      status: "Thực hiện",
      start: "01/03/2024",
      due: "05/03/2024",
      end: "05/03/2024",
    },
    {
      name: "HỘP ĐÈN 38*58 LED VÀNG BẾP MEMORY 119 MÃI HẮC ĐÊ",
      type: "Sản xuất",
      status: "Hoàn thiện",
      start: "14/01/2026",
      due: "14/01/2026",
      end: "22/01/2026",
    },
    {
      name: "BỘ CHỮ ALU XE HẠT NHỎ 0931626219",
      type: "Thi công",
      status: "Thực hiện",
      start: "01/01/2024",
      due: "01/01/2024",
      end: "01/03/2024",
    },
    {
      name: "BỘ CHỮ BỐI STORE",
      type: "Sản xuất",
      status: "Hoàn thiện",
      start: "08/02/2026",
      due: "08/02/2024",
      end: "03/03/2024",
    },
  ];

  const costCards = [
    { label: "Tổng số nhân sự", value: "7", delta: "+1 Hôm nay" },
    { label: "Lương trung bình", value: "7,428,571", delta: "↑ 0.5%" },
    { label: "Nghỉ việc", value: "0", delta: "" },
    { label: "Chi phí lương tháng", value: "52,000,000", delta: "↑" },
  ];

  const costPieData = [
    { id: 0, value: 57.1, label: "NV chính thức", color: "#14B8A6" },
    { id: 1, value: 14.3, label: "NV thử việc", color: "#93C5FD" },
    { id: 2, value: 14.3, label: "Kế toán", color: "#FBBF24" },
    { id: 3, value: 14.3, label: "Khác", color: "#60A5FA" },
  ];

  const costMonths = ["Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];
  const costSeries = [
    { label: "Tổng chi phí lương", data: [5200, 5400, 5600, 6000, 6400, 6800, 7100, 7400, 7600], color: "#38BDF8" },
    { label: "Lương trung bình", data: [7428, 7450, 7480, 7520, 7560, 7600, 7640, 7680, 7720], color: "#14B8A6" },
  ];

  const staffDetailRows = [
    { name: "NGUYỄN HỒNG HẢI", salary: "7,000,000 đ", delta: "+500,000 đ  ↑ 7.7%", status: "NV chính thức", start: "24/04/2025" },
    { name: "DƯƠNG QUÝ HÙNG", salary: "7,000,000 đ", delta: "+500,000 đ  ↑", status: "NV chính thức", start: "01/04/2025" },
    { name: "PHẠM THỊ ANH", salary: "5,000,000 đ", delta: "+500,000 đ  ↑ 7.7%", status: "NV chính thức", start: "15/03/2025" },
    { name: "TRẦN THỊ HOÀNG NGỌC", salary: "6,000,000 đ", delta: "— 0", status: "NV chính thức", start: "10/02/2025" },
    { name: "LÊ HOÀNG AN", salary: "10,000,000 đ", delta: "+500,000 đ  ↑ 9.1%", status: "NV chính thức", start: "05/01/2025" },
    { name: "LÊ HOÀNG AN", salary: "10,000,000 đ", delta: "— 0", status: "NV chính thức", start: "01/08/2025" },
  ];

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <section className="bg-white/90 rounded-2xl shadow-md border border-slate-100 p-6">
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

        {activeTab === "cong-viec" && (
          <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-teal-600">Thống kê công việc</h2>
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 min-w-[200px]">
            <span className="text-slate-500 text-sm">Tìm kiếm...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Tổng công việc", value: "55", delta: "+6 Hôm nay", accent: "text-teal-600" },
            { label: "Đã hoàn thiện", value: "39", delta: "+4", accent: "text-purple-600", up: true },
            { label: "Đang thực hiện", value: "10", delta: "6", accent: "text-orange-500", up: false },
            { label: "Tỉ lệ hoàn thành", value: `${completion}.0%`, delta: "5%", accent: "text-teal-600", up: true },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="text-sm text-slate-500 font-medium">{card.label}</div>
              <div className={`text-2xl font-semibold ${card.accent}`}>{card.value}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500">{card.delta}</span>
                {card.up === true && <CaretUpOutlined className="text-emerald-500" />}
                {card.up === false && <CaretDownOutlined className="text-rose-500" />}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.3fr_0.9fr] gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Thống kê trạng thái công việc</h3>
            <PieChart
              height={220}
              series={[{ data: taskStatusData, innerRadius: 35, outerRadius: 80 }]}/>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600">Thống kê công việc theo tháng</h3>
              <button className="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1">Năm nay</button>
            </div>
            <BarChart
              height={240}
              xAxis={[{ data: monthlyXAxis, scaleType: "band" }]}
              series={monthlySeries}
              margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center justify-center gap-2">
            <div className="relative w-full flex items-center justify-center">
              <PieChart
                height={220}
                series={[
                  {
                    data: [
                      { id: 0, value: completion, label: "Hoàn thành", color: "#14B8A6" },
                      { id: 1, value: 100 - completion, label: "Còn lại", color: "#E2E8F0" },
                    ],
                    innerRadius: 70,
                    outerRadius: 95,
                  },
                ]}/>
              <div className="absolute text-center">
                <div className="text-2xl font-semibold text-teal-600">{completion}.0%</div>
                <div className="text-xs text-slate-400">Tỉ lệ hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-600">Chi tiết công việc</h3>
            <button className="text-sm text-teal-500">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-xs border-b">
                  <th className="py-2">Tên công việc</th>
                  <th className="py-2">Loại</th>
                  <th className="py-2">Trạng thái</th>
                  <th className="py-2">Ngày bắt đầu</th>
                  <th className="py-2">Dự kiến hoàn thành</th>
                  <th className="py-2">Ngày kết thúc</th>
                </tr>
              </thead>
              <tbody>
                {taskRows.map((row) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="py-3 font-medium text-slate-700">{row.name}</td>
                    <td className="py-3">
                      <span className="px-3 py-1 rounded-full text-xs bg-orange-50 text-orange-600">{row.type}</span>
                    </td>
                    <td className="py-3">
                      <span className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-600">{row.status}</span>
                    </td>
                    <td className="py-3 text-slate-500">{row.start}</td>
                    <td className="py-3 text-slate-500">{row.due}</td>
                    <td className="py-3 text-slate-500">{row.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
        )}

        {activeTab === "chi-phi" && (
          <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-teal-600">Thống kê chi phí</h2>
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 min-w-[200px]">
            <span className="text-slate-500 text-sm">Tìm kiếm...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {costCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
              <div className="text-sm text-slate-500 font-medium">{card.label}</div>
              <div className="text-2xl font-semibold text-slate-700">{card.value}</div>
              {card.delta && <div className="text-xs text-teal-500">{card.delta}</div>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Cơ cấu nhân viên</h3>
            <PieChart
              height={230}
              series={[{ data: costPieData, innerRadius: 35, outerRadius: 90 }]}/>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600">Biểu đồ chi phí lương tháng</h3>
              <div className="flex gap-2 text-xs">
                <button className="px-3 py-1 rounded-full bg-teal-500 text-white">Tổng hợp</button>
                <button className="px-3 py-1 rounded-full border border-slate-200 text-slate-500">Từng tháng</button>
              </div>
            </div>
            <LineChart
              height={260}
              xAxis={[{ data: costMonths, scaleType: "point" }]}
              series={costSeries}
              margin={{ top: 20, bottom: 30, left: 40, right: 20 }}
            />
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-600">Chi tiết nhân sự</h3>
            <button className="text-sm text-teal-500">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-xs border-b">
                  <th className="py-2">Tên</th>
                  <th className="py-2">Lương</th>
                  <th className="py-2">Tăng/Giảm lương</th>
                  <th className="py-2">Trạng thái</th>
                  <th className="py-2">Ngày bắt đầu công việc</th>
                </tr>
              </thead>
              <tbody>
                {staffDetailRows.map((row) => (
                  <tr key={`${row.name}-${row.start}`} className="border-b last:border-0">
                    <td className="py-3 text-slate-700 font-medium">{row.name}</td>
                    <td className="py-3 text-teal-600 font-semibold">{row.salary}</td>
                    <td className="py-3 text-emerald-600">{row.delta}</td>
                    <td className="py-3 text-slate-500">{row.status}</td>
                    <td className="py-3 text-slate-500">{row.start}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
        )}

        {activeTab === "nhan-su" && (
          <>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-teal-600">Thống kê nhân sự / khách hàng</h2>
          <div className="text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2">
            01/04/2024 - 24/04/2024
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Tổng nhân sự", value: "7", delta: "Tăng 0% so với kỳ trước", accent: "text-teal-600" },
            { label: "Tổng lương", value: "50,000,000 đ", delta: "Tăng 10% so với kỳ trước", accent: "text-emerald-600" },
            { label: "Tổng khách hàng", value: "84", delta: "Tăng 5% so với kỳ trước", accent: "text-teal-600" },
            { label: "Chi phí tháng này", value: "30,000,000 đ", delta: "Giảm 20% so với kỳ trước", accent: "text-rose-500" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="text-sm text-slate-500 font-medium">{card.label}</div>
              <div className={`text-2xl font-semibold ${card.accent}`}>{card.value}</div>
              <div className="text-xs text-slate-400">{card.delta}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Biểu đồ lương và chi phí</h3>
            <LineChart
              height={240}
              xAxis={[{ data: lineXAxis, scaleType: "point" }]}
              series={salarySeries}
              margin={{ top: 20, bottom: 30, left: 40, right: 20 }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-600">Tăng / giảm nhân sự</h3>
                <div className="flex gap-2 text-xs">
                  <button className="px-3 py-1 rounded-full bg-teal-500 text-white">Tổng hợp</button>
                  <button className="px-3 py-1 rounded-full border border-slate-200 text-slate-500">Từng tháng</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-xl font-semibold text-emerald-600">+1</div>
                  <div className="text-xs text-slate-500">Tăng mới</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <div className="text-xl font-semibold text-rose-500">-1</div>
                  <div className="text-xs text-slate-500">Nghỉ việc</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Top khách hàng tiềm năng</h3>
              <div className="flex flex-col gap-2">
                {topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-teal-500 text-white flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-slate-600">{customer.name}</span>
                    </div>
                    <span className="text-slate-400">{customer.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Tỷ lệ phòng ban</h3>
            <PieChart
              height={220}
              series={[
                {
                  data: [
                    { id: 0, value: 46.2, label: "Nhân sự", color: "#F59E0B" },
                    { id: 1, value: 24.6, label: "Kế toán", color: "#22C55E" },
                    { id: 2, value: 15.4, label: "Thi công", color: "#3B82F6" },
                    { id: 3, value: 13.8, label: "Thiết kế", color: "#A855F7" },
                  ],
                  innerRadius: 30,
                  outerRadius: 80,
                },
              ]}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Nhân sự hàng đầu</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-xs border-b">
                    <th className="py-2">Họ và tên</th>
                    <th className="py-2">Lương</th>
                    <th className="py-2">Số công việc</th>
                    <th className="py-2">Số khách hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {topStaff.map((staff) => (
                    <tr key={staff.name} className="border-b last:border-0">
                      <td className="py-3 text-slate-600 font-medium">{staff.name}</td>
                      <td className="py-3 text-emerald-600">{staff.salary}</td>
                      <td className="py-3 text-slate-500">{staff.tasks}</td>
                      <td className="py-3 text-slate-500">{staff.customers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
        )}
      </section>
    </div>
  );
};

export default StatisticDashboard;


