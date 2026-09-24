import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCmsContent } from "@/hooks/useCmsContent";

export default function TermsOfService() {
  const navigate = useNavigate();
  const { data: cms, isLoading } = useCmsContent("terms-of-service");
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
            <h1 className="text-3xl font-bold text-foreground">Termos de Serviço – VirtuaLexis</h1>
            <p><strong>Última atualização:</strong> Junho de 2025</p>

            <p>Bem-vindo ao VirtuaLexis. Ao acessar ou utilizar nossa plataforma, você concorda com estes Termos de Serviço. Por favor, leia-os com atenção.</p>

            <hr />
            <h2>1. Definições</h2>
            <ul>
              <li><strong>"Plataforma"</strong>: o sistema VirtuaLexis, incluindo todas as suas funcionalidades, APIs e interfaces.</li>
              <li><strong>"Usuário"</strong>: qualquer pessoa física ou jurídica que se cadastre e utilize a plataforma.</li>
              <li><strong>"Conteúdo do Usuário"</strong>: dados, documentos, informações e materiais inseridos pelo usuário na plataforma.</li>
              <li><strong>"Serviços de IA"</strong>: funcionalidades que utilizam inteligência artificial para análise, classificação e geração de conteúdo.</li>
            </ul>

            <hr />
            <h2>2. Aceitação dos Termos</h2>
            <p>Ao criar uma conta ou utilizar qualquer funcionalidade da plataforma, você declara que:</p>
            <ul>
              <li>Leu e compreendeu estes Termos de Serviço</li>
              <li>Concorda em cumpri-los integralmente</li>
              <li>Possui capacidade legal para celebrar este acordo</li>
              <li>Se profissional do direito, possui inscrição ativa na OAB</li>
            </ul>

            <hr />
            <h2>3. Descrição do Serviço</h2>
            <p>O VirtuaLexis é uma plataforma de gestão jurídica inteligente que oferece:</p>
            <ul>
              <li>Gestão de casos e processos jurídicos</li>
              <li>Upload e análise automatizada de documentos</li>
              <li>Geração de linhas do tempo e cronologias</li>
              <li>Análise estratégica e de viabilidade com IA</li>
              <li>Geração de peças jurídicas assistida por IA</li>
              <li>Relatórios e diagnósticos visuais</li>
              <li>Monitoramento de prazos e movimentações processuais</li>
              <li>Base de conhecimento jurídico</li>
            </ul>

            <hr />
            <h2>4. Cadastro e Conta</h2>
            <h3>4.1 Requisitos</h3>
            <ul>
              <li>O usuário deve fornecer informações verdadeiras e atualizadas</li>
              <li>Cada pessoa deve manter apenas uma conta</li>
              <li>O usuário é responsável pela segurança de suas credenciais</li>
            </ul>
            <h3>4.2 Segurança da Conta</h3>
            <ul>
              <li>Não compartilhe suas credenciais de acesso</li>
              <li>Notifique-nos imediatamente sobre qualquer uso não autorizado</li>
            </ul>

            <hr />
            <h2>5. Uso Aceitável</h2>
            <h3>5.1 O usuário concorda em:</h3>
            <ul>
              <li>Utilizar a plataforma apenas para fins legítimos e legais</li>
              <li>Não inserir dados falsos ou fraudulentos</li>
              <li>Respeitar a propriedade intelectual de terceiros</li>
              <li>Não tentar acessar dados de outros usuários</li>
            </ul>

            <hr />
            <h2>6. Propriedade Intelectual</h2>
            <h3>6.1 Da Plataforma</h3>
            <ul>
              <li>O VirtuaLexis, incluindo código, design, marca e funcionalidades, é propriedade exclusiva dos seus criadores</li>
            </ul>
            <h3>6.2 Do Conteúdo do Usuário</h3>
            <ul>
              <li>O usuário mantém todos os direitos sobre seus dados e documentos</li>
            </ul>

            <hr />
            <h2>7. Serviços de Inteligência Artificial</h2>
            <ul>
              <li>Os resultados gerados por IA são sugestões e não substituem o julgamento profissional do advogado</li>
              <li>A IA pode cometer erros e as análises devem ser revisadas pelo profissional</li>
            </ul>

            <hr />
            <h2>8. Planos e Pagamentos</h2>
            <ul>
              <li>A plataforma pode oferecer planos gratuitos (trial) e pagos</li>
              <li>Pagamentos são processados por provedores terceiros</li>
              <li>O usuário pode cancelar sua assinatura a qualquer momento</li>
            </ul>

            <hr />
            <h2>9. Limitação de Responsabilidade</h2>
            <ul>
              <li>O VirtuaLexis é fornecido "como está" (as is)</li>
              <li>Não garantimos que os resultados de IA sejam precisos ou completos</li>
            </ul>

            <hr />
            <h2>10. Contato</h2>
            <ul>
              <li><strong>E-mail:</strong> contato@virtualexis.com.br</li>
            </ul>

            <hr />
            <p className="text-sm text-muted-foreground">Ao utilizar o VirtuaLexis, você confirma que leu, compreendeu e concorda com estes Termos de Serviço.</p>
          </article>
        )}
      </div>
    </div>
  );
}
