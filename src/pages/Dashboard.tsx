import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Clock, Activity, Plus, History, Cpu, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalCases: number;
  totalDocuments: number;
  totalEvents: number;
  recentCases: any[];
  recentActivities: any[];
  pendingAnalysis: number;
  processingAnalysis: number;
  completedAnalysis: number;
  errorAnalysis: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0, totalDocuments: 0, totalEvents: 0, recentCases: [], recentActivities: [],
    pendingAnalysis: 0, processingAnalysis: 0, completedAnalysis: 0, errorAnalysis: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [casesRes, docsRes, eventsRes, recentRes, activityRes, pendingRes, processingRes, completedRes, errorRes] = await Promise.all([
        supabase.from("cases").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("extracted_events").select("id", { count: "exact", head: true }),
        supabase.from("cases").select("*").order("updated_at", { ascending: false }).limit(5),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("analysis_status", "pending"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("analysis_status", "processing"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("analysis_status", "completed"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("analysis_status", "error"),
      ]);
      setStats({
        totalCases: casesRes.count ?? 0,
        totalDocuments: docsRes.count ?? 0,
        totalEvents: eventsRes.count ?? 0,
        recentCases: recentRes.data ?? [],
        recentActivities: activityRes.data ?? [],
        pendingAnalysis: pendingRes.count ?? 0,
        processingAnalysis: processingRes.count ?? 0,
        completedAnalysis: completedRes.count ?? 0,
        errorAnalysis: errorRes.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const statusColors: Record<string, string> = {
    ativo: "bg-success/10 text-success border-success/20",
    pendente: "bg-warning/10 text-warning border-warning/20",
    arquivado: "bg-muted text-muted-foreground border-border",
    encerrado: "bg-muted text-muted-foreground border-border",
  };

  const summaryCards = [
    { label: "Casos", value: stats.totalCases, icon: Briefcase, color: "text-primary" },
    { label: "Documentos", value: stats.totalDocuments, icon: FileText, color: "text-accent" },
    { label: "Eventos", value: stats.totalEvents, icon: Clock, color: "text-success" },
  ];

  return (
    <AppLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-lg bg-muted ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-display font-bold">{loading ? "..." : card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* PROCESSAMENTO DE DOCUMENTOS */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Cpu className="h-5 w-5" /> Processamento de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.pendingAnalysis}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <div>
                  <p className="text-xs text-muted-foreground">Processando</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.processingAnalysis}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Processados</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.completedAnalysis}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Erro</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.errorAnalysis}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Casos Recentes</CardTitle>
            <Button size="sm" onClick={() => navigate("/cases/new")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Caso
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : stats.recentCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum caso encontrado.</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate("/cases/new")}>
                  Criar primeiro caso
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentCases.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.legal_area && `${c.legal_area} · `}
                        {format(new Date(c.updated_at), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColors[c.status] || ""}>
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* ACTIVITY LOG */}
        <Card className="glass-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2"><History className="h-5 w-5" /> Última Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : stats.recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma atividade registrada.</p>
            ) : (
              <div className="space-y-2">
                {stats.recentActivities.map((a: any) => {
                  const actionLabels: Record<string, string> = {
                    case_created: "Caso criado", case_updated: "Caso atualizado", case_archived: "Caso arquivado",
                    case_deleted: "Caso excluído", document_uploaded: "Documento enviado", document_deleted: "Documento removido",
                    event_created: "Evento criado", event_updated: "Evento atualizado", event_deleted: "Evento removido",
                    report_generated: "Relatório gerado", login: "Login",
                  };
                  return (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded border border-border text-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span>{actionLabels[a.action] || a.action}</span>
                        {a.metadata?.title && <span className="text-muted-foreground truncate max-w-[200px]">— {a.metadata.title}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
