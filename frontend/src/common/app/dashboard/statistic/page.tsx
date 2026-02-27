import type { IPage } from "../../../@types/common.type";
import React from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";
import { useUser } from "../../../common/hooks/useUser";
import { useApiHost } from "../../../common/hooks/useApiHost";

const tabs = [
  { key: "cong-viec", label: "Thống kê công việc" },
  { key: "chi-phi", label: "Thống kê chi phí" },
  { key: "nhan-su", label: "Thống kê nhân sự/khách hàng" },
];

type StatsResponse = {
  period: {
    from_month: string;
    to_month: string;
  };
  job: {
    cards: {
      total_tasks: number;
      completed_tasks: number;
      running_tasks: number;
      completion_rate: number;
    };
    status_pie: Array<{ label: string; value: number; color: string }>;
    monthly: Array<{
      month: string;
      label: string;
      open: number;
      in_progress: number;
      done: number;
      reward: number;
    }>;
    detail_rows: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      start_date: string;
      due_date: string;
      end_date: string;
      workspace: string;
    }>;
  };
  cost: {
    cards: {
      total_staff: number;
      avg_salary: number;
      left_count: number;
      current_month_salary_total: number;
    };
    staff_structure: Array<{ label: string; value: number; color: string }>;
    monthly_salary: Array<{ month: string; label: string; total_salary: number; avg_salary: number }>;
    staff_rows: Array<{ name: string; salary: number; delta: string; status: string; start_date: string }>;
  };
  people_customer: {
    cards: {
      total_staff: number;
      total_salary: number;
      total_customers: number;
      current_month_cost: number;
    };
    salary_cost_trend: Array<{ month: string; label: string; total_salary: number; avg_salary: number }>;
    staff_change: { increase: number; decrease: number };
    top_customers: Array<{ name: string; phone: string; total_tasks: number }>;
    department_ratio: Array<{ label: string; value: number; color: string }>;
    top_staff: Array<{ name: string; salary: number; tasks: number; customers: number }>;
  };
};

const fmtCurrency = (value: number) =>
  `${Math.round(value || 0).toLocaleString("vi-VN")} đ`;

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const fmtPercent2 = (value: number) => `${(value || 0).toFixed(2)}%`;
const toPercentByTotal = (value: number, total: number) => {
  if (!total) return "0.00%";
  return `${((value / total) * 100).toFixed(2)}%`;
};

