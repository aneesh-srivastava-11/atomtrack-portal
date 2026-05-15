import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GoalStatus } from "@/lib/types";

const labels: Record<GoalStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  LOCKED: "Locked"
};

export function StatusBadge({ status }: { status: GoalStatus }) {
  if (status === "APPROVED") return <Badge variant="default">{labels[status]}</Badge>;
  if (status === "SUBMITTED") return <Badge variant="secondary">{labels[status]}</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">{labels[status]}</Badge>;
  if (status === "LOCKED") {
    return (
      <Badge variant="outline">
        <Lock className="h-3 w-3" />
        {labels[status]}
      </Badge>
    );
  }
  return <Badge variant="outline">{labels[status]}</Badge>;
}
