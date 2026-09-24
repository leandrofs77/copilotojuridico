import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AIStatusCard } from "@/components/admin/ai/AIStatusCard";
import { supabase } from "@/integrations/supabase/client";

export default function AIStatus() {
  const [models, setModels] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, { count: number; errors: number; lastCheck: string | null }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: modelsData } = await supabase.from("ai_models").select("*").order("priority");
    setModels(modelsData || []);

    const { data: logs } = await supabase
      .from("ai_execution_logs")
      .select("model_used, status, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const s: Record<string, { count: number; errors: number; lastCheck: string | null }> = {};
    (logs || []).forEach((log: any) => {
      const key = log.model_used || "unknown";
      if (!s[key]) s[key] = { count: 0, errors: 0, lastCheck: null };
      s[key].count++;
      if (log.status !== "success") s[key].errors++;
      if (!s[key].lastCheck || log.created_at > s[key].lastCheck) s[key].lastCheck = log.created_at;
    });
    setStats(s);
  };

  return (
    <AppLayout title="Status das APIs de IA" breadcrumbs={[{ label: "Administração" }, { label: "Status das IAs" }]}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => {
          const s = stats[model.model_name] || { count: 0, errors: 0, lastCheck: null };
          const errorRate = s.count > 0 ? (s.errors / s.count) * 100 : 0;
          return (
            <AIStatusCard
              key={model.id}
              model={model}
              executionCount={s.count}
              errorRate={errorRate}
              lastCheck={s.lastCheck}
            />
          );
        })}
      </div>
    </AppLayout>
  );
}
