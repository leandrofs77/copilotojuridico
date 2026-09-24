import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AIModelSelectorProps {
  models: { id: string; model_name: string; display_name: string | null; active: boolean }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function AIModelSelector({ models, value, onChange, label = "Modelo" }: AIModelSelectorProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um modelo" />
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.id} value={m.model_name}>
              {m.display_name || m.model_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
