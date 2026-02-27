import { createBrowserRouter, type NonIndexRouteObject,} from "react-router-dom";

import BaseLayout from "../common/common/layouts/base.layout";
import type { UserRole } from "../common/@types/user.type";
import Error404 from "../common/app/404";
import React from "react";
import Workpoint from "../common/components/chat/components/Workpoint";
import { WorkpointSettingProvider } from "../common/common/hooks/useWorkpointSetting";
import { WorkpointInforProvider } from "../common/common/hooks/useWorpointInfor";
import { TaskProvider } from "../common/common/hooks/useTask";

interface TRoute extends Omit<NonIndexRouteObject, "index" | "children"> {
  children?: TRoute[];
  roles?: UserRole[];
  title?: string;
  icon?: React.ReactNode;
  ignoreInMenu?: boolean;
  isDevelope?: boolean;
  isMainMenu?: boolean;
  index?: boolean;
  tooltip?: string;
  isDivider?: boolean;
}

const routes: TRoute = {
  path: "/",
  element: 
  <WorkpointInforProvider>
            <WorkpointSettingProvider>
              <TaskProvider>
              <BaseLayout />
              </TaskProvider>
            </WorkpointSettingProvider>
          </WorkpointInforProvider>
          ,
  errorElement: <Error404 />,
  children: [
    {
      path: "/point/:id/",
      element: 
      
          <Workpoint/>,
        
      title: "Workpoint",
      ignoreInMenu: true,
    }
  ],
};

export const router = createBrowserRouter([routes as NonIndexRouteObject], {});
export type Router = typeof router;

