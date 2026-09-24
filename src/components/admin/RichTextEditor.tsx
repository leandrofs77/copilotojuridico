import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageUploader } from "./ImageUploader";
import {
  Bold, Italic, Underline, Strikethrough, Code, Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link, Image, FileCode, Type, Palette, Undo, Redo, RemoveFormatting,
  Quote, Minus, Table, Maximize2, Minimize2
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type EditorMode = "visual" | "html" | "markdown";

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff0000", "#ff6600", "#ffcc00", "#33cc33", "#3399ff", "#9933ff",
  "#cc0000", "#cc6600", "#cccc00", "#009900", "#0066cc", "#6600cc",
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<EditorMode>("visual");
  const [htmlSource, setHtmlSource] = useState(value);
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageDialog, setImageDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && mode === "visual") {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    if (mode === "html") {
      setHtmlSource(value);
    }
  }, [value, mode]);

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelection(sel.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    if (savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection);
    }
  };

  const handleInsertLink = () => {
    restoreSelection();
    if (linkUrl) {
      if (linkText) {
        const html = `<a href="${linkUrl}" target="_blank" rel="noopener">${linkText}</a>`;
        document.execCommand("insertHTML", false, html);
      } else {
        document.execCommand("createLink", false, linkUrl);
      }
      syncContent();
    }
    setLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = (url: string) => {
    editorRef.current?.focus();
    restoreSelection();
    const html = `<img src="${url}" alt="" style="max-width:100%;height:auto;" />`;
    document.execCommand("insertHTML", false, html);
    syncContent();
    setImageDialog(false);
  };

  const handleHtmlChange = (html: string) => {
    setHtmlSource(html);
    onChange(html);
  };

  const switchMode = (newMode: EditorMode) => {
    if (mode === "visual") {
      const currentHtml = editorRef.current?.innerHTML || "";
      onChange(currentHtml);
      setHtmlSource(currentHtml);
    } else if (mode === "html") {
      onChange(htmlSource);
    }
    setMode(newMode);
  };

  const ToolbarButton = ({ icon: Icon, title, onClick, active }: { icon: any; title: string; onClick: () => void; active?: boolean }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${active ? "bg-accent text-accent-foreground" : ""}`}
      onClick={onClick}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background flex flex-col"
    : "border rounded-lg overflow-hidden bg-background";

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-1 flex flex-wrap gap-0.5 items-center">
        {/* Mode switcher */}
        <div className="flex gap-0.5 mr-2">
          {(["visual", "html", "markdown"] as EditorMode[]).map(m => (
            <Button
              key={m}
              type="button"
              variant={mode === m ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => switchMode(m)}
            >
              {m === "visual" ? "Visual" : m === "html" ? "HTML" : "MD"}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {mode === "visual" && (
          <>
            {/* Undo/Redo */}
            <ToolbarButton icon={Undo} title="Desfazer" onClick={() => exec("undo")} />
            <ToolbarButton icon={Redo} title="Refazer" onClick={() => exec("redo")} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text formatting */}
            <ToolbarButton icon={Bold} title="Negrito (Ctrl+B)" onClick={() => exec("bold")} />
            <ToolbarButton icon={Italic} title="Itálico (Ctrl+I)" onClick={() => exec("italic")} />
            <ToolbarButton icon={Underline} title="Sublinhado (Ctrl+U)" onClick={() => exec("underline")} />
            <ToolbarButton icon={Strikethrough} title="Riscado" onClick={() => exec("strikeThrough")} />
            <ToolbarButton icon={Code} title="Código inline" onClick={() => {
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const text = sel.toString();
                document.execCommand("insertHTML", false, `<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;">${text}</code>`);
                syncContent();
              }
            }} />
            <ToolbarButton icon={RemoveFormatting} title="Remover formatação" onClick={() => exec("removeFormat")} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Headings */}
            <ToolbarButton icon={Heading1} title="Título 1" onClick={() => exec("formatBlock", "h1")} />
            <ToolbarButton icon={Heading2} title="Título 2" onClick={() => exec("formatBlock", "h2")} />
            <ToolbarButton icon={Heading3} title="Título 3" onClick={() => exec("formatBlock", "h3")} />
            <ToolbarButton icon={Heading4} title="Título 4" onClick={() => exec("formatBlock", "h4")} />
            <ToolbarButton icon={Type} title="Parágrafo" onClick={() => exec("formatBlock", "p")} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <ToolbarButton icon={List} title="Lista" onClick={() => exec("insertUnorderedList")} />
            <ToolbarButton icon={ListOrdered} title="Lista numerada" onClick={() => exec("insertOrderedList")} />
            <ToolbarButton icon={Quote} title="Citação" onClick={() => exec("formatBlock", "blockquote")} />
            <ToolbarButton icon={Minus} title="Linha horizontal" onClick={() => exec("insertHorizontalRule")} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Alignment */}
            <ToolbarButton icon={AlignLeft} title="Alinhar à esquerda" onClick={() => exec("justifyLeft")} />
            <ToolbarButton icon={AlignCenter} title="Centralizar" onClick={() => exec("justifyCenter")} />
            <ToolbarButton icon={AlignRight} title="Alinhar à direita" onClick={() => exec("justifyRight")} />
            <ToolbarButton icon={AlignJustify} title="Justificar" onClick={() => exec("justifyFull")} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Colors */}
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Cor do texto">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Cor do texto</p>
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      onClick={() => exec("foreColor", c)}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium mt-3 mb-2 text-muted-foreground">Cor de fundo</p>
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map(c => (
                    <button
                      key={`bg-${c}`}
                      className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      onClick={() => exec("hiliteColor", c)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Link */}
            <ToolbarButton icon={Link} title="Inserir link" onClick={() => {
              saveSelection();
              const sel = window.getSelection();
              setLinkText(sel?.toString() || "");
              setLinkDialog(true);
            }} />

            {/* Image */}
            <ToolbarButton icon={Image} title="Inserir imagem" onClick={() => {
              saveSelection();
              setImageDialog(true);
            }} />

            {/* Table */}
            <ToolbarButton icon={Table} title="Inserir tabela" onClick={() => {
              editorRef.current?.focus();
              const html = `<table style="border-collapse:collapse;width:100%;"><thead><tr><th style="border:1px solid #ddd;padding:8px;">Coluna 1</th><th style="border:1px solid #ddd;padding:8px;">Coluna 2</th><th style="border:1px solid #ddd;padding:8px;">Coluna 3</th></tr></thead><tbody><tr><td style="border:1px solid #ddd;padding:8px;">—</td><td style="border:1px solid #ddd;padding:8px;">—</td><td style="border:1px solid #ddd;padding:8px;">—</td></tr></tbody></table><p><br></p>`;
              document.execCommand("insertHTML", false, html);
              syncContent();
            }} />
          </>
        )}

        <div className="flex-1" />

        {/* Fullscreen */}
        <ToolbarButton
          icon={isFullscreen ? Minimize2 : Maximize2}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          onClick={() => setIsFullscreen(!isFullscreen)}
        />
      </div>

      {/* Editor area */}
      {mode === "visual" && (
        <div
          ref={editorRef}
          contentEditable
          className={`p-4 prose prose-sm dark:prose-invert max-w-none focus:outline-none overflow-auto ${isFullscreen ? "flex-1" : "min-h-[400px] max-h-[700px]"}`}
          onInput={syncContent}
          onBlur={syncContent}
          data-placeholder={placeholder || "Comece a editar..."}
          style={{ minHeight: isFullscreen ? undefined : 400 }}
          suppressContentEditableWarning
        />
      )}

      {mode === "html" && (
        <Textarea
          value={htmlSource}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className={`font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0 ${isFullscreen ? "flex-1" : "min-h-[400px]"}`}
          placeholder="<h1>Título</h1><p>Conteúdo...</p>"
        />
      )}

      {mode === "markdown" && (
        <div className={`p-4 ${isFullscreen ? "flex-1 overflow-auto" : "min-h-[400px] max-h-[700px] overflow-auto"}`}>
          <p className="text-sm text-muted-foreground mb-4">
            O modo Markdown exibe o HTML como referência. Edite no modo HTML ou Visual para alterações.
          </p>
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Texto (opcional)</Label>
              <Input value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Texto do link" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(false)}>Cancelar</Button>
            <Button onClick={handleInsertLink}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
          </DialogHeader>
          <ImageUploader onSelect={handleInsertImage} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
