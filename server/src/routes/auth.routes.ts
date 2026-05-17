import { Router } from "express";
import { z } from "zod";
import { login, logout, me, register, azureLogin, azureCallback } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";

const router = Router();
const authSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8) }) });
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
    managerId: z.string().optional()
  })
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(authSchema), login);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

// Azure AD OAuth2 Routes
router.get("/azure/login", azureLogin);
router.get("/azure/callback", azureCallback);

export default router;
