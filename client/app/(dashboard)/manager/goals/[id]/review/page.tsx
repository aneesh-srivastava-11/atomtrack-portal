"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Goal } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReviewGoalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  useEffect(() => { api.get(`/api/goals/${id}`).then(({ data }) => setGoal(data)); }, [id]);
  if (!goal) return <p>Loading...</p>;

  async function edit(formData: FormData) {
    await api.put(`/api/manager/goals/${id}/edit`, { target: Number(formData.get("target")), weightage: Number(formData.get("weightage")) });
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
      <CardHeader><CardTitle>Review goal</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <h2 className="font-semibold">{goal.title}</h2>
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        </div>
        <form action={edit} className="grid gap-3 md:grid-cols-3">
          <Label>Target<Input name="target" type="number" defaultValue={goal.target} className="mt-2" /></Label>
          <Label>Weightage<Input name="weightage" type="number" defaultValue={goal.weightage} className="mt-2" /></Label>
          <div className="flex items-end"><Button variant="outline" className="w-full">Save inline edit</Button></div>
        </form>
        <div className="flex gap-2">
          <Button onClick={approve}>Approve</Button>
          <Dialog>
            <DialogTrigger asChild><Button variant="destructive">Reject</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Reject goal</DialogTitle></DialogHeader>
              <form action={reject} className="grid gap-3">
                <Label>Comment<Input name="comment" className="mt-2" required /></Label>
                <Button variant="destructive">Reject</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
