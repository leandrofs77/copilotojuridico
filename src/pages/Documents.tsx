import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [caseFilter, setCaseFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [docsRes, casesRes] = await Promise.all([
        supabase.from("documents").select("*, cases(title)").order("created_at", { ascending: false }),
        supabase.from("cases").select("id, title").order("title"),
      ]);
      setDocuments(docsRes.data ?? []);
      setCases(casesRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = caseFilter === "all" ? documents : documents.filter((d) => d.case_id === caseFilter);

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <AppLayout title="Documentos" breadcrumbs={[{ label: "Documentos" }]}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Select value={caseFilter} onValueChange={setCaseFilter}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Filtrar por caso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os casos</SelectItem>
              {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Card className="glass-card">
          <CardContent className="p-0">
            {loading ? (
              <p className="text-muted-foreground p-6">Carregando...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum documento encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Caso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/cases/${d.case_id}`)}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />{d.name}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{d.cases?.title || "—"}</Badge></TableCell>
                      <TableCell className="text-xs">{d.file_type || "—"}</TableCell>
                      <TableCell className="text-xs">{d.document_date ? format(new Date(d.document_date), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDownload(d); }}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
