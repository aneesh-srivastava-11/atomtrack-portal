"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Goal, Quarter } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export default function CheckInsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [quarter, setQuarter] = useState<Quarter>("Q1");
  useEffect(() => { api.get("/api/goals").then(({ data }) => setGoals(data)); }, []);

  async function save(goalId: string, formData: FormData) {
    await api.post("/api/checkins", {
      goalId,
      quarter,
      plannedTarget: Number(formData.get("plannedTarget")),
      actualAchievement: Number(formData.get("actualAchievement")),
      progressStatus: formData.get("progressStatus")
    });
  }

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Quarterly Check-ins</h1>
        <p className="text-sm text-muted-foreground">Update planned and actual achievement for each active goal.</p>
      </div>
      <div className="grid grid-cols-4 rounded-lg border bg-card p-2">
        {quarters.map((q) => (
          <button key={q} onClick={() => setQuarter(q)} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${quarter === q ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
            {quarter === q && <CheckCircle2 className="h-4 w-4" />}
            {q}
          </button>
        ))}
      </div>
      <Tabs value={quarter} onValueChange={(value) => setQuarter(value as Quarter)}>
        <TabsList className="sr-only">{quarters.map((q) => <TabsTrigger key={q} value={q}>{q}</TabsTrigger>)}</TabsList>
        {quarters.map((q) => (
          <TabsContent key={q} value={q} className="mt-4 grid gap-3">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader><CardTitle>{goal.title}</CardTitle></CardHeader>
                <CardContent>
                  <form action={(data) => save(goal.id, data)} className="grid gap-3 md:grid-cols-4">
                    <Label>Planned<Input name="plannedTarget" type="number" defaultValue={goal.target} className="mt-2" /></Label>
                    <Label>Actual<Input name="actualAchievement" type="number" className="mt-2" /></Label>
                    <Label>Status
                      <Select name="progressStatus" defaultValue="ON_TRACK">
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOT_STARTED">Not started</SelectItem>
                          <SelectItem value="ON_TRACK">On track</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </Label>
                    <div className="flex items-end"><Button className="w-full">Save</Button></div>
                  </form>
                  <blockquote className="mt-4 border-l-4 border-primary/40 pl-3 text-sm text-muted-foreground">Manager comments will appear here after review.</blockquote>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
