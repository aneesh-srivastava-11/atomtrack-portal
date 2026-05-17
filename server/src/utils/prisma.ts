import { PrismaClient } from "@prisma/client";
import { requestContext } from "./async-storage.js";

// Serverless-safe singleton: reuse the PrismaClient across warm function invocations
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };
const basePrisma = globalForPrisma.__prisma || new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = basePrisma;

export const prisma = basePrisma.$extends({
  query: {
    goal: {
      async update({ args, query }) {
        const context = requestContext.getStore();
        if (!context?.userId) return query(args);

        // Fetch old goal
        const oldGoal = await basePrisma.goal.findUnique({ where: args.where });
        if (!oldGoal) return query(args);

        // Perform the update
        const newGoal = await query(args);

        // Find diff
        const oldVals: Record<string, any> = {};
        const newVals: Record<string, any> = {};
        let hasChanges = false;

        const fieldsToTrack = ["title", "description", "thrustArea", "uom", "target", "weightage", "status", "rejectionComment"];
        
        for (const key of fieldsToTrack) {
           // We check if it was provided in the update, but actually it's better to just check if it changed
           if (oldGoal[key as keyof typeof oldGoal] !== newGoal[key as keyof typeof newGoal]) {
               oldVals[key] = oldGoal[key as keyof typeof oldGoal];
               newVals[key] = newGoal[key as keyof typeof newGoal];
               hasChanges = true;
           }
        }

        if (hasChanges) {
           await basePrisma.auditLog.create({
             data: {
               goalId: newGoal.id,
               userId: context.userId,
               action: "GOAL_UPDATED",
               oldValue: oldVals,
               newValue: newVals
             }
           });
        }

        return newGoal;
      }
    }
  }
});
