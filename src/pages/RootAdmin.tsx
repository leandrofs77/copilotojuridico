import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ShieldCheck, Search, CheckCircle, XCircle, PauseCircle, Ban, RefreshCw, Users, CalendarPlus, Handshake, Play, Key, Award, Gift, FileText, AlertCircle, Clock,
} from "lucide-react";
import { CmsPageList } from "@/components/admin/CmsPageList";
import { CmsPageEditor } from "@/components/admin/CmsPageEditor";

type LicenseRecord = {
  id: string;
  user_id: string;
  license_type: string;
  license_status: string;
  trial_ends_at: string | null;
  access_ends_at: string | null;
  billing_provider: string | null;
  stripe_subscription_id: string | null;
};

type AccountRecord = {
  id: string;
  user_id: string;
  office_name: string | null;
  plan_name: string | null;
  billing_status: string;
  access_status: string;
  approved_at: string | null;
  suspended_at: string | null;
  cancelled_at: string | null;
  pause_reason: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
  license?: LicenseRecord | null;
};

const statusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Pendente" },
  active: { variant: "default", label: "Ativo" },
  paused: { variant: "secondary", label: "Pausado" },
  suspended: { variant: "destructive", label: "Suspenso" },
  cancelled: { variant: "destructive", label: "Cancelado" },
};

const licenseBadge: Record<string, string> = {
  trial: "Trial",
  subscription: "Assinatura",
  partnership: "Parceria",
  lifetime: "Vitalício",
  manual: "Manual",
};

const licenseStatusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  active: { variant: "default", label: "Ativa" },
  paused: { variant: "secondary", label: "Pausada" },
  expired: { variant: "outline", label: "Expirada" },
  cancelled: { variant: "destructive", label: "Cancelada" },
  suspended: { variant: "destructive", label: "Suspensa" },
};

const billingBadge: Record<string, string> = {
  trial: "Trial",
  paid: "Pago",
  past_due: "Inadimplente",
  cancelled: "Cancelado",
};

// Calculate days remaining for license/trial
function getDaysRemaining(license: LicenseRecord | null | undefined): { days: number | null; label: string; expired: boolean } {
  if (!license) return { days: null, label: "—", expired: false };
  
  const now = new Date();
  let endDate: Date | null = null;
  
  if (license.license_type === "trial" && license.trial_ends_at) {
    endDate = new Date(license.trial_ends_at);
  } else if (license.license_type === "manual" && license.access_ends_at) {
    endDate = new Date(license.access_ends_at);
  } else if (["partnership", "lifetime", "subscription"].includes(license.license_type)) {
    return { days: null, label: "∞", expired: false };
  }
  
  if (!endDate) return { days: null, label: "—", expired: false };
  
  const days = differenceInDays(endDate, now);
  if (days < 0) return { days, label: `Expirado há ${Math.abs(days)}d`, expired: true };
  if (days === 0) return { days: 0, label: "Expira hoje", expired: false };
  return { days, label: `${days}d restantes`, expired: false };
}

