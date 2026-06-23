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
    try {
      const result = await authService.login(req.body as Parameters<typeof authService.login>[0]);
      res.status(200).json({ status: "ok", data: result });
    } catch (err) {
      next(err);
    }
  },
};
