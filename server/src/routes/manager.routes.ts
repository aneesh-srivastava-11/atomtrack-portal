import { Router } from "express";
import { addManagerCheckInComment, approveGoal, managerEditGoal, rejectGoal, teamGoals } from "../controllers/manager.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, requireRole("MANAGER", "ADMIN"));
router.get("/team-goals", teamGoals);
router.put("/goals/:id/approve", approveGoal);
router.put("/goals/:id/reject", rejectGoal);
router.put("/goals/:id/edit", managerEditGoal);
router.post("/checkin", addManagerCheckInComment);
export default router;
