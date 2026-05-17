"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { roleHome } from "@/lib/rbac";

export default function Page() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.replace(roleHome(user.role));
    } else {
      router.replace("/login");
    }
  }, [user, router]);

  return null;
}
