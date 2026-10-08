import React, { useState } from "react";
import type { IPage } from "../../../@types/common.type";
import { Signboard3DStudio } from "../../../components/ai-pricing/Signboard3DStudio";
import { AIPricingSplitView } from "../../../components/ai-pricing/AIPricingSplitView";
import { Segmented } from "antd";

const AIPricingDashboard: IPage["Component"] = () => {
  const [viewMode, setViewMode] = useState<"3d_workflow" | "classic">("3d_workflow");

  return (
    <div className="w-full h-full min-h-[calc(100vh-90px)] p-2 md:p-4 space-y-3">
      <div className="flex items-center justify-between px-2">
        <Segmented
          value={viewMode}
          onChange={(val) => setViewMode(val as "3d_workflow" | "classic")}
          options={[
            { label: "🧊 Quy Trình 3D & Render GenAI (Mới)", value: "3d_workflow" },
            { label: "📊 Báo Giá & Tách Vật Tư Cổ Điển", value: "classic" },
          ]}
          className="bg-slate-900 border border-slate-800 text-slate-200"
        />
      </div>

      {viewMode === "3d_workflow" ? <Signboard3DStudio /> : <AIPricingSplitView />}
    </div>
  );
};

export default AIPricingDashboard;
