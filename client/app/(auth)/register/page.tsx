"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const { data } = await api.post("/api/auth/register", { ...Object.fromEntries(formData), role: "EMPLOYEE" });
      setUser(data.user, data.token);
      router.push("/employee");
    } catch {
      // Error handling can be added here if needed
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Create account</CardTitle></CardHeader>
        <CardContent>
          <form action={onSubmit} className="grid gap-4">
            <Label>Name<Input name="name" className="mt-2" required /></Label>
            <Label>Email<Input name="email" type="email" className="mt-2" required /></Label>
            <Label>Password<Input name="password" type="password" className="mt-2" required /></Label>
            <Button disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
            <Link className="text-sm text-muted-foreground" href="/login">Back to login</Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
