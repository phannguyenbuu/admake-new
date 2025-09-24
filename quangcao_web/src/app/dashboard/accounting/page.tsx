import type { IPage } from "../../../@types/common.type";
import { Tabs } from "antd";
import { PayRollTab } from "../../../components/dashboard/accounting/PayRollTab";
import { AttendanceTab } from "../../../components/dashboard/accounting/AttendanceTab";
import "./accountingTabCustom.css";

const tabItems = [
  {
    key: "1",
    label: <span className="custom-tab">Tính công</span>,
    children: <PayRollTab />,
  },
  {
    key: "2",
    label: <span className="custom-tab">Chấm công</span>,
    children: <AttendanceTab />,
  },
];

export const AccountingDashboard: IPage["Component"] = () => {
  return (
    <div className="min-h-screen w-full p-0 m-0 ">
      <div className="w-full mx-auto pt-2">
        <Tabs defaultActiveKey="1" className="custom-tabs" items={tabItems} />
      </div>
    </div>
  );
};
