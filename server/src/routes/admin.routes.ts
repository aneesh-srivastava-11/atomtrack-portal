import { Router } from "express";
import { activateCycle, allAuditLogs, completionDashboard, createCycle, createSharedGoal, lockedGoals, unlockGoal, users } from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));
router.post("/cycles", createCycle);
router.put("/cycles/:id/activate", activateCycle);
router.get("/completion-dashboard", completionDashboard);
router.post("/goals/:id/unlock", unlockGoal);
router.get("/goals/locked", lockedGoals);
router.get("/users", users);
router.post("/shared-goals", createSharedGoal);
router.get("/audit-logs", allAuditLogs);
export default router;
