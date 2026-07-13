import { Request, Response, NextFunction } from "express";
import { quoteProfileService, QuoteProfileInput } from "../services/quoteProfile.service";

const did = (req: Request) => req.dealership!.sub;

export const quoteProfileController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await quoteProfileService.list(did(req)) }); }
    catch (e) { next(e); }
  },
  async findOne(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await quoteProfileService.findOwned(req.params.id, did(req)) }); }
    catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: "ok", data: await quoteProfileService.create(did(req), req.body as QuoteProfileInput) }); }
    catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await quoteProfileService.update(req.params.id, did(req), req.body as Partial<QuoteProfileInput>) }); }
    catch (e) { next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try { await quoteProfileService.remove(req.params.id, did(req)); res.status(204).send(); }
    catch (e) { next(e); }
  },
};
