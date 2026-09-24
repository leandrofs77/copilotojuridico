import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Trash2, Upload, Download, FileText, Clock, Users, Edit, Archive, Loader2,
  AlertCircle, AlertTriangle, Cloud, CloudOff, ExternalLink, HardDrive, BarChart3,
  CheckCircle, Shield, Swords, Target, Scale, AlertOctagon, ClipboardCheck, Check,
  X, MessageSquare, Zap, Timer, Flame, Map, RefreshCw, TrendingUp, Brain,
  BookOpen, Lightbulb, Link2, Copy, Search, Sparkles, Star, EyeOff, Eye, Filter,
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import ExternalFilePicker from "@/components/ExternalFilePicker";

type CaseData = any;
type PartyData = any;
type DocumentData = any;
type EventData = any;

const partyTypes = [
  { value: "autor", label: "Autor" },
  { value: "reu", label: "Réu" },
  { value: "testemunha", label: "Testemunha" },
  { value: "perito", label: "Perito" },
  { value: "advogado", label: "Advogado" },
  { value: "juiz", label: "Juiz" },
  { value: "outro", label: "Outro" },
];

const evidenceTypes = [
  { value: "documental", label: "Documental" },
  { value: "testemunhal", label: "Testemunhal" },
  { value: "pericial", label: "Pericial" },
  { value: "digital", label: "Digital" },
  { value: "outro", label: "Outro" },
];

const confidenceLevels = [
  { value: "alto", label: "Alto" },
  { value: "medio", label: "Médio" },
  { value: "baixo", label: "Baixo" },
];

const relevanceLevels = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const sourceTypes = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
  { value: "document", label: "Documento" },
  { value: "other", label: "Outro" },
];

