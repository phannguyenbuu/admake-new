import "./App.scss";
import React, { useEffect } from "react";
import "antd/dist/reset.css";

import { useResponsiveStore } from "./stores/useResponsiveStore";
import LoadingPage from "./pages/LoadingPage/LoadingPage";
import Router from "./routes/Router";
import Experience from "./Experience/Experience";
import { SelectionProvider, PointerProvider } from "./stores/selectionStore";

function App() {
  const { updateDimensions } = useResponsiveStore();

  useEffect(() => {
    const handleResize = () => updateDimensions();
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateDimensions]);

  return (
    <PointerProvider>
      <SelectionProvider>
        <LoadingPage />
        <Router />
        <Experience />
      </SelectionProvider>
    </PointerProvider>
  );
}

export default App;
