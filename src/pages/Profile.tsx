import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", oab_number: "", specialty: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setForm({ full_name: data.full_name || "", phone: data.phone || "", oab_number: data.oab_number || "", specialty: data.specialty || "" });
      setLoading(false);
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone || null, oab_number: form.oab_number || null, specialty: form.specialty || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado!");
  };

  return (
    <AppLayout title="Perfil" breadcrumbs={[{ label: "Perfil" }]}>
      <Card className="max-w-lg glass-card">
        <CardHeader><CardTitle className="font-display">Meus Dados</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Carregando...</p> : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
              <div className="space-y-2"><Label>Nome Completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Número OAB</Label><Input value={form.oab_number} onChange={(e) => setForm({ ...form, oab_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>Especialidade</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