const strengthBadge = (val: string | undefined) => {
  if (!val) return "bg-muted text-muted-foreground";
  const m: Record<string, string> = {
    fraca: "bg-destructive/10 text-destructive border-destructive/20",
    moderada: "bg-warning/10 text-warning border-warning/20",
    forte: "bg-success/10 text-success border-success/20",
    muito_forte: "bg-success/10 text-success border-success/20",
    muito_baixa: "bg-destructive/10 text-destructive border-destructive/20",
    baixa: "bg-destructive/10 text-destructive border-destructive/20",
    alta: "bg-success/10 text-success border-success/20",
    muito_alta: "bg-success/10 text-success border-success/20",
    low: "bg-success/10 text-success border-success/20",
    moderate: "bg-warning/10 text-warning border-warning/20",
    high: "bg-destructive/10 text-destructive border-destructive/20",
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    expired: "bg-destructive/10 text-destructive border-destructive/20",
    none: "bg-success/10 text-success border-success/20",
    extrema: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return m[val] || "bg-muted text-muted-foreground";
};

const scoreColor = (score: number) => {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-destructive";
};

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [parties, setParties] = useState<PartyData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viability, setViability] = useState<any>(null);
  const [viabilityLoading, setViabilityLoading] = useState(false);
  const [strategic, setStrategic] = useState<any>(null);
  const [strategicLoading, setStrategicLoading] = useState(false);
  const [evidenceChecklist, setEvidenceChecklist] = useState<any[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // Simulator state
  const [simulation, setSimulation] = useState<any>(null);
  const [temporalAnalysis, setTemporalAnalysis] = useState<any>(null);
  const [conflictAnalysis, setConflictAnalysis] = useState<any>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [contextSignals, setContextSignals] = useState<any[]>([]);
  const [signalForm, setSignalForm] = useState({ source_type: "whatsapp", content: "" });

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  // Knowledge state
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([]);
  const [similarCases, setSimilarCases] = useState<any[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [manualKnowledgeDialog, setManualKnowledgeDialog] = useState(false);
  const [editKnowledgeDialog, setEditKnowledgeDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [manualForm, setManualForm] = useState({ title: "", content: "", entry_type: "argument", tags: "", outcome: "pending", legal_area: "" });
  const [showArchived, setShowArchived] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [reusableArgs, setReusableArgs] = useState<any[]>([]);
  const [argFilters, setArgFilters] = useState({ legal_area: "", entry_type: "", outcome: "", search: "" });

  // External storage state
  const [externalConnections, setExternalConnections] = useState<any[]>([]);
  const [importPickerOpen, setImportPickerOpen] = useState(false);
  const [importPickerConn, setImportPickerConn] = useState<any>(null);
  const [exportPickerOpen, setExportPickerOpen] = useState(false);
  const [exportDoc, setExportDoc] = useState<any>(null);
  const [exportPickerConn, setExportPickerConn] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Phase 4 state
  const [radar, setRadar] = useState<any>(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [nextActions, setNextActions] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [processMonitoring, setProcessMonitoring] = useState<any[]>([]);
  const [processEvents, setProcessEvents] = useState<any[]>([]);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);
  const [genDocType, setGenDocType] = useState("petition_initial");
  const [genDocInstructions, setGenDocInstructions] = useState("");
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [monitorForm, setMonitorForm] = useState({ court: "", process_number: "" });

  // Party form
  const [partyDialog, setPartyDialog] = useState(false);
  const [partyForm, setPartyForm] = useState({ name: "", party_type: "outro" as string, observations: "" });

  // Document upload
  const [docDialog, setDocDialog] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", source: "", document_date: "", observations: "", storage_mode: "supabase_primary" });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Event form
  const [eventDialog, setEventDialog] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", event_date: "", evidence_type: "outro" as string,
    confidence: "medio" as string, relevance: "media" as string, document_id: "" as string, observations: "",
  });

  const fetchAll = async () => {
    if (!id || !user) return;
    const [c, p, d, e, v, s, ec, sim, temp, sig, diag, ke, sl, rd, na, gd, pm, pe, dl] = await Promise.all([
      supabase.from("cases").select("*").eq("id", id).single(),
      supabase.from("case_parties").select("*").eq("case_id", id).order("created_at"),
      supabase.from("documents").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("extracted_events").select("*, documents(name)").eq("case_id", id).order("event_date"),
      supabase.from("case_viability_analysis").select("*").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_strategic_analysis").select("*").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_evidence_checklist").select("*").eq("case_id", id).order("importance_level"),
      supabase.from("case_evidence_simulation").select("*").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_temporal_analysis").select("*").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_context_signals").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("case_visual_diagnostics").select("*").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("legal_knowledge_entries").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("knowledge_similarity_links").select("*").eq("source_case_id", id).order("similarity_score", { ascending: false }),
      supabase.from("case_strategy_radar").select("*").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_next_actions").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("generated_legal_documents").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("case_process_monitoring").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("case_process_events").select("*").eq("case_id", id).order("event_date", { ascending: false }),
      supabase.from("case_deadlines").select("*").eq("case_id", id).order("deadline_date"),
    ]);
    setCaseData(c.data);
    setParties(p.data ?? []);
    setDocuments(d.data ?? []);
    setEvents(e.data ?? []);
    setViability((v.data && v.data.length > 0) ? v.data[0] : null);
    setStrategic((s.data && s.data.length > 0) ? s.data[0] : null);
    setEvidenceChecklist(ec.data ?? []);
    setSimulation((sim.data && sim.data.length > 0) ? sim.data[0] : null);
    setTemporalAnalysis((temp.data && temp.data.length > 0) ? temp.data[0] : null);
    setContextSignals(sig.data ?? []);
    setDiagnostics((diag.data && diag.data.length > 0) ? diag.data[0] : null);
    setKnowledgeEntries(ke.data ?? []);
    setSimilarCases(sl.data ?? []);
    setRadar((rd.data && rd.data.length > 0) ? rd.data[0] : null);
    setNextActions(na.data ?? []);
    setGeneratedDocs(gd.data ?? []);
    setProcessMonitoring(pm.data ?? []);
    setProcessEvents(pe.data ?? []);
    setDeadlines(dl.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id, user]);

  // Fetch external storage connections
  useEffect(() => {
    const fetchConnections = async () => {
      if (!user) return;
      const { data } = await supabase.from("external_storage_connections").select("id, provider, provider_account_email, is_active").eq("is_active", true);
      setExternalConnections(data || []);
    };
    fetchConnections();
  }, [user]);

  const handleImportFromExternal = async (items: any[]) => {
    if (!id || !user || !importPickerConn || items.length === 0) return;
    setImporting(true);
    const files = items.map((i: any) => ({ id: i.id, name: i.name, mimeType: i.mimeType, webUrl: i.webUrl }));
    const { data, error } = await supabase.functions.invoke("external-storage-sync", {
      body: { action: "import", connection_id: importPickerConn.id, case_id: id, files },
    });
    setImporting(false);
    if (error || data?.error) { toast.error(data?.message || "Erro na importação"); return; }
    const imported = (data.results || []).filter((r: any) => r.status === "imported").length;
    const skipped = (data.results || []).filter((r: any) => r.status === "already_imported").length;
    toast.success(`${imported} arquivo(s) importado(s)${skipped > 0 ? `, ${skipped} já existente(s)` : ""}`);
    setImportPickerOpen(false);
    fetchAll();
  };

  const handleExportToExternal = async (items: any[]) => {
    if (!exportDoc || !exportPickerConn || items.length === 0) return;
    const folder = items[0];
    const { data, error } = await supabase.functions.invoke("external-storage-sync", {
      body: { action: "export", connection_id: exportPickerConn.id, document_id: exportDoc.id, folder_id: folder.id },
    });
    if (error || data?.error) { toast.error(data?.message || "Erro na exportação"); return; }
    toast.success("Documento exportado com sucesso!");
    setExportPickerOpen(false);
    if (data.web_url) window.open(data.web_url, "_blank");
  };

  const logActivity = async (action: string, entityType: string, entityId: string, caseId?: string, metadata?: any) => {
    if (!user) return;
    await supabase.from("activity_logs").insert({
      user_id: user.id, action: action as any, entity_type: entityType,
      entity_id: entityId, case_id: caseId || id || null, metadata: metadata || {},
    });
  };

  const handleAddParty = async () => {
    if (!user || !id) return;
    const { data, error } = await supabase.from("case_parties").insert({
      case_id: id, user_id: user.id, name: partyForm.name,
      party_type: partyForm.party_type as any, observations: partyForm.observations || null,
      created_by: user.id,
    }).select().single();
    if (error) toast.error(error.message);
    else { toast.success("Parte adicionada"); setPartyDialog(false); setPartyForm({ name: "", party_type: "outro", observations: "" }); fetchAll(); }
  };

  const handleDeleteParty = async (partyId: string) => {
    await supabase.from("case_parties").delete().eq("id", partyId);
    toast.success("Parte removida");
    fetchAll();
  };

  const handleUploadDoc = async () => {
    if (!user || !id || !docFile) return;
    setUploading(true);
    const filePath = `${user.id}/${id}/${Date.now()}_${docFile.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, docFile);
    if (uploadError) { toast.error("Erro no upload: " + uploadError.message); setUploading(false); return; }
    const isTemp = docForm.storage_mode === "temporary_supabase";
    const { data, error } = await supabase.from("documents").insert({
      case_id: id, user_id: user.id, name: docForm.name || docFile.name,
      file_type: docFile.type, file_path: filePath, file_size: docFile.size, mime_type: docFile.type,
      storage_path: filePath, original_filename: docFile.name, processing_status: "pendente" as any,
      source: docForm.source || null, document_date: docForm.document_date || null, observations: docForm.observations || null,
      created_by: user.id, analysis_status: 'pending', queued_for_analysis: true,
      storage_mode: docForm.storage_mode, is_temp_copy: isTemp, delete_from_supabase_after_processing: isTemp,
    }).select().single();
    setUploading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Documento enviado — análise iniciará automaticamente");
      await logActivity("document_uploaded", "document", data.id, id, { name: docForm.name || docFile.name });
      await supabase.from("document_analysis_jobs").insert({ document_id: data.id, user_id: user.id, status: "pending", priority: 5 });
      setDocDialog(false); setDocForm({ name: "", source: "", document_date: "", observations: "", storage_mode: "supabase_primary" }); setDocFile(null); fetchAll();
    }
  };

  const handleDownloadDoc = async (doc: DocumentData) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleDeleteDoc = async (doc: DocumentData) => {
    await supabase.storage.from("documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    await logActivity("document_deleted", "document", doc.id, id, { name: doc.name });
    toast.success("Documento removido");
    fetchAll();
  };

  const handleAddEvent = async () => {
    if (!user || !id) return;
    const { data, error } = await supabase.from("extracted_events").insert({
      case_id: id, user_id: user.id, title: eventForm.title,
      description: eventForm.description || null, event_date: eventForm.event_date,
      evidence_type: eventForm.evidence_type as any, confidence: eventForm.confidence as any,
      relevance: eventForm.relevance as any,
      document_id: eventForm.document_id || null, observations: eventForm.observations || null,
      source_type: "manual" as any, is_manual: true, event_category: "outro" as any, created_by: user.id,
    }).select().single();
    if (error) toast.error(error.message);
    else {
      toast.success("Evento adicionado");
      await logActivity("event_created", "event", data.id, id, { title: eventForm.title });
      setEventDialog(false);
      setEventForm({ title: "", description: "", event_date: "", evidence_type: "outro", confidence: "medio", relevance: "media", document_id: "", observations: "" });
      fetchAll();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    await supabase.from("extracted_events").delete().eq("id", eventId);
    await logActivity("event_deleted", "event", eventId, id);
    toast.success("Evento removido");
    fetchAll();
  };

  const handleAnalyzeViability = async () => {
    if (!id || !user) return;
    setViabilityLoading(true);
    const { data, error } = await supabase.functions.invoke("case-viability-analyze", { body: { case_id: id } });
    setViabilityLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro na análise de viabilidade"); return; }
    setViability(data);
    toast.success("Análise de viabilidade concluída!");
  };

  const handleAnalyzeStrategic = async () => {
    if (!id || !user) return;
    setStrategicLoading(true);
    const { data, error } = await supabase.functions.invoke("case-strategic-analyze", { body: { case_id: id } });
    setStrategicLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro na análise estratégica"); return; }
    setStrategic(data);
    toast.success("Análise estratégica concluída!");
  };

  const handleGenerateEvidenceChecklist = async () => {
    if (!id || !user) return;
    setEvidenceLoading(true);
    const { data, error } = await supabase.functions.invoke("case-evidence-checklist", { body: { case_id: id } });
    setEvidenceLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao gerar checklist de provas"); return; }
    toast.success("Checklist de provas gerado!");
    fetchAll();
  };

  const handleUpdateEvidenceItem = async (itemId: string, updates: { status?: string; notes?: string }) => {
    const { error } = await supabase.from("case_evidence_checklist").update(updates).eq("id", itemId);
    if (error) { toast.error(error.message); return; }
    setEvidenceChecklist((prev) => prev.map((item) => item.id === itemId ? { ...item, ...updates } : item));
  };

  const handleRunSimulation = async () => {
    if (!id || !user) return;
    setSimulationLoading(true);
    const { data, error } = await supabase.functions.invoke("case-evidence-simulator", { body: { case_id: id } });
    setSimulationLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro na simulação"); return; }
    // Update local state from response
    if (data.evidence_simulation) {
      setSimulation({
        current_strength: data.evidence_simulation.current_strength,
        potential_strength: data.evidence_simulation.potential_strength,
        estimated_success_probability: data.evidence_simulation.success_probability,
        missing_critical_evidence: data.evidence_simulation.missing_critical,
        missing_recommended_evidence: data.evidence_simulation.missing_recommended,
        evidence_impact_analysis: data.evidence_simulation.impact_analysis,
        simulation_summary: data.evidence_simulation.summary,
      });
    }
    if (data.temporal_analysis) {
      setTemporalAnalysis({
        possible_deadlines: data.temporal_analysis.deadlines,
        urgency_level: data.temporal_analysis.urgency_level,
        deadline_risk: data.temporal_analysis.deadline_risk,
        limitation_risk: data.temporal_analysis.limitation_risk,
        time_sensitivity_analysis: data.temporal_analysis.time_analysis,
      });
    }
    if (data.conflict_analysis) {
      setConflictAnalysis(data.conflict_analysis);
    }
    toast.success("Simulação de força do caso concluída!");

    // Auto-update diagnostics
    handleUpdateDiagnostics();
  };

  const handleAddContextSignal = async () => {
    if (!id || !user || !signalForm.content.trim()) return;
    const { error } = await supabase.from("case_context_signals").insert({
      case_id: id, user_id: user.id, source_type: signalForm.source_type, content: signalForm.content,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Contexto adicionado");
    setSignalForm({ ...signalForm, content: "" });
    fetchAll();
  };

  const handleDeleteContextSignal = async (signalId: string) => {
    await supabase.from("case_context_signals").delete().eq("id", signalId);
    toast.success("Sinal removido");
    fetchAll();
  };

  const handleUpdateDiagnostics = async () => {
    if (!id || !user) return;
    setDiagnosticsLoading(true);
    const { data, error } = await supabase.functions.invoke("update-case-diagnostics", { body: { case_id: id } });
    setDiagnosticsLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao calcular diagnóstico"); return; }
    setDiagnostics(data);
    toast.success("Mapa do caso atualizado!");
  };

  const handleBuildKnowledge = async (sourceType?: string) => {
    if (!id || !user) return;
    setKnowledgeLoading(true);
    const { data, error } = await supabase.functions.invoke("build-knowledge-entry", {
      body: { case_id: id, source_type: sourceType || null },
    });
    setKnowledgeLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao gerar conhecimento"); return; }
    toast.success(`${data.count || 0} entrada(s) de conhecimento extraída(s)!`);
    fetchAll();
  };

  const handleFindSimilarCases = async () => {
    if (!id || !user) return;
    setSimilarLoading(true);
    const { data, error } = await supabase.functions.invoke("find-similar-cases", {
      body: { case_id: id },
    });
    setSimilarLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao buscar casos semelhantes"); return; }
    setSimilarCases(data.similar_cases || []);
    toast.success(`${(data.similar_cases || []).length} caso(s) semelhante(s) encontrado(s)!`);
    fetchAll();
  };

  const handleAddManualKnowledge = async () => {
    if (!id || !user || !manualForm.title.trim() || !manualForm.content.trim()) return;
    const tags = manualForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("legal_knowledge_entries").insert({
      user_id: user.id,
      case_id: id,
      source_type: "manual",
      entry_type: manualForm.entry_type,
      title: manualForm.title,
      content: manualForm.content,
      legal_area: manualForm.legal_area || caseData?.legal_area || null,
      tags,
      outcome: manualForm.outcome || "pending",
      relevance_score: 0.5,
      is_manual: true,
      generated_by_ai: false,
      search_text: `${manualForm.title} ${manualForm.content} ${tags.join(" ")}`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Conhecimento adicionado!");
    setManualKnowledgeDialog(false);
    setManualForm({ title: "", content: "", entry_type: "argument", tags: "", outcome: "pending", legal_area: "" });
    fetchAll();
  };

  const handleDeleteKnowledge = async (entryId: string) => {
    await supabase.from("legal_knowledge_entries").delete().eq("id", entryId);
    toast.success("Entrada removida");
    fetchAll();
  };

  const handleToggleFavorite = async (entry: any) => {
    const { error } = await supabase.from("legal_knowledge_entries").update({ is_favorite: !entry.is_favorite }).eq("id", entry.id);
    if (error) { toast.error(error.message); return; }
    setKnowledgeEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_favorite: !e.is_favorite } : e));
  };

  const handleToggleArchive = async (entry: any) => {
    const { error } = await supabase.from("legal_knowledge_entries").update({ is_archived: !entry.is_archived }).eq("id", entry.id);
    if (error) { toast.error(error.message); return; }
    setKnowledgeEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_archived: !e.is_archived } : e));
  };

  const handleEditKnowledge = async () => {
    if (!editingEntry) return;
    const tags = typeof editingEntry.tags === "string" ? editingEntry.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : editingEntry.tags;
    const { error } = await supabase.from("legal_knowledge_entries").update({
      title: editingEntry.title,
      content: editingEntry.content,
      entry_type: editingEntry.entry_type,
      outcome: editingEntry.outcome,
      tags,
    }).eq("id", editingEntry.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Entrada atualizada!");
    setEditKnowledgeDialog(false);
    setEditingEntry(null);
    fetchAll();
  };

  const handleBackfillAllCases = async () => {
    if (!user) return;
    setBackfillLoading(true);
    const { data: allCases } = await supabase.from("cases").select("id").eq("user_id", user.id);
    if (!allCases) { setBackfillLoading(false); return; }
    const { data: casesWithKnowledge } = await supabase.from("legal_knowledge_entries").select("case_id").eq("user_id", user.id);
    const knownIds = new Set((casesWithKnowledge || []).map(k => k.case_id));
    const missing = allCases.filter(c => !knownIds.has(c.id));
    let count = 0;
    for (const c of missing.slice(0, 10)) {
      const { data } = await supabase.functions.invoke("build-knowledge-entry", { body: { case_id: c.id } });
      if (data?.count) count += data.count;
    }
    setBackfillLoading(false);
    toast.success(`${count} entradas geradas para ${Math.min(missing.length, 10)} caso(s)`);
    fetchAll();
  };

  const handleReindex = async () => {
    if (!id || !user) return;
    setKnowledgeLoading(true);
    await supabase.from("legal_knowledge_entries").delete().eq("case_id", id).eq("user_id", user.id).eq("is_manual", false);
    await handleBuildKnowledge();
  };

  // Fetch reusable arguments from all cases
  const fetchReusableArgs = async () => {
    if (!user) return;
    let query = supabase.from("legal_knowledge_entries").select("*").eq("user_id", user.id).neq("case_id", id || "").in("entry_type", ["thesis", "argument", "precedent"]).eq("is_archived", false).order("relevance_score", { ascending: false }).limit(50);
    if (argFilters.legal_area) query = query.eq("legal_area", argFilters.legal_area);
    if (argFilters.entry_type) query = query.eq("entry_type", argFilters.entry_type);
    if (argFilters.outcome) query = query.eq("outcome", argFilters.outcome);
    const { data } = await query;
    let filtered = data || [];
    if (argFilters.search) {
      const s = argFilters.search.toLowerCase();
      filtered = filtered.filter(e => e.title?.toLowerCase().includes(s) || e.tags?.some((t: string) => t.toLowerCase().includes(s)));
    }
    setReusableArgs(filtered);
  };

  useEffect(() => { fetchReusableArgs(); }, [user, id, argFilters]);

  const handleImportArgument = async (entry: any) => {
    if (!id || !user) return;
    const { error } = await supabase.from("legal_knowledge_entries").insert({
      user_id: user.id,
      case_id: id,
      source_type: "imported",
      source_id: entry.entry_id || entry.id,
      entry_type: entry.entry_type,
      title: entry.title,
      content: entry.content,
      legal_area: caseData?.legal_area || entry.legal_area,
      tags: entry.tags || [],
      outcome: entry.outcome || "pending",
      relevance_score: entry.relevance_score || 0.5,
      search_text: `${entry.title} ${entry.content} ${(entry.tags || []).join(" ")}`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Argumento importado para este caso!");
    fetchAll();
  };

  // Phase 4 handlers
  const handleGenerateRadar = async () => {
    if (!id || !user) return;
    setRadarLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-case-radar", { body: { case_id: id } });
    setRadarLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao gerar radar"); return; }
    toast.success("Radar estratégico atualizado!");
    fetchAll();
  };

  const handleSuggestActions = async () => {
    if (!id || !user) return;
    setActionsLoading(true);
    const { data, error } = await supabase.functions.invoke("suggest-next-actions", { body: { case_id: id } });
    setActionsLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao gerar sugestões"); return; }
    toast.success("Sugestões geradas!");
    fetchAll();
  };

  const handleCompleteAction = async (actionId: string) => {
    await supabase.from("case_next_actions").update({ status: "done" }).eq("id", actionId);
    setNextActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "done" } : a));
    toast.success("Ação concluída");
  };

  const handleDiscardAction = async (actionId: string) => {
    await supabase.from("case_next_actions").delete().eq("id", actionId);
    setNextActions(prev => prev.filter(a => a.id !== actionId));
    toast.success("Ação descartada");
  };

  const handleGenerateDocument = async () => {
    if (!id || !user) return;
    setDocsLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-legal-document", {
      body: { case_id: id, document_type: genDocType, instructions: genDocInstructions || undefined },
    });
    setDocsLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao gerar documento"); return; }
    toast.success("Documento gerado!");
    setGenDocInstructions("");
    fetchAll();
  };

  const handleAddMonitoring = async () => {
    if (!id || !user || !monitorForm.process_number) return;
    setMonitorLoading(true);
    const { error } = await supabase.from("case_process_monitoring").insert({
      case_id: id, user_id: user.id, court: monitorForm.court || null, process_number: monitorForm.process_number, status: "active",
    });
    setMonitorLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Monitoramento adicionado");
    setMonitorForm({ court: "", process_number: "" });
    fetchAll();
  };

  const handleCheckMonitoring = async (monitoringId: string) => {
    setMonitorLoading(true);
    const { data, error } = await supabase.functions.invoke("monitor-process-events", { body: { monitoring_id: monitoringId } });
    setMonitorLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao verificar movimentações"); return; }
    toast.success("Monitoramento atualizado!");
    fetchAll();
  };

  const handleCalculateDeadlines = async (eventId: string) => {
    setDeadlinesLoading(true);
    const { data, error } = await supabase.functions.invoke("calculate-deadlines", { body: { event_id: eventId } });
    setDeadlinesLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao calcular prazos"); return; }
    toast.success("Prazos calculados!");
    fetchAll();
  };

  const handleArchive = async () => {
    if (!id || !user) return;
    await supabase.from("cases").update({ status: "arquivado" as any, updated_by: user.id }).eq("id", id);
    await logActivity("case_archived", "case", id, id);
    toast.success("Caso arquivado");
    fetchAll();
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    await logActivity("case_deleted", "case", id, id, { title: caseData?.title });
    await supabase.from("cases").delete().eq("id", id);
    toast.success("Caso excluído");
    navigate("/cases");
  };

  if (loading) return <AppLayout title="Carregando..."><p className="text-muted-foreground">Carregando dados do caso...</p></AppLayout>;
  if (!caseData) return <AppLayout title="Caso não encontrado"><p>Este caso não existe ou você não tem acesso.</p></AppLayout>;

  const statusColors: Record<string, string> = {
    ativo: "bg-success/10 text-success border-success/20",
    pendente: "bg-warning/10 text-warning border-warning/20",
    arquivado: "bg-muted text-muted-foreground",
    encerrado: "bg-muted text-muted-foreground",
  };

  const confidenceColors: Record<string, string> = { alto: "text-success", medio: "text-warning", baixo: "text-destructive" };
  const relevanceColors: Record<string, string> = { alta: "text-destructive", media: "text-warning", baixa: "text-muted-foreground" };

  const radarData = diagnostics ? [
    { subject: "Provas", value: diagnostics.evidence_score, fullMark: 100 },
    { subject: "Viabilidade", value: diagnostics.viability_score, fullMark: 100 },
    { subject: "Tempo", value: diagnostics.timing_score, fullMark: 100 },
    { subject: "Urgência", value: diagnostics.urgency_score, fullMark: 100 },
    { subject: "Conflito", value: diagnostics.conflict_intensity_score, fullMark: 100 },
    { subject: "Complexidade", value: diagnostics.complexity_score, fullMark: 100 },
    { subject: "Financeiro", value: diagnostics.financial_score, fullMark: 100 },
  ] : [];

  return (
    <AppLayout breadcrumbs={[{ label: "Casos", href: "/cases" }, { label: caseData.title }]}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">{caseData.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusColors[caseData.status] || ""}>{caseData.status}</Badge>
              {caseData.legal_area && <Badge variant="secondary">{caseData.legal_area}</Badge>}
              {caseData.case_number && <span className="text-xs text-muted-foreground">Nº {caseData.case_number}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleArchive}><Archive className="h-4 w-4 mr-1" /> Arquivar</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" /> Excluir</Button>
          </div>
        </div>

        <Tabs defaultValue="summary">
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="parties">Partes ({parties.length})</TabsTrigger>
              <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline ({events.length})</TabsTrigger>
              <TabsTrigger value="viability">Viabilidade</TabsTrigger>
              <TabsTrigger value="strategic">Estratégia</TabsTrigger>
              <TabsTrigger value="evidence">Provas ({evidenceChecklist.length})</TabsTrigger>
              <TabsTrigger value="strength" className="flex items-center gap-1"><Zap className="h-3 w-3" /> Força do Caso</TabsTrigger>
              <TabsTrigger value="casemap" className="flex items-center gap-1"><Map className="h-3 w-3" /> Mapa do Caso</TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Conhecimento</TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-1"><Target className="h-3 w-3" /> Radar</TabsTrigger>
              <TabsTrigger value="assistant" className="flex items-center gap-1"><Brain className="h-3 w-3" /> Assistente</TabsTrigger>
              <TabsTrigger value="gendocs" className="flex items-center gap-1"><FileText className="h-3 w-3" /> Docs IA</TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center gap-1"><Shield className="h-3 w-3" /> Monitor</TabsTrigger>
              <TabsTrigger value="deadlines" className="flex items-center gap-1"><Timer className="h-3 w-3" /> Prazos</TabsTrigger>
              <TabsTrigger value="report">Relatório</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* SUMMARY TAB */}
          <TabsContent value="summary">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                {caseData.description && <div><Label className="text-muted-foreground text-xs">Descrição</Label><p className="mt-1">{caseData.description}</p></div>}
                {caseData.court && <div><Label className="text-muted-foreground text-xs">Vara / Tribunal</Label><p className="mt-1">{caseData.court}</p></div>}
                {caseData.observations && <div><Label className="text-muted-foreground text-xs">Observações</Label><p className="mt-1">{caseData.observations}</p></div>}
                {caseData.tags && caseData.tags.length > 0 && (
                  <div><Label className="text-muted-foreground text-xs">Tags</Label><div className="flex gap-1 mt-1">{caseData.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}</div></div>
                )}
                <div className="text-xs text-muted-foreground">Criado em {format(new Date(caseData.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PARTIES TAB */}
          <TabsContent value="parties">
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">Partes Envolvidas</CardTitle>
                <Dialog open={partyDialog} onOpenChange={setPartyDialog}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Parte</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Nome *</Label><Input value={partyForm.name} onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })} /></div>
                      <div><Label>Tipo</Label>
                        <Select value={partyForm.party_type} onValueChange={(v) => setPartyForm({ ...partyForm, party_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{partyTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Observações</Label><Textarea value={partyForm.observations} onChange={(e) => setPartyForm({ ...partyForm, observations: e.target.value })} /></div>
                      <Button onClick={handleAddParty} disabled={!partyForm.name}>Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {parties.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Nenhuma parte adicionada.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Obs</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {parties.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell><Badge variant="outline">{partyTypes.find((t) => t.value === p.party_type)?.label || p.party_type}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.observations || "—"}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteParty(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents">
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg font-display">Documentos</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {externalConnections.length > 0 && (
                    <div className="flex gap-1">
                      {externalConnections.map((conn) => (
                        <Button
                          key={conn.id}
                          size="sm"
                          variant="outline"
                          onClick={() => { setImportPickerConn(conn); setImportPickerOpen(true); }}
                          disabled={importing}
                        >
                          <Cloud className="h-3 w-3 mr-1" />
                          {conn.provider === "google_drive" ? "Google Drive" : conn.provider === "onedrive" ? "OneDrive" : "SharePoint"}
                        </Button>
                      ))}
                    </div>
                  )}
                  <Dialog open={docDialog} onOpenChange={setDocDialog}>
                    <DialogTrigger asChild><Button size="sm"><Upload className="h-4 w-4 mr-1" /> Upload</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Enviar Documento</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Arquivo *</Label><Input type="file" accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx" onChange={(e) => setDocFile(e.target.files?.[0] || null)} /></div>
                      <div><Label>Nome</Label><Input placeholder="Nome do documento" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} /></div>
                      <div><Label>Fonte</Label><Input placeholder="Ex: Tribunal, Cliente" value={docForm.source} onChange={(e) => setDocForm({ ...docForm, source: e.target.value })} /></div>
                      <div><Label>Data do Documento</Label><Input type="date" value={docForm.document_date} onChange={(e) => setDocForm({ ...docForm, document_date: e.target.value })} /></div>
                      <div><Label>Observações</Label><Textarea value={docForm.observations} onChange={(e) => setDocForm({ ...docForm, observations: e.target.value })} /></div>
                      <div><Label>Armazenamento</Label>
                        <Select value={docForm.storage_mode} onValueChange={(v) => setDocForm({ ...docForm, storage_mode: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supabase_primary"><div className="flex items-center gap-2"><HardDrive className="h-3 w-3" /> Permanente</div></SelectItem>
                            <SelectItem value="temporary_supabase"><div className="flex items-center gap-2"><CloudOff className="h-3 w-3" /> Temporário (remover após análise)</div></SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {docForm.storage_mode === "temporary_supabase"
                            ? "O arquivo será removido após a análise. Metadados e resultados serão mantidos."
                            : "O arquivo permanecerá armazenado permanentemente."}
                        </p>
                      </div>
                      <Button onClick={handleUploadDoc} disabled={!docFile || uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Enviar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Nenhum documento enviado.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Armazenamento</TableHead><TableHead>Data</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {documents.map((d) => {
                        const isDeleted = !!d.supabase_deleted_at;
                        const storageLabel = d.storage_mode === "temporary_supabase" ? "Temporário" : d.storage_mode === "external_only" ? "Externo" : "Permanente";
                        return (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground shrink-0" />{d.name}</TableCell>
                            <TableCell className="text-xs">{d.file_type || "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={d.storage_mode === "supabase_primary" ? "default" : "secondary"} className="text-[10px] w-fit">{storageLabel}</Badge>
                                {isDeleted && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><CloudOff className="h-3 w-3" /> Binário removido</span>}
                                {d.external_web_url && <a href={d.external_web_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline"><ExternalLink className="h-3 w-3" /> {d.external_provider || "Link externo"}</a>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{d.document_date ? format(new Date(d.document_date), "dd/MM/yyyy") : "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!isDeleted && d.file_path && <Button variant="ghost" size="icon" onClick={() => handleDownloadDoc(d)}><Download className="h-4 w-4" /></Button>}
                                {!isDeleted && d.file_path && externalConnections.length > 0 && (
                                  <Button variant="ghost" size="icon" title="Exportar para nuvem" onClick={() => {
                                    setExportDoc(d);
                                    setExportPickerConn(externalConnections[0]);
                                    setExportPickerOpen(true);
                                  }}><Cloud className="h-4 w-4 text-primary" /></Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMELINE TAB */}
          <TabsContent value="timeline">
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">Linha do Tempo</CardTitle>
                <Dialog open={eventDialog} onOpenChange={setEventDialog}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Evento</Button></DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                      <div><Label>Título *</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} /></div>
                      <div><Label>Data *</Label><Input type="date" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} /></div>
                      <div><Label>Descrição</Label><Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><Label className="text-xs">Tipo de Evidência</Label>
                          <Select value={eventForm.evidence_type} onValueChange={(v) => setEventForm({ ...eventForm, evidence_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{evidenceTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Confiança</Label>
                          <Select value={eventForm.confidence} onValueChange={(v) => setEventForm({ ...eventForm, confidence: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{confidenceLevels.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Relevância</Label>
                          <Select value={eventForm.relevance} onValueChange={(v) => setEventForm({ ...eventForm, relevance: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{relevanceLevels.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      {documents.length > 0 && (
                        <div><Label>Documento Relacionado</Label>
                          <Select value={eventForm.document_id} onValueChange={(v) => setEventForm({ ...eventForm, document_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                            <SelectContent>{documents.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}
                      <div><Label>Observações</Label><Textarea value={eventForm.observations} onChange={(e) => setEventForm({ ...eventForm, observations: e.target.value })} /></div>
                      <Button onClick={handleAddEvent} disabled={!eventForm.title || !eventForm.event_date}>Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Nenhum evento registrado.</p>
                ) : (
                  <div className="relative pl-6 space-y-6">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                    {events.map((ev) => (
                      <div key={ev.id} className="relative">
                        <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                        <div className="p-4 rounded-lg border border-border bg-card/50">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{ev.title}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(ev.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{evidenceTypes.find((t) => t.value === ev.evidence_type)?.label}</Badge>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteEvent(ev.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {ev.description && <p className="text-sm text-muted-foreground mt-2">{ev.description}</p>}
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className={confidenceColors[ev.confidence]}>Confiança: {confidenceLevels.find((c) => c.value === ev.confidence)?.label}</span>
                            <span className={relevanceColors[ev.relevance]}>Relevância: {relevanceLevels.find((r) => r.value === ev.relevance)?.label}</span>
                            {ev.documents && <span className="text-muted-foreground">📎 {ev.documents.name}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VIABILITY TAB */}
          <TabsContent value="viability">
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Análise de Viabilidade</CardTitle>
                <Button size="sm" onClick={handleAnalyzeViability} disabled={viabilityLoading}>
                  {viabilityLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {viability ? "Reanalisar" : "Analisar Viabilidade"}
                </Button>
              </CardHeader>
              <CardContent>
                {!viability ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">Nenhuma análise de viabilidade realizada.</p>
                    <p className="text-muted-foreground text-xs mt-1">Clique em "Analisar Viabilidade" para gerar uma avaliação com IA.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Viabilidade", value: viability.viability_level },
                        { label: "Complexidade", value: viability.complexity_level },
                        { label: "Duração Est.", value: viability.estimated_duration },
                        { label: "Prob. Êxito", value: viability.success_probability },
                      ].map((m) => (
                        <div key={m.label} className="text-center p-3 rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                          <Badge variant="outline">{m.value || "—"}</Badge>
                        </div>
                      ))}
                    </div>
                    {viability.effort_estimation && <div><Label className="text-muted-foreground text-xs">Esforço Estimado</Label><p className="mt-1 text-sm">{viability.effort_estimation}</p></div>}
                    {viability.recommendation && <div className="p-4 rounded-lg bg-muted/50 border border-border"><Label className="text-muted-foreground text-xs">Recomendação</Label><p className="mt-1 text-sm font-medium">{viability.recommendation}</p></div>}
                    {viability.analysis_summary && <div><Label className="text-muted-foreground text-xs">Resumo da Análise</Label><p className="mt-1 text-sm whitespace-pre-wrap">{viability.analysis_summary}</p></div>}
                    {viability.risk_factors && (viability.risk_factors as any[]).length > 0 && (
                      <div><Label className="text-muted-foreground text-xs">Fatores de Risco</Label><div className="mt-2 space-y-2">{(viability.risk_factors as any[]).map((r: any, i: number) => (<div key={i} className="flex items-center gap-2 text-sm"><Badge variant={r.severity === "alto" ? "destructive" : "secondary"} className="text-[10px]">{r.severity}</Badge><span>{r.factor}</span></div>))}</div></div>
                    )}
                    {viability.strengths && (viability.strengths as any[]).length > 0 && (
                      <div><Label className="text-muted-foreground text-xs">Pontos Fortes</Label><div className="mt-2 space-y-2">{(viability.strengths as any[]).map((s: any, i: number) => (<div key={i} className="flex items-center gap-2 text-sm"><CheckCircle className="h-3 w-3 text-success shrink-0" /><span>{s.point}</span><Badge variant="outline" className="text-[9px]">{s.impact}</Badge></div>))}</div></div>
                    )}
                    <p className="text-[10px] text-muted-foreground">Análise gerada em {format(new Date(viability.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STRATEGIC TAB */}
          <TabsContent value="strategic">
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Radar Estratégico</CardTitle>
                <Button size="sm" onClick={handleAnalyzeStrategic} disabled={strategicLoading}>
                  {strategicLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {strategic ? "Reanalisar" : "Gerar Análise Estratégica"}
                </Button>
              </CardHeader>
              <CardContent>
                {!strategic ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">Nenhuma análise estratégica gerada.</p>
                    <p className="text-muted-foreground text-xs mt-1">Usa modelo premium para análise profunda de teses, riscos e contra-argumentos.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                      <Scale className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Probabilidade de Êxito</p>
                        <Badge className={`mt-1 ${strategic.success_probability === "alta" ? "bg-success/10 text-success border-success/20" : strategic.success_probability === "media" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{strategic.success_probability}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-3"><Shield className="h-4 w-4 text-success" /> Pontos Fortes</h4>
                        <div className="space-y-3">
                          {((strategic.strengths as any[]) || []).map((s: any, i: number) => (<div key={i}><div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px] border-success/30 text-success">{s.impact}</Badge><span className="text-sm font-medium">{s.point}</span></div>{s.detail && <p className="text-xs text-muted-foreground mt-1 ml-[52px]">{s.detail}</p>}</div>))}
                          {(!strategic.strengths || (strategic.strengths as any[]).length === 0) && <p className="text-xs text-muted-foreground">Nenhum identificado</p>}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-3"><AlertOctagon className="h-4 w-4 text-destructive" /> Pontos Fracos</h4>
                        <div className="space-y-3">
                          {((strategic.weaknesses as any[]) || []).map((w: any, i: number) => (<div key={i}><div className="flex items-center gap-2"><Badge variant={w.severity === "alto" ? "destructive" : "secondary"} className="text-[9px]">{w.severity}</Badge><span className="text-sm font-medium">{w.point}</span></div>{w.detail && <p className="text-xs text-muted-foreground mt-1 ml-[52px]">{w.detail}</p>}</div>))}
                          {(!strategic.weaknesses || (strategic.weaknesses as any[]).length === 0) && <p className="text-xs text-muted-foreground">Nenhum identificado</p>}
                        </div>
                      </div>
                    </div>
                    {strategic.possible_theses && (strategic.possible_theses as any[]).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-3"><Swords className="h-4 w-4 text-primary" /> Teses Jurídicas Possíveis</h4>
                        <div className="space-y-3">{(strategic.possible_theses as any[]).map((t: any, i: number) => (<div key={i} className="p-3 rounded-lg border border-border bg-card/50"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{t.thesis}</p><Badge variant="outline" className={`shrink-0 text-[9px] ${t.viability === "alta" ? "border-success/30 text-success" : t.viability === "media" ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive"}`}>{t.viability}</Badge></div><p className="text-xs text-muted-foreground mt-1"><strong>Fundamento:</strong> {t.legal_basis}</p>{t.notes && <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>}</div>))}</div>
                      </div>
                    )}
                    {strategic.counterarguments && (strategic.counterarguments as any[]).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-3"><Swords className="h-4 w-4 text-warning" /> Contra-Argumentos Previsíveis</h4>
                        <div className="space-y-3">{(strategic.counterarguments as any[]).map((ca: any, i: number) => (<div key={i} className="p-3 rounded-lg border border-border bg-card/50"><p className="text-sm font-medium">{ca.argument}</p><p className="text-xs text-muted-foreground mt-1"><strong>Origem provável:</strong> {ca.likely_origin}</p><p className="text-xs mt-1"><strong className="text-primary">Estratégia de resposta:</strong> {ca.response_strategy}</p></div>))}</div>
                      </div>
                    )}
                    {strategic.risk_factors && (strategic.risk_factors as any[]).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-warning" /> Riscos</h4>
                        <div className="space-y-3">{(strategic.risk_factors as any[]).map((r: any, i: number) => (<div key={i} className="p-3 rounded-lg border border-border bg-card/50"><div className="flex items-center gap-2"><Badge variant={r.probability === "alta" ? "destructive" : "secondary"} className="text-[9px]">{r.probability}</Badge><span className="text-sm font-medium">{r.risk}</span></div><p className="text-xs text-muted-foreground mt-1"><strong>Mitigação:</strong> {r.mitigation}</p></div>))}</div>
                      </div>
                    )}
                    {strategic.jurisprudence_summary && <div><h4 className="font-medium text-sm mb-2">Jurisprudência e Precedentes</h4><p className="text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border">{strategic.jurisprudence_summary}</p></div>}
                    {strategic.strategic_recommendations && <div><h4 className="font-medium text-sm mb-2">Recomendações Estratégicas</h4><p className="text-sm whitespace-pre-wrap bg-primary/5 p-4 rounded-lg border border-primary/20">{strategic.strategic_recommendations}</p></div>}
                    <p className="text-[10px] text-muted-foreground">Análise gerada em {format(new Date(strategic.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} • Modelo premium</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVIDENCE CHECKLIST TAB */}
          <TabsContent value="evidence">
            <Card className="glass-card">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> Checklist de Provas</CardTitle>
                <Button size="sm" onClick={handleGenerateEvidenceChecklist} disabled={evidenceLoading}>
                  {evidenceLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {evidenceChecklist.length > 0 ? "Regerar Checklist" : "Gerar Checklist"}
                </Button>
              </CardHeader>
              <CardContent>
                {evidenceChecklist.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">Nenhum checklist de provas gerado.</p>
                    <p className="text-muted-foreground text-xs mt-1">Clique em "Gerar Checklist" para criar uma lista de provas com IA.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> {evidenceChecklist.filter((e) => e.status === "provided").length} fornecidas</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-warning" /> {evidenceChecklist.filter((e) => e.status === "pending").length} pendentes</span>
                      <span className="flex items-center gap-1"><X className="h-3 w-3 text-destructive" /> {evidenceChecklist.filter((e) => e.status === "unavailable").length} indisponíveis</span>
                    </div>
                    {evidenceChecklist.map((item) => {
                      const importanceColor = item.importance_level === "alta" ? "border-destructive/30 text-destructive" : item.importance_level === "media" ? "border-warning/30 text-warning" : "border-muted-foreground/30 text-muted-foreground";
                      const statusIcon = item.status === "provided" ? <Check className="h-4 w-4 text-success" /> : item.status === "unavailable" ? <X className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-warning" />;
                      return (
                        <div key={item.id} className={`p-4 rounded-lg border bg-card/50 ${item.status === "provided" ? "border-success/20 opacity-75" : "border-border"}`}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{statusIcon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-[9px] ${importanceColor}`}>{item.importance_level}</Badge>
                                <Badge variant="secondary" className="text-[9px]">{item.evidence_type}</Badge>
                              </div>
                              <p className="text-sm mt-1.5">{item.description}</p>
                              {item.notes && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MessageSquare className="h-3 w-3 shrink-0" /> {item.notes}</p>}
                              <div className="flex gap-1 mt-2">
                                {item.status !== "provided" && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleUpdateEvidenceItem(item.id, { status: "provided" })}><Check className="h-3 w-3 mr-1" /> Fornecida</Button>}
                                {item.status !== "unavailable" && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleUpdateEvidenceItem(item.id, { status: "unavailable" })}><X className="h-3 w-3 mr-1" /> Indisponível</Button>}
                                {item.status !== "pending" && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleUpdateEvidenceItem(item.id, { status: "pending" })}><Clock className="h-3 w-3 mr-1" /> Pendente</Button>}
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { const note = prompt("Observação:", item.notes || ""); if (note !== null) handleUpdateEvidenceItem(item.id, { notes: note || null }); }}><Edit className="h-3 w-3 mr-1" /> Obs</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ FORÇA DO CASO TAB ============ */}
          <TabsContent value="strength">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Simulador de Força do Caso</h2>
                <Button onClick={handleRunSimulation} disabled={simulationLoading}>
                  {simulationLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  {simulation ? "Recalcular Simulação" : "Rodar Simulação"}
                </Button>
              </div>

              {!simulation && !simulationLoading ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">Nenhuma simulação realizada.</p>
                    <p className="text-xs text-muted-foreground mt-1">Adicione contexto abaixo e clique em "Rodar Simulação".</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Card 1: Força Probatória */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-display flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Força Probatória</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {simulation && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Atual</p>
                              <Badge variant="outline" className={strengthBadge(simulation.current_strength)}>{simulation.current_strength || "—"}</Badge>
                            </div>
                            <div className="text-center p-2 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Potencial</p>
                              <Badge variant="outline" className={strengthBadge(simulation.potential_strength)}>{simulation.potential_strength || "—"}</Badge>
                            </div>
                            <div className="text-center p-2 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Prob. Êxito</p>
                              <Badge variant="outline" className={strengthBadge(simulation.estimated_success_probability)}>{simulation.estimated_success_probability || "—"}</Badge>
                            </div>
                          </div>

                          {simulation.missing_critical_evidence && (simulation.missing_critical_evidence as any[]).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-2"><AlertTriangle className="h-3 w-3" /> Provas Críticas Faltantes</p>
                              {(simulation.missing_critical_evidence as any[]).map((e: any, i: number) => (
                                <div key={i} className="p-2 mb-1 rounded border border-destructive/20 bg-destructive/5 text-sm">
                                  <p className="font-medium">{e.evidence}</p>
                                  <p className="text-xs text-muted-foreground">{e.impact}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {simulation.missing_recommended_evidence && (simulation.missing_recommended_evidence as any[]).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-warning flex items-center gap-1 mb-2"><AlertCircle className="h-3 w-3" /> Provas Recomendadas</p>
                              {(simulation.missing_recommended_evidence as any[]).map((e: any, i: number) => (
                                <div key={i} className="p-2 mb-1 rounded border border-border text-sm">
                                  <p className="font-medium">{e.evidence}</p>
                                  <p className="text-xs text-muted-foreground">{e.impact}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {simulation.evidence_impact_analysis && (simulation.evidence_impact_analysis as any[]).length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-2">Impacto das Provas</p>
                              {(simulation.evidence_impact_analysis as any[]).map((e: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30 mb-1">
                                  <span>{e.evidence}</span>
                                  <div className="flex gap-1">
                                    <Badge variant="outline" className="text-[9px]">{e.current_status}</Badge>
                                    <Badge variant="secondary" className="text-[9px]">{e.potential_impact}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {simulation.simulation_summary && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap border-t border-border pt-3">{simulation.simulation_summary}</p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 2: Situação Temporal */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-display flex items-center gap-2"><Timer className="h-4 w-4 text-warning" /> Situação Temporal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {temporalAnalysis ? (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Urgência</p>
                              <Badge variant="outline" className={strengthBadge(temporalAnalysis.urgency_level)}>{temporalAnalysis.urgency_level || "—"}</Badge>
                            </div>
                            <div className="text-center p-2 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Risco Prazo</p>
                              <Badge variant="outline" className={strengthBadge(temporalAnalysis.deadline_risk)}>{temporalAnalysis.deadline_risk || "—"}</Badge>
                            </div>
                            <div className="text-center p-2 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Prescrição</p>
                              <Badge variant="outline" className={strengthBadge(temporalAnalysis.limitation_risk)}>{temporalAnalysis.limitation_risk || "—"}</Badge>
                            </div>
                          </div>

                          {temporalAnalysis.possible_deadlines && (temporalAnalysis.possible_deadlines as any[]).length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-2">Prazos Identificados</p>
                              {(temporalAnalysis.possible_deadlines as any[]).map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs p-2 rounded border border-border mb-1">
                                  <div>
                                    <p className="font-medium">{d.deadline}</p>
                                    <p className="text-muted-foreground">{d.type}</p>
                                  </div>
                                  <Badge variant="outline" className={strengthBadge(d.risk)}>{d.risk}</Badge>
                                </div>
                              ))}
                            </div>
                          )}

                          {temporalAnalysis.time_sensitivity_analysis && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap border-t border-border pt-3">{temporalAnalysis.time_sensitivity_analysis}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">Rode a simulação para ver a análise temporal.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 3: Intensidade do Conflito */}
                  <Card className="glass-card lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-sm font-display flex items-center gap-2"><Flame className="h-4 w-4 text-destructive" /> Intensidade do Conflito</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {conflictAnalysis ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Intensidade</p>
                              <Badge variant="outline" className={strengthBadge(conflictAnalysis.conflict_intensity)}>{conflictAnalysis.conflict_intensity}</Badge>
                            </div>
                            <div className="text-center p-3 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Urgência do Cliente</p>
                              <Badge variant="outline" className={strengthBadge(conflictAnalysis.client_urgency)}>{conflictAnalysis.client_urgency}</Badge>
                            </div>
                            <div className="text-center p-3 rounded-lg border border-border">
                              <p className="text-[10px] text-muted-foreground">Pressão Emocional</p>
                              <Badge variant="outline" className={strengthBadge(conflictAnalysis.emotional_pressure)}>{conflictAnalysis.emotional_pressure}</Badge>
                            </div>
                          </div>
                          {conflictAnalysis.conflict_summary && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{conflictAnalysis.conflict_summary}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">Rode a simulação para ver a análise de conflito.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Context Signals Section */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-display flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Adicionar Contexto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Fonte</Label>
                      <Select value={signalForm.source_type} onValueChange={(v) => setSignalForm({ ...signalForm, source_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{sourceTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Conteúdo (cole mensagens, emails, etc.)</Label>
                      <Textarea placeholder="Cole aqui conversas de WhatsApp, emails, mensagens..." value={signalForm.content} onChange={(e) => setSignalForm({ ...signalForm, content: e.target.value })} className="min-h-[80px]" />
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddContextSignal} disabled={!signalForm.content.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Contexto
                  </Button>

                  {contextSignals.length > 0 && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{contextSignals.length} sinal(is) adicionado(s)</p>
                      {contextSignals.map((sig) => (
                        <div key={sig.id} className="flex items-start gap-2 p-2 rounded border border-border text-sm">
                          <Badge variant="secondary" className="text-[9px] shrink-0 mt-0.5">{sourceTypes.find((t) => t.value === sig.source_type)?.label || sig.source_type}</Badge>
                          <p className="flex-1 text-xs text-muted-foreground line-clamp-2">{sig.content}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDeleteContextSignal(sig.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============ MAPA DO CASO TAB ============ */}
          <TabsContent value="casemap">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2"><Map className="h-5 w-5 text-primary" /> Mapa Visual do Caso</h2>
                <Button onClick={handleUpdateDiagnostics} disabled={diagnosticsLoading}>
                  {diagnosticsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  {diagnostics ? "Recalcular Diagnóstico" : "Gerar Diagnóstico"}
                </Button>
              </div>

              {!diagnostics && !diagnosticsLoading ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Map className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">Nenhum diagnóstico gerado.</p>
                    <p className="text-xs text-muted-foreground mt-1">Execute primeiro a Simulação de Força, depois gere o Mapa do Caso.</p>
                  </CardContent>
                </Card>
              ) : diagnostics && (
                <>
                  {/* Score Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Força Probatória", value: diagnostics.evidence_score, icon: Shield },
                      { label: "Viabilidade", value: diagnostics.viability_score, icon: Target },
                      { label: "Risco Temporal", value: diagnostics.timing_score, icon: Timer },
                      { label: "Urgência", value: diagnostics.urgency_score, icon: AlertTriangle },
                      { label: "Intensidade Conflito", value: diagnostics.conflict_intensity_score, icon: Flame },
                      { label: "Complexidade", value: diagnostics.complexity_score, icon: Brain },
                      { label: "Financeiro", value: diagnostics.financial_score, icon: TrendingUp },
                      { label: "Força Geral", value: diagnostics.overall_case_strength, icon: Zap },
                    ].map((item) => (
                      <Card key={item.label} className="glass-card">
                        <CardContent className="p-4 text-center">
                          <item.icon className={`h-5 w-5 mx-auto mb-1 ${scoreColor(item.value)}`} />
                          <p className={`text-2xl font-bold ${scoreColor(item.value)}`}>{item.value}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Radar Chart */}
                    <Card className="glass-card">
                      <CardHeader><CardTitle className="text-sm font-display">Radar do Caso</CardTitle></CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="hsl(var(--border))" />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                              <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Critical Alerts */}
                    <Card className="glass-card">
                      <CardHeader><CardTitle className="text-sm font-display flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Alertas Críticos</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        {diagnostics.evidence_score < 40 && (
                          <div className="flex items-center gap-2 p-2 rounded border border-destructive/20 bg-destructive/5 text-sm">
                            <Shield className="h-4 w-4 text-destructive shrink-0" />
                            <span>Força probatória baixa ({diagnostics.evidence_score}/100)</span>
                          </div>
                        )}
                        {diagnostics.timing_score < 40 && (
                          <div className="flex items-center gap-2 p-2 rounded border border-destructive/20 bg-destructive/5 text-sm">
                            <Timer className="h-4 w-4 text-destructive shrink-0" />
                            <span>Risco temporal elevado ({diagnostics.timing_score}/100)</span>
                          </div>
                        )}
                        {diagnostics.urgency_score > 70 && (
                          <div className="flex items-center gap-2 p-2 rounded border border-warning/20 bg-warning/5 text-sm">
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                            <span>Urgência alta ({diagnostics.urgency_score}/100)</span>
                          </div>
                        )}
                        {diagnostics.conflict_intensity_score > 70 && (
                          <div className="flex items-center gap-2 p-2 rounded border border-destructive/20 bg-destructive/5 text-sm">
                            <Flame className="h-4 w-4 text-destructive shrink-0" />
                            <span>Forte pressão emocional ({diagnostics.conflict_intensity_score}/100)</span>
                          </div>
                        )}
                        {diagnostics.overall_case_strength < 40 && (
                          <div className="flex items-center gap-2 p-2 rounded border border-destructive/20 bg-destructive/5 text-sm">
                            <Zap className="h-4 w-4 text-destructive shrink-0" />
                            <span>Força geral baixa ({diagnostics.overall_case_strength}/100)</span>
                          </div>
                        )}
                        {diagnostics.evidence_score >= 40 && diagnostics.timing_score >= 40 && diagnostics.urgency_score <= 70 && diagnostics.conflict_intensity_score <= 70 && diagnostics.overall_case_strength >= 40 && (
                          <div className="flex items-center gap-2 p-2 rounded border border-success/20 bg-success/5 text-sm">
                            <CheckCircle className="h-4 w-4 text-success shrink-0" />
                            <span>Nenhum alerta crítico identificado</span>
                          </div>
                        )}

                        <div className="pt-2">
                          <p className="text-xs font-medium mb-1">Nível de Risco Geral</p>
                          <Badge variant="outline" className={strengthBadge(diagnostics.risk_level === "baixo" ? "low" : diagnostics.risk_level === "moderado" ? "moderate" : diagnostics.risk_level === "alto" ? "high" : "critical")}>
                            {diagnostics.risk_level}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Executive Summary */}
                  {diagnostics.visual_summary && (
                    <Card className="glass-card">
                      <CardHeader><CardTitle className="text-sm font-display">Resumo Executivo</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{diagnostics.visual_summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommended Actions */}
                  {diagnostics.recommended_actions && (diagnostics.recommended_actions as any[]).length > 0 && (
                    <Card className="glass-card">
                      <CardHeader><CardTitle className="text-sm font-display">O que falta para fortalecer este caso</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {(diagnostics.recommended_actions as any[]).map((a: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded border border-border">
                              <Badge variant={a.priority === "alta" ? "destructive" : a.priority === "media" ? "default" : "secondary"} className="text-[9px] shrink-0">{a.priority}</Badge>
                              <Badge variant="outline" className="text-[9px] shrink-0">{a.category}</Badge>
                              <span className="text-sm">{a.action}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* KNOWLEDGE TAB */}
          <TabsContent value="knowledge">
            <div className="space-y-6">
              {/* Backfill Controls */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground mr-2">Indexação:</span>
                <Button variant="outline" size="sm" onClick={() => handleBuildKnowledge()} disabled={knowledgeLoading}>
                  {knowledgeLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />} Indexar este caso
                </Button>
                <Button variant="outline" size="sm" onClick={handleBackfillAllCases} disabled={backfillLoading}>
                  {backfillLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />} Indexar casos sem conhecimento
                </Button>
                <Button variant="outline" size="sm" onClick={handleReindex} disabled={knowledgeLoading}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Reindexar entradas
                </Button>
              </div>

              {/* Section 1: Extracted Knowledge */}
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Conhecimento Extraído</CardTitle>
                  <div className="flex gap-2 items-center">
                    <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)} className="text-xs">
                      {showArchived ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                      {showArchived ? "Ocultar arquivados" : "Mostrar arquivados"}
                    </Button>
                    <Dialog open={manualKnowledgeDialog} onOpenChange={setManualKnowledgeDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Manual</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar Conhecimento Manual</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Tipo</Label>
                            <Select value={manualForm.entry_type} onValueChange={v => setManualForm({...manualForm, entry_type: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="thesis">Tese</SelectItem>
                                <SelectItem value="argument">Argumento</SelectItem>
                                <SelectItem value="precedent">Precedente</SelectItem>
                                <SelectItem value="strategy">Estratégia</SelectItem>
                                <SelectItem value="risk">Risco</SelectItem>
                                <SelectItem value="outcome">Resultado</SelectItem>
                                <SelectItem value="lesson_learned">Lição Aprendida</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Título</Label><Input value={manualForm.title} onChange={e => setManualForm({...manualForm, title: e.target.value})} placeholder="Título do conhecimento" /></div>
                          <div><Label>Conteúdo</Label><Textarea value={manualForm.content} onChange={e => setManualForm({...manualForm, content: e.target.value})} placeholder="Descreva o conhecimento..." rows={4} /></div>
                          <div><Label>Resultado</Label>
                            <Select value={manualForm.outcome} onValueChange={v => setManualForm({...manualForm, outcome: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="favorable">Favorável</SelectItem>
                                <SelectItem value="unfavorable">Desfavorável</SelectItem>
                                <SelectItem value="partial">Parcial</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Área Jurídica</Label><Input value={manualForm.legal_area} onChange={e => setManualForm({...manualForm, legal_area: e.target.value})} placeholder={caseData?.legal_area || "Ex: Trabalhista"} /></div>
                          <div><Label>Tags (separadas por vírgula)</Label><Input value={manualForm.tags} onChange={e => setManualForm({...manualForm, tags: e.target.value})} placeholder="trabalhista, rescisão, danos" /></div>
                          <Button onClick={handleAddManualKnowledge} className="w-full">Adicionar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => handleBuildKnowledge()} disabled={knowledgeLoading} size="sm">
                      {knowledgeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />} Gerar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {knowledgeEntries.filter(e => showArchived || !e.is_archived).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma entrada de conhecimento. Clique em "Gerar" para extrair automaticamente.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {knowledgeEntries.filter(e => showArchived || !e.is_archived).map(entry => {
                        const typeLabels: Record<string, string> = { thesis: "Tese", argument: "Argumento", precedent: "Precedente", strategy: "Estratégia", risk: "Risco", outcome: "Resultado", lesson_learned: "Lição" };
                        const typeColors: Record<string, string> = { thesis: "bg-primary/10 text-primary", argument: "bg-accent/50 text-accent-foreground", precedent: "bg-secondary text-secondary-foreground", strategy: "bg-success/10 text-success", risk: "bg-destructive/10 text-destructive", outcome: "bg-warning/10 text-warning", lesson_learned: "bg-muted text-muted-foreground" };
                        return (
                          <Card key={entry.id} className={`border ${entry.is_archived ? "opacity-50" : ""} ${entry.is_favorite ? "border-warning/40" : "border-border"}`}>
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={typeColors[entry.entry_type] || "bg-muted text-muted-foreground"}>{typeLabels[entry.entry_type] || entry.entry_type}</Badge>
                                  {entry.outcome === "favorable" && <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">Favorável</Badge>}
                                  {entry.is_manual && <Badge variant="outline" className="text-[10px]">Manual</Badge>}
                                  {entry.generated_by_ai && <Badge variant="outline" className="text-[10px] bg-primary/5"><Sparkles className="h-2 w-2 mr-0.5" />IA</Badge>}
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleFavorite(entry)} title="Favoritar">
                                    <Star className={`h-3 w-3 ${entry.is_favorite ? "fill-warning text-warning" : ""}`} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleArchive(entry)} title={entry.is_archived ? "Desarquivar" : "Arquivar"}>
                                    <EyeOff className={`h-3 w-3 ${entry.is_archived ? "text-muted-foreground" : ""}`} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingEntry({...entry, tags: entry.tags?.join(", ") || ""}); setEditKnowledgeDialog(true); }} title="Editar">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteKnowledge(entry.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                </div>
                              </div>
                              <h4 className="font-medium text-sm">{entry.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-3">{entry.content}</p>
                              {entry.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1">{entry.tags.map((t: string) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
                              )}
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                {entry.relevance_score > 0 && <span>Relevância: {(entry.relevance_score * 100).toFixed(0)}%</span>}
                                {entry.confidence_score != null && <span>Confiança: {(entry.confidence_score * 100).toFixed(0)}%</span>}
                                {entry.source_type && entry.source_type !== "manual" && <span>Fonte: {entry.source_type}</span>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit Dialog */}
              <Dialog open={editKnowledgeDialog} onOpenChange={setEditKnowledgeDialog}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Editar Entrada</DialogTitle></DialogHeader>
                  {editingEntry && (
                    <div className="space-y-3">
                      <div><Label>Tipo</Label>
                        <Select value={editingEntry.entry_type} onValueChange={v => setEditingEntry({...editingEntry, entry_type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="thesis">Tese</SelectItem><SelectItem value="argument">Argumento</SelectItem>
                            <SelectItem value="precedent">Precedente</SelectItem><SelectItem value="strategy">Estratégia</SelectItem>
                            <SelectItem value="risk">Risco</SelectItem><SelectItem value="outcome">Resultado</SelectItem>
                            <SelectItem value="lesson_learned">Lição Aprendida</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Título</Label><Input value={editingEntry.title} onChange={e => setEditingEntry({...editingEntry, title: e.target.value})} /></div>
                      <div><Label>Conteúdo</Label><Textarea value={editingEntry.content} onChange={e => setEditingEntry({...editingEntry, content: e.target.value})} rows={4} /></div>
                      <div><Label>Resultado</Label>
                        <Select value={editingEntry.outcome || "pending"} onValueChange={v => setEditingEntry({...editingEntry, outcome: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="favorable">Favorável</SelectItem><SelectItem value="unfavorable">Desfavorável</SelectItem>
                            <SelectItem value="partial">Parcial</SelectItem><SelectItem value="pending">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Tags</Label><Input value={editingEntry.tags} onChange={e => setEditingEntry({...editingEntry, tags: e.target.value})} /></div>
                      <Button onClick={handleEditKnowledge} className="w-full">Salvar</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Section 2: Similar Cases */}
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2"><Link2 className="h-5 w-5" /> Casos Semelhantes</CardTitle>
                  <Button onClick={handleFindSimilarCases} disabled={similarLoading} size="sm">
                    {similarLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />} Buscar Semelhantes
                  </Button>
                </CardHeader>
                <CardContent>
                  {similarCases.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Clique em "Buscar Semelhantes" para encontrar casos relacionados.</p>
                  ) : (
                    <div className="space-y-3">
                      {similarCases.map((sc: any, i: number) => (
                        <div key={sc.case_id || sc.similar_case_id || i} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <button onClick={() => navigate(`/cases/${sc.case_id || sc.similar_case_id}`)} className="text-sm font-medium text-primary hover:underline truncate">
                                {sc.title || `Caso #${(sc.case_id || sc.similar_case_id || "").slice(0, 8)}`}
                              </button>
                              {sc.legal_area && <Badge variant="secondary" className="text-[10px]">{sc.legal_area}</Badge>}
                              {sc.match_type && <Badge variant="outline" className="text-[10px]">{sc.match_type === "text_search" ? "Texto" : sc.match_type}</Badge>}
                            </div>
                            {(sc.reasons?.length > 0 || sc.similarity_reasons?.length > 0) && (
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {(sc.reasons || sc.similarity_reasons || []).map((r: string, j: number) => <li key={j}>• {r}</li>)}
                              </ul>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="outline" className="text-[10px]">
                              {((sc.similarity_score || 0) * 100).toFixed(0)}%
                            </Badge>
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={async () => {
                              const targetId = sc.case_id || sc.similar_case_id;
                              const { data } = await supabase.from("legal_knowledge_entries").select("*").eq("case_id", targetId).in("entry_type", ["thesis", "argument", "precedent"]).eq("is_archived", false).limit(10);
                              if (data?.length) {
                                for (const entry of data) await handleImportArgument(entry);
                              } else toast.info("Nenhum argumento encontrado neste caso");
                            }}>
                              <Copy className="h-2.5 w-2.5 mr-1" /> Aproveitar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 3: Reusable Arguments */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2"><Copy className="h-5 w-5" /> Argumentos Reutilizáveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Select value={argFilters.legal_area} onValueChange={v => setArgFilters({...argFilters, legal_area: v === "all" ? "" : v})}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Área jurídica" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todas áreas</SelectItem>
                        {["Trabalhista", "Civil", "Penal", "Tributário", "Família", "Consumidor", "Previdenciário", "Ambiental", "Administrativo"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={argFilters.entry_type} onValueChange={v => setArgFilters({...argFilters, entry_type: v === "all" ? "" : v})}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos tipos</SelectItem>
                        <SelectItem value="thesis">Tese</SelectItem><SelectItem value="argument">Argumento</SelectItem><SelectItem value="precedent">Precedente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={argFilters.outcome} onValueChange={v => setArgFilters({...argFilters, outcome: v === "all" ? "" : v})}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Resultado" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="favorable">Favorável</SelectItem><SelectItem value="unfavorable">Desfavorável</SelectItem><SelectItem value="partial">Parcial</SelectItem><SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Buscar por tags..." className="h-8 text-xs" value={argFilters.search} onChange={e => setArgFilters({...argFilters, search: e.target.value})} />
                  </div>

                  {reusableArgs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum argumento reutilizável encontrado. Gere conhecimento em outros casos para popular a memória.</p>
                  ) : (
                    <div className="space-y-2">
                      {reusableArgs.map(entry => (
                        <div key={entry.id} className={`flex items-start gap-3 p-3 rounded border ${entry.outcome === "favorable" ? "border-success/20 bg-success/5" : "border-border"}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className="text-[10px] bg-primary/10 text-primary">{entry.entry_type}</Badge>
                              {entry.outcome === "favorable" && <CheckCircle className="h-3 w-3 text-success" />}
                              {entry.legal_area && <Badge variant="secondary" className="text-[10px]">{entry.legal_area}</Badge>}
                            </div>
                            <h4 className="text-sm font-medium">{entry.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                            {entry.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{entry.tags.slice(0, 5).map((t: string) => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}</div>}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => handleImportArgument(entry)}>
                              <Copy className="h-2.5 w-2.5 mr-1" /> Copiar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => handleToggleFavorite(entry)}>
                              <Star className={`h-2.5 w-2.5 mr-1 ${entry.is_favorite ? "fill-warning text-warning" : ""}`} /> Favoritar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============ RADAR TAB ============ */}
          <TabsContent value="radar">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> VirtuaLexis Radar</h2>
                <Button onClick={handleGenerateRadar} disabled={radarLoading}>
                  {radarLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  {radar ? "Atualizar Radar" : "Gerar Radar"}
                </Button>
              </div>
              {!radar ? (
                <Card className="glass-card"><CardContent className="py-12 text-center">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">Nenhum radar estratégico gerado.</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Gerar Radar" para uma análise estratégica completa com IA.</p>
                </CardContent></Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="glass-card"><CardContent className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Prob. Êxito</p>
                      <p className={`text-2xl font-bold ${scoreColor(Number(radar.success_probability) || 0)}`}>{radar.success_probability != null ? `${radar.success_probability}%` : "—"}</p>
                    </CardContent></Card>
                    <Card className="glass-card"><CardContent className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Score de Risco</p>
                      <p className={`text-2xl font-bold ${scoreColor(100 - (Number(radar.risk_score) || 0))}`}>{radar.risk_score != null ? `${radar.risk_score}%` : "—"}</p>
                    </CardContent></Card>
                    <Card className="glass-card"><CardContent className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Confiança</p>
                      <p className={`text-2xl font-bold ${scoreColor(Number(radar.confidence_score) || 0)}`}>{radar.confidence_score != null ? `${radar.confidence_score}%` : "—"}</p>
                    </CardContent></Card>
                    <Card className="glass-card"><CardContent className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Atualizado</p>
                      <p className="text-xs font-medium">{format(new Date(radar.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                    </CardContent></Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {radar.strategic_advantages && (radar.strategic_advantages as any[]).length > 0 && (
                      <Card className="glass-card"><CardHeader><CardTitle className="text-sm font-display flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Pontos Fortes</CardTitle></CardHeader>
                        <CardContent><ul className="space-y-2">{(radar.strategic_advantages as any[]).map((a: any, i: number) => <li key={i} className="text-sm flex items-start gap-2"><CheckCircle className="h-3 w-3 text-success mt-1 shrink-0" /><span>{typeof a === "string" ? a : a.point || a.description || JSON.stringify(a)}</span></li>)}</ul></CardContent>
                      </Card>
                    )}
                    {radar.strategic_weaknesses && (radar.strategic_weaknesses as any[]).length > 0 && (
                      <Card className="glass-card"><CardHeader><CardTitle className="text-sm font-display flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Pontos Fracos</CardTitle></CardHeader>
                        <CardContent><ul className="space-y-2">{(radar.strategic_weaknesses as any[]).map((w: any, i: number) => <li key={i} className="text-sm flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-destructive mt-1 shrink-0" /><span>{typeof w === "string" ? w : w.point || w.description || JSON.stringify(w)}</span></li>)}</ul></CardContent>
                      </Card>
                    )}
                    {radar.recommended_evidence && (radar.recommended_evidence as any[]).length > 0 && (
                      <Card className="glass-card"><CardHeader><CardTitle className="text-sm font-display flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-warning" /> Provas Recomendadas</CardTitle></CardHeader>
                        <CardContent><ul className="space-y-2">{(radar.recommended_evidence as any[]).map((e: any, i: number) => <li key={i} className="text-sm flex items-start gap-2"><ClipboardCheck className="h-3 w-3 text-warning mt-1 shrink-0" /><span>{typeof e === "string" ? e : e.evidence || e.description || JSON.stringify(e)}</span></li>)}</ul></CardContent>
                      </Card>
                    )}
                    {radar.recommended_actions && (radar.recommended_actions as any[]).length > 0 && (
                      <Card className="glass-card"><CardHeader><CardTitle className="text-sm font-display flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Ações Estratégicas</CardTitle></CardHeader>
                        <CardContent><ul className="space-y-2">{(radar.recommended_actions as any[]).map((a: any, i: number) => <li key={i} className="text-sm flex items-start gap-2"><Zap className="h-3 w-3 text-primary mt-1 shrink-0" /><span>{typeof a === "string" ? a : a.action || a.description || JSON.stringify(a)}</span></li>)}</ul></CardContent>
                      </Card>
                    )}
                  </div>

                  {radar.strategic_summary && (
                    <Card className="glass-card"><CardHeader><CardTitle className="text-sm font-display">Resumo Estratégico</CardTitle></CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap text-muted-foreground">{radar.strategic_summary}</p></CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ============ ASSISTANT TAB ============ */}
          <TabsContent value="assistant">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> VirtuaLexis Assistant</h2>
                <Button onClick={handleSuggestActions} disabled={actionsLoading}>
                  {actionsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Gerar Sugestões
                </Button>
              </div>
              {nextActions.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-12 text-center">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">Nenhuma ação sugerida.</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Gerar Sugestões" para receber recomendações da IA.</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {nextActions.map((action) => {
                    const priorityColors: Record<string, string> = { high: "bg-destructive/10 text-destructive border-destructive/20", medium: "bg-warning/10 text-warning border-warning/20", low: "bg-secondary text-secondary-foreground" };
                    const typeLabels: Record<string, string> = { legal_document: "Documento", collect_evidence: "Prova", research_jurisprudence: "Pesquisa", procedural_step: "Procedimento", client_request: "Cliente", strategic_action: "Estratégia" };
                    return (
                      <Card key={action.id} className={`glass-card ${action.status === "done" ? "opacity-60" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={priorityColors[action.priority] || ""}>{action.priority === "high" ? "Alta" : action.priority === "medium" ? "Média" : "Baixa"}</Badge>
                                <Badge variant="secondary" className="text-[10px]">{typeLabels[action.action_type] || action.action_type}</Badge>
                                {action.impact_score && <Badge variant="outline" className="text-[10px]">Impacto: {action.impact_score}</Badge>}
                                {action.status === "done" && <Badge className="bg-success/10 text-success text-[10px]">Concluída</Badge>}
                              </div>
                              <p className="text-sm">{action.action_description}</p>
                            </div>
                            {action.status !== "done" && (
                              <div className="flex gap-1 shrink-0">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleCompleteAction(action.id)} title="Concluir"><Check className="h-3 w-3 text-success" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDiscardAction(action.id)} title="Descartar"><X className="h-3 w-3 text-destructive" /></Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ============ DOCS IA TAB ============ */}
          <TabsContent value="gendocs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> VirtuaLexis Docs</h2>
              </div>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm font-display">Gerar Documento Jurídico</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo de Documento</Label>
                      <Select value={genDocType} onValueChange={setGenDocType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="petition_initial">Petição Inicial</SelectItem>
                          <SelectItem value="contestacao">Contestação</SelectItem>
                          <SelectItem value="manifestacao">Manifestação</SelectItem>
                          <SelectItem value="recurso">Recurso</SelectItem>
                          <SelectItem value="memoriais">Memoriais</SelectItem>
                          <SelectItem value="notificacao">Notificação</SelectItem>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="parecer">Parecer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Instruções Adicionais</Label>
                      <Textarea placeholder="Instruções específicas para a IA..." value={genDocInstructions} onChange={(e) => setGenDocInstructions(e.target.value)} className="min-h-[60px]" />
                    </div>
                  </div>
                  <Button onClick={handleGenerateDocument} disabled={docsLoading}>
                    {docsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Gerar Documento
                  </Button>
                </CardContent>
              </Card>

              {generatedDocs.length > 0 && (
                <Card className="glass-card">
                  <CardHeader><CardTitle className="text-sm font-display">Documentos Gerados</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {generatedDocs.map((doc) => {
                      const typeLabels: Record<string, string> = { petition_initial: "Petição Inicial", contestacao: "Contestação", manifestacao: "Manifestação", recurso: "Recurso", memoriais: "Memoriais", notificacao: "Notificação", contrato: "Contrato", parecer: "Parecer" };
                      return (
                        <div key={doc.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{doc.title}</span>
                              <Badge variant="secondary" className="text-[10px]">{typeLabels[doc.document_type] || doc.document_type}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">{format(new Date(doc.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}>
                                {expandedDocId === doc.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(doc.content); toast.success("Copiado!"); }}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {expandedDocId === doc.id && (
                            <div className="mt-2 p-3 rounded bg-muted/30 border border-border">
                              <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{doc.content}</pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ============ MONITOR TAB ============ */}
          <TabsContent value="monitor">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> VirtuaLexis Monitor</h2>
              </div>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-sm font-display">Adicionar Monitoramento</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><Label className="text-xs">Tribunal</Label><Input placeholder="Ex: TJSP, TRT2" value={monitorForm.court} onChange={(e) => setMonitorForm({ ...monitorForm, court: e.target.value })} /></div>
                    <div><Label className="text-xs">Número do Processo *</Label><Input placeholder="0000000-00.0000.0.00.0000" value={monitorForm.process_number} onChange={(e) => setMonitorForm({ ...monitorForm, process_number: e.target.value })} /></div>
                    <div className="flex items-end"><Button onClick={handleAddMonitoring} disabled={!monitorForm.process_number || monitorLoading}>
                      {monitorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />} Monitorar
                    </Button></div>
                  </div>
                </CardContent>
              </Card>

              {processMonitoring.map((mon) => (
                <Card key={mon.id} className="glass-card">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <Scale className="h-4 w-4" /> {mon.process_number}
                      {mon.court && <Badge variant="secondary" className="text-[10px]">{mon.court}</Badge>}
                      <Badge variant="outline" className="text-[10px]">{mon.status}</Badge>
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleCheckMonitoring(mon.id)} disabled={monitorLoading}>
                      {monitorLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />} Atualizar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {mon.last_checked_at && <p>Última verificação: {format(new Date(mon.last_checked_at), "dd/MM/yy HH:mm", { locale: ptBR })}</p>}
                      {mon.last_event_summary && <p className="text-sm">{mon.last_event_summary}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {processEvents.length > 0 && (
                <Card className="glass-card">
                  <CardHeader><CardTitle className="text-sm font-display">Movimentações Detectadas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="relative pl-6 space-y-4">
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                      {processEvents.map((ev) => (
                        <div key={ev.id} className="relative">
                          <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                          <div className="p-3 rounded-lg border border-border bg-card/50">
                            <div className="flex items-center gap-2 mb-1">
                              {ev.event_date && <span className="text-xs font-medium">{format(new Date(ev.event_date), "dd/MM/yyyy", { locale: ptBR })}</span>}
                              {ev.event_type && <Badge variant="outline" className="text-[10px]">{ev.event_type}</Badge>}
                            </div>
                            {ev.event_text && <p className="text-sm text-muted-foreground">{ev.event_text}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ============ DEADLINES TAB ============ */}
          <TabsContent value="deadlines">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold flex items-center gap-2"><Timer className="h-5 w-5 text-primary" /> VirtuaLexis Deadlines</h2>
                {processEvents.length > 0 && (
                  <Button size="sm" onClick={() => handleCalculateDeadlines(processEvents[0].id)} disabled={deadlinesLoading}>
                    {deadlinesLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Calcular Prazos
                  </Button>
                )}
              </div>
              {deadlines.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-12 text-center">
                  <Timer className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">Nenhum prazo registrado.</p>
                  <p className="text-xs text-muted-foreground mt-1">Adicione monitoramento e calcule prazos automaticamente.</p>
                </CardContent></Card>
              ) : (
                <Card className="glass-card">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Risco</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deadlines.map((dl) => {
                          const riskColors: Record<string, string> = { low: "bg-success/10 text-success border-success/20", medium: "bg-warning/10 text-warning border-warning/20", high: "bg-orange-500/10 text-orange-600 border-orange-500/20", critical: "bg-destructive/10 text-destructive border-destructive/20" };
                          return (
                            <TableRow key={dl.id}>
                              <TableCell className="font-medium text-sm">{dl.deadline_date ? format(new Date(dl.deadline_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}</TableCell>
                              <TableCell className="text-sm">{dl.deadline_type}</TableCell>
                              <TableCell><Badge variant="outline" className={riskColors[dl.risk_level] || ""}>{dl.risk_level === "low" ? "Baixo" : dl.risk_level === "medium" ? "Médio" : dl.risk_level === "high" ? "Alto" : "Crítico"}</Badge></TableCell>
                              <TableCell><Badge variant={dl.status === "pending" ? "secondary" : "default"} className="text-[10px]">{dl.status === "pending" ? "Pendente" : dl.status === "completed" ? "Cumprido" : dl.status}</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* REPORT TAB */}
          <TabsContent value="report">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg font-display">Relatório do Caso</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div><h3 className="font-semibold mb-2">Resumo</h3><p className="text-sm text-muted-foreground">{caseData.description || "Sem descrição."}</p></div>
                <div><h3 className="font-semibold mb-2">Partes Envolvidas ({parties.length})</h3>
                  {parties.length > 0 ? <ul className="text-sm space-y-1">{parties.map((p) => <li key={p.id}>• <strong>{p.name}</strong> — {partyTypes.find((t) => t.value === p.party_type)?.label}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma parte registrada.</p>}
                </div>
                <div><h3 className="font-semibold mb-2">Linha do Tempo ({events.length} eventos)</h3>
                  {events.length > 0 ? <ul className="text-sm space-y-1">{events.map((e) => <li key={e.id}>• <strong>{e.event_date ? format(new Date(e.event_date), "dd/MM/yyyy") : "—"}</strong> — {e.title}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>}
                </div>
                <div><h3 className="font-semibold mb-2">Documentos ({documents.length})</h3>
                  {documents.length > 0 ? <ul className="text-sm space-y-1">{documents.map((d) => <li key={d.id}>• {d.name} {d.source ? `(${d.source})` : ""}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>}
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Estrutura preparada para geração automática de dossiê via IA.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* External Storage File Pickers */}
      {importPickerConn && (
        <ExternalFilePicker
          open={importPickerOpen}
          onOpenChange={setImportPickerOpen}
          connectionId={importPickerConn.id}
          provider={importPickerConn.provider}
          mode="import"
          onSelect={handleImportFromExternal}
        />
      )}
      {exportPickerConn && (
        <ExternalFilePicker
          open={exportPickerOpen}
          onOpenChange={setExportPickerOpen}
          connectionId={exportPickerConn.id}
          provider={exportPickerConn.provider}
          mode="folder"
          onSelect={handleExportToExternal}
        />
      )}
    </AppLayout>
  );
}
