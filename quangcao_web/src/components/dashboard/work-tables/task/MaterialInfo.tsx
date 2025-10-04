import React, { useEffect, useState } from "react";
import { Typography } from "antd";
import { MaterialSection } from "../../invoice/MaterialSection";
import type { Mode } from "../../../../@types/work-space.type";
import type { MaterialTask } from "../../../../@types/work-space.type";
import type { FormTaskDetailProps } from "../../../../@types/work-space.type";
import type { Task } from "../../../../@types/work-space.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import type { Material } from "../../../../@types/material.type";

const { Text } = Typography;

interface MaterialProps {
  data:Material[],
}

const MaterialInfo = ({taskDetail}:{taskDetail:Task | null}) => {
  const [materialList, setMeterialList] = useState<Material[]>([]);


  useEffect(()=>{
    fetch(`${useApiHost()}/material/`)
        .then((response) => response.json())
        .then((data: MaterialProps) => {
          console.log("materials", data);
          setMeterialList(data.data);
        });
  },[]);



  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
          <span className="text-purple-600 text-xs sm:text-sm">🔧</span>
        </div>
        <Text strong className="!text-gray-800 !text-sm sm:!text-base">
          Vật liệu cần thiết
        </Text>
      </div>
      {/* {currentStatus === "OPEN"  ? (
        <MaterialSection
          selected={material.selectedMaterials}
          quantities={material.materialQuantities}
          onCheck={handlers.materialCheck}
          onRemove={handlers.materialRemove}
          onQuantityChange={handlers.materialQuantityChange}
          disabled={mode.adminMode && currentStatus !== "OPEN"}
        />
      ) : ( */}
        <div
          className="px-3 sm:px-4 pb-4 max-h-60 overflow-y-auto space-y-2"
          style={{ maxHeight: 240 }}
        >
          {/* @ts-ignore */}
          {materialList && taskDetail?.materials?.map((mat) => {
            const qty = mat.quantity || 1;
            const material = materialList.find(m => m.id === mat?.materialId);
            const price = material?.price || 0;
            const mtl = material?.name;

            return (
              <div key={mat?.materialId} className="p-2 md:p-0">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-cyan-600 font-semibold cursor-pointer hover:underline block truncate">
                      {mtl || "Unknown Material"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-gray-600">Số lượng</span>
                    <span className="text-green-600 font-semibold text-sm">
                      {qty} x {price.toLocaleString("vi-VN")}đ
                    </span>
                    <span className="text-green-600 font-semibold text-sm">
                      = {(price * qty).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      {/* )} */}
    </div>
  );
};

export default MaterialInfo;
