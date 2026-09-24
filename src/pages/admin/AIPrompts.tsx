import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PromptEditor } from "@/components/admin/ai/PromptEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Copy, Pencil } from "lucide-react";

export default function AIPrompts() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from("ai_prompts").select("*").order("created_at", { ascending: false });
    setPrompts(data || []);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("ai_prompts").update({ active: !active }).eq("id", id);
    load();
  };

  const duplicate = async (prompt: any) => {
    const { id, created_at, updated_at, ...rest } = prompt;
    await supabase.from("ai_prompts").insert({ ...rest, name: `${rest.name} (cópia)`, version: 1 } as any);
    toast({ title: "Prompt duplicado" });
    load();
  };

  return (
    <AppLayout title="Gerenciamento de Prompts" breadcrumbs={[{ label: "Administração" }, { label: "Prompts" }]}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditingPrompt(null); setEditorOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Prompt
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Ferramenta</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{p.tool_name}</Badge></TableCell>
                <TableCell className="text-xs">{p.model_preferred}</TableCell>
                <TableCell>v{p.version}</TableCell>
                <TableCell>
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id, p.active)} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingPrompt(p); setEditorOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => duplicate(p)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PromptEditor open={editorOpen} onOpenChange={setEditorOpen} prompt={editingPrompt} onSaved={load} />
    </AppLayout>
  );
}
