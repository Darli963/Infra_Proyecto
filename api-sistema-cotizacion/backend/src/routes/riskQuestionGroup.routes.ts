import { Router } from "express";
import { riskQuestionGroupController } from "../controllers/riskQuestionGroup.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate";

const router = Router();
router.use(requireAuth);

router.get("/",       riskQuestionGroupController.list);
router.get("/:id",    riskQuestionGroupController.findOne);
router.post("/",      validate({ name: { required: true } }), riskQuestionGroupController.create);
router.post("/:id/questions", validate({ text: { required: true } }), riskQuestionGroupController.addQuestion);

export default router;
