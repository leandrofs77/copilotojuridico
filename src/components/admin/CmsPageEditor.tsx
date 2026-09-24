import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "./RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, EyeOff, Loader2, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import cmsDefaults from "@/lib/cmsDefaults";

interface CmsPage {
  id: string;
  page_slug: string;
  page_title: string;
  page_category: string;
  html_content: string;
  published: boolean;
  updated_at: string;
  updated_by: string | null;
}

interface CmsPageEditorProps {
  page: CmsPage;
  onBack: () => void;
  onSaved: () => void;
}

export function CmsPageEditor({ page, onBack, onSaved }: CmsPageEditorProps) {
  const { user } = useAuth();
  const defaultContent = cmsDefaults[page.page_slug] || "";
  const hasOriginalContent = !!(page.html_content && page.html_content.trim());
  const initialContent = hasOriginalContent ? page.html_content : defaultContent;
  const [title, setTitle] = useState(page.page_title);
  const [htmlContent, setHtmlContent] = useState(initialContent);
  const [published, setPublished] = useState(page.published);
  const [isUsingDefault, setIsUsingDefault] = useState(!hasOriginalContent && !!defaultContent);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSave = async (publish?: boolean) => {
    setSaving(true);
    const pubValue = publish !== undefined ? publish : published;

    const { error } = await supabase
      .from("cms_pages")
      .update({
        page_title: title,
        html_content: htmlContent,
        published: pubValue,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", page.id);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(pubValue ? "Página publicada!" : "Rascunho salvo!");
      setPublished(pubValue);
      setIsUsingDefault(false);
      onSaved();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">/{page.page_slug}</Badge>
            {published ? (
              <Badge variant="default" className="text-xs"><Eye className="h-3 w-3 mr-1" /> Publicado</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs"><EyeOff className="h-3 w-3 mr-1" /> Rascunho</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" /> Pré-visualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar rascunho
          </Button>
          <Button size="sm" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Publicar
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <Label>Título da página</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-2">
        <Switch checked={published} onCheckedChange={setPublished} />
        <Label className="text-sm">{published ? "Publicado" : "Rascunho"}</Label>
      </div>

      {/* Default content banner */}
      {isUsingDefault && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-primary">
          <Info className="h-4 w-4 shrink-0" />
          <span>Este é o conteúdo padrão da página. Edite e salve para personalizar.</span>
        </div>
      )}

      {/* Editor */}
      <div>
        <Label className="mb-2 block">Conteúdo</Label>
        <RichTextEditor value={htmlContent} onChange={setHtmlContent} placeholder="Insira o conteúdo da página..." />
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização: {title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
