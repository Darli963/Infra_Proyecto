import { Router } from "express";
import { publicController } from "../controllers/public.controller";
import { validate } from "../utils/validate";

const router = Router();

router.get("/motorcycles",      publicController.listMotorcycles);
router.get("/motorcycles/:id",  publicController.getMotorcycle);
router.get("/risk-questions",   publicController.getRiskQuestions);

router.post(
  "/quote/simulate",
  validate({
    motorcycleId:   { required: true },
    applicantName:  { required: true },
    applicantEmail: { required: true, isEmail: true },
    responses:      { required: true },
  }),
  publicController.simulate
);

export default router;
