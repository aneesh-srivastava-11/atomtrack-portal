import { z } from "zod";

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export const goalBodySchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(3),
    thrustArea: z.enum(["SALES", "OPERATIONS", "INNOVATION", "CUSTOMER_SUCCESS", "PEOPLE", "FINANCE", "COMPLIANCE", "TECHNOLOGY"]),
    uom: z.enum(["MIN_NUMERIC", "MAX_NUMERIC", "MIN_PERCENTAGE", "MAX_PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
    target: z.coerce.number().positive(),
    weightage: z.coerce.number().int().min(10, "Minimum 10%").max(100),
    isShared: z.boolean().optional(),
    primaryOwnerId: z.string().optional(),
    sharedWith: z.array(z.string()).optional()
  })
});

export const checkInSchema = z.object({
  body: z.object({
    goalId: z.string(),
    quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
    plannedTarget: z.coerce.number().nonnegative(),
    actualAchievement: z.coerce.number().nonnegative().optional(),
    progressStatus: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]).default("NOT_STARTED")
  })
});
