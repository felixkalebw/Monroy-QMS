import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export function audit(action, entityType = null) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.sub ?? null;
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? req.ip;
      const userAgent = req.headers["user-agent"] ?? null;

      res.on("finish", async () => {
        // only log successful-ish actions
        if (res.statusCode >= 200 && res.statusCode < 500) {
          await prisma.auditLog.create({
            data: {
              userId,
              action,
              entityType,
              entityId: req.params?.id ?? null,
              ip,
              userAgent,
              metadata: {
                path: req.path,
                method: req.method,
                status: res.statusCode
              }
            }
          });
        }
      });

      next();
    } catch {
      next();
    }
  };
}
