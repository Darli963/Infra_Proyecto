import { Request, Response, NextFunction } from "express";
import { riskQuestionService, RiskQuestionInput } from "../services/riskQuestion.service";

export const riskQuestionController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await riskQuestionService.list() }); }
    catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: "ok", data: await riskQuestionService.create(req.body as RiskQuestionInput) }); }
    catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await riskQuestionService.update(req.params.id, req.body as Partial<RiskQuestionInput>) }); }
    catch (e) { next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try { await riskQuestionService.remove(req.params.id); res.status(204).send(); }
    catch (e) { next(e); }
  },
};
