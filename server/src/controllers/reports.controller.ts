import { stringify } from "csv-stringify/sync";
import { prisma } from "../utils/prisma.js";
import { asyncHandler } from "../utils/errors.js";
import { generateAchievementReport } from "../services/excel.service.js";

export const achievementExport = asyncHandler(async (req, res) => {
  const buffer = await generateAchievementReport(req.query.userId as string | undefined, req.query.cycleId as string | undefined);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=achievement-export.xlsx");
  res.send(Buffer.from(buffer));
});

export const completionReport = asyncHandler(async (_req, res) => {
  const sheets = await prisma.goalSheet.findMany({ include: { user: { include: { manager: true } }, goals: { include: { checkIns: true } } } });
  const rows = sheets.map((sheet) => ({
    Employee: sheet.user.name,
    Manager: sheet.user.manager?.name || "",
    "Goals Submitted": Boolean(sheet.submittedAt),
    "Goals Approved": sheet.locked,
    "Q1 Done": sheet.goals.some((goal) => goal.checkIns.some((item) => item.quarter === "Q1")),
    "Q2 Done": sheet.goals.some((goal) => goal.checkIns.some((item) => item.quarter === "Q2")),
    "Q3 Done": sheet.goals.some((goal) => goal.checkIns.some((item) => item.quarter === "Q3")),
    "Q4 Done": sheet.goals.some((goal) => goal.checkIns.some((item) => item.quarter === "Q4"))
  }));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=completion-report.csv");
  res.send(stringify(rows, { header: true }));
});

export const auditLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({ where: { goalId: String(req.params.goalId) }, include: { user: true }, orderBy: { timestamp: "desc" } });
  res.json(logs);
});
