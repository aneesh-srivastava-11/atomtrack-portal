"use client";

import { useEffect, useState } from "react";
import { BarChart3, PieChart as PieIcon, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];
const STATUS_COLORS: Record<string, string> = { DRAFT: "#94a3b8", SUBMITTED: "#f59e0b", APPROVED: "#10b981", REJECTED: "#ef4444", LOCKED: "#6366f1" };
const HEAT_COLORS: Record<string, string> = { COMPLETED: "#10b981", PARTIAL: "#f59e0b", NONE: "#e2e8f0" };

interface QoQData { quarter: string; avgProgress: number; count: number }
interface DistData { byThrustArea: { name: string; value: number }[]; byUom: { name: string; value: number }[]; byStatus: { name: string; value: number }[]; total: number }
interface HeatRow { employee: string; manager: string; goalCount: number; Q1: string; Q2: string; Q3: string; Q4: string }
interface MgrData { name: string; teamSize: number; totalGoals: number; goalsWithCheckIn: number; checkInRate: number; commentsGiven: number }

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

      {/* Row 1: QoQ Trend + Goal Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />QoQ Achievement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={qoq}>
                <defs><linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="quarter" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Avg Progress"]} />
                <Area type="monotone" dataKey="avgProgress" stroke="#6366f1" fill="url(#colorProgress)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><PieIcon className="h-4 w-4" />Goal Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {dist && (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dist.byStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {dist.byStatus.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Thrust Area Distribution + UoM Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Goals by Thrust Area</CardTitle></CardHeader>
          <CardContent>
            {dist && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dist.byThrustArea} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {dist.byThrustArea.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Goals by UoM Type</CardTitle></CardHeader>
          <CardContent>
            {dist && (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dist.byUom} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {dist.byUom.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Heatmap */}
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
                            style={{ backgroundColor: HEAT_COLORS[row[q]] || "#e2e8f0" }}
                            title={row[q]}
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

      {/* Row 4: Manager Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Manager Effectiveness</CardTitle>
        </CardHeader>
        <CardContent>
          {mgr.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, mgr.length * 60)}>
              <BarChart data={mgr} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, name) => [name === "checkInRate" ? `${v}%` : v, name === "checkInRate" ? "Check-in Rate" : "Comments Given"]} />
                <Legend />
                <Bar dataKey="checkInRate" name="Check-in Rate %" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="commentsGiven" name="Comments Given" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
