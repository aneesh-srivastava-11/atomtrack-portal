"use client";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CyclesPage() {
  async function create(formData: FormData) {
    await api.post("/api/admin/cycles", {
      name: formData.get("name"),
      year: Number(formData.get("year")),
      startDate: new Date(String(formData.get("startDate"))),
      q1Window: new Date(String(formData.get("q1Window"))),
      q2Window: new Date(String(formData.get("q2Window"))),
      q3Window: new Date(String(formData.get("q3Window"))),
      q4Window: new Date(String(formData.get("q4Window"))),
      active: true
    });
  }
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Cycle management</CardTitle></CardHeader>
      <CardContent>
        <form action={create} className="grid gap-3 md:grid-cols-2">
          <Label>Name<Input name="name" className="mt-2" /></Label>
          <Label>Year<Input name="year" type="number" className="mt-2" /></Label>
          <Label>Start<Input name="startDate" type="date" className="mt-2" /></Label>
          <Label>Q1 window<Input name="q1Window" type="date" className="mt-2" /></Label>
          <Label>Q2 window<Input name="q2Window" type="date" className="mt-2" /></Label>
          <Label>Q3 window<Input name="q3Window" type="date" className="mt-2" /></Label>
          <Label>Q4 window<Input name="q4Window" type="date" className="mt-2" /></Label>
          <div className="flex items-end"><Button className="w-full">Create cycle</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
