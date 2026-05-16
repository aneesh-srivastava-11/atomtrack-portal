"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Play, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Rule { id: string; name: string; triggerType: string; thresholdDays: number; active: boolean; _count: { logs: number } }
interface Log { id: string; level: number; status: string; message: string; firedAt: string; resolvedAt?: string; user: { name: string }; rule: { name: string } }

const TRIGGER_LABELS: Record<string, string> = {
  GOAL_NOT_SUBMITTED: "Goal Not Submitted",
  GOAL_NOT_APPROVED: "Goal Not Approved",
  CHECKIN_MISSING: "Check-in Missing"
};

export default function EscalationsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function refresh() {
    api.get("/api/escalations/rules").then(({ data }) => setRules(data));
    api.get("/api/escalations/logs").then(({ data }) => setLogs(data));
  }

  useEffect(() => { refresh(); }, []);

  async function createRule(formData: FormData) {
    await api.post("/api/escalations/rules", {
      name: formData.get("name"),
      triggerType: formData.get("triggerType"),
      thresholdDays: Number(formData.get("thresholdDays"))
    });
    setShowCreate(false);
    refresh();
  }

  async function toggleRule(id: string) {
    await api.put(`/api/escalations/rules/${id}/toggle`);
    refresh();
  }

  async function deleteRule(id: string) {
    await api.delete(`/api/escalations/rules/${id}`);
    refresh();
  }

  async function runAll() {
    setRunning(true);
    setRunResult(null);
    const { data } = await api.post("/api/escalations/run");
    setRunResult(`Processed ${data.rulesProcessed} rules, fired ${data.fired} escalations.`);
    setRunning(false);
    refresh();
  }

  async function resolveLog(id: string) {
    await api.put(`/api/escalations/logs/${id}/resolve`);
    refresh();
  }

  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Bell className="h-6 w-6 text-primary" />
            Escalation Module
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure rules, run escalations, and track resolution.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />New Rule</Button>
          <Button onClick={runAll} disabled={running}>
            <Play className="h-4 w-4" />{running ? "Running..." : "Run Escalations"}
          </Button>
        </div>
      </div>

      {runResult && (
        <Alert className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" /> {runResult}
        </Alert>
      )}

      {/* Rules */}
      <Card>
        <CardHeader><CardTitle className="text-base">Escalation Rules ({rules.length})</CardTitle></CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No rules configured. Click "New Rule" to create one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Fired</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{TRIGGER_LABELS[rule.triggerType] || rule.triggerType}</TableCell>
                    <TableCell>{rule.thresholdDays} days</TableCell>
                    <TableCell>{rule._count.logs}</TableCell>
                    <TableCell>
                      <Badge variant={rule.active ? "default" : "secondary"}>{rule.active ? "Active" : "Paused"}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => toggleRule(rule.id)}>
                        {rule.active ? "Pause" : "Enable"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader><CardTitle className="text-base">Escalation Log ({logs.length})</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No escalations fired yet. Configure rules and click "Run Escalations".</p>
          ) : (
            <div className="max-h-[400px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, i) => (
                    <TableRow key={log.id} className={i % 2 ? "bg-muted/30" : ""}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(log.firedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{log.rule.name}</TableCell>
                      <TableCell className="font-medium">{log.user.name}</TableCell>
                      <TableCell>
                        <Badge variant={log.level >= 3 ? "destructive" : log.level >= 2 ? "secondary" : "outline"}>
                          L{log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-xs">{log.message}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "RESOLVED" ? "default" : "destructive"}>
                          {log.status === "RESOLVED" ? "Resolved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.status === "PENDING" && (
                          <Button variant="outline" size="sm" onClick={() => resolveLog(log.id)}>
                            <CheckCircle2 className="h-3 w-3" />Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Escalation Rule</DialogTitle></DialogHeader>
          <form action={createRule} className="grid gap-4">
            <Label>Rule name<Input name="name" className="mt-2" placeholder="Late goal submission alert" required /></Label>
            <Label>Trigger type
              <Select name="triggerType" defaultValue="GOAL_NOT_SUBMITTED">
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOAL_NOT_SUBMITTED">Goal Not Submitted</SelectItem>
                  <SelectItem value="GOAL_NOT_APPROVED">Goal Not Approved</SelectItem>
                  <SelectItem value="CHECKIN_MISSING">Check-in Missing</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <Label>Threshold (days)<Input name="thresholdDays" type="number" min="1" className="mt-2" placeholder="7" required /></Label>
            <Button>Create Rule</Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
