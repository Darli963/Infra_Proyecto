import { Request, Response, NextFunction } from "express";
import { authProvider, AuthTokenPayload } from "../config/auth.provider";

// Extiende Request para que los controladores accedan a req.dealership
declare global {
  namespace Express {
    interface Request {
      dealership?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ status: "error", message: "Token requerido" });
    return;
  }

  void authProvider.verifyToken(header.slice(7))
    .then((payload) => {
      req.dealership = payload;
      next();
    })
    .catch(() => {
      res.status(401).json({ status: "error", message: "Token inválido o expirado" });
    });
}
