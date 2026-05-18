"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Edit, Plus, Send, Share2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useGoalStore } from "@/stores/goalStore";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function computeProgress(uom: string, target: number, actual?: number | null): number {
  if (actual == null) return 0;
  if (uom.startsWith("MIN")) return Math.min(Math.round((actual / target) * 100), 200);
  if (uom.startsWith("MAX")) return actual === 0 ? 100 : Math.min(Math.round((target / actual) * 100), 200);
  if (uom === "ZERO_BASED") return actual === 0 ? 100 : 0;
  return actual <= target ? 100 : 0;
}

export default function EmployeeDashboard() {
  const { goals, totalWeightage, setGoals, removeGoal } = useGoalStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/goals")
      .then(({ data }) => { setGoals(data); setLoading(false); })
      .catch(() => { setGoals([]); setLoading(false); });
  }, [setGoals]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    await api.delete(`/api/goals/${id}`);
    removeGoal(id);
  }

  async function submit() {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/goals/submit");
      const { data } = await api.get("/api/goals");
      setGoals(data);
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(err.response?.data?.error?.message || "Submission failed. Check that total weightage = 100%.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasDrafts = goals.some((g) => g.status === "DRAFT");
  const hasRejections = goals.some((g) => g.rejectionComment);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Goals</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">Create up to 8 goals, assign 100% total weightage, then submit them for manager review.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" disabled={goals.length >= 8}><Link href="/employee/goals/create"><Plus className="h-4 w-4" />Create Goal</Link></Button>
          <Button disabled={totalWeightage !== 100 || !hasDrafts || isSubmitting} onClick={submit} title={totalWeightage === 100 ? "Submit for manager review" : "Total weightage must equal 100%"}>
            <Send className="h-4 w-4" />{isSubmitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>
      </div>

      {hasRejections && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            One or more goals were returned for rework or unlocked by Admin. Review the comments below, make changes, and re-submit.
          </span>
        </Alert>
      )}

      {submitError && (
        <Alert className="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {submitError}
          </span>
        </Alert>
      )}
      <Card>
        <CardContent className="grid gap-3 p-5">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Weightage assigned</p>
                  <p className="text-xs text-muted-foreground">Submit is available only at exactly 100%.</p>
                </div>
                <p className="text-3xl font-semibold">{totalWeightage}<span className="text-base text-muted-foreground">/100</span></p>
              </div>
              <Progress value={Math.min(totalWeightage, 100)} />
              {totalWeightage !== 100 && <Alert>Total must equal 100% before you submit for approval.</Alert>}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </>
        ) : (
          <>
            {goals.map((goal) => (
              <Card key={goal.id} className={goal.rejectionComment ? "border-amber-300 dark:border-amber-700" : ""}>
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <CardTitle>{goal.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{goal.thrustArea} | Target {goal.target} | {goal.weightage}%</p>
                  </div>
                  <StatusBadge status={goal.status} />
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm leading-relaxed">{goal.description}</p>

                  {/* Rejection comment from manager */}
                  {goal.rejectionComment && (
                    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                      <p className="mb-1 font-medium text-amber-800 dark:text-amber-300">Feedback / Reason:</p>
                      <p className="text-amber-700 dark:text-amber-400">{goal.rejectionComment}</p>
                    </div>
                  )}

                  {(goal.status === "APPROVED" || goal.status === "LOCKED") && (
                    <div className="mb-4">
                      {(() => {
                        const latestCheckIn = goal.checkIns?.sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
                        const progress = computeProgress(goal.uom, goal.target, latestCheckIn?.actualAchievement);
                        return (
                          <>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Current Progress</span>
                              <span className="font-medium text-green-600 dark:text-green-400">{progress}%</span>
                            </div>
                            <Progress className="h-2" value={Math.min(progress, 100)} />
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {goal.status === "DRAFT" ? (
                      <Button asChild size="icon" variant="outline"><Link href={`/employee/goals/${goal.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                    ) : (
                      <Button size="icon" variant="outline" disabled><Edit className="h-4 w-4" /></Button>
                    )}
                    <Button size="icon" variant="destructive" disabled={goal.status !== "DRAFT"} onClick={() => deleteGoal(goal.id)}><Trash2 className="h-4 w-4" /></Button>
                    {goal.isShared && (
                      <span className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                        <Share2 className="h-3 w-3" />Shared — weightage only
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!goals.length && <Card className="lg:col-span-2"><CardContent className="p-8 text-center text-sm text-muted-foreground">No goals yet. Create your first quarterly goal to begin.</CardContent></Card>}
          </>
        )}
      </div>
    </section>
  );
}
