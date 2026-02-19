import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Pages/Dashboard.jsx";
import NcrStatutoryReport from "./Pages/NcrStatutoryReport.jsx";

function DisabledLogin() {
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* force root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* hard-disable login routes */}
        <Route path="/login" element={<DisabledLogin />} />
        <Route path="/auth" element={<DisabledLogin />} />

        {/* main pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ncr-report" element={<NcrStatutoryReport />} />

        {/* catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
