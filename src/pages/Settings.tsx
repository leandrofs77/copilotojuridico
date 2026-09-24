import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Key, Eye, EyeOff, ShieldCheck, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProviderKey {
  id: string;
  provider: string;
  key_hint: string | null;
  is_default: boolean;
  created_at: string;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI (ChatGPT)" },
  { value: "google", label: "Google (Gemini)" },
  { value: "perplexity", label: "Perplexity" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ProviderKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [externalAiEnabled, setExternalAiEnabled] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Form state
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Storage policy state
  const [defaultStorageMode, setDefaultStorageMode] = useState("supabase_primary");
  const [autoDeleteAfterProcessing, setAutoDeleteAfterProcessing] = useState(false);

  const fetchPrivacySettings = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("user_privacy_settings")
      .select("external_ai_processing_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      toast({ title: "Erro ao carregar privacidade", description: error.message, variant: "destructive" });
      return;
    }

    setExternalAiEnabled(data?.external_ai_processing_enabled === true);
  };

  const fetchKeys = async () => {
    if (!user) return;
    const { data, error } = await supabase.functions.invoke("ai-provider-keys", {
      body: { action: "list" },
    });

    if (error || data?.error) {
      toast({ title: "Erro ao carregar chaves", description: data?.error || error?.message, variant: "destructive" });
    } else {
      setKeys(data?.keys || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrivacySettings();
    fetchKeys();
    // Load storage preferences from localStorage
    const savedMode = localStorage.getItem("vlx_default_storage_mode");
    const savedAutoDelete = localStorage.getItem("vlx_auto_delete_after_processing");
    if (savedMode) setDefaultStorageMode(savedMode);
    if (savedAutoDelete) setAutoDeleteAfterProcessing(savedAutoDelete === "true");
  }, [user]);

  const handleAdd = async () => {
    if (!user || !provider || !apiKey.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke("ai-provider-keys", {
      body: {
        action: "upsert",
        provider,
        api_key: apiKey.trim(),
        is_default: isDefault,
      },
    });

    if (error || data?.error) {
      toast({ title: "Erro ao salvar chave", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Chave adicionada com sucesso" });
      setProvider("");
      setApiKey("");
      setIsDefault(false);
      fetchKeys();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("ai-provider-keys", {
      body: { action: "delete", id },
    });
    if (error || data?.error) {
      toast({ title: "Erro ao remover chave", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Chave removida" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;
    setSavingPrivacy(true);

    const { error } = await (supabase as any)
      .from("user_privacy_settings")
      .upsert({
        user_id: user.id,
        external_ai_processing_enabled: externalAiEnabled,
        consent_version: "2026-09",
      }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Erro ao salvar privacidade", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: externalAiEnabled
          ? "Processamento externo de IA autorizado"
          : "Processamento externo de IA desativado",
      });
    }

    setSavingPrivacy(false);
  };

  const handleSaveStoragePolicy = () => {
    localStorage.setItem("vlx_default_storage_mode", defaultStorageMode);
    localStorage.setItem("vlx_auto_delete_after_processing", String(autoDeleteAfterProcessing));
    toast({ title: "Política de armazenamento salva" });
  };

  const providerLabel = (value: string) =>
    PROVIDERS.find((p) => p.value === value)?.label ?? value;

  return (
    <AppLayout title="Configurações" breadcrumbs={[{ label: "Configurações" }]}>
      <div className="max-w-2xl space-y-6">
        {/* Storage Policy Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Política de Armazenamento
            </CardTitle>
            <CardDescription>
              Defina como os arquivos são tratados após o processamento. Metadados, textos extraídos e análises são sempre preservados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modo padrão para novos documentos</Label>
              <Select value={defaultStorageMode} onValueChange={setDefaultStorageMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supabase_primary">Permanente — manter arquivo no sistema</SelectItem>
                  <SelectItem value="temporary_supabase">Temporário — remover após análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label>Remover cópias locais após processamento</Label>
                <p className="text-xs text-muted-foreground">
                  Documentos temporários terão o binário removido automaticamente após a análise completa.
                </p>
              </div>
              <Switch checked={autoDeleteAfterProcessing} onCheckedChange={setAutoDeleteAfterProcessing} />
            </div>
            <Button onClick={handleSaveStoragePolicy}>Salvar política</Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Privacidade e processamento por IA
            </CardTitle>
            <CardDescription>
              Controle se dados jurídicos podem ser enviados a provedores externos de inteligência artificial para análise e geração de conteúdo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="space-y-1">
                <Label>Permitir processamento por provedores externos de IA</Label>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, descrições de casos, trechos de documentos, eventos, relatórios e amostras de escrita podem ser enviados aos provedores de IA configurados para executar os recursos inteligentes do sistema. Quando desativado, essas rotinas são bloqueadas no servidor.
                </p>
              </div>
              <Switch checked={externalAiEnabled} onCheckedChange={setExternalAiEnabled} />
            </div>
            <Button onClick={handleSavePrivacy} disabled={savingPrivacy}>
              {savingPrivacy ? "Salvando..." : "Salvar preferência de privacidade"}
            </Button>
          </CardContent>
        </Card>

        {/* Add Key Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Chaves de API de IA
            </CardTitle>
            <CardDescription>
              Adicione suas próprias chaves de API para usar provedores externos. Se nenhuma chave for configurada, o sistema usará o provedor padrão do VirtuaLexis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-default"
                checked={isDefault}
                onCheckedChange={(v) => setIsDefault(v === true)}
              />
              <Label htmlFor="is-default" className="text-sm cursor-pointer">
                Marcar como provedor padrão
              </Label>
            </div>
            <Button onClick={handleAdd} disabled={saving || !provider || !apiKey.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Adicionar chave"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Keys */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Chaves cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma chave cadastrada. O sistema usará o provedor padrão do VirtuaLexis.
              </p>
            ) : (
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{providerLabel(k.provider)}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {k.key_hint || "••••"}
                      </p>
                      {k.is_default && (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Padrão
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(k.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}