import React from "react";
import { Typography } from "antd";
import { MaterialSection } from "../../invoice/MaterialSection";
import type { Mode } from "../../../../@types/work-space.type";
import type { MaterialTask } from "../../../../@types/work-space.type";
import type { FormTaskDetailProps } from "../../../../@types/work-space.type";
import type { Task } from "../../../../@types/work-space.type";

const { Text } = Typography;

// interface Material {
//   id: string | number;
//   name: string;
//   price: number;
//   quantity?: number;
// }

// interface MaterialData {
//   selectedMaterials: Material[];
//   materialQuantities: Record<string, number>;
// }

// interface MaterialHandlers {
//   materialCheck: (checked: boolean, material: any) => void;
//   materialRemove: (materialId: string) => void;
//   materialQuantityChange: (materialId: string, value: number | null) => void;
// }

// interface MaterialInfoProps {
//   currentStatus: string;
//   isEditMode: boolean;
//   mode: Mode;
//   material: MaterialData;
//   handlers: MaterialHandlers;
//   mappedTask?: {
//     materials?: {
//       material: Material & { quantity?: number };
//     }[];
//   };
// }

const MaterialInfo = ({taskDetail}:{taskDetail:Task | null}) => {
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
          {taskDetail?.materials?.map((mat) => {
            const qty = mat.quantity || 1;
            return (
              <div key={mat.materialId} className="p-2 md:p-0">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-cyan-600 font-semibold cursor-pointer hover:underline block truncate">
                      {mat?.material?.name || "Unknown Material"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-gray-600">Số lượng</span>
                    <span className="text-green-600 font-semibold text-sm">
                      {qty} x {mat?.material?.price.toLocaleString("vi-VN")}đ
                    </span>
                    <span className="text-green-600 font-semibold text-sm">
                      = {(mat?.material?.price * qty).toLocaleString("vi-VN")}đ
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
