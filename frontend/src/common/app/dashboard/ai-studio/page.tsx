import React from "react";
import type { IPage } from "../../../@types/common.type";
import { BomPromptLauncher } from "../../../components/product-bom/BomPromptLauncher";

const AiStudioPage: IPage["Component"] = () => {
  return <BomPromptLauncher />;
};

export default AiStudioPage;
