import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Cloud, HardDrive, Link2, Unlink, FolderOpen, Plus, Trash2, Loader2,
  AlertCircle, CheckCircle, RefreshCw, ExternalLink,
} from "lucide-react";
import ExternalFilePicker from "@/components/ExternalFilePicker";

type Connection = {
  id: string;
  provider: string;
  provider_account_email: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
};

type Folder = {
  id: string;
  connection_id: string;
  provider: string;
  folder_name: string | null;
  folder_id: string | null;
  folder_path: string | null;
  usage_type: string;
  is_default: boolean;
};

type ProviderConfig = {
  configured: boolean;
};

const providerInfo: Record<string, { name: string; icon: string; color: string }> = {
  google_drive: { name: "Google Drive", icon: "🔵", color: "border-blue-500/30 bg-blue-500/5" },
  onedrive: { name: "OneDrive", icon: "🔷", color: "border-sky-500/30 bg-sky-500/5" },
  sharepoint: { name: "SharePoint", icon: "🟣", color: "border-purple-500/30 bg-purple-500/5" },
};

const usageTypeLabels: Record<string, string> = {
  import: "Importação",
  export: "Exportação",
  case_default: "Padrão do Caso",
  office_default: "Padrão do Escritório",
};

export default function ExternalStorage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [providers, setProviders] = useState<Record<string, ProviderConfig>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [folderPickerConnection, setFolderPickerConnection] = useState<Connection | null>(null);
  const [folderUsageType, setFolderUsageType] = useState("import");

  const fetchData = async () => {
    if (!user) return;

    const [connRes, foldersRes, statusRes] = await Promise.all([
      supabase.from("external_storage_connections").select("*").order("created_at"),
      supabase.from("external_storage_folders").select("*").order("created_at"),
      supabase.functions.invoke("external-storage-auth", { body: { action: "status" } }),
    ]);

    setConnections((connRes.data as any[]) || []);
    setFolders((foldersRes.data as any[]) || []);

    if (statusRes.data?.providers) {
      setProviders(statusRes.data.providers);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state) {
      const provider = sessionStorage.getItem("external_oauth_provider");
      if (provider) {
        handleOAuthCallback(code, state, provider);
      } else {
        toast.error("Não foi possível validar o provedor OAuth.");
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string, provider: string) => {
    setConnecting(provider);
    const redirectUri = `${window.location.origin}/settings/storage`;

    const { data, error } = await supabase.functions.invoke("external-storage-auth", {
      body: { action: "authorize", provider, code, redirect_uri: redirectUri, state },
    });

    setConnecting(null);
    if (error || data?.error) {
      toast.error(data?.message || data?.detail || error?.message || "Erro ao conectar");
      return;
    }
    sessionStorage.removeItem("external_oauth_provider");
    toast.success(`${providerInfo[provider]?.name || provider} conectado com sucesso!`);
    fetchData();
  };

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    const redirectUri = `${window.location.origin}/settings/storage`;

    const { data, error } = await supabase.functions.invoke("external-storage-auth", {
      body: { action: "get_auth_url", provider, redirect_uri: redirectUri },
    });

    setConnecting(null);
    if (error || data?.error) {
      toast.error(data?.message || "Provedor ainda não configurado pelo administrador.");
      return;
    }

    if (data?.url) {
      sessionStorage.setItem("external_oauth_provider", provider);
      window.location.href = data.url;
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    const { error } = await supabase.functions.invoke("external-storage-auth", {
      body: { action: "disconnect", connection_id: connectionId },
    });
    if (error) { toast.error("Erro ao desconectar"); return; }
    toast.success("Provedor desconectado");
    fetchData();
  };

  const handleDelete = async (connectionId: string) => {
    const { error } = await supabase.functions.invoke("external-storage-auth", {
      body: { action: "delete", connection_id: connectionId },
    });
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Conexão removida");
    fetchData();
  };

  const handleSelectFolder = async (connection: Connection, items: any[]) => {
    if (items.length === 0) return;
    const folder = items[0];

    if (!user) return;
    const { error } = await supabase.from("external_storage_folders").insert({
      user_id: user.id,
      connection_id: connection.id,
      provider: connection.provider,
      folder_name: folder.name,
      folder_id: folder.id,
      folder_path: folder.name,
      usage_type: folderUsageType,
      is_default: false,
    });

    if (error) { toast.error(error.message); return; }
    toast.success("Pasta configurada!");
    setFolderPickerOpen(false);
    fetchData();
  };

  const handleDeleteFolder = async (folderId: string) => {
    await supabase.from("external_storage_folders").delete().eq("id", folderId);
    toast.success("Pasta removida");
    fetchData();
  };

  const isTokenExpired = (conn: Connection) => {
    if (!conn.token_expires_at) return false;
    return new Date(conn.token_expires_at) < new Date();
  };

  const getConnectionForProvider = (provider: string) => {
    return connections.find((c) => c.provider === provider && c.is_active);
  };

  if (loading) return <AppLayout title="Armazenamento Externo"><p className="text-muted-foreground">Carregando...</p></AppLayout>;

  return (
    <AppLayout title="Armazenamento Externo" breadcrumbs={[{ label: "Configurações", href: "/settings" }, { label: "Armazenamento Externo" }]}>
      <div className="space-y-6 max-w-4xl">
        {/* Documentation banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Configuração de provedores</p>
                <p className="text-muted-foreground">Para ativar os provedores, é necessário configurar as credenciais OAuth. Consulte a documentação para obter os Client IDs e Secrets necessários.</p>
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <p><strong>Secrets necessários:</strong> GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET</p>
                  <p><strong>Redirect URI:</strong> {window.location.origin}/settings/storage</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(providerInfo).map(([key, info]) => {
            const conn = getConnectionForProvider(key);
            const isConfigured = providers[key]?.configured || false;
            const expired = conn ? isTokenExpired(conn) : false;

            return (
              <Card key={key} className={`${info.color} border`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{info.icon}</span>
                    {info.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {!isConfigured && "Provedor não configurado"}
                    {isConfigured && !conn && "Pronto para conectar"}
                    {conn && !expired && `Conectado: ${conn.provider_account_email || "—"}`}
                    {conn && expired && "Token expirado — reconecte"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {conn && conn.is_active ? (
                      <Badge variant="outline" className="text-[10px] border-success/30 text-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {expired ? "Expirado" : "Conectado"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Desconectado
                      </Badge>
                    )}
                  </div>

                  {!conn || !conn.is_active ? (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(key)}
                      disabled={!isConfigured || connecting === key}
                      className="w-full"
                    >
                      {connecting === key ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
                      {isConfigured ? "Conectar" : "Não configurado"}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      {expired && (
                        <Button size="sm" variant="outline" onClick={() => handleConnect(key)} disabled={connecting === key} className="flex-1">
                          <RefreshCw className="h-3 w-3 mr-1" /> Reconectar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDisconnect(conn.id)} className="flex-1">
                        <Unlink className="h-3 w-3 mr-1" /> Desconectar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(conn.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Configured Folders */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Pastas Configuradas
            </CardTitle>
            {connections.filter((c) => c.is_active).length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar Pasta</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Configurar Pasta</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Provedor</Label>
                      <Select
                        value={folderPickerConnection?.id || ""}
                        onValueChange={(v) => setFolderPickerConnection(connections.find((c) => c.id === v) || null)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione um provedor conectado" /></SelectTrigger>
                        <SelectContent>
                          {connections.filter((c) => c.is_active).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {providerInfo[c.provider]?.icon} {providerInfo[c.provider]?.name} — {c.provider_account_email || c.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de Uso</Label>
                      <Select value={folderUsageType} onValueChange={setFolderUsageType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(usageTypeLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {folderPickerConnection && (
                      <Button
                        onClick={() => setFolderPickerOpen(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <FolderOpen className="h-4 w-4 mr-1" /> Navegar e Selecionar Pasta
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {folders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhuma pasta configurada.</p>
            ) : (
              <div className="space-y-2">
                {folders.map((folder) => (
                  <div key={folder.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{providerInfo[folder.provider]?.icon || "📁"}</span>
                      <div>
                        <p className="text-sm font-medium">{folder.folder_name || folder.folder_id || "Pasta"}</p>
                        <div className="flex gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[9px]">{providerInfo[folder.provider]?.name}</Badge>
                          <Badge variant="outline" className="text-[9px]">{usageTypeLabels[folder.usage_type] || folder.usage_type}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFolder(folder.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Picker for folder selection */}
      {folderPickerConnection && (
        <ExternalFilePicker
          open={folderPickerOpen}
          onOpenChange={setFolderPickerOpen}
          connectionId={folderPickerConnection.id}
          provider={folderPickerConnection.provider}
          mode="folder"
          onSelect={(items) => handleSelectFolder(folderPickerConnection, items)}
        />
      )}
    </AppLayout>
  );
}
