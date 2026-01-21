import React from "react";
import { Route, Routes } from "react-router-dom";

import TransitionComponent from "../components/Transition";
import HomePage from "../pages/HomePage/HomePage";
import EditGLBPage from "../pages/EditGLBPage/EditGLBPage";
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage";

const Router = () => {
  return (
    <Routes>
      <Route
        index
        element={
          <TransitionComponent>
            <HomePage />
          </TransitionComponent>
        }
      />
      <Route path="edit/:modelGroup/:modelFile" element={<EditGLBPage />} />
      <Route path="preview/:modelName" element={<EditGLBPage previewOnly />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
