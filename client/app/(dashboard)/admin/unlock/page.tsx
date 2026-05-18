"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LockedGoal {
  id: string;
  title: string;
  target: number;
  weightage: number;
  status: string;
  user: { name: string; email: string };
}

export default function UnlockPage() {
  const [goals, setGoals] = useState<LockedGoal[]>([]);
  const [unlockGoalId, setUnlockGoalId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function fetchData() {
    api.get("/api/admin/goals/locked").then(({ data }) => setGoals(data));
  }

  useEffect(() => { fetchData(); }, []);

  const [error, setError] = useState("");

  async function handleUnlock() {
    if (!unlockGoalId) return;
    setError("");
    try {
      await api.post(`/api/admin/goals/${unlockGoalId}/unlock`, { reason });
      setUnlockGoalId(null);
      setReason("");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to unlock goal");
    }
  }

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Lock className="h-6 w-6 text-primary" />
          Goal Unlock Controls
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlock approved goals for exceptions. All unlock actions are recorded in the audit trail.
        </p>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No locked / approved goals found. Goals become locked after manager approval.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Approved / Locked Goals ({goals.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Weightage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal, index) => (
                  <TableRow key={goal.id} className={index % 2 ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium">{goal.user.name}</TableCell>
                    <TableCell>{goal.title}</TableCell>
                    <TableCell>{goal.target}</TableCell>
                    <TableCell>{goal.weightage}%</TableCell>
                    <TableCell className="text-green-700 dark:text-green-300">{goal.status}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => { setUnlockGoalId(goal.id); setReason(""); }}>
                        <Unlock className="h-3 w-3" />Unlock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Unlock dialog */}
      <Dialog open={!!unlockGoalId} onOpenChange={(open) => { if (!open) setUnlockGoalId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Unlock goal for editing</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will reset the goal to DRAFT and unlock the sheet. The employee will be able to edit it again. This action is logged in the audit trail.
          </p>
          <div className="grid gap-3">
            <Label>
              Reason for unlock
              <Input className="mt-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Employee requested target revision after org restructuring" required />
            </Label>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button variant="destructive" disabled={!reason.trim()} onClick={handleUnlock}>
              <Unlock className="h-4 w-4" />Confirm unlock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
