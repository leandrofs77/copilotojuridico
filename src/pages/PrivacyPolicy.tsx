import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCmsContent } from "@/hooks/useCmsContent";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { data: cms, isLoading } = useCmsContent("privacy-policy");
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
            <h1 className="text-3xl font-bold text-foreground">Política de Privacidade – VirtuaLexis</h1>
            <p><strong>Última atualização:</strong> Setembro de 2026</p>

            <p>A VirtuaLexis ("nós", "nosso" ou "plataforma") valoriza a sua privacidade e está comprometida em proteger os dados pessoais dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações ao utilizar nossa plataforma jurídica baseada em inteligência artificial.</p>

            <hr />

            <h2>1. Informações que Coletamos</h2>
            <h3>1.1 Dados fornecidos pelo usuário</h3>
            <ul>
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número da OAB (para advogados)</li>
              <li>Telefone (opcional)</li>
              <li>Especialidade jurídica (opcional)</li>
            </ul>

            <h3>1.2 Dados gerados pelo uso da plataforma</h3>
            <ul>
              <li>Dados de casos jurídicos inseridos pelo usuário</li>
              <li>Documentos enviados para análise</li>
              <li>Eventos e linhas do tempo criados</li>
              <li>Relatórios gerados</li>
              <li>Logs de atividade (ações realizadas na plataforma)</li>
              <li>Dados de uso de IA (tokens consumidos, modelos utilizados)</li>
            </ul>

            <h3>1.3 Dados coletados automaticamente</h3>
            <ul>
              <li>Endereço IP</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Cookies de sessão e autenticação</li>
              <li>Dados de navegação dentro da plataforma</li>
            </ul>

            <hr />

            <h2>2. Como Usamos Seus Dados</h2>
            <p>Utilizamos suas informações para:</p>
            <ul>
              <li>Criar e gerenciar sua conta</li>
              <li>Processar e analisar documentos jurídicos com IA</li>
              <li>Gerar relatórios, cronologias e análises estratégicas</li>
              <li>Fornecer funcionalidades da plataforma (gestão de casos, prazos, partes, etc.)</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Enviar comunicações sobre atualizações, segurança ou suporte</li>
              <li>Cumprir obrigações legais</li>
            </ul>

            <hr />

            <h2>3. Processamento por Inteligência Artificial</h2>
            <ul>
              <li>O processamento por provedores externos de IA é opcional e depende de autorização expressa do usuário nas configurações de privacidade.</li>
              <li>Quando autorizado, descrições de casos, trechos de documentos, eventos processuais, relatórios e amostras de escrita podem ser enviados aos provedores de IA necessários para executar a funcionalidade solicitada.</li>
              <li>Quando a autorização é desativada, novas rotinas de processamento externo por IA são bloqueadas no servidor.</li>
              <li>As condições de retenção, tratamento e eventual uso dos dados pelos provedores externos dependem dos contratos, planos e políticas aplicáveis a cada integração configurada pela plataforma.</li>
              <li>O conteúdo gerado por IA deve ser revisado por profissional qualificado antes de qualquer uso jurídico ou profissional.</li>
            </ul>

            <hr />

            <h2>4. Compartilhamento de Dados</h2>
            <p><strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong>, exceto:</p>
            <ul>
              <li><strong>Provedores de infraestrutura:</strong> utilizamos serviços seguros para armazenamento de dados.</li>
              <li><strong>Provedores de IA:</strong> mediante autorização do usuário, dados estritamente necessários à funcionalidade solicitada podem ser transmitidos para APIs externas de IA para processamento.</li>
              <li><strong>Obrigações legais:</strong> quando exigido por lei ou ordem judicial.</li>
            </ul>

            <hr />

            <h2>5. Armazenamento e Segurança</h2>
            <ul>
              <li>Dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS) e em repouso.</li>
              <li>Utilizamos Row-Level Security (RLS) para garantir que cada usuário acesse apenas seus próprios dados.</li>
              <li>Senhas são armazenadas com hash seguro e nunca em texto plano.</li>
              <li>Implementamos controle de acesso baseado em funções (RBAC).</li>
              <li>Conexões com armazenamento externo utilizam tokens criptografados.</li>
            </ul>

            <hr />

            <h2>6. Seus Direitos (LGPD)</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar o consentimento para o processamento</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Obter informações sobre compartilhamento de dados</li>
            </ul>
            <p>Para exercer esses direitos, entre em contato conosco pelo e-mail indicado abaixo.</p>

            <hr />

            <h2>7. Cookies</h2>
            <p>Utilizamos cookies essenciais para:</p>
            <ul>
              <li>Manter sua sessão de autenticação</li>
              <li>Garantir o funcionamento adequado da plataforma</li>
            </ul>
            <p>Não utilizamos cookies de rastreamento ou publicidade de terceiros.</p>

            <hr />

            <h2>8. Retenção de Dados</h2>
            <ul>
              <li>Dados de conta são mantidos enquanto a conta estiver ativa.</li>
              <li>Dados de casos e documentos são mantidos conforme necessidade do usuário.</li>
              <li>Logs de atividade são mantidos por até 12 meses.</li>
              <li>Após exclusão da conta, dados são removidos em até 30 dias, exceto quando houver obrigação legal de retenção.</li>
            </ul>

            <hr />

            <h2>9. Alterações nesta Política</h2>
            <p>Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma.</p>

            <hr />

            <h2>10. Contato</h2>
            <p>Para dúvidas, solicitações ou reclamações sobre privacidade:</p>
            <ul>
              <li><strong>E-mail:</strong> privacidade@virtualexis.com.br</li>
              <li><strong>Responsável:</strong> Encarregado de Proteção de Dados (DPO)</li>
            </ul>

            <hr />

            <p className="text-sm text-muted-foreground">Esta política é válida a partir da data de sua última atualização e se aplica a todos os usuários da plataforma VirtuaLexis.</p>
          </article>
        )}
      </div>
    </div>
  );
}
