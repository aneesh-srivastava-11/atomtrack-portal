import PDFDocument from "pdfkit";
import { prisma } from "../utils/prisma.js";

export async function generateGoalSheetPDF(goalSheetId: string) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: { user: true, cycle: true, goals: true }
  });
  if (!sheet) throw new Error("Goal sheet not found");

  const doc = new PDFDocument({ margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(18).text(`${sheet.user.name} - ${sheet.cycle.name}`);
  doc.moveDown();
  sheet.goals.forEach((goal, index) => {
    doc.fontSize(12).text(`${index + 1}. ${goal.title} (${goal.weightage}%)`);
    doc.fontSize(10).text(goal.description);
    doc.moveDown(0.6);
  });
  doc.end();

  return new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
}
