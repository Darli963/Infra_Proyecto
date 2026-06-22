import { Router } from "express";
import { riskQuestionController } from "../controllers/riskQuestion.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate";

const router = Router();
router.use(requireAuth);

router.get("/",      riskQuestionController.list);
router.post("/",     validate({ text: { required: true } }), riskQuestionController.create);
router.put("/:id",   riskQuestionController.update);
router.delete("/:id",riskQuestionController.remove);

export default router;
