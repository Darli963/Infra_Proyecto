import { Router } from "express";
import { quoteRuleController } from "../controllers/quoteRule.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate";

const router = Router();
router.use(requireAuth);

router.get("/",      quoteRuleController.list);
router.get("/:id",   quoteRuleController.findOne);
router.post("/",     validate({ name: { required: true }, factor: { required: true } }), quoteRuleController.create);
router.put("/:id",   quoteRuleController.update);
router.delete("/:id",quoteRuleController.remove);

export default router;
