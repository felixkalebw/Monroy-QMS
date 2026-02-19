import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";
import NcrStatutoryReport from "./pages/NcrStatutoryReport.jsx";


export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>Monroy QMS</strong>
        <nav style={{ display: "flex", gap: 10 }}>
          <Link to="/">Dashboard</Link>
          <Link to="/login">Login</Link>
          <Link to="/verify/demo">Verify</Link>
        </nav>
      </header>

      <hr style={{ margin: "16px 0" }} />

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:publicCode" element={<VerifyPage />} />
      </Routes>
    </div>
  );
}
