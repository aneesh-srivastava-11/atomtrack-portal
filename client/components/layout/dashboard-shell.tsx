"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, FileDown, Home, Settings, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

const nav = [
  { href: "/employee", label: "My Goals", icon: Home, group: "Employee" },
  { href: "/employee/checkins", label: "Quarterly Check-ins", icon: BarChart3, group: "Employee" },
  { href: "/employee/goals/create", label: "Create Goal", icon: ClipboardCheck, group: "Employee" },
  { href: "/manager", label: "Team Dashboard", icon: Users, group: "Manager" },
  { href: "/manager/approvals", label: "Pending Approvals", icon: ClipboardCheck, group: "Manager" },
  { href: "/manager/checkins", label: "Check-in Reviews", icon: BarChart3, group: "Manager" },
  { href: "/admin/completion", label: "Completion Dashboard", icon: ShieldCheck, group: "Admin" },
  { href: "/admin/cycles", label: "Manage Cycles", icon: Settings, group: "Admin" },
  { href: "/admin/users", label: "User Management", icon: Users, group: "Admin" },
  { href: "/admin/reports", label: "Export Reports", icon: FileDown, group: "Admin" }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-r bg-card">
        <div className="border-b px-5 py-4">
          <Link href="/employee" className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs text-primary-foreground">AT</span>
            AtomTrack
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Goal setting and quarterly tracking</p>
        </div>
        <nav className="grid gap-5 p-4">
          {["Employee", "Manager", "Admin"].map((group) => (
            <div key={group} className="grid gap-1">
              <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
              {nav.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", pathname === item.href && "bg-muted text-foreground")}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <main>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-5">
          <div>
            <p className="text-xs text-muted-foreground">Workspace</p>
            <p className="font-medium">{user?.name || "Demo User"} <span className="text-sm font-normal text-muted-foreground">{user?.role || "ADMIN"}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </header>
        <div className="p-5">{children}</div>
      </main>
    </div>
  );
}
