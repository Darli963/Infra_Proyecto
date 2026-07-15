import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body as Parameters<typeof authService.register>[0]);
      res.status(201).json({ status: "ok", data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
    const cleanIp = Array.isArray(ip) ? ip[0] : ip.split(",")[0].trim();
    try {
      const result = await authService.login(req.body as Parameters<typeof authService.login>[0]);
      console.log(JSON.stringify({
        level: "info",
        action: "User login",
        user: email,
        ip: cleanIp,
      }));
      res.status(200).json({ status: "ok", data: result });
    } catch (err) {
      console.log(JSON.stringify({
        level: "warn",
        action: "Login failed",
        user: email,
        ip: cleanIp,
        reason: (err as Error).message,
      }));
      next(err);
    }
  },
};
