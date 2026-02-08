import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import LandingPage from "./LandingPage";
import GCSERevision from "./gcse-revision";
import { USER_PROFILES } from "./userConfig";
import "./index.css";

const VALID_USERS = Object.keys(USER_PROFILES);

function UserApp() {
  const { name } = useParams();
  const slug = name?.toLowerCase();

  if (!VALID_USERS.includes(slug)) {
    return <Navigate to="/" replace />;
  }

  return <GCSERevision userName={slug} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/:name" element={<UserApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
