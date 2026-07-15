import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";

    // Omitir endpoints de health-check para no saturar el dashboard
    if (req.originalUrl === "/api" || req.originalUrl === "/api/health" || req.originalUrl === "/api/") {
      return;
    }

    console.log(JSON.stringify({
      level:      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      method:     req.method,
      endpoint:   req.originalUrl.split("?")[0],
      status:     res.statusCode,
      ip:         Array.isArray(ip) ? ip[0] : ip.split(",")[0].trim(),
      durationMs: duration,
    }));
  });

  next();
}
