import { Router } from "express";

const router = Router();

router.post("/login", async (req, res) => {
  // Demo auth (so frontend can unlock and you can see UI)
  return res.json({
    accessToken: "demo-token",
    refreshToken: "demo-refresh",
    user: { id: "demo", name: "Admin", email: "admin@demo.local", role: "ADMIN" }
  });
});

export default router;
