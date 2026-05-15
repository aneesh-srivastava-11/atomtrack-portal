import ExcelJS from "exceljs";
import { prisma } from "../utils/prisma.js";
import { calculateProgress } from "./goal.service.js";

export async function generateAchievementReport(userId?: string, cycleId?: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Achievement");
  sheet.columns = [
    { header: "Employee", key: "employee", width: 24 },
    { header: "Goal", key: "goal", width: 32 },
    { header: "Target", key: "target", width: 12 },
    { header: "Q1 Actual", key: "q1", width: 14 },
    { header: "Q2 Actual", key: "q2", width: 14 },
    { header: "Q3 Actual", key: "q3", width: 14 },
    { header: "Q4 Actual", key: "q4", width: 14 },
    { header: "Final Score", key: "score", width: 14 }
  ];

  const goals = await prisma.goal.findMany({
    where: { userId, goalSheet: { cycleId } },
    include: { user: true, checkIns: true }
  });

  goals.forEach((goal) => {
    const byQuarter = Object.fromEntries(goal.checkIns.map((item) => [item.quarter, item]));
    const latest = goal.checkIns.at(-1);
    sheet.addRow({
      employee: goal.user.name,
      goal: goal.title,
      target: goal.target,
      q1: byQuarter.Q1?.actualAchievement ?? "",
      q2: byQuarter.Q2?.actualAchievement ?? "",
      q3: byQuarter.Q3?.actualAchievement ?? "",
      q4: byQuarter.Q4?.actualAchievement ?? "",
      score: calculateProgress(goal.uom, goal.target, latest?.actualAchievement)
    });
  });

  return workbook.xlsx.writeBuffer();
}
