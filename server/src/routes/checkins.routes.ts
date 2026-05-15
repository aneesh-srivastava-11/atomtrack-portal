import { Router } from "express";
import { getGoalCheckIns, updateCheckIn, upsertCheckIn } from "../controllers/checkins.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { checkInSchema } from "../schemas/common.js";

const router = Router();
router.use(authenticate);
router.post("/", validate(checkInSchema), upsertCheckIn);
router.get("/goal/:goalId", getGoalCheckIns);
router.put("/:id", updateCheckIn);
export default router;
