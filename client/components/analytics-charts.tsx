"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieIcon, Users } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];
const STATUS_COLORS: Record<string, string> = { DRAFT: "#94a3b8", SUBMITTED: "#f59e0b", APPROVED: "#10b981", REJECTED: "#ef4444", LOCKED: "#6366f1" };

export interface QoQData { quarter: string; avgProgress: number; count: number }
export interface DistData { byThrustArea: { name: string; value: number }[]; byUom: { name: string; value: number }[]; byStatus: { name: string; value: number }[]; total: number }
export interface MgrData { name: string; teamSize: number; totalGoals: number; goalsWithCheckIn: number; checkInRate: number; commentsGiven: number }

export default function AnalyticsCharts({ qoq, dist, mgr }: { qoq: QoQData[], dist: DistData | null, mgr: MgrData[] }) {
  return (
    <>
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
    </>
  );
}
