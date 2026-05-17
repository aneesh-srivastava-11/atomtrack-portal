"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Goal, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ManagerDashboard() {
  const [sheets, setSheets] = useState<Array<{ id: string; user: User; goals: Goal[]; locked: boolean; submittedAt?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/manager/team-goals")
      .then(({ data }) => { setSheets(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team dashboard</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your direct reports and their goal sheet statuses.</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : sheets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No team goals found. If you have direct reports, their goal sheets will appear here once created.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Goals</TableHead><TableHead>Weightage</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {sheets.map((sheet) => (
                <TableRow key={sheet.id}>
                  <TableCell className="font-medium">{sheet.user.name}</TableCell>
                  <TableCell>{sheet.goals.length}</TableCell>
                  <TableCell>{sheet.goals.reduce((sum, goal) => sum + goal.weightage, 0)}%</TableCell>
                  <TableCell><Badge variant={sheet.locked ? "default" : sheet.submittedAt ? "secondary" : "outline"}>{sheet.locked ? "APPROVED" : sheet.submittedAt ? "SUBMITTED" : "DRAFT"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
