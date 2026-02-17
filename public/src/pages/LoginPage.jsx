import React, { useState } from "react";
import { apiPost } from "../api/http.js";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@monroy.local");
  const [password, setPassword] = useState("Admin@12345");
  const [msg, setMsg] = useState("");

  async function onLogin(e) {
    e.preventDefault();
    setMsg("Logging in...");

    try {
      const data = await apiPost("/api/auth/login", { email, password });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setMsg(`✅ Logged in as ${data.user.name} (${data.user.role})`);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Login</h2>
      <form onSubmit={onLogin} style={{ display: "grid", gap: 10 }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
        </label>
        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}
