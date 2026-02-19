import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Clients() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MINE");

  async function load() {
    const r = await api("/api/clients");
    setItems(r.items || []);
  }

  async function create() {
    await api("/api/clients", {
      method: "POST",
      body: JSON.stringify({ name, category })
    });
    setName("");
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ background: "white", padding: 16, borderRadius: 14 }}>
      <h2 style={{ marginTop: 0 }}>Clients</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="MINE">MINE</option>
          <option value="INDUSTRIAL">INDUSTRIAL</option>
          <option value="CONSTRUCTION">CONSTRUCTION</option>
        </select>
        <button onClick={create} disabled={!name.trim()}>Add</button>
        <button onClick={load}>Refresh</button>
      </div>

      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#f3f4f6" }}>
            <th>Name</th><th>Category</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(c => (
            <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{c.name}</td>
              <td>{c.category}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
