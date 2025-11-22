import type { IPage } from "../../../@types/common.type";
import React from "react";
import { Chart } from "react-google-charts";

export const StatisticDashboard: IPage["Component"] = () => {
  
  const barData = [
    ["Year", "Sales", "Expenses"],
    ["2019", 1000, 400],
    ["2020", 1170, 460],
    ["2021", 660, 1120],
    ["2022", 1030, 540],
  ];

  const barOptions = {
    chart: {
      title: "Company Performance",
      subtitle: "Sales and Expenses by Year",
    },
    chartArea: { width: '70%', height: '70%' },
    colors: ["#1b9e77", "#d95f02"],
    backgroundColor: {
      fill: "transparent",
      stroke: "transparent",
      strokeWidth: 0,
    },
  };

  // Dữ liệu cho pie chart
  const pieData = [
    ["Task", "Hours per Day"],
    ["Work", 11],
    ["Eat", 2],
    ["Commute", 2],
    ["Watch TV", 2],
    ["Sleep", 7],
  ];

  const pieOptions = {
    title: "My Daily Activities",
    pieHole: 0.4, // tạo donut chart, để hình tròn rỗng giữa
    backgroundColor: {
      fill: "transparent",
      stroke: "transparent",
      strokeWidth: 0,
    },
  };

  return (
    <div>
      <Chart
        chartType="Bar"
        width="100%"
        height="300px"
        data={barData}
        options={barOptions}
      />
      <h2>Pie Chart</h2>
      <Chart
        chartType="PieChart"
        width="100%"
        height="300px"
        data={pieData}
        options={pieOptions}
      />
    </div>
  );
};
