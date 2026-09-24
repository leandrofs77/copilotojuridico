import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [caseData, setCaseData] = useState<any>(null);
  const [parties, setParties] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("cases").select("id, title").order("title").then(({ data }) => setCases(data ?? []));
  }, [user]);

  useEffect(() => {
    if (!selectedCase) return;
    setLoading(true);
    Promise.all([
      supabase.from("cases").select("*").eq("id", selectedCase).single(),
      supabase.from("case_parties").select("*").eq("case_id", selectedCase),
      supabase.from("documents").select("*").eq("case_id", selectedCase),
      supabase.from("extracted_events").select("*").eq("case_id", selectedCase).order("event_date"),
    ]).then(([c, p, d, e]) => {
      setCaseData(c.data);
      setParties(p.data ?? []);
      setDocuments(d.data ?? []);
      setEvents(e.data ?? []);
      setLoading(false);
    });
  }, [selectedCase]);

  const partyLabels: Record<string, string> = { autor: "Autor", reu: "Réu", testemunha: "Testemunha", perito: "Perito", advogado: "Advogado", juiz: "Juiz", outro: "Outro" };

  return (
    <AppLayout title="Relatórios" breadcrumbs={[{ label: "Relatórios" }]}>
      <div className="space-y-4">
        <Select value={selectedCase} onValueChange={setSelectedCase}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Selecione um caso para gerar relatório" /></SelectTrigger>
          <SelectContent>{cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>

        {!selectedCase ? (
          <Card className="glass-card"><CardContent className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Selecione um caso para visualizar o relatório.</p>
          </CardContent></Card>
        ) : loading ? (
          <p className="text-muted-foreground">Gerando relatório...</p>
        ) : caseData ? (
          <div className="space-y-4 max-w-3xl">
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-display">Relatório: {caseData.title}</CardTitle>
                <Button size="sm" onClick={async () => {
                  if (!user) return;
                  const contentJson = { case: caseData, parties, documents, events };
                  const contentText = [
                    `Relatório: ${caseData.title}`,
                    `Status: ${caseData.status}`,
                    caseData.description ? `Descrição: ${caseData.description}` : '',
                    `Partes (${parties.length}): ${parties.map((p: any) => `${p.name} (${p.party_type})`).join(', ')}`,
                    `Eventos (${events.length}): ${events.map((e: any) => `${e.event_date} - ${e.title}`).join('; ')}`,
                    `Documentos (${documents.length}): ${documents.map((d: any) => d.name).join(', ')}`,
                  ].filter(Boolean).join('\n');
                  const { data, error } = await supabase.from("reports").insert({
                    case_id: selectedCase, user_id: user.id, title: `Relatório - ${caseData.title}`,
                    report_type: "completo" as any, content_json: contentJson, content_text: contentText,
                    summary: caseData.description || null, status: "gerado" as any,
                    generated_by_ai: false, created_by: user.id,
                  }).select().single();
                  if (error) toast.error("Erro ao salvar: " + error.message);
                  else {
                    await supabase.from("activity_logs").insert({
                      user_id: user.id, action: "report_generated" as any, entity_type: "report",
                      entity_id: data.id, case_id: selectedCase, metadata: { title: caseData.title },
                    });
                    toast.success("Relatório salvo com sucesso!");
                  }
                }}>Salvar Relatório</Button>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <section>
                  <h3 className="font-semibold text-base mb-2">1. Resumo do Caso</h3>
                  <p>{caseData.description || "Sem descrição disponível."}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge variant="outline">{caseData.status}</Badge>
                    {caseData.legal_area && <Badge variant="secondary">{caseData.legal_area}</Badge>}
                    {caseData.case_number && <span className="text-muted-foreground">Processo nº {caseData.case_number}</span>}
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">2. Partes Envolvidas ({parties.length})</h3>
                  {parties.length > 0 ? (
                    <ul className="space-y-1">{parties.map((p: any) => <li key={p.id}>• <strong>{p.name}</strong> — {partyLabels[p.party_type] || p.party_type}</li>)}</ul>
                  ) : <p className="text-muted-foreground">Nenhuma parte registrada.</p>}
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">3. Cronologia dos Fatos ({events.length} eventos)</h3>
                  {events.length > 0 ? (
                    <ul className="space-y-1">{events.map((e: any) => <li key={e.id}>• <strong>{format(new Date(e.event_date), "dd/MM/yyyy")}</strong> — {e.title}</li>)}</ul>
                  ) : <p className="text-muted-foreground">Nenhum evento registrado.</p>}
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">4. Documentos Anexados ({documents.length})</h3>
                  {documents.length > 0 ? (
                    <ul className="space-y-1">{documents.map((d: any) => <li key={d.id}>• {d.name} {d.source ? `(${d.source})` : ""}</li>)}</ul>
                  ) : <p className="text-muted-foreground">Nenhum documento anexado.</p>}
                </section>

                {caseData.observations && (
                  <section>
                    <h3 className="font-semibold text-base mb-2">5. Observações</h3>
                    <p>{caseData.observations}</p>
                  </section>
                )}

                <div className="border-t pt-4 text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Relatório gerado em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}. Estrutura preparada para dossiê automático via IA.
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
