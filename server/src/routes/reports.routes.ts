import { Router } from "express";
import { achievementExport, auditLogs, completionReport } from "../controllers/reports.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, requireRole("MANAGER", "ADMIN"));
router.get("/achievement-export", achievementExport);
router.get("/completion-report", completionReport);
router.get("/audit-logs/:goalId", auditLogs);
export default router;
