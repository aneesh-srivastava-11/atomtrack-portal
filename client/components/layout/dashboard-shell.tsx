"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navForRole, groupsForRole, roleLabels, roleColors } from "@/lib/rbac";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const role = user?.role || "EMPLOYEE";
  const items = navForRole(role);
  const groups = groupsForRole(role);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-r bg-card">
        <div className="border-b px-5 py-4">
          <Link href={`/${role === "ADMIN" ? "admin" : role === "MANAGER" ? "manager" : "employee"}`} className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs text-primary-foreground">AT</span>
            AtomTrack
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Goal setting and quarterly tracking</p>
        </div>
        <nav className="grid gap-5 p-4">
          {groups.map((group) => (
            <div key={group} className="grid gap-1">
              <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
              {items.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", active && "bg-muted text-foreground")}>
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
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", roleColors[role])}>
              {roleLabels[role]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => { logout(); window.location.href = "/login"; }}>Logout</Button>
          </div>
        </header>
        <div className="p-5">{children}</div>
      </main>
    </div>
  );
}
