"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function download(endpoint: string, filename: string) {
    setLoading(endpoint);
    try {
      const response = await api.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={() => download("/api/reports/achievement-export", "achievement-export.xlsx")} disabled={!!loading}>
          {loading === "/api/reports/achievement-export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Achievement export
        </Button>
        <Button variant="outline" onClick={() => download("/api/reports/completion-report", "completion-report.csv")} disabled={!!loading}>
          {loading === "/api/reports/completion-report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Completion CSV
        </Button>
      </CardContent>
    </Card>
  );
}
