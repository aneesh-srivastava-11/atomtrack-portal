import { Router } from "express";
import { createRule, deleteRule, getLogs, listRules, resolveLog, toggleRule, triggerEscalations } from "../controllers/escalation.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));
router.get("/rules", listRules);
router.post("/rules", createRule);
router.put("/rules/:id/toggle", toggleRule);
router.delete("/rules/:id", deleteRule);
router.post("/run", triggerEscalations);
router.get("/logs", getLogs);
router.put("/logs/:id/resolve", resolveLog);
export default router;
