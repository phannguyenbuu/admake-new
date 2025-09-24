import { redirect } from "react-router-dom";
import type { IPage } from "../../@types/common.type";
import { TOKEN_LABEL } from "../../common/config";
import { delay } from "../../common/utils/method.util";
import DashLayout from "../../common/layouts/dash.layout";

export const Component: IPage["Component"] = () => {
  return <DashLayout />;
};
export const loader = async () => {
  await delay(2000); // Simulate loading delay
  // if (!localStorage.getItem(TOKEN_LABEL)) {
    // return redirect("/");
  // }
  return null;
};
