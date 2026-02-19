// public/src/lib/demoStore.js
const KEY = "monroy_demo_db_v1";

function nowIso() {
  return new Date().toISOString();
}

function randId(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function defaultDb() {
  const client1 = {
    id: "cl_demo_001",
    name: "Khoemacau Copper Mine",
    category: "MINE",
    status: "ACTIVE",
    notes: "Demo client seed",
    createdAt: nowIso()
  };

  const equipment1 = {
    id: "eq_demo_001",
    clientId: client1.id,
    equipmentCode: "EQ-000001",
    type: "AIR_RECEIVER",
    serialNumber: "AR-12345",
    manufacturer: "SHACMAN",
    yearOfManufacture: 2022,
    countryOfOrigin: "China",
    swl: null,
    mawp: 0.8,
    designPressure: 1.0,
    testPressure: 1.2,
    nextDueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    createdAt: nowIso()
  };

  const insp1 = {
    id: "insp_demo_001",
    inspectionCode: "INSP-000001",
    clientId: client1.id,
    equipmentId: equipment1.id,
    type: "UT_THICKNESS_TEST",
    datePerformed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    findingsText: "UT thickness readings taken. No critical thinning found (demo).",
    nonConformance: false,
    certificateIssued: true,
    certificateExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 355).toISOString(),
    status: "APPROVED",
    createdAt: nowIso()
  };

  const ncr1 = {
    id: "ncr_demo_001",
    ncrCode: "NCR-000001",
    clientId: client1.id,
    equipmentId: equipment1.id,
    inspectionId: insp1.id,
    category: "MINOR",
    description: "Minor documentation gap found during inspection (demo).",
    status: "OPEN",
    createdAt: nowIso(),
    reportJson: {}
  };

  return {
    clients: [client1],
    equipment: [equipment1],
    inspections: [insp1],
    ncrs: [ncr1],
    counters: {
      client: 1,
      equipment: 1,
      inspection: 1,
      ncr: 1
    }
  };
}

export function loadDemoDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const db = defaultDb();
      localStorage.setItem(KEY, JSON.stringify(db));
      return db;
    }
    return JSON.parse(raw);
  } catch {
    const db = defaultDb();
    localStorage.setItem(KEY, JSON.stringify(db));
    return db;
  }
}

export function saveDemoDb(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}

export function resetDemoDb() {
  localStorage.removeItem(KEY);
  return loadDemoDb();
}

export function demoList(resource) {
  const db = loadDemoDb();
  return db[resource] ?? [];
}

export function demoCreate(resource, data) {
  const db = loadDemoDb();
  const item = { ...data };

  if (!item.id) item.id = randId(resource);
  item.createdAt = item.createdAt || nowIso();

  if (resource === "clients") {
    db.counters.client += 1;
  }
  if (resource === "equipment") {
    db.counters.equipment += 1;
    if (!item.equipmentCode) item.equipmentCode = `EQ-${String(db.counters.equipment).padStart(6, "0")}`;
  }
  if (resource === "inspections") {
    db.counters.inspection += 1;
    if (!item.inspectionCode) item.inspectionCode = `INSP-${String(db.counters.inspection).padStart(6, "0")}`;
  }
  if (resource === "ncrs") {
    db.counters.ncr += 1;
    if (!item.ncrCode) item.ncrCode = `NCR-${String(db.counters.ncr).padStart(6, "0")}`;
    if (!item.reportJson) item.reportJson = {};
  }

  db[resource] = [item, ...(db[resource] ?? [])];
  saveDemoDb(db);
  return item;
}

export function demoGetById(resource, id) {
  const db = loadDemoDb();
  return (db[resource] ?? []).find((x) => x.id === id) || null;
}

export function demoUpdateById(resource, id, patch) {
  const db = loadDemoDb();
  const items = db[resource] ?? [];
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  db[resource] = items;
  saveDemoDb(db);
  return items[idx];
}

export function demoStats() {
  const db = loadDemoDb();
  const expiring30 = (db.equipment || []).filter((e) => {
    if (!e.nextDueDate) return false;
    const d = new Date(e.nextDueDate).getTime();
    const diffDays = (d - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const expired = (db.equipment || []).filter((e) => {
    if (!e.nextDueDate) return false;
    return new Date(e.nextDueDate).getTime() < Date.now();
  }).length;

  const openNcrs = (db.ncrs || []).filter((n) => n.status !== "CLOSED").length;

  return {
    totalClients: (db.clients || []).length,
    totalEquipment: (db.equipment || []).length,
    expiring30,
    expired,
    openNcrs,
    inspectionsThisMonth: (db.inspections || []).filter((i) => {
      const d = new Date(i.datePerformed || i.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length
  };
}
