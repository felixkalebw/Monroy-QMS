export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  // Demo token for now
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  next();
}
