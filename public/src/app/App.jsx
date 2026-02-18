import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clients from "./pages/Clients.jsx";
import Equipment from "./pages/Equipment.jsx";
import Inspections from "./pages/Inspections.jsx";
import Pfmea from "./pages/Pfmea.jsx";
import Ncr from "./pages/Ncr.jsx";
import { API_URL } from "./api.js";

function Shell({ children }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#f6f7fb" }}>
      <div style={{ background: "#0b2a5b", color: "white", padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
        <b>MONROY QMS</b>
        <Link style={{ color: "white", textDecoration: "none" }} to="/dashboard">Dashboard</Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/clients">Clients</Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/equipment">Equipment</Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/inspections">Inspections</Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/pfmea">PFMEA</Link>
        <Link style={{ color: "white", textDecoration: "none" }} to="/ncr">NCR</Link>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.9 }}>
          API: {API_URL || "(set VITE_API_URL)"}
        </div>
      </div>

      <div style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const token = localStorage.getItem("token");
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/clients" element={token ? <Clients /> : <Navigate to="/login" replace />} />
        <Route path="/equipment" element={token ? <Equipment /> : <Navigate to="/login" replace />} />
        <Route path="/inspections" element={token ? <Inspections /> : <Navigate to="/login" replace />} />
        <Route path="/pfmea" element={token ? <Pfmea /> : <Navigate to="/login" replace />} />
        <Route path="/ncr" element={token ? <Ncr /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </Shell>
  );
}
