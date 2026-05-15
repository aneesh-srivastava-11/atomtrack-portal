"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ManagerStat {
  name: string;
  teamSize: number;
  submitted: number;
  approved: number;
  completion: number;
}

interface DashboardStats {
  employees: number;
  submitted: number;
  approved: number;
  goalsSubmittedPercent: number;
  goalsApprovedPercent: number;
  checkInPercent: number;
  managerStats: ManagerStat[];
}

function rateClass(value: number) {
  if (value < 50) return "text-red-700 dark:text-red-300";
  if (value < 80) return "text-amber-700 dark:text-amber-300";
  return "text-green-700 dark:text-green-300";
}

export default function AdminCompletionPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get("/api/admin/completion-dashboard")
      .then(({ data }) => setStats(data))
      .catch(() => null);
  }, []);

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;
  }

  const pendingApprovals = Math.max(stats.submitted - stats.approved, 0);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Completion Dashboard</h1>
          <p className="text-sm text-muted-foreground">View organization progress for goal submission, approvals, and check-ins.</p>
        </div>
        <Button onClick={async () => {
          const response = await api.get("/api/reports/achievement-export", { responseType: "blob" });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.download = "achievement-export.xlsx";
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        }}><Download className="h-4 w-4" />Download Achievement Report</Button>
      </div>

      {/* Summary cards — all from real API data */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Goals Submitted</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{stats.submitted}/{stats.employees}</p>
            <p className="mt-1 text-sm text-muted-foreground">employees</p>
            <Progress className="mt-4" value={stats.goalsSubmittedPercent} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-amber-700 dark:text-amber-300">{pendingApprovals}</p>
            <p className="mt-1 text-sm text-muted-foreground">goal sheets need review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Check-ins Complete</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-4xl font-semibold ${rateClass(stats.checkInPercent)}`}>{stats.checkInPercent}%</p>
            <p className="mt-1 text-sm text-muted-foreground">of approved goals</p>
            <Progress className="mt-4" value={stats.checkInPercent} />
          </CardContent>
        </Card>
      </div>

      {/* Manager breakdown — real data from API */}
      {stats.managerStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Manager completion breakdown</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.managerStats.map((mgr, index) => (
                  <TableRow key={mgr.name} className={index % 2 ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium">{mgr.name}</TableCell>
                    <TableCell>{mgr.teamSize}</TableCell>
                    <TableCell>{mgr.submitted}/{mgr.teamSize}</TableCell>
                    <TableCell>{mgr.approved}/{mgr.teamSize}</TableCell>
                    <TableCell className={rateClass(mgr.completion)}>{mgr.completion}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Manager heatmap cards — real data */}
      {stats.managerStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Manager completion heatmap</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stats.managerStats.map((mgr) => (
              <div key={mgr.name} className="rounded-md border p-3">
                <p className="font-medium">{mgr.name}</p>
                <p className="text-xs text-muted-foreground">{mgr.teamSize} reports</p>
                <p className={`mt-3 text-2xl font-semibold ${rateClass(mgr.completion)}`}>{mgr.completion}%</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
