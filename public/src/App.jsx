import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./Pages/Dashboard.jsx";
import NcrStatutoryReport from "./Pages/NcrStatutoryReport.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ncr-report" element={<NcrStatutoryReport />} />
      </Routes>
    </BrowserRouter>
  );
}
