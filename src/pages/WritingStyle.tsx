import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, RefreshCw, Pen, FileText, Loader2, Trash2, BookOpen, Quote, BarChart3 } from "lucide-react";

type Profile = any;
type Document = any;

export default function WritingStyle() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [analyzeDialog, setAnalyzeDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [p, d] = await Promise.all([
      supabase
        .from("legal_writing_profiles")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("documents")
        .select("id, name, case_id, extracted_text, file_type")
        .not("extracted_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setProfiles(p.data ?? []);
    setDocuments(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !profileName.trim()) return;
    const { error } = await supabase.from("legal_writing_profiles").insert({
      user_id: user.id,
      profile_name: profileName.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Perfil criado");
      setCreateDialog(false);
      setProfileName("");
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("legal_writing_profiles").delete().eq("id", id);
    toast.success("Perfil removido");
    fetchData();
  };

  const openAnalyze = (profile: Profile) => {
    setSelectedProfile(profile);
    setSelectedDocIds([]);
    setAnalyzeDialog(true);
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const handleAnalyze = async () => {
    if (!selectedProfile || selectedDocIds.length === 0) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-writing-style", {
        body: { profile_id: selectedProfile.id, document_ids: selectedDocIds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Estilo analisado com ${data.documents_analyzed} documentos`);
      setAnalyzeDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro na análise");
    } finally {
      setAnalyzing(false);
    }
  };

  const renderStyleCard = (profile: Profile) => {
    const vocab = profile.vocabulary_patterns || {};
    const structure = profile.structure_patterns || {};
    const args = profile.argument_patterns || {};
    const phrases = profile.signature_phrases || [];
    const hasAnalysis = !!profile.style_summary;

    return (
      <Card key={profile.id} className="glass-card">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Pen className="h-4 w-4 text-primary" />
              {profile.profile_name}
            </CardTitle>
            <CardDescription>
              {profile.sample_documents_count} documento(s) analisado(s)
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => openAnalyze(profile)}>
              <RefreshCw className="h-3 w-3 mr-1" />
              {hasAnalysis ? "Reanalisar" : "Analisar"}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(profile.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        {hasAnalysis && (
          <CardContent className="space-y-4">
            {/* Summary */}
            <div>
              <Label className="text-xs text-muted-foreground">Resumo do Estilo</Label>
              <p className="text-sm mt-1">{profile.style_summary}</p>
            </div>

            {/* Tone */}
            {profile.tone && (
              <div>
                <Label className="text-xs text-muted-foreground">Tom</Label>
                <Badge variant="secondary" className="mt-1">{profile.tone}</Badge>
              </div>
            )}

            {/* Vocabulary */}
            {vocab.frequent_terms?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Vocabulário Frequente
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {vocab.frequent_terms.slice(0, 15).map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Connectives */}
            {vocab.connectives?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Conectivos Preferidos</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {vocab.connectives.slice(0, 10).map((c: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Structure */}
            {structure.document_sections?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Estrutura Típica
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {structure.document_sections.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {structure.avg_paragraph_length > 0 && (
                    <span>~{structure.avg_paragraph_length} palavras/parágrafo</span>
                  )}
                  {structure.avg_sentence_length > 0 && (
                    <span>~{structure.avg_sentence_length} palavras/frase</span>
                  )}
                </div>
              </div>
            )}

            {/* Argumentation */}
            {args.argumentation_style && (
              <div>
                <Label className="text-xs text-muted-foreground">Estilo de Argumentação</Label>
                <p className="text-sm mt-1">{args.argumentation_style}</p>
              </div>
            )}

            {/* Signature phrases */}
            {phrases.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Quote className="h-3 w-3" /> Frases Características
                </Label>
                <ul className="mt-1 space-y-1">
                  {phrases.slice(0, 8).map((p: string, i: number) => (
                    <li key={i} className="text-sm italic text-muted-foreground">"{p}"</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <AppLayout
      title="Estilo de Redação Jurídica"
      breadcrumbs={[{ label: "Estilo de Redação" }]}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Crie perfis de estilo para que a IA reproduza seu padrão de escrita ao gerar documentos.
          </p>
          <Dialog open={createDialog} onOpenChange={setCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Novo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Perfil de Estilo</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome do Perfil *</Label>
                  <Input
                    placeholder="Ex: Petições Trabalhistas"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreate} disabled={!profileName.trim()}>
                  Criar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : profiles.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Pen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum perfil de estilo criado.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um perfil e envie documentos para análise de estilo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {profiles.map(renderStyleCard)}
          </div>
        )}
      </div>

      {/* Analyze dialog */}
      <Dialog open={analyzeDialog} onOpenChange={setAnalyzeDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Documentos para Análise</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Selecione documentos que representam seu estilo de escrita. Documentos com texto extraído aparecerão aqui.
          </p>
          <div className="space-y-2 mt-2">
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum documento com texto extraído disponível.
              </p>
            ) : (
              documents.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDocIds.includes(doc.id)}
                    onCheckedChange={() => toggleDoc(doc.id)}
                  />
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{doc.name}</span>
                </label>
              ))
            )}
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={selectedDocIds.length === 0 || analyzing}
            className="mt-3"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" /> Analisando...
              </>
            ) : (
              `Analisar ${selectedDocIds.length} documento(s)`
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
