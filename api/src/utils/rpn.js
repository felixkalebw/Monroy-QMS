export function computeRpn(sev, occ, det) {
  const s = clamp1to10(sev);
  const o = clamp1to10(occ);
  const d = clamp1to10(det);
  return s * o * d;
}

export function riskLevelFromRpn(rpn, { high = 100, critical = 200 } = {}) {
  if (rpn >= critical) return "CRITICAL";
  if (rpn >= high) return "HIGH";
  if (rpn >= 50) return "MEDIUM";
  return "LOW";
}

function clamp1to10(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.max(1, Math.min(10, Math.floor(x)));
}
