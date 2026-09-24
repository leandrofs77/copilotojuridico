import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AIStatusCardProps {
  model: {
    id: string;
    provider: string;
    model_name: string;
    display_name: string | null;
    avg_response_time: number | null;
    success_rate: number | null;
    active: boolean;
  };
  executionCount?: number;
  errorRate?: number;
  lastCheck?: string | null;
}

export function AIStatusCard({ model, executionCount = 0, errorRate = 0, lastCheck }: AIStatusCardProps) {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"online" | "instável" | "offline">(
    model.active ? (errorRate > 10 ? "instável" : "online") : "offline"
  );
  const [latency, setLatency] = useState<number | null>(null);

  const statusConfig = {
    online: { color: "bg-green-500", icon: Wifi, label: "Online", badge: "default" as const },
    instável: { color: "bg-yellow-500", icon: AlertTriangle, label: "Instável", badge: "secondary" as const },
    offline: { color: "bg-red-500", icon: WifiOff, label: "Offline", badge: "destructive" as const },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-ai-connection", {
        body: { model: model.model_name },
      });
      if (error) throw error;
      setLatency(data.latency_ms);
      setStatus(data.status === "online" ? "online" : "offline");
      toast({ title: "Teste concluído", description: `Latência: ${data.latency_ms}ms — ${data.status}` });
    } catch (err: any) {
      setStatus("offline");
      toast({ title: "Falha no teste", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{model.display_name || model.model_name}</CardTitle>
        <Badge variant={config.badge} className="gap-1">
          <span className={`h-2 w-2 rounded-full ${config.color}`} />
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Provedor</p>
            <p className="font-medium">{model.provider}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tempo Médio</p>
            <p className="font-medium">{latency ?? model.avg_response_time ?? "—"}ms</p>
          </div>
          <div>
            <p className="text-muted-foreground">Execuções</p>
            <p className="font-medium">{executionCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Taxa de Erro</p>
            <p className="font-medium">{errorRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Taxa de Sucesso</p>
            <p className="font-medium">{(model.success_rate ?? 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Última Verificação</p>
            <p className="font-medium text-xs">{lastCheck ? new Date(lastCheck).toLocaleString("pt-BR") : "—"}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="w-full" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <StatusIcon className="h-4 w-4 mr-2" />}
          Testar Conexão
        </Button>
      </CardContent>
    </Card>
  );
}
