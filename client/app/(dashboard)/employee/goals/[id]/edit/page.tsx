"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Goal } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditGoalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  useEffect(() => { api.get(`/api/goals/${id}`).then(({ data }) => setGoal(data)); }, [id]);

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
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Edit goal</CardTitle></CardHeader>
      <CardContent>
        <form action={onSubmit} className="grid gap-4">
          <Label>Title<Input name="title" defaultValue={goal.title} className="mt-2" /></Label>
          <Label>Description<Input name="description" defaultValue={goal.description} className="mt-2" /></Label>
          <Label>Target<Input name="target" type="number" defaultValue={goal.target} className="mt-2" /></Label>
          <Label>Weightage<Input name="weightage" type="number" min="10" max="100" defaultValue={goal.weightage} className="mt-2" /></Label>
          <Button>Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}
