import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../utils/validate";

const router = Router();

router.post(
  "/dealership/register",
  validate({
    name:     { required: true },
    slug:     { required: true },
    email:    { required: true, isEmail: true },
    password: { required: true, minLength: 8 },
  }),
  authController.register
);

router.post(
  "/dealership/login",
  validate({
    email:    { required: true, isEmail: true },
    password: { required: true },
  }),
  authController.login
);

export default router;
