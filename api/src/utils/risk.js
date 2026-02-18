export function clampScore(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.max(1, Math.min(10, Math.trunc(x)));
}

export function calcRpn(sev, occ, det) {
  return clampScore(sev) * clampScore(occ) * clampScore(det);
}

export function riskLevelFromRpn(rpn) {
  if (rpn >= 200) return "CRITICAL";
  if (rpn >= 100) return "HIGH";
  if (rpn >= 50) return "MEDIUM";
  return "LOW";
}
