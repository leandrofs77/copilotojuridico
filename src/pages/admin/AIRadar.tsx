import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AIRadarDashboard } from "@/components/admin/ai/AIRadarDashboard";
import { supabase } from "@/integrations/supabase/client";
import { Radar } from "lucide-react";

export default function AIRadar() {
  const [models, setModels] = useState<any[]>([]);
  const [usageByModel, setUsageByModel] = useState<{ name: string; count: number }[]>([]);
  const [avgTimeByModel, setAvgTimeByModel] = useState<{ name: string; avg_time: number }[]>([]);
  const [costByModel, setCostByModel] = useState<{ name: string; cost: number }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: modelsData } = await supabase.from("ai_models").select("*").order("priority");
    setModels(modelsData || []);

    const { data: logs } = await supabase.from("ai_execution_logs").select("model_used, execution_time_ms, estimated_cost, status");
    if (logs) {
      const byModel: Record<string, { count: number; totalTime: number; totalCost: number }> = {};
      logs.forEach((l: any) => {
        const key = l.model_used || "unknown";
        if (!byModel[key]) byModel[key] = { count: 0, totalTime: 0, totalCost: 0 };
        byModel[key].count++;
        byModel[key].totalTime += l.execution_time_ms || 0;
        byModel[key].totalCost += l.estimated_cost || 0;
      });
      setUsageByModel(Object.entries(byModel).map(([name, v]) => ({ name: name.split("/").pop() || name, count: v.count })));
      setAvgTimeByModel(Object.entries(byModel).map(([name, v]) => ({ name: name.split("/").pop() || name, avg_time: v.count > 0 ? Math.round(v.totalTime / v.count) : 0 })));
      setCostByModel(Object.entries(byModel).map(([name, v]) => ({ name: name.split("/").pop() || name, cost: parseFloat(v.totalCost.toFixed(4)) })));
    }
  };

  const toggleModel = async (id: string, active: boolean) => {
    await supabase.from("ai_models").update({ active: !active }).eq("id", id);
    loadData();
  };

  return (
    <AppLayout title="Radar Inteligente de IA" breadcrumbs={[{ label: "Administração" }, { label: "Radar de IA" }]}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            <CardTitle>Lógica do Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O Radar Inteligente seleciona automaticamente o melhor modelo de IA para cada execução, priorizando por:
              prioridade configurada → disponibilidade → fallback automático em caso de falha.
            </p>
          </CardContent>
        </Card>

        <AIRadarDashboard usageByModel={usageByModel} avgTimeByModel={avgTimeByModel} costByModel={costByModel} />

        <Card>
          <CardHeader><CardTitle>Modelos Registrados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Custo/1k tokens</TableHead>
                  <TableHead>Tempo Médio</TableHead>
                  <TableHead>Taxa Sucesso</TableHead>
                  <TableHead>Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.display_name || m.model_name}</TableCell>
                    <TableCell><Badge variant="outline">{m.provider}</Badge></TableCell>
                    <TableCell>{m.priority}</TableCell>
                    <TableCell>R$ {(m.cost_per_1k_tokens || 0).toFixed(2)}</TableCell>
                    <TableCell>{m.avg_response_time}ms</TableCell>
                    <TableCell>{(m.success_rate || 0).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Switch checked={m.active} onCheckedChange={() => toggleModel(m.id, m.active)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
