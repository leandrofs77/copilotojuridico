import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AILogTableProps {
  logs: any[];
}

export function AILogTable({ logs }: AILogTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Ferramenta</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Tempo (ms)</TableHead>
            <TableHead>Tokens In</TableHead>
            <TableHead>Tokens Out</TableHead>
            <TableHead>Custo Est.</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Nenhum log encontrado
              </TableCell>
            </TableRow>
          )}
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell className="font-medium">{log.tool_name || "—"}</TableCell>
              <TableCell className="text-xs">{log.model_used || "—"}</TableCell>
              <TableCell>{log.execution_time_ms ?? "—"}</TableCell>
              <TableCell>{log.tokens_input ?? 0}</TableCell>
              <TableCell>{log.tokens_output ?? 0}</TableCell>
              <TableCell>R$ {(log.estimated_cost ?? 0).toFixed(4)}</TableCell>
              <TableCell>
                <Badge variant={log.status === "success" ? "default" : "destructive"}>
                  {log.status === "success" ? "Sucesso" : "Erro"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
