import { createRoot } from "react-dom/client";
import "../index.css";
import Providers from "../common/common/providers.tsx";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import LoadingPage from "../common/app/loading.tsx";
import { UserProvider } from "../common/common/hooks/useUser.tsx";
import "@ant-design/v5-patch-for-react-19";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <Providers>
      <RouterProvider
        fallbackElement={<LoadingPage />}
        future={{
          v7_startTransition: true,
        }}
        router={router}
      />
    </Providers>
  </UserProvider>
);
