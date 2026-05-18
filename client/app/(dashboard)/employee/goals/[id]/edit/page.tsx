"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Goal } from "@/lib/types";
import { api } from "@/lib/api";
import { useGoalStore } from "@/stores/goalStore";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditGoalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { totalWeightage, setGoals } = useGoalStore();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [currentWeightage, setCurrentWeightage] = useState(0);

  useEffect(() => { 
    api.get(`/api/goals/${id}`).then(({ data }) => {
      setGoal(data);
      setCurrentWeightage(data.weightage);
    }); 
    api.get("/api/goals").then(({ data }) => setGoals(data));
  }, [id, setGoals]);

  async function onSubmit(formData: FormData) {
    await api.put(`/api/goals/${id}`, {
      ...goal,
      ...Object.fromEntries(formData),
      target: Number(formData.get("target")),
      weightage: Number(formData.get("weightage"))
    });
    router.push("/employee");
  }

  if (!goal) return <p>Loading...</p>;

  // The total weightage available to this goal is the total remaining budget PLUS whatever this goal currently held before edits.
  const remainingBudget = 100 - totalWeightage + goal.weightage;
  const isValidWeightage = currentWeightage >= 10 && currentWeightage <= 100 && currentWeightage <= remainingBudget;

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Edit goal</CardTitle></CardHeader>
      <CardContent>
        <form action={onSubmit} className="grid gap-4">
          <Label>Title<Input name="title" defaultValue={goal.title} className="mt-2" /></Label>
          <Label>Description<Input name="description" defaultValue={goal.description} className="mt-2" /></Label>
          <Label>Thrust Area
            <select name="thrustArea" defaultValue={goal.thrustArea} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2">
              {["SALES", "OPERATIONS", "INNOVATION", "CUSTOMER_SUCCESS", "PEOPLE", "FINANCE", "COMPLIANCE", "TECHNOLOGY"].map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </Label>
          <Label>UoM
            <select name="uom" defaultValue={goal.uom} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2">
              {["MIN_NUMERIC", "MAX_NUMERIC", "MIN_PERCENTAGE", "MAX_PERCENTAGE", "TIMELINE", "ZERO_BASED"].map((uom) => <option key={uom} value={uom}>{uom}</option>)}
            </select>
          </Label>
          <Label>Target<Input name="target" type="number" step="0.01" defaultValue={goal.target} className="mt-2" /></Label>
          
          <Label className="flex justify-between mt-2">
            <span>Weightage</span>
            <span className={currentWeightage > remainingBudget ? "text-red-500" : "text-muted-foreground"}>
              {remainingBudget}% max available
            </span>
          </Label>
          <Input 
            name="weightage" 
            type="number" 
            min="10" 
            max="100" 
            value={currentWeightage || ""} 
            onChange={(e) => setCurrentWeightage(Number(e.target.value))} 
            className="mt-2" 
          />

          <Alert className={isValidWeightage ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"}>
            <span className="flex items-center gap-2">
              {isValidWeightage ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {currentWeightage > remainingBudget 
                ? `You can only assign up to ${remainingBudget}% based on your other goals.` 
                : isValidWeightage 
                  ? `${currentWeightage}% weightage is valid.` 
                  : "Weightage must be between 10% and 100%."}
            </span>
          </Alert>

          <Button disabled={!isValidWeightage}>Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}
