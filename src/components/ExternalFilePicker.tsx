import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderOpen, FileText, ChevronRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType: string | null;
  size: number | null;
  webUrl: string | null;
  modifiedAt: string | null;
};

interface ExternalFilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
  provider: string;
  mode: "import" | "export" | "folder";
  onSelect: (items: FileItem[]) => void;
  siteId?: string;
}

const providerNames: Record<string, string> = {
  google_drive: "Google Drive",
  onedrive: "OneDrive",
  sharepoint: "SharePoint",
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function ExternalFilePicker({
  open, onOpenChange, connectionId, provider, mode, onSelect, siteId,
}: ExternalFilePickerProps) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Raiz" },
  ]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const fetchItems = async (folderId: string | null) => {
    setLoading(true);
    setSelected(new Set());

    const { data, error } = await supabase.functions.invoke("external-storage-browse", {
      body: {
        connection_id: connectionId,
        folder_id: folderId || undefined,
        site_id: siteId || undefined,
      },
    });

    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.message || error?.message || "Erro ao navegar");
      return;
    }
    setItems(data.items || []);
  };

  const handleOpen = () => {
    if (open) {
      fetchItems(null);
      setBreadcrumbs([{ id: null, name: "Raiz" }]);
      setCurrentFolderId(null);
    }
  };

  // Fetch on open
  useState(() => { if (open) handleOpen(); });

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
    fetchItems(folderId);
  };

  const navigateBack = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    fetchItems(target.id);
  };

  const toggleSelect = (item: FileItem) => {
    if (mode === "folder" && item.type !== "folder") return;
    if (mode === "folder") {
      // Single selection for folder mode
      setSelected(new Set([item.id]));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((i) => selected.has(i.id));
    onSelect(selectedItems);
    onOpenChange(false);
  };

  const filteredItems = mode === "folder"
    ? items.filter((i) => i.type === "folder")
    : items;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) handleOpen(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            {mode === "folder" ? "Selecionar Pasta" : mode === "export" ? "Selecionar Destino" : "Importar Arquivos"} — {providerNames[provider] || provider}
          </DialogTitle>
        </DialogHeader>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
          {breadcrumbs.map((bc, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button
                onClick={() => navigateBack(i)}
                className={`hover:underline ${i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {bc.name}
              </button>
            </div>
          ))}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto border rounded-lg divide-y divide-border min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {mode === "folder" ? "Nenhuma pasta encontrada." : "Nenhum arquivo encontrado."}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                  selected.has(item.id) ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
                onClick={() => {
                  if (item.type === "folder" && mode !== "folder") {
                    navigateToFolder(item.id, item.name);
                  } else {
                    toggleSelect(item);
                  }
                }}
                onDoubleClick={() => {
                  if (item.type === "folder") navigateToFolder(item.id, item.name);
                }}
              >
                {item.type === "folder" ? (
                  <FolderOpen className="h-5 w-5 text-warning shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    {item.size !== null && <span>{formatSize(item.size)}</span>}
                    {item.mimeType && <span>{item.mimeType}</span>}
                  </div>
                </div>
                {selected.has(item.id) && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
                {item.type === "folder" && mode !== "folder" && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selected.size > 0 ? `${selected.size} item(ns) selecionado(s)` : "Selecione itens para continuar"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={selected.size === 0}>
              {mode === "folder" ? "Selecionar Pasta" : mode === "export" ? "Exportar Aqui" : `Importar (${selected.size})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
