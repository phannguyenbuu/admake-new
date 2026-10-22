import React from "react";
import { useNavigate } from "react-router-dom";
import type { IPage } from "../../../@types/common.type";
import { Signboard3DStudio } from "../../../components/ai-pricing/Signboard3DStudio";

const AiStudioPage: IPage["Component"] = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-[calc(100vh-80px)] overflow-hidden rounded-2xl bg-slate-100 shadow-xs border border-slate-200/90">
      <Signboard3DStudio
        open={true}
        onClose={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/statistics");
          }
        }}
      />
    </div>
  );
};

export default AiStudioPage;
