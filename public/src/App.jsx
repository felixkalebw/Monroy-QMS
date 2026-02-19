import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import NcrStatutoryReport from "./pages/NcrStatutoryReport.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ncr-report" element={<NcrStatutoryReport />} />
      </Routes>
    </BrowserRouter>
  );
}
