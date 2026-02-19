// public/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { apiGet, apiPost, isDemoMode, setDemoMode } from "../lib/api.js";
import { useNavigate } from "react-router-dom";

const Card = ({ title, value }) => (
  <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "white" }}>
    <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div>
    <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
  </div>
);

export default function Dashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [ncrs, setNcrs] = useState([]);

  async function load() {
    const s = await apiGet("/api/demo/stats").catch(() => null);
    if (s?.stats) setStats(s.stats);

    const c = await apiGet("/api/clients");
    const e = await apiGet("/api/equipment");
    const n = await apiGet("/api/ncr");

    setClients(c.items || []);
    setEquipment(e.items || []);
    setNcrs(n.items || []);
  }

  useEffect(() => {
    load().catch((e) => alert(e.message));
  }, []);

  async function quickCreateNcr() {
    if (!clients[0] || !equipment[0]) {
      alert("Need at least 1 client and 1 equipment.");
      return;
    }
    const created = await apiPost("/api/ncr", {
      clientId: clients[0].id,
      equipmentId: equipment[0].id,
      inspectionId: null,
      category: "MINOR",
      description: "Demo NCR created for presentation.",
      status: "OPEN"
    });
    alert("✅ NCR created");
    await load();
    nav(`/ncr-report?id=${created.id}`);
  }

  function logout() {
    localStorage.removeItem("token");
    setDemoMode(false);
    nav("/");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <div style={{ background: "#111827", color: "white", padding: 16 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Monroy QMS — Dashboard</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Mode: {isDemoMode() ? "DEMO (offline safe)" : "LIVE"} • Present-ready
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => {
                setDemoMode(!isDemoMode());
                load().catch(() => {});
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent",
                color: "white",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Toggle Demo
            </button>

            <button
              onClick={logout}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent",
                color: "white",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
          <Card title="Active Clients" value={stats?.totalClients ?? "-"} />
          <Card title="Equipment Registered" value={stats?.totalEquipment ?? "-"} />
          <Card title="Expiring ≤ 30 days" value={stats?.expiring30 ?? "-"} />
          <Card title="Expired Equipment" value={stats?.expired ?? "-"} />
          <Card title="Open NCRs" value={stats?.openNcrs ?? "-"} />
          <Card title="Inspections This Month" value={stats?.inspectionsThisMonth ?? "-"} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            onClick={quickCreateNcr}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #111827", background: "#111827", color: "white", fontWeight: 900 }}
          >
            + Create Demo NCR + Open Statutory NCR Report
          </button>

          <button
            onClick={() => nav("/ncr-report?id=" + (ncrs[0]?.id || ""))}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", fontWeight: 900 }}
          >
            Open First NCR Report
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Clients</div>
            <div style={{ display: "grid", gap: 8 }}>
              {clients.slice(0, 6).map((c) => (
                <div key={c.id} style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 800 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{c.category} • {c.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>NCRs</div>
            <div style={{ display: "grid", gap: 8 }}>
              {ncrs.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  onClick={() => nav(`/ncr-report?id=${n.id}`)}
                  style={{ textAlign: "left", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}
                >
                  <div style={{ fontWeight: 900 }}>{n.ncrCode || "NCR"}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {n.category} • {n.status} • {n.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Equipment</div>
          <div style={{ display: "grid", gap: 8 }}>
            {equipment.slice(0, 8).map((e) => (
              <div key={e.id} style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: 900 }}>{e.equipmentCode} • {e.type}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Serial: {e.serialNumber} • Next Due: {e.nextDueDate ? new Date(e.nextDueDate).toLocaleDateString() : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
