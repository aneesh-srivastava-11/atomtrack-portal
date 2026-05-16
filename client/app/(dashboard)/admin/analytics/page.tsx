"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Import types
import type { QoQData, DistData, MgrData } from "@/components/analytics-charts";

const HEAT_COLORS: Record<string, string> = { COMPLETED: "#10b981", PARTIAL: "#f59e0b", NONE: "#e2e8f0" };

interface HeatRow { employee: string; manager: string; goalCount: number; Q1: string; Q2: string; Q3: string; Q4: string }

// Lazy load the Recharts component
const AnalyticsCharts = dynamic(() => import("@/components/analytics-charts"), { 
  ssr: false,
  loading: () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Skeleton className="h-[350px] w-full rounded-xl" />
      <Skeleton className="h-[350px] w-full rounded-xl" />
      <Skeleton className="h-[350px] w-full rounded-xl" />
      <Skeleton className="h-[350px] w-full rounded-xl" />
    </div>
  )
});

export default function AnalyticsPage() {
  const [qoq, setQoq] = useState<QoQData[]>([]);
  const [dist, setDist] = useState<DistData | null>(null);
  const [heat, setHeat] = useState<HeatRow[]>([]);
  const [mgr, setMgr] = useState<MgrData[]>([]);

  useEffect(() => {
    api.get("/api/analytics/qoq").then(({ data }) => setQoq(data));
    api.get("/api/analytics/distribution").then(({ data }) => setDist(data));
    api.get("/api/analytics/heatmap").then(({ data }) => setHeat(data));
    api.get("/api/analytics/manager-effectiveness").then(({ data }) => setMgr(data));
  }, []);

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <BarChart3 className="h-6 w-6 text-primary" />
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Organization-wide goal performance, trends, and manager effectiveness.</p>
      </div>

      {/* Lazy-Loaded Charts (QoQ, Dist, Mgr Effectiveness) */}
      <AnalyticsCharts qoq={qoq} dist={dist} mgr={mgr} />

      {/* Row 3: Heatmap (HTML native, no Recharts needed) */}
      <Card>
        <CardHeader><CardTitle className="text-base">Quarterly Check-in Completion Heatmap</CardTitle></CardHeader>
        <CardContent>
          {heat.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 font-medium">Manager</th>
                    <th className="px-3 py-2 font-medium text-center">Goals</th>
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => <th key={q} className="px-3 py-2 text-center font-medium">{q}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {heat.map((row, i) => (
                    <tr key={i} className={i % 2 ? "bg-muted/30" : ""}>
                      <td className="px-3 py-2 font-medium">{row.employee}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.manager}</td>
                      <td className="px-3 py-2 text-center">{row.goalCount}</td>
                      {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
                        <td key={q} className="px-3 py-2 text-center">
                          <span
                            className="inline-block h-6 w-6 rounded"
                            style={{ backgroundColor: HEAT_COLORS[row[q as keyof HeatRow]] || "#e2e8f0" }}
                            title={row[q as keyof HeatRow] as string}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#10b981" }} />Completed</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#f59e0b" }} />Partial</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#e2e8f0" }} />None</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
