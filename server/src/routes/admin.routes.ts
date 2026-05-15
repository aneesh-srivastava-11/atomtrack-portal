import { Router } from "express";
import { activateCycle, completionDashboard, createCycle, unlockGoal, users } from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));
router.post("/cycles", createCycle);
router.put("/cycles/:id/activate", activateCycle);
router.get("/completion-dashboard", completionDashboard);
router.post("/goals/:id/unlock", unlockGoal);
router.get("/users", users);
export default router;
