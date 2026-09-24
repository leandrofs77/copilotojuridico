import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Briefcase, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ cases: any[]; documents: any[]; events: any[] }>({ cases: [], documents: [], events: [] });
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!user || !query.trim()) return;
    const q = `%${query}%`;
    const [casesRes, docsRes, eventsRes] = await Promise.all([
      supabase.from("cases").select("*").or(`title.ilike.${q},description.ilike.${q}`).limit(20),
      supabase.from("documents").select("*, cases(title)").or(`name.ilike.${q},source.ilike.${q}`).limit(20),
      supabase.from("extracted_events").select("*, cases(title)").or(`title.ilike.${q},description.ilike.${q}`).limit(20),
    ]);
    setResults({ cases: casesRes.data ?? [], documents: docsRes.data ?? [], events: eventsRes.data ?? [] });
    setSearched(true);
  };

  const total = results.cases.length + results.documents.length + results.events.length;

  return (
    <AppLayout title="Busca" breadcrumbs={[{ label: "Busca" }]}>
      <div className="space-y-4 max-w-3xl">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar em casos, documentos e eventos..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </form>

        {searched && (
          <p className="text-sm text-muted-foreground">{total} resultado(s) encontrado(s)</p>
        )}

        {results.cases.length > 0 && (
          <div>
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Casos</h3>
            <div className="space-y-2">
              {results.cases.map((c) => (
                <Card key={c.id} className="glass-card cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/cases/${c.id}`)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="font-medium">{c.title}</span>
                    <Badge variant="outline">{c.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.documents.length > 0 && (
          <div>
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Documentos</h3>
            <div className="space-y-2">
              {results.documents.map((d) => (
                <Card key={d.id} className="glass-card cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/cases/${d.case_id}`)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span>{d.name}</span>
                    <Badge variant="secondary" className="text-xs">{d.cases?.title}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.events.length > 0 && (
          <div>
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> Eventos</h3>
            <div className="space-y-2">
              {results.events.map((e) => (
                <Card key={e.id} className="glass-card cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/cases/${e.case_id}`)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{e.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">{format(new Date(e.event_date), "dd/MM/yyyy")}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{e.cases?.title}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {searched && total === 0 && (
          <Card className="glass-card"><CardContent className="text-center py-12 text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum resultado para "{query}".</p>
          </CardContent></Card>
        )}
      </div>
    </AppLayout>
  );
}
