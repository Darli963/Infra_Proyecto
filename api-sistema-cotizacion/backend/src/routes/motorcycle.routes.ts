import { Router } from "express";
import { motorcycleController } from "../controllers/motorcycle.controller";
import { uploadMiddleware, uploadImageHandler } from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate";

const router = Router();
router.use(requireAuth);

const createRules = {
  brand: { required: true }, model:    { required: true },
  year:  { required: true }, engineCC: { required: true },
  price: { required: true }, category: { required: true },
};

// upload-image debe ir ANTES de /:id para no ser capturado por ese patrón
router.post("/upload-image", uploadMiddleware, uploadImageHandler);

router.get("/",       motorcycleController.list);
router.get("/:id",    motorcycleController.findOne);
router.post("/",      validate(createRules), motorcycleController.create);
router.put("/:id",    motorcycleController.update);
router.delete("/:id", motorcycleController.remove);

export default router;
