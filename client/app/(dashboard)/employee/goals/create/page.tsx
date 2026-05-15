"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const thrustAreas = ["SALES", "OPERATIONS", "INNOVATION", "CUSTOMER_SUCCESS", "PEOPLE", "FINANCE", "COMPLIANCE", "TECHNOLOGY"];
const uoms = ["MIN_NUMERIC", "MAX_NUMERIC", "MIN_PERCENTAGE", "MAX_PERCENTAGE", "TIMELINE", "ZERO_BASED"];

export default function CreateGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({ thrustArea: "SALES", uom: "MIN_NUMERIC" });
  const [weightage, setWeightage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidWeightage = weightage >= 10 && weightage <= 100;

  async function onSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const body = {
        title: String(formData.get("title")),
        description: String(formData.get("description")),
        thrustArea: values.thrustArea,
        uom: values.uom,
        target: Number(formData.get("target")),
        weightage: Number(formData.get("weightage")),
      };

      await api.post("/api/goals", body);
      router.push("/employee");
      router.refresh();
    } catch (err: any) {
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
        <form action={onSubmit} className="grid gap-4">
          {step === 1 && (
            <>
              <Label>Goal title<Input name="title" className="mt-2" placeholder="Increase renewal coverage" required /></Label>
              <Label>Description<Input name="description" className="mt-2" placeholder="Describe the outcome and how it will be measured." required /></Label>
              <Button type="button" onClick={() => setStep(2)}>Next</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Label>Thrust area</Label>
              <Select value={values.thrustArea} onValueChange={(thrustArea) => setValues((v) => ({ ...v, thrustArea }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{thrustAreas.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
              </Select>
              <Label>UoM</Label>
              <Select value={values.uom} onValueChange={(uom) => setValues((v) => ({ ...v, uom }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{uoms.map((uom) => <SelectItem key={uom} value={uom}>{uom}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="button" onClick={() => setStep(3)}>Next</Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Label>Target<Input name="target" type="number" min="0" step="0.01" className="mt-2" required /></Label>
              <Label>Weightage<Input name="weightage" type="number" min="1" max="100" className="mt-2" onChange={(event) => setWeightage(Number(event.target.value))} required /></Label>
              <Alert className={isValidWeightage ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"}>
                <span className="flex items-center gap-2">
                  {isValidWeightage ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {isValidWeightage ? `${weightage}% weightage will be assigned to this goal.` : "Weightage must be between 10% and 100%."}
                </span>
              </Alert>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button disabled={!isValidWeightage || loading}>{loading ? "Creating..." : "Create goal"}</Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
