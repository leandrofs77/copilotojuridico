import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCmsContent } from "@/hooks/useCmsContent";

export default function AIDisclaimer() {
  const navigate = useNavigate();
  const { data: cms, isLoading } = useCmsContent("ai-disclaimer");
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
            <h1 className="text-3xl font-bold text-foreground">Aviso Legal sobre Uso de Inteligência Artificial – VirtuaLexis</h1>
            <p><strong>Última atualização:</strong> 09 de março de 2026</p>

            <hr />

            <h2>1. Natureza da Inteligência Artificial</h2>
            <p>O VirtuaLexis utiliza tecnologias de inteligência artificial para auxiliar advogados e escritórios de advocacia em atividades como:</p>
            <ul>
              <li>Análise de dados processuais</li>
              <li>Organização de informações jurídicas</li>
              <li>Geração assistida de documentos</li>
              <li>Sugestões estratégicas de atuação</li>
              <li>Identificação de padrões em processos judiciais</li>
            </ul>
            <p>Essas funcionalidades têm caráter <strong>exclusivamente assistivo e tecnológico</strong>.</p>
            <p>A inteligência artificial do VirtuaLexis <strong>não realiza consultoria jurídica nem substitui a atuação profissional do advogado</strong>.</p>

            <hr />

            <h2>2. Necessidade de Validação Profissional</h2>
            <p>Todo conteúdo gerado pela inteligência artificial deve ser <strong>obrigatoriamente revisado por profissional habilitado</strong> antes de qualquer utilização.</p>

            <hr />

            <h2>3. Limitações da Inteligência Artificial</h2>
            <p>O usuário reconhece que sistemas de inteligência artificial podem apresentar:</p>
            <ul>
              <li>Interpretações imprecisas</li>
              <li>Informações incompletas</li>
              <li>Erros factuais</li>
              <li>Generalizações inadequadas</li>
              <li>Sugestões não aplicáveis ao caso concreto</li>
            </ul>

            <hr />

            <h2>4. Responsabilidade Profissional</h2>
            <p>A responsabilidade pela elaboração, revisão e utilização de qualquer conteúdo jurídico permanece integralmente com o advogado ou escritório usuário da plataforma.</p>

            <hr />

            <h2>5. Uso Ético da Tecnologia</h2>
            <p>O usuário concorda em utilizar os recursos de inteligência artificial de forma ética, profissional e em conformidade com a legislação brasileira aplicável.</p>

            <hr />

            <h2>6. Aceitação</h2>
            <p>Ao utilizar funcionalidades baseadas em inteligência artificial no VirtuaLexis, o usuário declara estar ciente destas limitações e concorda em assumir a responsabilidade profissional sobre o uso das informações geradas.</p>
          </article>
        )}
      </div>
    </div>
  );
}
