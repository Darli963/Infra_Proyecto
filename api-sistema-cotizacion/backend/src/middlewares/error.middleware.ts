import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const message = status < 500 ? err.message : "Error interno del servidor";
  if (status >= 500) console.error(err);
  res.status(status).json({ status: "error", message });
}
