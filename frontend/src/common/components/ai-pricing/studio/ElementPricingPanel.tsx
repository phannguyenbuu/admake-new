/**
 * ElementPricingPanel.tsx - Router Component điều phối giữa:
 * - ElementDetailPricing: Khi người dùng chọn 1 cấu kiện trên không gian 3D.
 * - OverallPricingBreakdown: Khi không chọn vật thể nào (chỉ xem kích thước tổng thể, bảng giá thành phần, nhân công, hao hụt).
 */

import React from "react";
import type { SelectedMeshInfo } from "../editor3d/editorTypes";
import type { Signboard3DModel } from "../../../services/genaiSignboard.service";
import type { StudioQuoteResult } from "./studioQuote";
import { ElementDetailPricing } from "./ElementDetailPricing";
import { OverallPricingBreakdown } from "./OverallPricingBreakdown";

interface ElementPricingPanelProps {
  selection: SelectedMeshInfo | null;
  model3D: Signboard3DModel | null;
  quoteResult: StudioQuoteResult | null;
  onDeselect?: () => void;
  onUpdateTextParams?: (params: any) => void;
}

export const ElementPricingPanel: React.FC<ElementPricingPanelProps> = ({
  selection,
  model3D,
  quoteResult,
  onDeselect,
  onUpdateTextParams,
}) => {
  if (selection) {
    return (
      <ElementDetailPricing
        selection={selection}
        model3D={model3D}
        onDeselect={onDeselect}
        onUpdateTextParams={onUpdateTextParams}
      />
    );
  }

  return (
    <OverallPricingBreakdown
      model3D={model3D}
      quoteResult={quoteResult}
    />
  );
};
