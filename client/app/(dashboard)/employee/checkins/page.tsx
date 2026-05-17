"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import type { Goal, Quarter, CheckIn } from "@/lib/types";
import { api } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  COMPLETED: "Completed",
};

/**
 * Client-side progress score calculation matching the spec:
 * - MIN (Numeric/%): Achievement ÷ Target (higher is better)
 * - MAX (Numeric/%): Target ÷ Achievement (lower is better)
 * - TIMELINE: Completion date vs. Deadline (simplified: on-time = 100%)
 * - ZERO: If 0 → 100%, else 0%
 */
function computeProgress(uom: string, target: number, actual?: number | null): number {
  if (actual == null) return 0;
  if (uom.startsWith("MIN")) return Math.min(Math.round((actual / target) * 100), 200);
  if (uom.startsWith("MAX")) return actual === 0 ? 100 : Math.min(Math.round((target / actual) * 100), 200);
  if (uom === "ZERO_BASED") return actual === 0 ? 100 : 0;
  // TIMELINE — simplified
  return actual <= target ? 100 : 0;
}

export default function CheckInsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [quarter, setQuarter] = useState<Quarter>("Q1");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/goals").then(({ data }) => setGoals(data));
  }, []);

  // Get existing check-in data for a goal + quarter
  function getCheckIn(goal: Goal, q: Quarter): CheckIn | undefined {
    return goal.checkIns?.find((c) => c.quarter === q);
  }

  async function save(goalId: string, formData: FormData) {
    setSaving(goalId);
    setSaved(null);
    setError("");
    try {
      await api.post("/api/checkins", {
        goalId,
        quarter,
        plannedTarget: Number(formData.get("plannedTarget")),
        actualAchievement: Number(formData.get("actualAchievement")),
        progressStatus: formData.get("progressStatus"),
      });
      // Refresh goals to get updated check-in data
      const { data } = await api.get("/api/goals");
      setGoals(data);
      setSaved(goalId);
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      setError(err?.response?.data?.error?.message || "Failed to save check-in. The quarterly window may be closed.");
    } finally {
      setSaving(null);
    }
  }

  const approvedGoals = goals.filter((g) => g.status === "APPROVED" || g.status === "LOCKED");

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Quarterly Check-ins</h1>
        <p className="text-sm text-muted-foreground">Update planned and actual achievement for each approved goal.</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </Alert>
      )}

      {/* Quarter selector */}
      <div className="grid grid-cols-4 rounded-lg border bg-card p-2">
        {quarters.map((q) => (
          <button
            key={q}
            onClick={() => { setQuarter(q); setSaved(null); setError(""); }}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${quarter === q ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {quarter === q && <CheckCircle2 className="h-4 w-4" />}
            {q}
          </button>
        ))}
      </div>

      {approvedGoals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            No approved goals found. Submit your goals and wait for manager approval before logging check-ins.
          </CardContent>
        </Card>
      )}

      {/* Goal check-in cards */}
      <div className="grid gap-3">
        {approvedGoals.map((goal) => {
          const existing = getCheckIn(goal, quarter);
          const progress = computeProgress(goal.uom, goal.target, existing?.actualAchievement);

          return (
            <Card key={goal.id} className={saved === goal.id ? "border-green-300 dark:border-green-700" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{goal.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {goal.thrustArea} · UoM: {goal.uom} · Target: {goal.target} · Weight: {goal.weightage}%
                    </p>
                  </div>
                  {existing && (
                    <div className="text-right">
                      <p className="text-2xl font-semibold">{progress}%</p>
                      <p className="text-xs text-muted-foreground">progress</p>
                    </div>
                  )}
                </div>
                {existing && <Progress className="mt-3" value={Math.min(progress, 100)} />}
              </CardHeader>
              <CardContent>
                <form action={(data) => save(goal.id, data)} className="grid gap-3 md:grid-cols-4">
                  <Label>
                    Planned Target
                    <Input
                      name="plannedTarget"
                      type="number"
                      step="0.01"
                      defaultValue={existing?.plannedTarget ?? goal.target}
                      className="mt-2"
                    />
                  </Label>
                  <Label>
                    Actual Achievement
                    <Input
                      name="actualAchievement"
                      type="number"
                      step="0.01"
                      defaultValue={existing?.actualAchievement ?? ""}
                      className="mt-2"
                      placeholder="Enter actual"
                    />
                  </Label>
                  <Label>
                    Status
                    <select name="progressStatus" defaultValue={existing?.progressStatus || "NOT_STARTED"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2">
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="ON_TRACK">On Track</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </Label>
                  <div className="flex items-end">
                    <Button className="w-full" disabled={saving === goal.id}>
                      {saving === goal.id ? "Saving..." : <><Save className="h-4 w-4" />Save</>}
                    </Button>
                  </div>
                </form>

                {/* Show existing check-in summary */}
                {existing && (
                  <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Last saved: {statusLabels[existing.progressStatus]}</p>
                    <p className="text-muted-foreground">Planned: {existing.plannedTarget} · Actual: {existing.actualAchievement ?? "—"}</p>
                  </div>
                )}

                {/* Manager comment */}
                {existing?.managerComment && (
                  <blockquote className="mt-3 border-l-4 border-primary/40 pl-3 text-sm">
                    <p className="font-medium text-primary">Manager feedback:</p>
                    <p className="text-muted-foreground">{existing.managerComment}</p>
                  </blockquote>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
