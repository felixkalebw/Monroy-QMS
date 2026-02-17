import React, { useEffect, useState } from "react";
import { apiGet } from "../api/http.js";

export default function DashboardPage() {
  const [health, setHealth] = useState(null);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const h = await apiGet("/health");
        setHealth(h);

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const c = await apiGet("/api/clients", token);
        setClients(c);

        const e = await apiGet("/api/equipment", token);
        setEquipment(e);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Card title="API Health" value={health?.ok ? "OK" : "..."} />
        <Card title="Clients" value={clients.length} />
        <Card title="Equipment" value={equipment.length} />
      </div>

      {error ? <p style={{ color: "crimson" }}>❌ {error}</p> : null}

      <p style={{ marginTop: 16 }}>
        Tip: Login first to view Clients/Equipment.
      </p>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, minWidth: 180 }}>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
