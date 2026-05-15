"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Goal, User } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ApprovalsPage() {
  const [sheets, setSheets] = useState<Array<{ id: string; user: User; goals: Goal[] }>>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { api.get("/api/manager/team-goals").then(({ data }) => setSheets(data)); }, []);
  const rows = sheets.flatMap((sheet) => sheet.goals.map((goal) => ({ ...goal, employee: sheet.user }))).filter((goal) => `${goal.employee.name} ${goal.title} ${goal.status}`.toLowerCase().includes(query.toLowerCase()));
  async function approveSelected() {
    await Promise.all(selected.map((id) => api.put(`/api/manager/goals/${id}/approve`)));
  }
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Pending approvals</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Review submitted goals, adjust target or weightage, and approve selected items.</p>
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
            <DialogTrigger asChild><Button disabled={!selected.length}>Approve Selected</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Approve selected goals?</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.length} goal(s) will be marked approved and their goal sheets will be locked.</p>
              <Button onClick={approveSelected}>Approve goals</Button>
            </DialogContent>
          </Dialog>
        </div>
        <div className="max-h-[620px] overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card"><TableRow><TableHead className="w-10"><span className="sr-only">Select</span></TableHead><TableHead>Employee</TableHead><TableHead>Goal Title</TableHead><TableHead>Target</TableHead><TableHead>Weightage</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((goal, index) => (
              <TableRow key={goal.id} className={index % 2 ? "bg-muted/30 hover:bg-muted/60" : "hover:bg-muted/60"}>
                <TableCell><input aria-label={`Select ${goal.title}`} type="checkbox" checked={selected.includes(goal.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, goal.id] : current.filter((id) => id !== goal.id))} /></TableCell>
                <TableCell>{goal.employee.name}</TableCell>
                <TableCell className="font-medium">{goal.title}</TableCell>
                <TableCell><Input className="h-8 w-24 focus:border-amber-500" defaultValue={goal.target} /></TableCell>
                <TableCell><Input className="h-8 w-20 focus:border-amber-500" defaultValue={goal.weightage} /></TableCell>
                <TableCell><StatusBadge status={goal.status} /></TableCell>
                <TableCell className="flex gap-2">
                  <Button asChild variant="outline" size="sm"><Link href={`/manager/goals/${goal.id}/review`}>Review</Link></Button>
                  <Button variant="secondary" size="sm">Reject</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
