import type { Role } from "./types";
import { BarChart3, Bell, ClipboardCheck, FileDown, Home, Lock, Settings, Shield, ShieldCheck, TrendingUp, Users } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Navigation items — each item declares which roles may see it      */
/* ------------------------------------------------------------------ */

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  roles: Role[];
  group: string;
}

export const navItems: NavItem[] = [
  // Employee
  { href: "/employee",              label: "My Goals",             icon: Home,           roles: ["EMPLOYEE"],          group: "Employee" },
  { href: "/employee/checkins",     label: "Quarterly Check-ins",  icon: BarChart3,      roles: ["EMPLOYEE"],          group: "Employee" },
  { href: "/employee/goals/create", label: "Create Goal",          icon: ClipboardCheck, roles: ["EMPLOYEE"],          group: "Employee" },

  // Manager
  { href: "/manager",               label: "Team Dashboard",       icon: Users,          roles: ["MANAGER"],           group: "Manager" },
  { href: "/manager/approvals",     label: "Pending Approvals",    icon: ClipboardCheck, roles: ["MANAGER"],           group: "Manager" },
  { href: "/manager/checkins",      label: "Check-in Reviews",     icon: BarChart3,      roles: ["MANAGER"],           group: "Manager" },

  // Admin
  { href: "/admin",                 label: "Completion Dashboard",  icon: ShieldCheck,    roles: ["ADMIN"],             group: "Admin" },
  { href: "/admin/cycles",          label: "Manage Cycles",         icon: Settings,       roles: ["ADMIN"],             group: "Admin" },
  { href: "/admin/users",           label: "User Management",       icon: Users,          roles: ["ADMIN"],             group: "Admin" },
  { href: "/admin/reports",         label: "Export Reports",        icon: FileDown,       roles: ["ADMIN"],             group: "Admin" },
  { href: "/admin/audit-logs",      label: "Audit Trail",           icon: Shield,         roles: ["ADMIN"],             group: "Admin" },
  { href: "/admin/unlock",          label: "Goal Unlock",           icon: Lock,           roles: ["ADMIN"],             group: "Admin" },
  { href: "/admin/analytics",       label: "Analytics",             icon: TrendingUp,     roles: ["ADMIN"],             group: "Admin" },
  { href: "/admin/escalations",     label: "Escalations",           icon: Bell,           roles: ["ADMIN"],             group: "Admin" },
];

/* ------------------------------------------------------------------ */
/*  Route prefix → allowed roles                                      */
/* ------------------------------------------------------------------ */

const routePermissions: { prefix: string; roles: Role[] }[] = [
  { prefix: "/employee", roles: ["EMPLOYEE"] },
  { prefix: "/manager",  roles: ["MANAGER"] },
  { prefix: "/admin",    roles: ["ADMIN"] },
];

/**
 * Check whether a given role is allowed to access a pathname.
 */
export function isRouteAllowed(pathname: string, role: Role): boolean {
  const match = routePermissions.find((r) => pathname.startsWith(r.prefix));
  if (!match) return true; // public or unknown route
  return match.roles.includes(role);
}

/**
 * Get the home route for a given role.
 */
export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":   return "/admin";
    case "MANAGER": return "/manager";
    case "EMPLOYEE":
    default:        return "/employee";
  }
}

/**
 * Filter nav items to only those visible to the given role.
 */
export function navForRole(role: Role): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

/**
 * Get the sidebar groups that should be visible for a role.
 */
export function groupsForRole(role: Role): string[] {
  const items = navForRole(role);
  return [...new Set(items.map((i) => i.group))];
}

/* ------------------------------------------------------------------ */
/*  Role display helpers                                               */
/* ------------------------------------------------------------------ */

export const roleLabels: Record<Role, string> = {
  EMPLOYEE: "Employee",
  MANAGER:  "Manager",
  ADMIN:    "Admin",
};

export const roleColors: Record<Role, string> = {
  EMPLOYEE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  MANAGER:  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  ADMIN:    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};
