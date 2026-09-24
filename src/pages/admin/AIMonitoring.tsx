import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, AlertTriangle, Cpu } from "lucide-react";

export default function AIMonitoring() {
  const [metrics, setMetrics] = useState({ total: 0, avgTime: 0, errors: 0, topModel: "—" });
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([]);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: logs } = await supabase
      .from("ai_execution_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const items = logs || [];
    const total = items.length;
    const errors = items.filter((l: any) => l.status !== "success").length;
    const avgTime = total > 0 ? Math.round(items.reduce((s: number, l: any) => s + (l.execution_time_ms || 0), 0) / total) : 0;

    const modelCounts: Record<string, number> = {};
    items.forEach((l: any) => { modelCounts[l.model_used || "unknown"] = (modelCounts[l.model_used || "unknown"] || 0) + 1; });
    const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.split("/").pop() || "—";

    setMetrics({ total, avgTime, errors, topModel });

    // Hourly distribution
    const hourly: Record<string, number> = {};
    for (let i = 23; i >= 0; i--) {
      const h = new Date(Date.now() - i * 60 * 60 * 1000).getHours();
      hourly[`${h}h`] = 0;
    }
    items.forEach((l: any) => {
      const h = new Date(l.created_at).getHours();
      const key = `${h}h`;
      if (hourly[key] !== undefined) hourly[key]++;
    });
    setHourlyData(Object.entries(hourly).map(([hour, count]) => ({ hour, count })));

    setRecentErrors(items.filter((l: any) => l.status !== "success").slice(0, 10));
  };

  const statCards = [
    { icon: Activity, label: "Execuções (24h)", value: metrics.total, color: "text-primary" },
    { icon: Clock, label: "Tempo Médio", value: `${metrics.avgTime}ms`, color: "text-accent" },
    { icon: AlertTriangle, label: "Erros (24h)", value: metrics.errors, color: "text-destructive" },
    { icon: Cpu, label: "Modelo Top", value: metrics.topModel, color: "text-primary" },
  ];

  return (
    <AppLayout title="Monitoramento do Sistema" breadcrumbs={[{ label: "Administração" }, { label: "Monitoramento" }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Execuções por Hora (últimas 24h)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(217, 71%, 35%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {recentErrors.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Erros Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentErrors.map((e: any) => (
                  <div key={e.id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{e.tool_name} — {e.model_used}</span>
                      <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-destructive text-xs mt-1">{e.error_message || "Erro desconhecido"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
