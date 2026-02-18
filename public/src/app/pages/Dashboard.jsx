import React from "react";

function Card({ title, value }) {
  return (
    <div style={{ background: "white", padding: 16, borderRadius: 14, boxShadow: "0 6px 16px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Enterprise Dashboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <Card title="Active Clients" value="0" />
        <Card title="Equipment Registered" value="0" />
        <Card title="Expiring in 30 Days" value="0" />
        <Card title="Open NCRs" value="0" />
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "white", padding: 16, borderRadius: 14, boxShadow: "0 6px 16px rgba(0,0,0,.06)" }}>
          <h3 style={{ marginTop: 0 }}>Charts (coming next)</h3>
          <ul style={{ margin: 0, opacity: 0.85 }}>
            <li>Inspections by month</li>
            <li>Compliance trend</li>
            <li>Equipment by type</li>
            <li>NCR ageing</li>
            <li>PFMEA risk heatmap</li>
          </ul>
        </div>
        <div style={{ background: "white", padding: 16, borderRadius: 14, boxShadow: "0 6px 16px rgba(0,0,0,.06)" }}>
          <h3 style={{ marginTop: 0 }}>Alerts</h3>
          <p style={{ margin: 0, opacity: 0.85 }}>
            Next we connect email reminders + expiry rules to real data.
          </p>
        </div>
      </div>
    </div>
  );
}