export default function RootAdmin() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Partners state
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerDialog, setPartnerDialog] = useState(false);
  const [partnerUserId, setPartnerUserId] = useState("");
  const [partnerLevel, setPartnerLevel] = useState("bronze");
  const [rewardDialog, setRewardDialog] = useState(false);
  const [rewardTargetUserId, setRewardTargetUserId] = useState("");
  const [rewardType, setRewardType] = useState("commission");
  const [rewardValue, setRewardValue] = useState("0");
  const [rewardDescription, setRewardDescription] = useState("");

  // Action dialog
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [targetAccount, setTargetAccount] = useState<AccountRecord | null>(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");
  const [processing, setProcessing] = useState(false);

  // CMS state
  const [cmsEditingPage, setCmsEditingPage] = useState<any>(null);

  const fetchAccounts = useCallback(async () => {
    let query = supabase.from("account_access_control").select("*").order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("access_status", filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar contas: " + error.message);
      setLoading(false);
      return;
    }

    // Fetch profiles
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email");
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Fetch licenses
    const { data: licenses } = await supabase.from("account_licenses").select("*");
    const licenseMap = new Map((licenses || []).map((l: any) => [l.user_id, l]));

    const enriched = (data || []).map((a: any) => ({
      ...a,
      profiles: profileMap.get(a.user_id) || null,
      license: licenseMap.get(a.user_id) || null,
    }));

    setAccounts(enriched);
    setLoading(false);
  }, [filter]);

  const fetchPartners = useCallback(async () => {
    const { data: partnersData } = await supabase.from("partners").select("*");
    const { data: codesData } = await supabase.from("referral_codes").select("*");
    const { data: referralsData } = await supabase.from("referrals").select("*");
    const { data: rewardsData } = await supabase.from("partner_rewards").select("*");
    const { data: profilesData } = await supabase.from("profiles").select("user_id, full_name, email");

    const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));
    const codeMap = new Map((codesData || []).map((c: any) => [c.user_id, c]));

    const enriched = (partnersData || []).map((p: any) => ({
      ...p,
      profile: profileMap.get(p.user_id),
      code: codeMap.get(p.user_id),
      referralCount: (referralsData || []).filter((r: any) => r.referrer_user_id === p.user_id).length,
      totalRewards: (rewardsData || []).filter((r: any) => r.user_id === p.user_id).reduce((s: number, r: any) => s + Number(r.reward_value || 0), 0),
    }));
    setPartners(enriched);
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchPartners();
  }, [fetchAccounts, fetchPartners]);

  const openAction = (account: AccountRecord, action: string) => {
    setTargetAccount(account);
    setActionType(action);
    setReason("");
    setDays("30");
    setActionDialog(true);
  };

  // Quick approve action without dialog
  const quickApprove = async (account: AccountRecord) => {
    if (!user) return;
    setProcessing(true);
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from("account_access_control")
        .update({ access_status: "active", approved_by: user.id, approved_at: now })
        .eq("id", account.id);
      if (error) throw error;
      
      await supabase.from("admin_action_logs").insert({
        admin_user_id: user.id,
        target_user_id: account.user_id,
        action: "approve",
        old_status: account.access_status,
        new_status: "active",
      });
      
      toast.success(`${account.profiles?.full_name || "Usuário"} aprovado!`);
      fetchAccounts();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
    setProcessing(false);
  };

  const executeAction = async () => {
    if (!targetAccount || !user) return;
    setProcessing(true);

    const now = new Date().toISOString();
    let accessUpdate: any = null;
    let licenseUpdate: any = null;
    let newStatus = "";
    let logAction = actionType;

    switch (actionType) {
      // Access actions
      case "approve":
        newStatus = "active";
        accessUpdate = { access_status: "active", approved_by: user.id, approved_at: now, notes: reason || null };
        break;
      case "reject":
        newStatus = "cancelled";
        accessUpdate = { access_status: "cancelled", cancelled_at: now, cancellation_reason: reason || "Cadastro rejeitado" };
        break;
      case "activate":
        newStatus = "active";
        accessUpdate = { access_status: "active", approved_by: user.id, approved_at: now };
        break;
      case "pause":
        newStatus = "paused";
        accessUpdate = { access_status: "paused", pause_reason: reason || null };
        break;
      case "suspend":
        newStatus = "suspended";
        accessUpdate = { access_status: "suspended", suspended_at: now, notes: reason || null };
        break;
      case "cancel":
        newStatus = "cancelled";
        accessUpdate = { access_status: "cancelled", cancelled_at: now, cancellation_reason: reason || null };
        break;
      case "reactivate":
        newStatus = "active";
        accessUpdate = { access_status: "active", suspended_at: null, cancelled_at: null, pause_reason: null, cancellation_reason: null };
        break;

      // License actions
      case "extend_trial": {
        const d = parseInt(days) || 30;
        const currentEnd = targetAccount.license?.trial_ends_at ? new Date(targetAccount.license.trial_ends_at) : new Date();
        const base = currentEnd > new Date() ? currentEnd : new Date();
        const newEnd = new Date(base.getTime() + d * 86400000);
        licenseUpdate = { trial_ends_at: newEnd.toISOString(), license_type: "trial", license_status: "active" };
        logAction = "extend_trial";
        newStatus = `trial extended +${d}d`;
        break;
      }
      case "grant_manual": {
        const d = parseInt(days) || 30;
        const newEnd = new Date(Date.now() + d * 86400000);
        licenseUpdate = { license_type: "manual", access_ends_at: newEnd.toISOString(), license_status: "active", created_by_admin: user.id };
        logAction = "grant_manual_access";
        newStatus = `manual access ${d}d`;
        break;
      }
      case "convert_partnership":
        licenseUpdate = { license_type: "partnership", license_status: "active", trial_ends_at: null, access_ends_at: null, created_by_admin: user.id };
        logAction = "convert_to_partnership";
        newStatus = "partnership";
        break;
      case "pause_license":
        licenseUpdate = { license_status: "paused" };
        logAction = "pause_license";
        newStatus = "license paused";
        break;
      case "resume_license":
        licenseUpdate = { license_status: "active" };
        logAction = "resume_license";
        newStatus = "license active";
        break;
      case "cancel_license":
        licenseUpdate = { license_status: "cancelled" };
        logAction = "cancel_license";
        newStatus = "license cancelled";
        break;
    }

    try {
      if (accessUpdate) {
        const { error } = await supabase
          .from("account_access_control")
          .update(accessUpdate)
          .eq("id", targetAccount.id);
        if (error) throw error;
      }

      if (licenseUpdate && targetAccount.license) {
        const { error } = await supabase
          .from("account_licenses")
          .update(licenseUpdate)
          .eq("id", targetAccount.license.id);
        if (error) throw error;
      }

      // Log admin action
      await supabase.from("admin_action_logs").insert({
        admin_user_id: user.id,
        target_user_id: targetAccount.user_id,
        action: logAction,
        old_status: targetAccount.access_status,
        new_status: newStatus,
        reason: reason || null,
      });

      toast.success("Ação executada com sucesso");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }

    setActionDialog(false);
    setProcessing(false);
    fetchAccounts();
  };

  const accessActionLabels: Record<string, { label: string; icon: any }> = {
    approve: { label: "Aprovar", icon: CheckCircle },
    reject: { label: "Rejeitar", icon: XCircle },
    activate: { label: "Ativar", icon: CheckCircle },
    pause: { label: "Pausar", icon: PauseCircle },
    suspend: { label: "Suspender", icon: Ban },
    cancel: { label: "Cancelar", icon: XCircle },
    reactivate: { label: "Reativar", icon: RefreshCw },
  };

  const licenseActionLabels: Record<string, { label: string; icon: any }> = {
    extend_trial: { label: "Estender Trial", icon: CalendarPlus },
    grant_manual: { label: "Acesso Manual", icon: Key },
    convert_partnership: { label: "Parceria", icon: Handshake },
    pause_license: { label: "Pausar Licença", icon: PauseCircle },
    resume_license: { label: "Retomar Licença", icon: Play },
    cancel_license: { label: "Cancelar Licença", icon: XCircle },
  };

  const allActionLabels = { ...accessActionLabels, ...licenseActionLabels };

  const getAccessActions = (status: string): string[] => {
    switch (status) {
      case "pending": return ["approve", "reject"];
      case "active": return ["pause", "suspend", "cancel"];
      case "paused": return ["activate", "suspend", "cancel"];
      case "suspended": return ["reactivate", "cancel"];
      case "cancelled": return ["reactivate"];
      default: return [];
    }
  };

  const getLicenseActions = (license: LicenseRecord | null | undefined): string[] => {
    if (!license) return [];
    const actions: string[] = ["extend_trial", "grant_manual", "convert_partnership"];
    if (license.license_status === "active") {
      actions.push("pause_license", "cancel_license");
    } else if (license.license_status === "paused") {
      actions.push("resume_license", "cancel_license");
    } else if (license.license_status === "cancelled") {
      actions.push("resume_license");
    }
    return actions;
  };

  const needsDaysInput = ["extend_trial", "grant_manual"].includes(actionType);

  // Apply license filter
  const applyLicenseFilter = (list: AccountRecord[]) => {
    if (licenseFilter === "all") return list;
    return list.filter((a) => {
      const daysInfo = getDaysRemaining(a.license);
      switch (licenseFilter) {
        case "expired":
          return daysInfo.expired;
        case "expiring_soon":
          return daysInfo.days !== null && daysInfo.days >= 0 && daysInfo.days <= 7;
        case "trial":
          return a.license?.license_type === "trial";
        case "paid":
          return a.license?.license_type === "subscription" || a.license?.billing_provider === "stripe";
        case "partnership":
          return a.license?.license_type === "partnership";
        default:
          return true;
      }
    });
  };

  const filtered = applyLicenseFilter(
    accounts.filter((a) => {
      if (!search) return true;
      const name = a.profiles?.full_name?.toLowerCase() || "";
      const email = a.profiles?.email?.toLowerCase() || "";
      const office = a.office_name?.toLowerCase() || "";
      const q = search.toLowerCase();
      return name.includes(q) || email.includes(q) || office.includes(q);
    })
  );

  const counts = {
    all: accounts.length,
    pending: accounts.filter((a) => a.access_status === "pending").length,
    active: accounts.filter((a) => a.access_status === "active").length,
    paused: accounts.filter((a) => a.access_status === "paused").length,
    suspended: accounts.filter((a) => a.access_status === "suspended").length,
    cancelled: accounts.filter((a) => a.access_status === "cancelled").length,
  };

  const createPartner = async () => {
    if (!user || !partnerUserId) return;
    setProcessing(true);
    try {
      // Generate referral code
      const code = `ATL-${partnerUserId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { data: codeData, error: codeErr } = await supabase
        .from("referral_codes")
        .insert({ user_id: partnerUserId, code })
        .select()
        .single();
      if (codeErr) throw codeErr;

      const { error: partnerErr } = await supabase
        .from("partners")
        .insert({ user_id: partnerUserId, partner_level: partnerLevel, referral_code_id: codeData.id });
      if (partnerErr) throw partnerErr;

      await supabase.from("admin_action_logs").insert({
        admin_user_id: user.id, target_user_id: partnerUserId,
        action: "create_partner", new_status: partnerLevel,
      });
      toast.success("Parceiro criado!");
      setPartnerDialog(false);
      fetchPartners();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
    setProcessing(false);
  };

  const updatePartnerLevel = async (partnerId: string, userId: string, newLevel: string) => {
    if (!user) return;
    const { error } = await supabase.from("partners").update({ partner_level: newLevel }).eq("id", partnerId);
    if (error) { toast.error(error.message); return; }
    await supabase.from("admin_action_logs").insert({
      admin_user_id: user.id, target_user_id: userId,
      action: "update_partner_level", new_status: newLevel,
    });
    toast.success("Nível atualizado!");
    fetchPartners();
  };

  const grantReward = async () => {
    if (!user || !rewardTargetUserId) return;
    setProcessing(true);
    try {
      const { error } = await supabase.from("partner_rewards").insert({
        user_id: rewardTargetUserId, reward_type: rewardType,
        reward_value: parseFloat(rewardValue) || 0, description: rewardDescription || null,
      });
      if (error) throw error;
      await supabase.from("admin_action_logs").insert({
        admin_user_id: user.id, target_user_id: rewardTargetUserId,
        action: "grant_reward", new_status: `${rewardType}: ${rewardValue}`,
      });
      toast.success("Recompensa atribuída!");
      setRewardDialog(false);
      fetchPartners();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
    setProcessing(false);
  };

  // Get non-partner user IDs for creating new partners
  const partnerUserIds = new Set(partners.map((p: any) => p.user_id));
  const nonPartnerAccounts = accounts.filter((a) => !partnerUserIds.has(a.user_id));

  return (
    <AppLayout title="Painel Administrativo" breadcrumbs={[{ label: "Administração" }]}>
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts" className="relative">
            Contas
            {counts.pending > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] text-[10px] px-1.5 animate-pulse">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="partners">Parceiros</TabsTrigger>
          <TabsTrigger value="cms"><FileText className="h-4 w-4 mr-1" /> Conteúdo</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          {/* Pending Alert Banner */}
          {counts.pending > 0 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {counts.pending} {counts.pending === 1 ? "conta aguardando" : "contas aguardando"} aprovação
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Novos usuários precisam de sua aprovação para acessar a plataforma
                  </p>
                </div>
                <Button variant="outline" onClick={() => setFilter("pending")} className="border-warning text-warning hover:bg-warning/10">
                  Ver pendentes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: "all", label: "Total", color: "text-foreground" },
              { key: "pending", label: "Pendentes", color: "text-warning" },
              { key: "active", label: "Ativos", color: "text-success" },
              { key: "paused", label: "Pausados", color: "text-orange-500" },
              { key: "suspended", label: "Suspensos", color: "text-destructive" },
              { key: "cancelled", label: "Cancelados", color: "text-muted-foreground" },
            ].map((s) => (
              <Card
                key={s.key}
                className={`glass-card cursor-pointer transition-all ${filter === s.key ? "ring-2 ring-primary" : ""} ${s.key === "pending" && counts.pending > 0 ? "ring-1 ring-warning/50" : ""}`}
                onClick={() => setFilter(s.key)}
              >
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, email ou escritório..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={licenseFilter} onValueChange={setLicenseFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar licença" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas licenças</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
                <SelectItem value="expiring_soon">Expira em 7 dias</SelectItem>
                <SelectItem value="trial">Em trial</SelectItem>
                <SelectItem value="paid">Pagantes</SelectItem>
                <SelectItem value="partnership">Parcerias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accounts Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Contas Cadastradas ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conta encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Acesso</TableHead>
                        <TableHead>Licença</TableHead>
                        <TableHead>Dias Restantes</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="text-right">Ações Rápidas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((a) => {
                        const badge = statusBadge[a.access_status] || statusBadge.pending;
                        const lBadge = a.license ? licenseStatusBadge[a.license.license_status] || licenseStatusBadge.active : null;
                        const daysInfo = getDaysRemaining(a.license);
                        const isPending = a.access_status === "pending";
                        
                        return (
                          <TableRow key={a.id} className={isPending ? "bg-warning/5" : ""}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {isPending && <Clock className="h-4 w-4 text-warning" />}
                                {a.profiles?.full_name || "—"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{a.profiles?.email || "—"}</TableCell>
                            <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                            <TableCell>
                              {a.license ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs">{licenseBadge[a.license.license_type] || a.license.license_type}</span>
                                  {lBadge && <Badge variant={lBadge.variant} className="text-[10px] w-fit">{lBadge.label}</Badge>}
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs font-medium ${daysInfo.expired ? "text-destructive" : daysInfo.days !== null && daysInfo.days <= 7 ? "text-warning" : "text-muted-foreground"}`}>
                                {daysInfo.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">{format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 justify-end flex-wrap">
                                {/* Quick actions for pending */}
                                {isPending && (
                                  <>
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      className="h-7 text-xs bg-success hover:bg-success/90"
                                      onClick={() => quickApprove(a)}
                                      disabled={processing}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />Aprovar
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="h-7 text-xs"
                                      onClick={() => openAction(a, "reject")}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />Rejeitar
                                    </Button>
                                  </>
                                )}
                                {/* Other actions in a dropdown-style list */}
                                {!isPending && (
                                  <>
                                    {getAccessActions(a.access_status).slice(0, 2).map((action) => {
                                      const cfg = accessActionLabels[action];
                                      return (
                                        <Button key={action} variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openAction(a, action)}>
                                          <cfg.icon className="h-3 w-3 mr-1" />{cfg.label}
                                        </Button>
                                      );
                                    })}
                                    {a.license && (
                                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => openAction(a, "extend_trial")}>
                                        <CalendarPlus className="h-3 w-3 mr-1" />+Dias
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" /> Parceiros ({partners.length})
            </h2>
            <Button onClick={() => { setPartnerUserId(""); setPartnerLevel("bronze"); setPartnerDialog(true); }}>
              <Handshake className="h-4 w-4 mr-2" /> Criar Parceiro
            </Button>
          </div>

          {partners.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum parceiro cadastrado.</CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Indicações</TableHead>
                        <TableHead>Recompensas</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.profile?.full_name || "—"}</TableCell>
                          <TableCell className="text-sm">{p.profile?.email || "—"}</TableCell>
                          <TableCell>
                            <Select value={p.partner_level} onValueChange={(v) => updatePartnerLevel(p.id, p.user_id, v)}>
                              <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bronze">Bronze</SelectItem>
                                <SelectItem value="silver">Silver</SelectItem>
                                <SelectItem value="gold">Gold</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{p.code?.code || "—"}</TableCell>
                          <TableCell className="text-sm">{p.referralCount}</TableCell>
                          <TableCell className="text-sm">R$ {p.totalRewards.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                              setRewardTargetUserId(p.user_id);
                              setRewardType("commission");
                              setRewardValue("0");
                              setRewardDescription("");
                              setRewardDialog(true);
                            }}>
                              <Gift className="h-3 w-3 mr-1" /> Recompensa
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CMS Tab */}
        <TabsContent value="cms" className="space-y-6">
          {cmsEditingPage ? (
            <CmsPageEditor
              page={cmsEditingPage}
              onBack={() => setCmsEditingPage(null)}
              onSaved={() => {}}
            />
          ) : (
            <CmsPageList onEditPage={(page) => setCmsEditingPage(page)} />
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {allActionLabels[actionType]?.label || "Ação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3 bg-muted/30">
              <p className="text-sm"><strong>Usuário:</strong> {targetAccount?.profiles?.full_name || "—"}</p>
              <p className="text-sm"><strong>Email:</strong> {targetAccount?.profiles?.email || "—"}</p>
              <p className="text-sm"><strong>Acesso:</strong> {statusBadge[targetAccount?.access_status || ""]?.label || "—"}</p>
              {targetAccount?.license && (
                <p className="text-sm"><strong>Licença:</strong> {licenseBadge[targetAccount.license.license_type] || targetAccount.license.license_type} — {targetAccount.license.license_status}</p>
              )}
            </div>
            {needsDaysInput && (
              <div>
                <Label>Quantidade de dias</Label>
                <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="1" max="3650" />
              </div>
            )}
            <div>
              <Label>Motivo / Observação</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Opcional..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(false)}>Cancelar</Button>
            <Button onClick={executeAction} disabled={processing}>{processing ? "Processando..." : "Confirmar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Partner Dialog */}
      <Dialog open={partnerDialog} onOpenChange={setPartnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" /> Criar Parceiro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Usuário</Label>
              <Select value={partnerUserId} onValueChange={setPartnerUserId}>
                <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                <SelectContent>
                  {nonPartnerAccounts.map((a) => (
                    <SelectItem key={a.user_id} value={a.user_id}>
                      {a.profiles?.full_name || a.profiles?.email || a.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nível</Label>
              <Select value={partnerLevel} onValueChange={setPartnerLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartnerDialog(false)}>Cancelar</Button>
            <Button onClick={createPartner} disabled={processing || !partnerUserId}>{processing ? "Criando..." : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Dialog */}
      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Atribuir Recompensa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={rewardType} onValueChange={setRewardType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission">Comissão</SelectItem>
                  <SelectItem value="credits">Créditos</SelectItem>
                  <SelectItem value="free_license">Licença Grátis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} min="0" step="0.01" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} placeholder="Opcional..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialog(false)}>Cancelar</Button>
            <Button onClick={grantReward} disabled={processing}>{processing ? "Processando..." : "Atribuir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
