import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AISettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: settingsData } = await supabase.from("ai_settings").select("*").limit(1).single();
    if (settingsData) setSettings(settingsData);

    const { data: modelsData } = await supabase.from("ai_models").select("*").eq("active", true).order("priority");
    setModels(modelsData || []);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("ai_settings").update({
        default_model: settings.default_model,
        fallback_model: settings.fallback_model,
        max_tokens_default: settings.max_tokens_default,
        temperature_default: settings.temperature_default,
        enable_logging: settings.enable_logging,
        enable_fallback: settings.enable_fallback,
        cost_alert_threshold: settings.cost_alert_threshold,
        updated_by: user?.id,
      }).eq("id", settings.id);
      if (error) throw error;
      toast({ title: "Configurações salvas" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <AppLayout title="Configurações de IA"><p className="text-muted-foreground">Carregando...</p></AppLayout>;

  return (
    <AppLayout title="Configurações Globais de IA" breadcrumbs={[{ label: "Administração" }, { label: "Configurações de IA" }]}>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Parâmetros Globais</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Modelo Padrão</Label>
              <Select value={settings.default_model} onValueChange={(v) => setSettings({ ...settings, default_model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map((m) => <SelectItem key={m.id} value={m.model_name}>{m.display_name || m.model_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modelo Fallback</Label>
              <Select value={settings.fallback_model} onValueChange={(v) => setSettings({ ...settings, fallback_model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map((m) => <SelectItem key={m.id} value={m.model_name}>{m.display_name || m.model_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Temperatura Padrão</Label>
              <Input type="number" step="0.1" min="0" max="2" value={settings.temperature_default} onChange={(e) => setSettings({ ...settings, temperature_default: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Max Tokens Padrão</Label>
              <Input type="number" value={settings.max_tokens_default} onChange={(e) => setSettings({ ...settings, max_tokens_default: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div>
            <Label>Alerta de Custo (R$)</Label>
            <Input type="number" step="0.01" value={settings.cost_alert_threshold} onChange={(e) => setSettings({ ...settings, cost_alert_threshold: parseFloat(e.target.value) || 0 })} className="max-w-xs" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={settings.enable_logging} onCheckedChange={(c) => setSettings({ ...settings, enable_logging: c })} />
              <Label>Ativar Logs de Execução</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={settings.enable_fallback} onCheckedChange={(c) => setSettings({ ...settings, enable_fallback: c })} />
              <Label>Ativar Fallback Automático</Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Configurações"}</Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
