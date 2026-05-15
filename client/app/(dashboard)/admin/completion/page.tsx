"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const departments = [
  { name: "Sales", submitted: 31, employees: 36, checkins: 72 },
  { name: "Operations", submitted: 22, employees: 31, checkins: 61 },
  { name: "Technology", submitted: 28, employees: 30, checkins: 83 },
  { name: "Finance", submitted: 6, employees: 10, checkins: 48 }
];

const managers = [
  { name: "Meera Rao", team: "Sales", completion: 86 },
  { name: "Arjun Menon", team: "Operations", completion: 64 },
  { name: "Kavya Shah", team: "Technology", completion: 93 },
  { name: "Nikhil Sen", team: "Finance", completion: 42 }
];

function rateClass(value: number) {
  if (value < 50) return "text-red-700 dark:text-red-300";
  if (value < 80) return "text-amber-700 dark:text-amber-300";
  return "text-green-700 dark:text-green-300";
}

export default function AdminCompletionPage() {
  const [stats, setStats] = useState({ employees: 120, goalsSubmittedPercent: 73, goalsApprovedPercent: 54 });
  useEffect(() => { api.get("/api/admin/completion-dashboard").then(({ data }) => setStats((current) => ({ ...current, ...data }))).catch(() => null); }, []);
  const submitted = Math.round((stats.goalsSubmittedPercent / 100) * stats.employees);
  const pendingApprovals = Math.max(submitted - Math.round((stats.goalsApprovedPercent / 100) * stats.employees), 0);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Completion Dashboard</h1>
          <p className="text-sm text-muted-foreground">View organization progress for goal submission, approvals, and Q2 check-ins.</p>
        </div>
        <Button><Download className="h-4 w-4" />Download Achievement Report</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Goals Submitted</CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold">{submitted}/{stats.employees}</p><p className="mt-1 text-sm text-muted-foreground">employees</p><Progress className="mt-4" value={stats.goalsSubmittedPercent} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold text-amber-700 dark:text-amber-300">{pendingApprovals}</p><p className="mt-1 text-sm text-muted-foreground">goal sheets need review</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Q2 Check-ins Complete</CardTitle></CardHeader><CardContent><p className={`text-4xl font-semibold ${rateClass(65)}`}>65%</p><p className="mt-1 text-sm text-muted-foreground">current quarter</p><Progress className="mt-4" value={65} /></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Department breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Goals Submitted</TableHead><TableHead>Completion</TableHead><TableHead>Q2 Check-ins</TableHead></TableRow></TableHeader>
            <TableBody>
              {departments.map((department, index) => {
                const completion = Math.round((department.submitted / department.employees) * 100);
                return <TableRow key={department.name} className={index % 2 ? "bg-muted/30" : ""}><TableCell className="font-medium">{department.name}</TableCell><TableCell>{department.submitted}/{department.employees}</TableCell><TableCell className={rateClass(completion)}>{completion}%</TableCell><TableCell className={rateClass(department.checkins)}>{department.checkins}%</TableCell></TableRow>;
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Manager completion heatmap</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {managers.map((manager) => (
            <div key={manager.name} className="rounded-md border p-3">
              <p className="font-medium">{manager.name}</p>
              <p className="text-xs text-muted-foreground">{manager.team}</p>
              <p className={`mt-3 text-2xl font-semibold ${rateClass(manager.completion)}`}>{manager.completion}%</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
