"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Goal, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ManagerDashboard() {
  const [sheets, setSheets] = useState<Array<{ id: string; user: User; goals: Goal[]; locked: boolean; submittedAt?: string }>>([]);
  useEffect(() => { api.get("/api/manager/team-goals").then(({ data }) => setSheets(data)); }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Team dashboard</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Goals</TableHead><TableHead>Weightage</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {sheets.map((sheet) => (
              <TableRow key={sheet.id}>
                <TableCell>{sheet.user.name}</TableCell>
                <TableCell>{sheet.goals.length}</TableCell>
                <TableCell>{sheet.goals.reduce((sum, goal) => sum + goal.weightage, 0)}%</TableCell>
                <TableCell><Badge>{sheet.locked ? "APPROVED" : sheet.submittedAt ? "SUBMITTED" : "DRAFT"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
