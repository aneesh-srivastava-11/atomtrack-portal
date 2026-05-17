"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setError("");
    try {
      const credentials = Object.fromEntries(formData) as { email: string; password: string };
      await supabase.auth.signInWithPassword(credentials).catch(() => null);
      const { data } = await api.post("/api/auth/login", credentials);
      setUser(data.user, data.token);
      router.push(data.user.role === "ADMIN" ? "/admin" : data.user.role === "MANAGER" ? "/manager" : "/employee");
    } catch {
      setError("We could not sign you in. Check your email, password, and server connection.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sign in to AtomTrack</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">Set quarterly goals, track progress, and complete check-ins with your manager.</p>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="grid gap-4">
            {error && <Alert>{error}</Alert>}
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center justify-center gap-3 font-medium text-slate-700 dark:text-slate-200"
              onClick={() => {
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/azure/login`;
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21">
                <path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/>
              </svg>
              Sign in with Microsoft
            </Button>
            
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with email</span></div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" className="pl-9" defaultValue="admin@atomtrack.test" autoComplete="email" required />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a className="text-xs text-primary hover:underline" href="#">Forgot password?</a>
              </div>
              <Input id="password" name="password" type="password" defaultValue="Password@123" autoComplete="current-password" required />
            </div>
            <Button>Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
