"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useGoalStore } from "@/stores/goalStore";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const thrustAreas = ["SALES", "OPERATIONS", "INNOVATION", "CUSTOMER_SUCCESS", "PEOPLE", "FINANCE", "COMPLIANCE", "TECHNOLOGY"];
const uoms = ["MIN_NUMERIC", "MAX_NUMERIC", "MIN_PERCENTAGE", "MAX_PERCENTAGE", "TIMELINE", "ZERO_BASED"];

export default function CreateGoalPage() {
  const router = useRouter();
  const { totalWeightage, setGoals } = useGoalStore();
  const remaining = Math.max(0, 100 - totalWeightage);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({ 
    title: "", 
    description: "", 
    thrustArea: "SALES", 
    uom: "MIN_NUMERIC", 
    target: "", 
    weightage: 0 
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/goals").then(({ data }) => setGoals(data));
  }, [setGoals]);

  const isValidWeightage = values.weightage >= 10 && values.weightage <= 100;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        title: values.title,
        description: values.description,
        thrustArea: values.thrustArea,
        uom: values.uom,
        target: Number(values.target),
        weightage: Number(values.weightage),
      };

      await api.post("/api/goals", body);
      router.push("/employee");
      router.refresh();
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const msg = err.response?.data?.error?.message || "Failed to create goal. Please check all fields.";
      setError(msg);
      console.error("Create goal error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Create a new goal</CardTitle>
        <p className="text-sm text-muted-foreground">Step {step} of 3. Add the goal details, measurement method, target, and weightage.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => <div key={item} className={`h-1.5 rounded ${item <= step ? "bg-primary" : "bg-muted"}`} />)}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
        )}
        <form onSubmit={onSubmit} className="grid gap-4">
          {step === 1 && (
            <>
              <Label>Goal title<Input value={values.title} onChange={e => setValues({...values, title: e.target.value})} className="mt-2" placeholder="Increase renewal coverage" required /></Label>
              <Label>Description<Input value={values.description} onChange={e => setValues({...values, description: e.target.value})} className="mt-2" placeholder="Describe the outcome and how it will be measured." required /></Label>
              <Button type="button" onClick={() => setStep(2)}>Next</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Label>Thrust area</Label>
              <select value={values.thrustArea} onChange={(e) => setValues((v) => ({ ...v, thrustArea: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2 mb-4">
                {thrustAreas.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
              <Label>UoM</Label>
              <select value={values.uom} onChange={(e) => setValues((v) => ({ ...v, uom: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2 mb-4">
                {uoms.map((uom) => <option key={uom} value={uom}>{uom}</option>)}
              </select>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="button" onClick={() => setStep(3)}>Next</Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Label>Target<Input value={values.target} onChange={e => setValues({...values, target: e.target.value})} type="number" min="0" step="0.01" className="mt-2" required /></Label>
              <Label className="flex justify-between mt-2">
                <span>Weightage</span>
                <span className={values.weightage > remaining ? "text-red-500" : "text-muted-foreground"}>
                  {remaining}% remaining
                </span>
              </Label>
              <Input value={values.weightage || ""} onChange={e => setValues({...values, weightage: Number(e.target.value)})} type="number" min="1" max="100" className="mt-2" required />
              
              <Alert className={isValidWeightage && values.weightage <= remaining ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"}>
                <span className="flex items-center gap-2">
                  {isValidWeightage && values.weightage <= remaining ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {values.weightage > remaining 
                    ? `You only have ${remaining}% weightage left across your goals.` 
                    : isValidWeightage 
                      ? `${values.weightage}% weightage will be assigned to this goal.` 
                      : "Weightage must be between 10% and 100%."}
                </span>
              </Alert>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button disabled={!isValidWeightage || values.weightage > remaining || loading}>{loading ? "Creating..." : "Create goal"}</Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
