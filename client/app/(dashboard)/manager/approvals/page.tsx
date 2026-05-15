"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Goal, User } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ApprovalsPage() {
  const [sheets, setSheets] = useState<Array<{ id: string; user: User; goals: Goal[] }>>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectGoalId, setRejectGoalId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [editedValues, setEditedValues] = useState<Record<string, { target?: number; weightage?: number }>>({});

  const fetchSheets = useCallback(() => {
    api.get("/api/manager/team-goals").then(({ data }) => setSheets(data));
  }, []);

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  const rows = sheets
    .flatMap((sheet) => sheet.goals.map((goal) => ({ ...goal, employee: sheet.user })))
    .filter((goal) => `${goal.employee.name} ${goal.title} ${goal.status}`.toLowerCase().includes(query.toLowerCase()));

  async function approveSelected() {
    await Promise.all(selected.map((id) => api.put(`/api/manager/goals/${id}/approve`)));
    setSelected([]);
    fetchSheets();
  }

  async function saveInlineEdit(goalId: string) {
    const edits = editedValues[goalId];
    if (!edits) return;
    await api.put(`/api/manager/goals/${goalId}/edit`, edits);
    setEditedValues((prev) => { const next = { ...prev }; delete next[goalId]; return next; });
    fetchSheets();
  }

  async function rejectGoal() {
    if (!rejectGoalId) return;
    await api.put(`/api/manager/goals/${rejectGoalId}/reject`, { comment: rejectComment });
    setRejectGoalId(null);
    setRejectComment("");
    fetchSheets();
  }

  function handleFieldChange(goalId: string, field: "target" | "weightage", value: string) {
    setEditedValues((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: Number(value) }
    }));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Pending approvals</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Review submitted goals, adjust target or weightage inline, and approve or return for rework.</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4" />Export CSV</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Filter by employee, goal, or status" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Dialog>
            <DialogTrigger asChild><Button disabled={!selected.length}>Approve Selected ({selected.length})</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Approve selected goals?</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.length} goal(s) will be marked approved. The goal sheet will lock once all goals on a sheet are approved.</p>
              <Button onClick={approveSelected}>Approve goals</Button>
            </DialogContent>
          </Dialog>
        </div>
        <div className="max-h-[620px] overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="w-10"><span className="sr-only">Select</span></TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Goal Title</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Weightage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((goal, index) => {
              const isEdited = !!editedValues[goal.id];
              return (
                <TableRow key={goal.id} className={index % 2 ? "bg-muted/30 hover:bg-muted/60" : "hover:bg-muted/60"}>
                  <TableCell>
                    <input
                      aria-label={`Select ${goal.title}`}
                      type="checkbox"
                      checked={selected.includes(goal.id)}
                      onChange={(event) => setSelected((current) => event.target.checked ? [...current, goal.id] : current.filter((id) => id !== goal.id))}
                    />
                  </TableCell>
                  <TableCell>{goal.employee.name}</TableCell>
                  <TableCell className="font-medium">{goal.title}</TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-24 focus:border-amber-500"
                      type="number"
                      defaultValue={goal.target}
                      onChange={(e) => handleFieldChange(goal.id, "target", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-20 focus:border-amber-500"
                      type="number"
                      defaultValue={goal.weightage}
                      onChange={(e) => handleFieldChange(goal.id, "weightage", e.target.value)}
                    />
                  </TableCell>
                  <TableCell><StatusBadge status={goal.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {isEdited && (
                        <Button variant="outline" size="sm" onClick={() => saveInlineEdit(goal.id)}>Save</Button>
                      )}
                      <Button asChild variant="outline" size="sm"><Link href={`/manager/goals/${goal.id}/review`}>Review</Link></Button>
                      <Button variant="secondary" size="sm" onClick={() => { setRejectGoalId(goal.id); setRejectComment(""); }}>Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>

        {/* Reject dialog */}
        <Dialog open={!!rejectGoalId} onOpenChange={(open) => { if (!open) setRejectGoalId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Return goal for rework</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">The goal will be returned to draft status. The employee will see your comment and can edit and re-submit.</p>
            <div className="grid gap-3">
              <Label>Comment<Input className="mt-2" placeholder="Describe what needs to change" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} required /></Label>
              <Button variant="destructive" disabled={!rejectComment.trim()} onClick={rejectGoal}>Return for rework</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
