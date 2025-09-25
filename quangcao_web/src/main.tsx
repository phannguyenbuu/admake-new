import { createRoot } from "react-dom/client";
import "./index.css";
import Providers from "./common/providers.tsx";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import LoadingPage from "./app/loading.tsx";
// import "@goongmaps/goong-js/dist/goong-js.css";
import "@ant-design/v5-patch-for-react-19";
createRoot(document.getElementById("root")!).render(
  <Providers>
    <RouterProvider
      fallbackElement={<LoadingPage />}
      future={{
        v7_startTransition: true,
      }}
      router={router}
    />
  </Providers>
);
