import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: any;
  onSaved: () => void;
}

const MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
];

export function PromptEditor({ open, onOpenChange, prompt, onSaved }: PromptEditorProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    tool_name: "",
    prompt_content: "",
    model_preferred: "google/gemini-3-flash-preview",
    temperature: 0.7,
    max_tokens: 4096,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prompt) {
      setForm({
        name: prompt.name || "",
        description: prompt.description || "",
        tool_name: prompt.tool_name || "",
        prompt_content: prompt.prompt_content || "",
        model_preferred: prompt.model_preferred || "google/gemini-3-flash-preview",
        temperature: prompt.temperature ?? 0.7,
        max_tokens: prompt.max_tokens ?? 4096,
        active: prompt.active ?? true,
      });
    } else {
      setForm({ name: "", description: "", tool_name: "", prompt_content: "", model_preferred: "google/gemini-3-flash-preview", temperature: 0.7, max_tokens: 4096, active: true });
    }
  }, [prompt, open]);

  const handleSave = async () => {
    if (!form.name || !form.tool_name) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (prompt?.id) {
        const { error } = await supabase.from("ai_prompts").update({ ...form, version: (prompt.version || 1) + 1 }).eq("id", prompt.id);
        if (error) throw error;
        toast({ title: "Prompt atualizado" });
      } else {
        const { error } = await supabase.from("ai_prompts").insert(form as any);
        if (error) throw error;
        toast({ title: "Prompt criado" });
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prompt ? "Editar Prompt" : "Novo Prompt"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Ferramenta (tool_name) *</Label>
              <Input value={form.tool_name} onChange={(e) => setForm({ ...form, tool_name: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Conteúdo do Prompt</Label>
            <Textarea rows={8} value={form.prompt_content} onChange={(e) => setForm({ ...form, prompt_content: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Modelo Preferido</Label>
              <Select value={form.model_preferred} onValueChange={(v) => setForm({ ...form, model_preferred: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperatura</Label>
              <Input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Max Tokens</Label>
              <Input type="number" value={form.max_tokens} onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
            <Label>Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
