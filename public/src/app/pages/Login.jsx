import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onLogin() {
    setErr("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "demo", password: "demo" })
      });
      localStorage.setItem("token", data.accessToken);
      nav("/dashboard");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "white", padding: 18, borderRadius: 14, boxShadow: "0 8px 20px rgba(0,0,0,.08)", maxWidth: 420 }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <p style={{ opacity: 0.8 }}>
        Demo login to view the UI (we’ll wire real auth + roles next).
      </p>
      {err && <div style={{ background: "#ffe3e3", padding: 10, borderRadius: 10, marginBottom: 10 }}>{err}</div>}
      <button onClick={onLogin} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10, border: "0", background: "#0b2a5b", color: "white", cursor: "pointer" }}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}
