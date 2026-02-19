// public/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { apiGet, apiPost, setDemoMode } from "../lib/api.js";
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
    // Always run in demo mode for presentation (no auth/no DB required)
    setDemoMode(true);

    const s = await apiGet("/api/demo/stats").catch(() => null);
    if (s?.stats) setStats(s.stats);

    const c = await apiGet("/api/clients").catch(() => ({ items: [] }));
    const e = await apiGet("/api/equipment").catch(() => ({ items: [] }));
    const n = await apiGet("/api/ncr").catch(() => ({ items: [] }));

    setClients(c.items || []);
    setEquipment(e.items || []);
    setNcrs(n.items || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function quickCreateNcr() {
    if (!clients[0] || !equipment[0]) {
      alert("Demo data missing. Refresh the page.");
      return;
    }

    const created = await apiPost("/api/ncr", {
      clientId: clients[0].id,
      equipmentId: equipment[0].id,
      inspectionId: null,
      category: "MINOR",
      description: "Demo NCR created for presentation.",
      status: "OPEN"
    }).catch(() => null);

    if (!created?.id) {
      alert("Could not create NCR (demo store not loaded). Refresh and try again.");
      return;
    }

    await load();
    nav(`/ncr-report?id=${created.id}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <div style={{ background: "#111827", color: "white", padding: 16 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Monroy QMS — Enterprise Demo</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Presentation Mode: DEMO (offline safe) • No Login Required
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => window.location.reload()}
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
              Refresh Demo Data
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
          <Card title="Active Clients" value={stats?.totalClients ?? clients.length ?? "-"} />
          <Card title="Equipment Registered" value={stats?.totalEquipment ?? equipment.length ?? "-"} />
          <Card title="Expiring ≤ 30 days" value={stats?.expiring30 ?? "-"} />
          <Card title="Expired Equipment" value={stats?.expired ?? "-"} />
          <Card title="Open NCRs" value={stats?.openNcrs ?? ncrs.filter(x => x.status !== "CLOSED").length ?? "-"} />
          <Card title="Inspections This Month" value={stats?.inspectionsThisMonth ?? "-"} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            onClick={quickCreateNcr}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #111827", background: "#111827", color: "white", fontWeight: 900, cursor: "pointer" }}
          >
            + Create Demo NCR + Open Statutory NCR Report
          </button>

          <button
            onClick={() => {
              const id = ncrs[0]?.id;
              if (!id) return alert("No NCR found. Click Create Demo NCR first.");
              nav("/ncr-report?id=" + id);
            }}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", fontWeight: 900, cursor: "pointer" }}
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
              {!clients.length && (
                <div style={{ padding: 10, borderRadius: 12, border: "1px dashed #d1d5db", color: "#6b7280" }}>
                  No demo clients loaded yet. Click “Refresh Demo Data”.
                </div>
              )}
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
              {!ncrs.length && (
                <div style={{ padding: 10, borderRadius: 12, border: "1px dashed #d1d5db", color: "#6b7280" }}>
                  No NCRs yet. Click “Create Demo NCR”.
                </div>
              )}
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
            {!equipment.length && (
              <div style={{ padding: 10, borderRadius: 12, border: "1px dashed #d1d5db", color: "#6b7280" }}>
                No demo equipment loaded yet. Click “Refresh Demo Data”.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
