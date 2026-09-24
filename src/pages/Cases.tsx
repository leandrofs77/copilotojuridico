import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Cases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchCases = async () => {
      let query = supabase.from("cases").select("*").order("updated_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      if (search) query = query.ilike("title", `%${search}%`);
      const { data } = await query;
      setCases(data ?? []);
      setLoading(false);
    };
    fetchCases();
  }, [user, search, statusFilter]);

  const statusColors: Record<string, string> = {
    ativo: "bg-success/10 text-success border-success/20",
    pendente: "bg-warning/10 text-warning border-warning/20",
    arquivado: "bg-muted text-muted-foreground",
    encerrado: "bg-muted text-muted-foreground",
  };

  return (
    <AppLayout title="Casos" breadcrumbs={[{ label: "Casos" }]}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar casos..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="arquivado">Arquivado</SelectItem>
              <SelectItem value="encerrado">Encerrado</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/cases/new")}>
            <Plus className="h-4 w-4 mr-1" /> Novo Caso
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : cases.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum caso encontrado</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/cases/new")}>
                Criar primeiro caso
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c) => (
              <Card key={c.id} className="glass-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-semibold text-foreground truncate pr-2">{c.title}</h3>
                    <Badge variant="outline" className={`shrink-0 ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {c.legal_area && <Badge variant="secondary" className="text-xs">{c.legal_area}</Badge>}
                    <span>{format(new Date(c.updated_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
