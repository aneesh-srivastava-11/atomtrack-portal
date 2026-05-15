import { Router } from "express";
import { distribution, heatmap, managerEffectiveness, qoqTrends } from "../controllers/analytics.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));
router.get("/qoq", qoqTrends);
router.get("/heatmap", heatmap);
router.get("/distribution", distribution);
router.get("/manager-effectiveness", managerEffectiveness);
export default router;
