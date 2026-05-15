import { Router } from "express";
import { createGoal, deleteGoal, getGoal, getGoals, submitGoals, updateGoal } from "../controllers/goals.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { auditLockedGoal } from "../middleware/audit.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { goalBodySchema } from "../schemas/common.js";

const router = Router();
router.use(authenticate, requireRole("EMPLOYEE", "MANAGER", "ADMIN"));
router.post("/", validate(goalBodySchema), createGoal);
router.get("/", getGoals);
router.get("/:id", getGoal);
router.put("/:id", auditLockedGoal, validate(goalBodySchema), updateGoal);
router.post("/submit", submitGoals);
router.delete("/:id", deleteGoal);
export default router;
