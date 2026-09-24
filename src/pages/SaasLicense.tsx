import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCmsContent } from "@/hooks/useCmsContent";

export default function SaasLicense() {
  const navigate = useNavigate();
  const { data: cms, isLoading } = useCmsContent("saas-license");
  const hasCustomContent = cms?.html_content && cms.html_content.trim().length > 0;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : hasCustomContent ? (
          <article className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground" dangerouslySetInnerHTML={{ __html: cms!.html_content }} />
        ) : (
          <article className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground">
            <h1 className="text-3xl font-bold text-foreground">Contrato de Licença de Uso de Software (SaaS) – VirtuaLexis</h1>
            <p><strong>Última atualização:</strong> 09 de março de 2026</p>

            <hr />
            <h2>1. Objeto</h2>
            <p>O presente contrato regula a licença de uso da plataforma <strong>VirtuaLexis</strong>, sistema online de apoio operacional e inteligência jurídica destinado a advogados e escritórios de advocacia.</p>

            <hr />
            <h2>2. Licença de Uso</h2>
            <p>Ao contratar o VirtuaLexis, o usuário recebe uma <strong>licença limitada, não exclusiva e intransferível</strong> para utilizar a plataforma.</p>
            <ul>
              <li>Copiar o software</li>
              <li>Modificar a plataforma</li>
              <li>Distribuir ou revender o sistema</li>
              <li>Realizar engenharia reversa</li>
            </ul>

            <hr />
            <h2>3. Natureza da Plataforma</h2>
            <p>O VirtuaLexis é uma ferramenta tecnológica de apoio à operação jurídica. A plataforma não presta serviços jurídicos.</p>

            <hr />
            <h2>4. Funcionalidades</h2>
            <ul>
              <li>Gestão de processos jurídicos</li>
              <li>Monitoramento de movimentações processuais</li>
              <li>Organização de prazos</li>
              <li>Geração assistida de documentos jurídicos</li>
              <li>Análise estratégica de casos</li>
              <li>Inteligência artificial aplicada ao fluxo de trabalho jurídico</li>
            </ul>

            <hr />
            <h2>5. Planos e Pagamentos</h2>
            <p>O acesso ao VirtuaLexis poderá ser oferecido mediante planos de assinatura.</p>

            <hr />
            <h2>6. Limitação de Responsabilidade</h2>
            <p>O VirtuaLexis não se responsabiliza por perda de prazos processuais, decisões jurídicas tomadas com base no sistema, ou erros decorrentes do uso de inteligência artificial.</p>

            <hr />
            <h2>7. Legislação Aplicável</h2>
            <p>Este contrato é regido pela legislação brasileira.</p>
          </article>
        )}
      </div>
    </div>
  );
}
