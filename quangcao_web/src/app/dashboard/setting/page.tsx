import type { IPage } from "../../../@types/common.type";
import { Row, Col } from "antd";
import { SalaryLevelCard } from "../../../components/dashboard/setting/salary/SalaryLevelCard";
import { RoleCard } from "../../../components/dashboard/setting/role/RoleCard";
import { OvertimeCard } from "../../../components/dashboard/setting/OvertimeCard";
import { WorkDayCard } from "../../../components/dashboard/setting/WorkDayCard";

export const SettingDashboard: IPage["Component"] = () => {
  return (
    <div className="w-full min-h-screen p-2 sm:p-4 bg-fixed bg-center bg-cover rounded-2xl">
      <Row gutter={[16, 16]} className="w-full">
        {/* Top-Left: Lương tháng */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12} className="flex flex-col">
          <div className="h-full">
            <SalaryLevelCard />
          </div>
        </Col>

        {/* Top-Right: Lương tăng ca */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12} className="flex flex-col">
          <div className="h-full">
            <OvertimeCard />
          </div>
        </Col>

        {/* Bottom-Left: Chức vụ */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12} className="flex flex-col">
          <div className="h-full">
            <RoleCard />
          </div>
        </Col>

        {/* Bottom-Right: Ngày tính công */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12} className="flex flex-col">
          <div className="h-full">
            <WorkDayCard />
          </div>
        </Col>
      </Row>
    </div>
  );
};
