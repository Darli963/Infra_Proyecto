import { Request, Response, NextFunction } from "express";
import { motorcycleService, MotorcycleInput } from "../services/motorcycle.service";

function dealershipId(req: Request): string {
  return req.dealership!.sub;
}

export const motorcycleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, active, page, limit } = req.query as Record<string, string>;
      const result = await motorcycleService.list(dealershipId(req), {
        search,
        category,
        active: active === undefined ? undefined : active === "true",
        page:   page  ? Number(page)  : undefined,
        limit:  limit ? Number(limit) : undefined,
      });
      res.json({ status: "ok", data: result });
    } catch (err) { next(err); }
  },

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const moto = await motorcycleService.findOwned(req.params.id, dealershipId(req));
      res.json({ status: "ok", data: moto });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const moto = await motorcycleService.create(dealershipId(req), req.body as MotorcycleInput);
      res.status(201).json({ status: "ok", data: moto });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const moto = await motorcycleService.update(
        req.params.id, dealershipId(req), req.body as Partial<MotorcycleInput>
      );
      res.json({ status: "ok", data: moto });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await motorcycleService.remove(req.params.id, dealershipId(req));
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
