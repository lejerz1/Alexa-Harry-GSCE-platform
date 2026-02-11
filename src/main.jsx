import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import posthog from "posthog-js";
import LandingPage from "./LandingPage";
import GCSERevision from "./gcse-revision";
import { USER_PROFILES } from "./userConfig";
import "./index.css";

posthog.init("phc_jhJveU4pKogAGUTwYBdA5e07BLrbBgi4PjQasf6luCC", {
  api_host: "https://us.i.posthog.com",
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
});

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
