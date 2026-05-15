"use client";

import { useEffect, useState } from "react";
import { FileSearch, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  user: { name: string; role: string };
  goal?: { title: string; id: string } | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ADMIN_UNLOCK:                        { label: "Admin Unlock",    variant: "destructive" },
  GOAL_REJECTED:                       { label: "Goal Rejected",   variant: "secondary" },
  LOCKED_GOAL_MODIFICATION_ATTEMPT:    { label: "Locked Edit Attempt", variant: "destructive" },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/api/admin/audit-logs").then(({ data }) => setLogs(data));
  }, []);

  const filtered = logs.filter((log) =>
    `${log.action} ${log.user.name} ${log.goal?.title || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Shield className="h-6 w-6 text-primary" />
            Audit Trail
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All changes made to goals after lock date — who changed what and when.
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <FileSearch className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Filter by action, user, or goal" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {logs.length === 0 ? "No audit entries yet. Actions like goal rejections, unlock operations, and locked-goal modification attempts will appear here." : "No matching entries."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Recent audit events ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[620px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log, index) => {
                    const meta = actionLabels[log.action] || { label: log.action, variant: "outline" as const };
                    return (
                      <TableRow key={log.id} className={index % 2 ? "bg-muted/30" : ""}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.user.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.goal?.title || "—"}</TableCell>
                        <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                          {log.newValue ? JSON.stringify(log.newValue) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
