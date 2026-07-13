import { Router } from "express";
import { quoteProfileController } from "../controllers/quoteProfile.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate";

const router = Router();
router.use(requireAuth);

router.get("/",      quoteProfileController.list);
router.get("/:id",   quoteProfileController.findOne);
router.post("/",     validate({ name: { required: true }, factor: { required: true } }), quoteProfileController.create);
router.put("/:id",   quoteProfileController.update);
router.delete("/:id",quoteProfileController.remove);

export default router;
