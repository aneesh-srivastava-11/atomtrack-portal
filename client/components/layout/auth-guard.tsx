"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { isRouteAllowed, roleHome } from "@/lib/rbac";

/**
 * Client-side auth guard. Wraps all dashboard pages.
 * - If not logged in → redirect to /login
 * - If logged in but accessing a route outside their role → redirect to role home
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Not authenticated
    if (!user || !token) {
      router.replace("/login");
      return;
    }

    // Authenticated but wrong role for this route
    if (!isRouteAllowed(pathname, user.role)) {
      router.replace(roleHome(user.role));
      return;
    }

    setAllowed(true);
  }, [user, token, pathname, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
