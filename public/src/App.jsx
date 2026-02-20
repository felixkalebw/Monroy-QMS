import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./Pages/Dashboard.jsx";
import NcrStatutoryReport from "./Pages/NcrStatutoryReport.jsx";

/*
  MONROY QMS
  Clean version – Login fully removed
  No authentication gate
  Fully open UI
*/

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Root → Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Main Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ncr-report" element={<NcrStatutoryReport />} />

        {/* Catch-all → Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
