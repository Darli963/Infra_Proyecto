import { Router, Request, Response } from "express";

const router = Router();

router.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "api-sistema-cotizacion" });
});

export default router;
