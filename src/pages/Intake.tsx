import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, CheckCircle, AlertTriangle, XCircle, ArrowRight,
  FileSearch, Upload, X, FileText, Image as ImageIcon,
} from "lucide-react";

const legalAreas = [
  "Civil", "Penal", "Trabalhista", "Tributário", "Administrativo",
  "Constitucional", "Empresarial", "Família", "Consumidor", "Ambiental", "Outro",
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const viabilityColors: Record<string, string> = {
  alta: "bg-success/10 text-success border-success/20",
  media: "bg-warning/10 text-warning border-warning/20",
  baixa: "bg-destructive/10 text-destructive border-destructive/20",
  muito_baixa: "bg-destructive/10 text-destructive border-destructive/20",
};

const recommendationLabels: Record<string, { label: string; icon: any; color: string }> = {
  aceitar: { label: "Aceitar Caso", icon: CheckCircle, color: "text-success" },
  aprofundar_analise: { label: "Aprofundar Análise", icon: FileSearch, color: "text-warning" },
  recusar: { label: "Recusar", icon: XCircle, color: "text-destructive" },
  solicitar_documentos: { label: "Solicitar Documentos", icon: AlertTriangle, color: "text-warning" },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export default function Intake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [legalArea, setLegalArea] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedIntake, setSelectedIntake] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("case_intake_analysis")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setIntakes(data || []);
    setLoadingHistory(false);
  };

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid: File[] = [];
    Array.from(incoming).forEach((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`Tipo não suportado: ${f.name}`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`Arquivo muito grande: ${f.name} (máx 20MB)`);
        return;
      }
      valid.push(f);
    });
    setFiles((prev) => {
      const names = new Set(prev.map((p) => p.name));
      return [...prev, ...valid.filter((v) => !names.has(v.name))];
    });
  }, []);

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const uploadFilesToStorage = async (): Promise<Array<{ name: string; file_type: string; file_size: number; file_path: string }>> => {
    if (!user || files.length === 0) return [];
    const ts = Date.now();
    const uploaded: Array<{ name: string; file_type: string; file_size: number; file_path: string }> = [];

    for (const file of files) {
      const path = `${user.id}/intake/${ts}_${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }
      uploaded.push({ name: file.name, file_type: file.type, file_size: file.size, file_path: path });
    }
    return uploaded;
  };

  const handleAnalyze = async () => {
    if (!description.trim()) { toast.error("Descreva o problema"); return; }
    setAnalyzing(true);
    setResult(null);
    setResultId(null);

    // Upload files first
    const uploadedDocs = await uploadFilesToStorage();

    const { data, error } = await supabase.functions.invoke("case-intake-analyze", {
      body: { description, legal_area: legalArea, uploaded_documents: uploadedDocs },
    });

    setAnalyzing(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro na análise");
      return;
    }

    setResult(data);
    setResultId(data.id || null);
    setFiles([]);
    toast.success("Triagem concluída!");
    fetchHistory();
  };

  const handleConvertToCase = async () => {
    if (!user || !resultId) return;
    const intake = result || selectedIntake;
    if (!intake) return;

    const { data: newCase, error } = await supabase.from("cases").insert({
      user_id: user.id,
      title: `Caso — ${legalArea || intake.legal_area || "Triagem"}`,
      description: intake.description || description,
      legal_area: legalArea || intake.legal_area || null,
      status: "ativo" as any,
      created_by: user.id,
    }).select("id").single();

    if (error) { toast.error(error.message); return; }

    // Create document records for uploaded files
    const docs = intake.uploaded_documents as any[] | null;
    if (docs && docs.length > 0) {
      const docRows = docs.map((d: any) => ({
        user_id: user.id,
        case_id: newCase.id,
        name: d.name,
        file_type: d.file_type,
        file_size: d.file_size,
        file_path: d.file_path,
        source: "intake",
        created_by: user.id,
      }));
      await supabase.from("documents").insert(docRows);
    }

    await supabase.from("case_intake_analysis").update({
      status: "converted",
      converted_case_id: newCase.id,
    }).eq("id", resultId);

    toast.success("Caso criado a partir da triagem!");
    navigate(`/cases/${newCase.id}`);
  };

  const viewIntake = (intake: any) => {
    setSelectedIntake(intake);
    setResult(intake);
    setResultId(intake.id);
    setDescription(intake.description || "");
    setLegalArea(intake.legal_area || "");
    setFiles([]);
  };

  const activeResult = result || selectedIntake;

  return (
    <AppLayout title="Triagem de Caso" breadcrumbs={[{ label: "Triagem" }]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Nova Triagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Área do Direito</Label>
                <Select value={legalArea} onValueChange={setLegalArea}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {legalAreas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição do Problema *</Label>
                <Textarea
                  placeholder="Descreva o problema do cliente, incluindo fatos relevantes, documentos disponíveis, prazos conhecidos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[160px]"
                />
              </div>

              {/* File Upload */}
              <div>
                <Label>Documentos (opcional)</Label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arraste arquivos aqui ou <span className="text-primary font-medium">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG — máx 20MB cada</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50 border border-border">
                        {fileIcon(f.type)}
                        <span className="flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(f.name); }} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleAnalyze} disabled={analyzing || !description.trim()} className="w-full">
                {analyzing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analisando...</> : "Analisar Caso"}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {activeResult && activeResult.viability_level && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display">Resultado da Triagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Viabilidade</p>
                    <Badge className={viabilityColors[activeResult.viability_level] || ""}>{activeResult.viability_level}</Badge>
                  </div>
                  <div className="text-center p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Complexidade</p>
                    <Badge variant="outline">{activeResult.complexity_level}</Badge>
                  </div>
                  <div className="text-center p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Duração Est.</p>
                    <span className="text-sm font-medium">{activeResult.estimated_duration}</span>
                  </div>
                  <div className="text-center p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Prob. Êxito</p>
                    <Badge className={viabilityColors[activeResult.success_probability] || ""}>{activeResult.success_probability}</Badge>
                  </div>
                </div>

                {/* Recommendation */}
                {activeResult.recommendation && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                    {(() => {
                      const rec = recommendationLabels[activeResult.recommendation];
                      const Icon = rec?.icon || AlertTriangle;
                      return (
                        <>
                          <Icon className={`h-6 w-6 ${rec?.color || "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium">{rec?.label || activeResult.recommendation}</p>
                            <p className="text-xs text-muted-foreground">Recomendação da IA</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Uploaded docs indicator */}
                {activeResult.uploaded_documents && (activeResult.uploaded_documents as any[]).length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Documentos Anexados</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(activeResult.uploaded_documents as any[]).map((d: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs gap-1">
                          <FileText className="h-3 w-3" />
                          {d.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {activeResult.analysis_summary && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Resumo da Análise</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{activeResult.analysis_summary}</p>
                  </div>
                )}

                {/* Risk Factors */}
                {activeResult.risk_factors && activeResult.risk_factors.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Fatores de Risco</Label>
                    <div className="mt-2 space-y-2">
                      {(activeResult.risk_factors as any[]).map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant={r.severity === "alto" ? "destructive" : r.severity === "medio" ? "secondary" : "outline"} className="text-[10px]">{r.severity}</Badge>
                          <span>{r.factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {activeResult.strengths && activeResult.strengths.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Pontos Fortes</Label>
                    <div className="mt-2 space-y-2">
                      {(activeResult.strengths as any[]).map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-[10px] border-success/40 text-success">{s.impact}</Badge>
                          <span>{s.point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {activeResult.status !== "converted" && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <Button onClick={handleConvertToCase} disabled={!resultId}>
                      <ArrowRight className="h-4 w-4 mr-1" /> Converter em Caso
                    </Button>
                  </div>
                )}
                {activeResult.status === "converted" && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" />
                    Convertido em caso
                    {activeResult.converted_case_id && (
                      <Button variant="link" size="sm" onClick={() => navigate(`/cases/${activeResult.converted_case_id}`)}>
                        Ver caso →
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* History */}
        <div>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-display">Histórico de Triagens</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : intakes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma triagem realizada.</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {intakes.map((intake) => (
                    <div
                      key={intake.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedIntake?.id === intake.id ? "border-primary bg-primary/5" : "border-border"}`}
                      onClick={() => viewIntake(intake)}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{intake.legal_area || "—"}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(intake.created_at), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs mt-1 line-clamp-2">{intake.description?.slice(0, 100)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {intake.viability_level && (
                          <Badge className={`text-[9px] ${viabilityColors[intake.viability_level] || ""}`}>
                            {intake.viability_level}
                          </Badge>
                        )}
                        {intake.status === "converted" && (
                          <Badge variant="outline" className="text-[9px] text-success border-success/30">Convertido</Badge>
                        )}
                        {intake.uploaded_documents && (intake.uploaded_documents as any[]).length > 0 && (
                          <Badge variant="outline" className="text-[9px] gap-0.5">
                            <FileText className="h-2.5 w-2.5" />
                            {(intake.uploaded_documents as any[]).length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
