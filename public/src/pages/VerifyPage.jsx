import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../api/http.js";

export default function VerifyPage() {
  const { publicCode } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet(`/public/verify/${publicCode}`);
        setData(r);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [publicCode]);

  return (
    <div style={{ maxWidth: 700 }}>
      <h2>Certificate Verification</h2>
      <p><strong>Code:</strong> {publicCode}</p>

      {err ? <p style={{ color: "crimson" }}>❌ {err}</p> : null}

      {data ? (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
          <p><strong>Valid:</strong> {String(data.valid)}</p>
          {data.equipment ? (
            <>
              <h3>Equipment</h3>
              <pre style={{ background: "#f7f7f7", padding: 10, borderRadius: 8 }}>
{JSON.stringify(data.equipment, null, 2)}
              </pre>
            </>
          ) : null}

          <h3>Latest inspection</h3>
          <pre style={{ background: "#f7f7f7", padding: 10, borderRadius: 8 }}>
{JSON.stringify(data.latestInspection, null, 2)}
          </pre>
        </div>
      ) : (
        !err ? <p>Loading...</p> : null
      )}
    </div>
  );
}
