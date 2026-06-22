import { Request, Response, NextFunction } from "express";
import { quoteRuleService, QuoteRuleInput } from "../services/quoteRule.service";

const did = (req: Request) => req.dealership!.sub;

export const quoteRuleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await quoteRuleService.list(did(req)) }); }
    catch (e) { next(e); }
  },
  async findOne(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await quoteRuleService.findOwned(req.params.id, did(req)) }); }
    catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: "ok", data: await quoteRuleService.create(did(req), req.body as QuoteRuleInput) }); }
    catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await quoteRuleService.update(req.params.id, did(req), req.body as Partial<QuoteRuleInput>) }); }
    catch (e) { next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try { await quoteRuleService.remove(req.params.id, did(req)); res.status(204).send(); }
    catch (e) { next(e); }
  },
};