const StatisticDashboard: IPage["Component"] = () => {
  const { userLeadId } = useUser();
  const apiHost = useApiHost();
  const [activeTab, setActiveTab] = React.useState(tabs[0].key);
  const [fromMonth, setFromMonth] = React.useState<string>(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 5);
    return now.toISOString().slice(0, 7);
  });
  const [toMonth, setToMonth] = React.useState<string>(getCurrentMonth());
  const [search, setSearch] = React.useState("");
  const [taskNameSearch, setTaskNameSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [data, setData] = React.useState<StatsResponse | null>(null);

  const fetchStats = React.useCallback(async () => {
    if (!userLeadId || userLeadId <= 0) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        lead: String(userLeadId),
        from_month: fromMonth,
        to_month: toMonth,
      });
      const response = await fetch(`${apiHost}/statistics/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Không thể tải thống kê: ${response.status}`);
      }
      const json = (await response.json()) as StatsResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiHost, fromMonth, toMonth, userLeadId]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const jobRows = React.useMemo(() => {
    const rows = data?.job.detail_rows ?? [];
    if (!taskNameSearch.trim()) return rows;
    const keyword = taskNameSearch.trim().toLowerCase();
    return rows.filter((row) => row.title.toLowerCase().includes(keyword));
  }, [data?.job.detail_rows, taskNameSearch]);

  const staffRows = React.useMemo(() => {
    const rows = data?.cost.staff_rows ?? [];
    if (!search.trim()) return rows;
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => row.name.toLowerCase().includes(keyword));
  }, [data?.cost.staff_rows, search]);

  const jobStatusTotal = React.useMemo(
    () => (data?.job.status_pie ?? []).reduce((sum, item) => sum + (item.value || 0), 0),
    [data?.job.status_pie],
  );

  const costStructureTotal = React.useMemo(
    () => (data?.cost.staff_structure ?? []).reduce((sum, item) => sum + (item.value || 0), 0),
    [data?.cost.staff_structure],
  );

  const departmentRatioTotal = React.useMemo(
    () => (data?.people_customer.department_ratio ?? []).reduce((sum, item) => sum + (item.value || 0), 0),
    [data?.people_customer.department_ratio],
  );

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

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-4">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-slate-600">
              Từ tháng
              <input
                type="month"
                value={fromMonth}
                onChange={(event) => setFromMonth(event.target.value)}
                className="ml-2 border border-slate-200 rounded-lg px-2 py-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              Đến tháng
              <input
                type="month"
                value={toMonth}
                onChange={(event) => setToMonth(event.target.value)}
                className="ml-2 border border-slate-200 rounded-lg px-2 py-1"
              />
            </label>
            <button
              onClick={fetchStats}
              className="bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Tải lại
            </button>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm..."
            className="border border-slate-200 rounded-full px-4 py-2 text-sm min-w-[220px]"
          />
        </div>

        {loading && <div className="text-sm text-slate-500 py-4">Đang tải dữ liệu...</div>}
        {error && <div className="text-sm text-rose-500 py-4">{error}</div>}
        {!loading && !error && !data && <div className="text-sm text-slate-500 py-4">Chưa có dữ liệu.</div>}

        {!loading && !error && data && activeTab === "cong-viec" && (
          <>
            <h2 className="text-xl font-semibold text-teal-600 mb-4">Thống kê công việc</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: "Tổng công việc",
                  value: data.job.cards.total_tasks.toLocaleString("vi-VN"),
                  delta: `Kỳ ${data.period.from_month} → ${data.period.to_month}`,
                  accent: "text-teal-600",
                },
                {
                  label: "Đã hoàn thiện",
                  value: data.job.cards.completed_tasks.toLocaleString("vi-VN"),
                  delta: fmtPercent2(data.job.cards.completion_rate),
                  accent: "text-purple-600",
                  up: true,
                },
                {
                  label: "Đang thực hiện",
                  value: data.job.cards.running_tasks.toLocaleString("vi-VN"),
                  delta: `${Math.max(data.job.cards.total_tasks - data.job.cards.completed_tasks, 0)}`,
                  accent: "text-orange-500",
                  up: false,
                },
                {
                  label: "Tỉ lệ hoàn thành",
                  value: fmtPercent2(data.job.cards.completion_rate),
                  delta: `${data.job.cards.completed_tasks}/${data.job.cards.total_tasks}`,
                  accent: "text-teal-600",
                  up: true,
                },
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
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Trạng thái công việc</h3>
                <PieChart
                  height={220}
                  series={[
                    {
                      data: data.job.status_pie.map((item, idx) => ({
                        id: idx,
                        value: item.value,
                        label: item.label,
                        color: item.color,
                      })),
                      innerRadius: 35,
                      outerRadius: 80,
                      arcLabel: (item) => toPercentByTotal(item.value, jobStatusTotal),
                      arcLabelMinAngle: 12,
                    },
                  ]}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-600">Thống kê công việc theo tháng</h3>
                <BarChart
                  height={240}
                  xAxis={[{ data: data.job.monthly.map((item) => item.label), scaleType: "band" }]}
                  series={[
                    { label: "Đơn hàng", data: data.job.monthly.map((item) => item.open), stack: "total", color: "#F87171" },
                    {
                      label: "Phân việc",
                      data: data.job.monthly.map((item) => item.in_progress),
                      stack: "total",
                      color: "#FBBF24",
                    },
                    { label: "Đang thực hiện", data: data.job.monthly.map((item) => item.done), stack: "total", color: "#22C55E" },
                    { label: "Hoàn thiện", data: data.job.monthly.map((item) => item.reward), stack: "total", color: "#60A5FA" },
                  ]}
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
                          { id: 0, value: data.job.cards.completion_rate, label: "Hoàn thành", color: "#14B8A6" },
                          { id: 1, value: 100 - data.job.cards.completion_rate, label: "Còn lại", color: "#E2E8F0" },
                        ],
                        innerRadius: 70,
                        outerRadius: 95,
                        arcLabel: (item) => `${(item.value || 0).toFixed(2)}%`,
                        arcLabelMinAngle: 12,
                      },
                    ]}
                  />
                  <div className="absolute text-center">
                    <div className="text-2xl font-semibold text-teal-600">{fmtPercent2(data.job.cards.completion_rate)}</div>
                    <div className="text-xs text-slate-400">Tỉ lệ hoàn thành</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-semibold text-slate-600">Chi tiết công việc</h3>
                <input
                  value={taskNameSearch}
                  onChange={(event) => setTaskNameSearch(event.target.value)}
                  placeholder="Tìm theo tên công việc..."
                  className="border border-slate-200 rounded-full px-4 py-2 text-sm min-w-[260px]"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b">
                      <th className="py-2">Tên công việc</th>
                      <th className="py-2">Loại</th>
                      <th className="py-2">Trạng thái</th>
                      <th className="py-2">Workspace</th>
                      <th className="py-2">Ngày bắt đầu</th>
                      <th className="py-2">Dự kiến hoàn thành</th>
                      <th className="py-2">Ngày kết thúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobRows.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-slate-700">{row.title || "-"}</td>
                        <td className="py-3 text-slate-500">{row.type || "-"}</td>
                        <td className="py-3 text-slate-500">{row.status || "-"}</td>
                        <td className="py-3 text-slate-500">{row.workspace || "-"}</td>
                        <td className="py-3 text-slate-500">{row.start_date || "-"}</td>
                        <td className="py-3 text-slate-500">{row.due_date || "-"}</td>
                        <td className="py-3 text-slate-500">{row.end_date || "-"}</td>
                      </tr>
                    ))}
                    {jobRows.length === 0 && (
                      <tr>
                        <td className="py-4 text-slate-500 text-center" colSpan={7}>
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && !error && data && activeTab === "chi-phi" && (
          <>
            <h2 className="text-xl font-semibold text-teal-600 mb-4">Thống kê chi phí</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: "Tổng số nhân sự", value: data.cost.cards.total_staff.toLocaleString("vi-VN") },
                { label: "Lương trung bình", value: fmtCurrency(data.cost.cards.avg_salary) },
                { label: "Nghỉ việc", value: data.cost.cards.left_count.toLocaleString("vi-VN") },
                { label: "Chi phí lương tháng", value: fmtCurrency(data.cost.cards.current_month_salary_total) },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
                  <div className="text-sm text-slate-500 font-medium">{card.label}</div>
                  <div className="text-2xl font-semibold text-slate-700">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4 mt-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Cơ cấu nhân sự</h3>
                <PieChart
                  height={230}
                  series={[
                    {
                      data: data.cost.staff_structure.map((item, idx) => ({
                        id: idx,
                        value: item.value,
                        label: item.label,
                        color: item.color,
                      })),
                      innerRadius: 35,
                      outerRadius: 90,
                      arcLabel: (item) => toPercentByTotal(item.value, costStructureTotal),
                      arcLabelMinAngle: 12,
                    },
                  ]}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-600">Biểu đồ chi phí lương theo tháng</h3>
                <LineChart
                  height={260}
                  xAxis={[{ data: data.cost.monthly_salary.map((item) => item.label), scaleType: "point" }]}
                  series={[
                    {
                      label: "Tổng lương",
                      data: data.cost.monthly_salary.map((item) => item.total_salary),
                      color: "#38BDF8",
                    },
                    {
                      label: "Lương trung bình",
                      data: data.cost.monthly_salary.map((item) => item.avg_salary),
                      color: "#14B8A6",
                    },
                  ]}
                  margin={{ top: 20, bottom: 30, left: 40, right: 20 }}
                />
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">Chi tiết nhân sự</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b">
                      <th className="py-2">Tên</th>
                      <th className="py-2">Lương</th>
                      <th className="py-2">Biến động</th>
                      <th className="py-2">Bộ phận</th>
                      <th className="py-2">Ngày bắt đầu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffRows.map((row, idx) => (
                      <tr key={`${row.name}-${idx}`} className="border-b last:border-0">
                        <td className="py-3 text-slate-700 font-medium">{row.name}</td>
                        <td className="py-3 text-teal-600 font-semibold">{fmtCurrency(row.salary)}</td>
                        <td className="py-3 text-slate-500">{row.delta}</td>
                        <td className="py-3 text-slate-500">{row.status}</td>
                        <td className="py-3 text-slate-500">{row.start_date || "-"}</td>
                      </tr>
                    ))}
                    {staffRows.length === 0 && (
                      <tr>
                        <td className="py-4 text-slate-500 text-center" colSpan={5}>
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && !error && data && activeTab === "nhan-su" && (
          <>
            <h2 className="text-xl font-semibold text-teal-600 mb-4">Thống kê nhân sự / khách hàng</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: "Tổng nhân sự", value: data.people_customer.cards.total_staff.toLocaleString("vi-VN"), accent: "text-teal-600" },
                { label: "Tổng lương", value: fmtCurrency(data.people_customer.cards.total_salary), accent: "text-emerald-600" },
                {
                  label: "Tổng khách hàng",
                  value: data.people_customer.cards.total_customers.toLocaleString("vi-VN"),
                  accent: "text-teal-600",
                },
                { label: "Chi phí tháng này", value: fmtCurrency(data.people_customer.cards.current_month_cost), accent: "text-rose-500" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
                  <div className="text-sm text-slate-500 font-medium">{card.label}</div>
                  <div className={`text-2xl font-semibold ${card.accent}`}>{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 mt-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Biểu đồ lương và chi phí</h3>
                <LineChart
                  height={240}
                  xAxis={[{ data: data.people_customer.salary_cost_trend.map((item) => item.label), scaleType: "point" }]}
                  series={[
                    {
                      label: "Tổng lương",
                      data: data.people_customer.salary_cost_trend.map((item) => item.total_salary),
                      color: "#22C55E",
                    },
                    {
                      label: "Lương trung bình",
                      data: data.people_customer.salary_cost_trend.map((item) => item.avg_salary),
                      color: "#3B82F6",
                    },
                  ]}
                  margin={{ top: 20, bottom: 30, left: 40, right: 20 }}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">Tăng / giảm nhân sự</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="text-xl font-semibold text-emerald-600">+{data.people_customer.staff_change.increase}</div>
                      <div className="text-xs text-slate-500">Tăng mới</div>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-4">
                      <div className="text-xl font-semibold text-rose-500">-{data.people_customer.staff_change.decrease}</div>
                      <div className="text-xs text-slate-500">Nghỉ việc</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">Top khách hàng theo khối lượng việc</h3>
                  <div className="flex flex-col gap-2">
                    {data.people_customer.top_customers.map((customer, index) => (
                      <div key={`${customer.name}-${index}`} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-teal-500 text-white flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <span className="text-slate-600">{customer.name}</span>
                        </div>
                        <span className="text-slate-400">
                          {customer.phone} | {customer.total_tasks} việc
                        </span>
                      </div>
                    ))}
                    {data.people_customer.top_customers.length === 0 && (
                      <div className="text-sm text-slate-500">Không có dữ liệu</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4 mt-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Tỉ lệ phòng ban</h3>
                <PieChart
                  height={220}
                  series={[
                    {
                      data: data.people_customer.department_ratio.map((item, idx) => ({
                        id: idx,
                        value: item.value,
                        label: item.label,
                        color: item.color,
                      })),
                      innerRadius: 30,
                      outerRadius: 80,
                      arcLabel: (item) => toPercentByTotal(item.value, departmentRatioTotal),
                      arcLabelMinAngle: 12,
                    },
                  ]}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Nhân sự hiệu suất cao</h3>
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
                      {data.people_customer.top_staff.map((staff, idx) => (
                        <tr key={`${staff.name}-${idx}`} className="border-b last:border-0">
                          <td className="py-3 text-slate-600 font-medium">{staff.name}</td>
                          <td className="py-3 text-emerald-600">{fmtCurrency(staff.salary)}</td>
                          <td className="py-3 text-slate-500">{staff.tasks}</td>
                          <td className="py-3 text-slate-500">{staff.customers}</td>
                        </tr>
                      ))}
                      {data.people_customer.top_staff.length === 0 && (
                        <tr>
                          <td className="py-4 text-slate-500 text-center" colSpan={4}>
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
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
