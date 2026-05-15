"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild><a href={`${apiUrl}/api/reports/achievement-export`}><FileDown className="h-4 w-4" />Achievement export</a></Button>
        <Button asChild variant="outline"><a href={`${apiUrl}/api/reports/completion-report`}><FileDown className="h-4 w-4" />Completion CSV</a></Button>
      </CardContent>
    </Card>
  );
}
