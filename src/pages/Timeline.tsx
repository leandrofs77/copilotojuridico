import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Timeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [caseFilter, setCaseFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [evRes, casesRes] = await Promise.all([
        supabase.from("extracted_events").select("*, cases(title), documents(name)").order("event_date"),
        supabase.from("cases").select("id, title").order("title"),
      ]);
      setEvents(evRes.data ?? []);
      setCases(casesRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = caseFilter === "all" ? events : events.filter((e) => e.case_id === caseFilter);

  const evidenceLabels: Record<string, string> = { documental: "Documental", testemunhal: "Testemunhal", pericial: "Pericial", digital: "Digital", outro: "Outro" };
  const confidenceColors: Record<string, string> = { alto: "text-success", medio: "text-warning", baixo: "text-destructive" };

  return (
    <AppLayout title="Timeline Global" breadcrumbs={[{ label: "Timeline" }]}>
      <div className="space-y-4">
        <Select value={caseFilter} onValueChange={setCaseFilter}>
          <SelectTrigger className="w-60"><SelectValue placeholder="Filtrar por caso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os casos</SelectItem>
            {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card className="glass-card"><CardContent className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum evento encontrado.</p>
          </CardContent></Card>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
            {filtered.map((ev) => (
              <div key={ev.id} className="relative cursor-pointer" onClick={() => navigate(`/cases/${ev.case_id}`)}>
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(ev.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">{ev.cases?.title}</Badge>
                      <Badge variant="outline" className="text-xs">{evidenceLabels[ev.evidence_type] || ev.evidence_type}</Badge>
                    </div>
                  </div>
                  {ev.description && <p className="text-sm text-muted-foreground mt-2">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
