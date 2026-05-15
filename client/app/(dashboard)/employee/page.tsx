"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Edit, Plus, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useGoalStore } from "@/stores/goalStore";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function EmployeeDashboard() {
  const { goals, totalWeightage, setGoals, removeGoal } = useGoalStore();
  useEffect(() => {
    api.get("/api/goals").then(({ data }) => setGoals(data)).catch(() => setGoals([]));
  }, [setGoals]);

  async function deleteGoal(id: string) {
    await api.delete(`/api/goals/${id}`);
    removeGoal(id);
  }

  async function submit() {
    await api.post("/api/goals/submit");
    const { data } = await api.get("/api/goals");
    setGoals(data);
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Goals - Q2 2025</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">Create up to 8 goals, assign 100% total weightage, then submit them for manager review.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" disabled={goals.length >= 8}><Link href="/employee/goals/create"><Plus className="h-4 w-4" />Create Goal</Link></Button>
          <Button disabled={totalWeightage !== 100} onClick={submit} title={totalWeightage === 100 ? "Submit for manager review" : "Total weightage must equal 100%"}>
            <Send className="h-4 w-4" />Submit for Approval
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="grid gap-3 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weightage assigned</p>
              <p className="text-xs text-muted-foreground">Submit is available only at exactly 100%.</p>
            </div>
            <p className="text-3xl font-semibold">{totalWeightage}<span className="text-base text-muted-foreground">/100</span></p>
          </div>
          <Progress value={Math.min(totalWeightage, 100)} />
          {totalWeightage !== 100 && <Alert>Total must equal 100% before you submit for approval.</Alert>}
        </CardContent>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>{goal.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{goal.thrustArea} | Target {goal.target} | {goal.weightage}%</p>
              </div>
              <StatusBadge status={goal.status} />
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-relaxed">{goal.description}</p>
              <div className="flex gap-2">
                <Button asChild size="icon" variant="outline" disabled={goal.status !== "DRAFT"}><Link href={`/employee/goals/${goal.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                <Button size="icon" variant="destructive" disabled={goal.status !== "DRAFT"} onClick={() => deleteGoal(goal.id)}><Trash2 className="h-4 w-4" /></Button>
                {goal.isShared && <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">Read-only target</span>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!goals.length && <Card><CardContent className="p-8 text-sm text-muted-foreground">No goals yet. Create your first quarterly goal to begin.</CardContent></Card>}
      </div>
    </section>
  );
}
