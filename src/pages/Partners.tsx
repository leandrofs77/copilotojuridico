import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Handshake, Copy, Users, Gift, TrendingUp, Award } from "lucide-react";

const levelColors: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  silver: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
  gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  active: { label: "Ativo", variant: "default" },
  paid: { label: "Pago", variant: "secondary" },
};

export default function Partners() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [partnerRes, codesRes, referralsRes, rewardsRes] = await Promise.all([
      supabase.from("partners").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("referral_codes").select("*").eq("user_id", user.id).eq("active", true).maybeSingle(),
      supabase.from("referrals").select("*").eq("referrer_user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("partner_rewards").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setPartner(partnerRes.data);
    setReferralCode(codesRes.data);
    setReferrals(referralsRes.data || []);
    setRewards(rewardsRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateCode = async () => {
    if (!user) return;
    const code = `ATL-${user.id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({ user_id: user.id, code })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao gerar código: " + error.message);
    } else {
      setReferralCode(data);
      toast.success("Código gerado!");
    }
  };

  const copyLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/login?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const totalCommission = referrals.reduce((sum, r) => sum + Number(r.commission_value || 0), 0);
  const activeReferrals = referrals.filter((r) => r.status === "active").length;
  const totalRewards = rewards.reduce((sum, r) => sum + Number(r.reward_value || 0), 0);

  if (loading) {
    return (
      <AppLayout title="Parceiros" breadcrumbs={[{ label: "Parceiros" }]}>
        <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  if (!partner) {
    return (
      <AppLayout title="Parceiros" breadcrumbs={[{ label: "Parceiros" }]}>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Handshake className="h-16 w-16 text-muted-foreground/40" />
          <h2 className="text-xl font-display font-semibold text-foreground">Programa de Parceiros</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Você ainda não faz parte do programa de parceiros. Entre em contato com a administração para se tornar um parceiro e começar a indicar clientes.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Parceiros" breadcrumbs={[{ label: "Parceiros" }]}>
      <div className="space-y-6">
        {/* Header with level */}
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Programa de Parceiros</h2>
            <Badge className={levelColors[partner.partner_level] || levelColors.bronze}>
              {partner.partner_level.charAt(0).toUpperCase() + partner.partner_level.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
                <p className="text-xs text-muted-foreground">Total Indicados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{activeReferrals}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">R$ {totalCommission.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Comissão Gerada</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Gift className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">R$ {totalRewards.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Recompensas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral code */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Seu Link de Indicação</CardTitle>
          </CardHeader>
          <CardContent>
            {referralCode ? (
              <div className="flex items-center gap-3">
                <Input
                  readOnly
                  value={`${window.location.origin}/login?ref=${referralCode.code}`}
                  className="font-mono text-sm"
                />
                <Button onClick={copyLink} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={generateCode}>Gerar Código de Indicação</Button>
            )}
            {referralCode && (
              <p className="text-xs text-muted-foreground mt-2">
                Código: <span className="font-mono font-bold">{referralCode.code}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Referrals table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma indicação ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => {
                    const s = statusLabels[r.status] || statusLabels.pending;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">
                          {format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                        <TableCell className="text-sm">R$ {Number(r.commission_value || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Rewards */}
        {rewards.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-display">Recompensas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">
                        {format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{r.reward_type}</TableCell>
                      <TableCell className="text-sm">R$ {Number(r.reward_value || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
