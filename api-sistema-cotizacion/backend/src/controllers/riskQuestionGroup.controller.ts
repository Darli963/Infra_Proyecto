import { Request, Response, NextFunction } from "express";
import { riskQuestionGroupService, RiskQuestionGroupInput } from "../services/riskQuestionGroup.service";
import { RiskQuestionInput } from "../services/riskQuestion.service";

export const riskQuestionGroupController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await riskQuestionGroupService.list() }); }
    catch (e) { next(e); }
  },

  async findOne(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: "ok", data: await riskQuestionGroupService.findOne(req.params.id) }); }
    catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: "ok", data: await riskQuestionGroupService.create(req.body as RiskQuestionGroupInput) }); }
    catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        status: "ok",
        data: await riskQuestionGroupService.update(req.params.id, req.body as RiskQuestionGroupInput),
      });
    } catch (e) { next(e); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await riskQuestionGroupService.remove(req.params.id);
      res.status(204).send();
    } catch (e) { next(e); }
  },

  async addQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await riskQuestionGroupService.addQuestion(req.params.id, req.body);
      res.status(201).json({ status: "ok", data: result });
    } catch (e) { next(e); }
  },
};
