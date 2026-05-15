"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import type { Goal } from "@/lib/types";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReviewGoalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get(`/api/goals/${id}`).then(({ data }) => setGoal(data)); }, [id]);
  if (!goal) return <p>Loading...</p>;

  async function edit(formData: FormData) {
    setSaving(true);
    await api.put(`/api/manager/goals/${id}/edit`, { target: Number(formData.get("target")), weightage: Number(formData.get("weightage")) });
    const { data } = await api.get(`/api/goals/${id}`);
    setGoal(data);
    setSaving(false);
  }
  async function approve() {
    await api.put(`/api/manager/goals/${id}/approve`);
    router.push("/manager/approvals");
  }
  async function reject(formData: FormData) {
    await api.put(`/api/manager/goals/${id}/reject`, { comment: formData.get("comment") });
    router.push("/manager/approvals");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Review goal</CardTitle>
          <StatusBadge status={goal.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <h2 className="font-semibold">{goal.title}</h2>
          <p className="text-sm text-muted-foreground">{goal.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">{goal.thrustArea} · UoM: {goal.uom}</p>
        </div>

        {goal.isShared && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Share2 className="h-4 w-4 shrink-0" />
            This is a shared departmental KPI. Achievement syncs from the primary owner.
          </div>
        )}

        <form action={edit} className="grid gap-3 md:grid-cols-3">
          <Label>Target<Input name="target" type="number" defaultValue={goal.target} className="mt-2" /></Label>
          <Label>Weightage<Input name="weightage" type="number" defaultValue={goal.weightage} className="mt-2" /></Label>
          <div className="flex items-end"><Button variant="outline" className="w-full" disabled={saving}>{saving ? "Saving..." : "Save inline edit"}</Button></div>
        </form>

        <div className="flex gap-2">
          <Button onClick={approve} disabled={goal.status !== "SUBMITTED"}>Approve</Button>
          <Dialog>
            <DialogTrigger asChild><Button variant="destructive" disabled={goal.status !== "SUBMITTED"}>Return for Rework</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Return goal for rework</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">The goal will revert to draft. Add a comment so the employee knows what to fix.</p>
              <form action={reject} className="grid gap-3">
                <Label>Comment<Input name="comment" className="mt-2" placeholder="e.g. Target too low, increase to 95%" required /></Label>
                <Button variant="destructive">Return for rework</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
