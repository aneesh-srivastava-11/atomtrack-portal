import { prisma } from "../utils/prisma.js";
import { sendNotification } from "./email.service.js";

/**
 * Run all active escalation rules and fire notifications for violations.
 * Called manually by admin via API or could be wired to a cron job.
 */
export async function runEscalations() {
  const rules = await prisma.escalationRule.findMany({ where: { active: true } });
  const activeCycle = await prisma.cycle.findFirst({ where: { active: true } });
  if (!activeCycle) return { fired: 0, message: "No active cycle" };

  const now = new Date();
  let totalFired = 0;

  for (const rule of rules) {
    const threshold = new Date(now.getTime() - rule.thresholdDays * 24 * 60 * 60 * 1000);

    if (rule.triggerType === "GOAL_NOT_SUBMITTED") {
      // Employees who haven't submitted goals N days after cycle start
      const employees = await prisma.user.findMany({
        where: {
          role: "EMPLOYEE",
          goalSheets: { none: { cycleId: activeCycle.id, submittedAt: { not: null } } }
        },
        include: { manager: true }
      });

      if (activeCycle.startDate < threshold) {
        for (const emp of employees) {
          const alreadyFired = await prisma.escalationLog.findFirst({
            where: { ruleId: rule.id, userId: emp.id, status: "PENDING" }
          });
          if (alreadyFired) continue;

          await prisma.escalationLog.create({
            data: {
              ruleId: rule.id,
              userId: emp.id,
              level: 1,
              message: `${emp.name} has not submitted goals (${rule.thresholdDays} days overdue)`
            }
          });

          await sendNotification(
            emp.email,
            "Action Required: Submit Your Goals",
            `Hi ${emp.name}, your goals for ${activeCycle.name} are overdue. Please submit them as soon as possible.`
          );

          totalFired++;
        }
      }
    }

    if (rule.triggerType === "GOAL_NOT_APPROVED") {
      // Sheets submitted but not approved N days after submission
      const sheets = await prisma.goalSheet.findMany({
        where: {
          cycleId: activeCycle.id,
          submittedAt: { not: null, lt: threshold },
          locked: false
        },
        include: { user: { include: { manager: true } } }
      });

      for (const sheet of sheets) {
        const manager = sheet.user.manager;
        if (!manager) continue;

        const alreadyFired = await prisma.escalationLog.findFirst({
          where: { ruleId: rule.id, userId: manager.id, status: "PENDING" }
        });
        if (alreadyFired) continue;

        await prisma.escalationLog.create({
          data: {
            ruleId: rule.id,
            userId: manager.id,
            level: 2,
            message: `${manager.name} has not approved ${sheet.user.name}'s goals (${rule.thresholdDays} days overdue)`
          }
        });

        await sendNotification(
          manager.email,
          "Action Required: Approve Pending Goals",
          `Hi ${manager.name}, ${sheet.user.name}'s goals are awaiting your review for ${rule.thresholdDays}+ days.`
        );

        totalFired++;
      }
    }

    if (rule.triggerType === "CHECKIN_MISSING") {
      // Employees with approved goals but no check-in for the current open quarter
      const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
      const currentQuarter = quarters.find((q) => {
        const windowKey = `${q.toLowerCase()}Window` as keyof typeof activeCycle;
        return now <= new Date(activeCycle[windowKey] as string);
      });
      if (!currentQuarter) continue;

      const employees = await prisma.user.findMany({
        where: {
          role: "EMPLOYEE",
          goals: {
            some: { status: { in: ["APPROVED", "LOCKED"] } }
          }
        },
        include: {
          goals: {
            where: { status: { in: ["APPROVED", "LOCKED"] } },
            include: { checkIns: { where: { quarter: currentQuarter } } }
          }
        }
      });

      for (const emp of employees) {
        const hasMissing = emp.goals.some((g) => g.checkIns.length === 0);
        if (!hasMissing) continue;

        const alreadyFired = await prisma.escalationLog.findFirst({
          where: { ruleId: rule.id, userId: emp.id, status: "PENDING" }
        });
        if (alreadyFired) continue;

        await prisma.escalationLog.create({
          data: {
            ruleId: rule.id,
            userId: emp.id,
            level: 1,
            message: `${emp.name} has not completed ${currentQuarter} check-in`
          }
        });

        await sendNotification(
          emp.email,
          `Reminder: Complete Your ${currentQuarter} Check-in`,
          `Hi ${emp.name}, please log your ${currentQuarter} quarterly achievement before the window closes.`
        );

        totalFired++;
      }
    }
  }

  return { fired: totalFired, rulesProcessed: rules.length };
}
