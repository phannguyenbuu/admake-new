import React from "react";
import type { IPage } from "../../../@types/common.type";
import { AIPricingSplitView } from "../../../components/ai-pricing/AIPricingSplitView";

const AIPricingDashboard: IPage["Component"] = () => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-90px)] p-2 md:p-4">
      <AIPricingSplitView />
    </div>
  );
};

export default AIPricingDashboard;
