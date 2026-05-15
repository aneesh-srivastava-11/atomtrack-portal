import { Router } from "express";
import { getGoalCheckIns, updateCheckIn, upsertCheckIn } from "../controllers/checkins.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { checkInSchema } from "../schemas/common.js";

const router = Router();
router.use(authenticate);
router.post("/", requireRole("EMPLOYEE"), validate(checkInSchema), upsertCheckIn);
router.get("/goal/:goalId", getGoalCheckIns);
router.put("/:id", requireRole("EMPLOYEE"), updateCheckIn);
export default router;
