import cors from "cors";
import { config } from "../config.js";

export const corsMw = cors({
  origin: (origin, cb) => {
    // allow server-to-server / curl (no origin)
    if (!origin) return cb(null, true);

    if (config.corsOrigin === "*" || config.corsOrigin === origin) return cb(null, true);

    // allow multiple origins separated by comma
    const list = config.corsOrigin.split(",").map(s => s.trim()).filter(Boolean);
    if (list.includes(origin)) return cb(null, true);

    return cb(new Error("CORS blocked"), false);
  },
  credentials: true
});
