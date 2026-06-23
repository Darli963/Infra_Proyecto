import { Request, Response, NextFunction } from "express";
import { publicService, quoteEngine, SimulateInput } from "../services/quote.service";

export const publicController = {
  async listMotorcycles(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, page, limit } = req.query as Record<string, string>;
      const result = await publicService.listMotorcycles({
        search, category,
        page:  page  ? Number(page)  : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json({ status: "ok", data: result });
    } catch (err) { next(err); }
  },

  async getMotorcycle(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ status: "ok", data: await publicService.getMotorcycle(req.params.id) });
    } catch (err) { next(err); }
  },

  async getRiskQuestions(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ status: "ok", data: await publicService.getRiskQuestions() });
    } catch (err) { next(err); }
  },

  async simulate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quoteEngine.simulate(req.body as SimulateInput);
      res.status(201).json({ status: "ok", data: result });
    } catch (err) { next(err); }
  },
};
