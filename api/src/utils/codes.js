let eqCounter = 1;

export function makeEquipmentCode() {
  // simple deterministic format; DB uniqueness will enforce
  const code = `EQ-${String(Date.now()).slice(-6)}-${String(eqCounter++).padStart(3, "0")}`;
  return code;
}

export function makeInspectionCode() {
  return `INSP-${Date.now().toString().slice(-8)}`;
}

export function makeNcrCode() {
  return `NCR-${Date.now().toString().slice(-8)}`;
}

export function makePublicCode() {
  // short public code for QR verify
  return Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}
