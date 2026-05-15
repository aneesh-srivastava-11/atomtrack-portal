"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import type { Goal, User, CheckIn, Quarter } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

const statusColors: Record<string, string> = {
  NOT_STARTED: "text-muted-foreground",
  ON_TRACK: "text-blue-700 dark:text-blue-300",
  COMPLETED: "text-green-700 dark:text-green-300",
};

function computeProgress(uom: string, target: number, actual?: number | null): number {
  if (actual == null) return 0;
  if (uom.startsWith("MIN")) return Math.min(Math.round((actual / target) * 100), 200);
  if (uom.startsWith("MAX")) return actual === 0 ? 100 : Math.min(Math.round((target / actual) * 100), 200);
  if (uom === "ZERO_BASED") return actual === 0 ? 100 : 0;
  return actual <= target ? 100 : 0;
}

interface GoalWithCheckIns extends Goal {
  checkIns: CheckIn[];
}

interface Sheet {
  id: string;
  user: User;
  goals: GoalWithCheckIns[];
  locked: boolean;
}

export default function ManagerCheckInsPage() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [quarter, setQuarter] = useState<Quarter>("Q1");
  const [commentGoalId, setCommentGoalId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    api.get("/api/manager/team-goals").then(({ data }) => setSheets(data));
  }, []);

  async function saveComment(checkInId: string) {
    await api.post("/api/manager/checkin", { checkInId, comment });
    setCommentGoalId(null);
    setComment("");
    // Refresh
    const { data } = await api.get("/api/manager/team-goals");
    setSheets(data);
  }

  // Flatten all goals with check-in data for the selected quarter
  const rows = sheets.flatMap((sheet) =>
    sheet.goals.map((goal) => {
      const checkIn = goal.checkIns?.find((c) => c.quarter === quarter);
      return { ...goal, employee: sheet.user, checkIn };
    })
  ).filter((row) => row.checkIn); // Only show goals that have check-in data

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Team Check-in Reviews</h1>
        <p className="text-sm text-muted-foreground">View planned vs. actual achievement and add discussion comments for each team member.</p>
      </div>

      {/* Quarter selector */}
      <div className="grid grid-cols-4 rounded-lg border bg-card p-2">
        {quarters.map((q) => (
          <button
            key={q}
            onClick={() => setQuarter(q)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${quarter === q ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {q}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            No check-in data for {quarter} yet. Team members will appear here after they submit their quarterly updates.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{quarter} — Planned vs. Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[620px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Planned</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => {
                    const progress = computeProgress(row.uom, row.target, row.checkIn?.actualAchievement);
                    return (
                      <TableRow key={`${row.id}-${quarter}`} className={index % 2 ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium">{row.employee.name}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell className="text-xs">{row.uom}</TableCell>
                        <TableCell className="text-right">{row.target}</TableCell>
                        <TableCell className="text-right">{row.checkIn?.plannedTarget ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">{row.checkIn?.actualAchievement ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress className="w-16" value={Math.min(progress, 100)} />
                            <span className="text-sm font-medium">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${statusColors[row.checkIn?.progressStatus || "NOT_STARTED"]}`}>
                            {row.checkIn?.progressStatus?.replace("_", " ") || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setCommentGoalId(row.checkIn?.id || null); setComment(row.checkIn?.managerComment || ""); }}
                          >
                            <MessageSquare className="h-3 w-3" />
                            {row.checkIn?.managerComment ? "Edit" : "Comment"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comment dialog — inline */}
      {commentGoalId && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">Add Check-in Comment</CardTitle>
            <p className="text-sm text-muted-foreground">Document the discussion points from your check-in meeting.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label>
              Comment
              <Input
                className="mt-2"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Good progress on revenue target. Discussed plan to accelerate Q2 pipeline."
              />
            </Label>
            <div className="flex gap-2">
              <Button onClick={() => saveComment(commentGoalId)} disabled={!comment.trim()}>Save comment</Button>
              <Button variant="outline" onClick={() => setCommentGoalId(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
