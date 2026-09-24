import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const legalAreas = [
  "Direito Civil", "Direito Penal", "Direito Trabalhista", "Direito Tributário",
  "Direito Administrativo", "Direito Empresarial", "Direito do Consumidor",
  "Direito Ambiental", "Direito Constitucional", "Direito de Família", "Outro",
];

export default function NewCase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", legal_area: "", case_number: "", court: "", observations: "", tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("cases").insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      legal_area: form.legal_area || null,
      case_number: form.case_number || null,
      court: form.court || null,
      observations: form.observations || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      created_by: user.id,
    }).select().single();
    setLoading(false);
    if (error) {
      toast.error("Erro ao criar caso: " + error.message);
    } else {
      toast.success("Caso criado com sucesso!");
      await supabase.from("activity_logs").insert({
        user_id: user.id, action: "case_created" as any, entity_type: "case",
        entity_id: data.id, case_id: data.id, metadata: { title: form.title },
      });
      navigate(`/cases/${data.id}`);
    }
  };

  return (
    <AppLayout title="Novo Caso" breadcrumbs={[{ label: "Casos", href: "/cases" }, { label: "Novo Caso" }]}>
      <Card className="max-w-2xl glass-card">
        <CardHeader>
          <CardTitle className="font-display">Dados do Caso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Título do caso" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea placeholder="Descrição detalhada do caso" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Área do Direito</Label>
                <Select value={form.legal_area} onValueChange={(v) => setForm({ ...form, legal_area: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {legalAreas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número do Processo</Label>
                <Input placeholder="0000000-00.0000.0.00.0000" value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vara / Tribunal</Label>
              <Input placeholder="Ex: 1ª Vara Cível" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input placeholder="urgente, recurso, liminar" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Notas adicionais" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Caso"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/cases")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
