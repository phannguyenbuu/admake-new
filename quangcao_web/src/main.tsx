import { createRoot } from "react-dom/client";
import "./index.css";
import Providers from "./common/providers.tsx";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import LoadingPage from "./app/loading.tsx";
<<<<<<< HEAD
import "@goongmaps/goong-js/dist/goong-js.css";
=======
// import "@goongmaps/goong-js/dist/goong-js.css";
>>>>>>> c0e8eb3d11debb508d0dbb29418540c6b17018be
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
