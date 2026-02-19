// public/src/lib/api.js

// ==============================
// ALWAYS DEMO MODE
// ==============================
export function isDemoMode() {
  return true;
}

export function setDemoMode() {
  // do nothing (always demo)
}

// ==============================
// DEMO DATABASE (LOCAL)
// ==============================

function loadStore() {
  const raw = localStorage.getItem("monroy_demo_store");
  if (raw) return JSON.parse(raw);

  const initial = {
    clients: [
      {
        id: "cl1",
        name: "Khoemacau Copper Mine",
        category: "MINE",
        status: "ACTIVE"
      }
    ],
    equipment: [
      {
        id: "eq1",
        equipmentCode: "EQ-0001",
        type: "AIR_RECEIVER",
        serialNumber: "AR-12345",
        nextDueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90)
      }
    ],
    ncr: []
  };

  localStorage.setItem("monroy_demo_store", JSON.stringify(initial));
  return initial;
}

function saveStore(store) {
  localStorage.setItem("monroy_demo_store", JSON.stringify(store));
}

function generateId(prefix) {
  return prefix + "_" + Math.random().toString(36).substring(2, 9);
}

// ==============================
// API GET
// ==============================

export async function apiGet(url) {
  const store = loadStore();

  if (url === "/api/demo/stats") {
    return {
      stats: {
        totalClients: store.clients.length,
        totalEquipment: store.equipment.length,
        expiring30: 1,
        expired: 0,
        openNcrs: store.ncr.filter(n => n.status !== "CLOSED").length,
        inspectionsThisMonth: 3
      }
    };
  }

  if (url === "/api/clients") {
    return { items: store.clients };
  }

  if (url === "/api/equipment") {
    return { items: store.equipment };
  }

  if (url === "/api/ncr") {
    return { items: store.ncr };
  }

  return {};
}

// ==============================
// API POST
// ==============================

export async function apiPost(url, data) {
  const store = loadStore();

  if (url === "/api/ncr") {
    const newNcr = {
      id: generateId("ncr"),
      ncrCode: "NCR-" + String(store.ncr.length + 1).padStart(4, "0"),
      clientId: data.clientId,
      equipmentId: data.equipmentId,
      inspectionId: data.inspectionId,
      category: data.category,
      description: data.description,
      status: data.status,
      createdAt: new Date().toISOString()
    };

    store.ncr.unshift(newNcr);
    saveStore(store);
    return newNcr;
  }

  return {};
}

// ==============================
// UNUSED BUT REQUIRED
// ==============================

export async function apiPut() {
  return {};
}

export async function apiDel() {
  return {};
}
