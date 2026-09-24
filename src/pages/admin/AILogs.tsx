import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AILogTable } from "@/components/admin/ai/AILogTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function AILogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterModel, setFilterModel] = useState("all");
  const [filterTool, setFilterTool] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => { load(); }, [filterModel, filterStatus]);

  const load = async () => {
    let query = supabase.from("ai_execution_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (filterModel !== "all") query = query.eq("model_used", filterModel);
    if (filterStatus === "error") query = query.neq("status", "success");
    if (filterStatus === "success") query = query.eq("status", "success");
    const { data } = await query;
    const items = data || [];
    setLogs(items);
    setTotalCost(items.reduce((sum: number, l: any) => sum + (l.estimated_cost || 0), 0));
  };

  const filteredLogs = filterTool
    ? logs.filter((l) => l.tool_name?.toLowerCase().includes(filterTool.toLowerCase()))
    : logs;

  return (
    <AppLayout title="Logs de Execução de IA" breadcrumbs={[{ label: "Administração" }, { label: "Logs de Execução" }]}>
      <div className="flex flex-wrap gap-4 mb-4">
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por modelo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os modelos</SelectItem>
            <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
            <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
            <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
            <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
            <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Filtrar por ferramenta..." value={filterTool} onChange={(e) => setFilterTool(e.target.value)} className="w-48" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erros</SelectItem>
          </SelectContent>
        </Select>
        <Card className="ml-auto">
          <CardContent className="py-2 px-4">
            <p className="text-xs text-muted-foreground">Custo total estimado</p>
            <p className="text-lg font-bold">R$ {totalCost.toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>
      <AILogTable logs={filteredLogs} />
    </AppLayout>
  );
}
