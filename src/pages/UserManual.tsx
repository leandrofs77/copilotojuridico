import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen, LogIn, LayoutDashboard, FileSearch, Briefcase, FolderOpen,
  FileText, Clock, BarChart3, Search, User, Settings, Pen, Handshake,
  Cloud, ShieldCheck, ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const sections = [
  { id: "introducao", label: "Introdução", icon: BookOpen },
  { id: "acesso", label: "Acesso e Login", icon: LogIn },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "triagem", label: "Triagem de Caso", icon: FileSearch },
  { id: "casos", label: "Gestão de Casos", icon: Briefcase },
  { id: "detalhes-caso", label: "Detalhes do Caso", icon: FolderOpen },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "timeline", label: "Timeline Global", icon: Clock },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "busca", label: "Busca", icon: Search },
  { id: "perfil", label: "Perfil", icon: User },
  { id: "configuracoes", label: "Configurações", icon: Settings },
  { id: "estilo-redacao", label: "Estilo de Redação", icon: Pen },
  { id: "parceiros", label: "Parceiros", icon: Handshake },
  { id: "armazenamento", label: "Armazenamento Externo", icon: Cloud },
  { id: "admin", label: "Painel Admin", icon: ShieldCheck },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-display font-bold text-foreground mt-10 mb-4 scroll-mt-20 border-b border-border pb-2">
      {children}
    </h2>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-muted-foreground leading-relaxed">
      <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

export default function UserManual() {
  const [activeSection, setActiveSection] = useState("introducao");

  const handleClick = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AppLayout title="Manual do Usuário" breadcrumbs={[{ label: "Manual do Usuário" }]}>
      <div className="flex gap-8">
        {/* Sidebar nav */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <nav className="space-y-1 pr-4">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleClick(s.id)}
                    className={cn(
                      "flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeSection === s.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <s.icon className="h-4 w-4 shrink-0" />
                    {s.label}
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          {/* 1. Introdução */}
          <SectionHeading id="introducao">1. Introdução</SectionHeading>
          <P>
            O VirtuaLexis é uma plataforma de inteligência jurídica que combina gestão de casos com análise por inteligência artificial. Projetado para advogados e escritórios de advocacia, o sistema automatiza a triagem, análise estratégica, controle de provas, prazos e geração de documentos jurídicos.
          </P>
          <P>
            Este manual cobre todas as funcionalidades disponíveis na plataforma, com instruções passo a passo para operação correta.
          </P>

          {/* 2. Acesso e Login */}
          <SectionHeading id="acesso">2. Acesso e Login</SectionHeading>
          <Sub>Cadastro</Sub>
          <P>Para criar uma conta, acesse a página de login e clique em "Criar conta". Preencha seu e-mail e senha. Um e-mail de confirmação será enviado para validar seu cadastro.</P>
          <Sub>Login</Sub>
          <P>Insira seu e-mail e senha na tela de login. Você também pode utilizar login social (Google) se disponível.</P>
          <Sub>Redefinição de Senha</Sub>
          <P>Clique em "Esqueceu a senha?" na tela de login. Um e-mail com link de redefinição será enviado. Siga as instruções para criar uma nova senha.</P>
          <Sub>Controle de Acesso</Sub>
          <P>Após o cadastro, sua conta passa por aprovação. O status pode ser: pendente, ativo, pausado, suspenso ou cancelado. Apenas contas ativas com licença válida têm acesso ao sistema.</P>

          {/* 3. Dashboard */}
          <SectionHeading id="dashboard">3. Dashboard</SectionHeading>
          <P>O Dashboard é a tela inicial após o login. Ele apresenta uma visão geral do seu escritório:</P>
          <ul className="space-y-2 mb-4">
            <Li><strong>Cartões de resumo:</strong> Total de casos, documentos, eventos na timeline e prazos próximos.</Li>
            <Li><strong>Casos recentes:</strong> Lista dos últimos casos criados ou atualizados, com acesso rápido.</Li>
            <Li><strong>Processamento de documentos:</strong> Status dos documentos sendo analisados pela IA (pendentes, em processamento, concluídos, com erro).</Li>
            <Li><strong>Log de atividades:</strong> Registro cronológico das ações realizadas na plataforma.</Li>
          </ul>

          {/* 4. Triagem */}
          <SectionHeading id="triagem">4. Triagem de Caso</SectionHeading>
          <P>A triagem permite avaliar rapidamente a viabilidade de um novo caso antes de cadastrá-lo formalmente.</P>
          <Sub>Como usar</Sub>
          <ol className="space-y-2 mb-4 list-decimal list-inside text-muted-foreground">
            <li>Acesse <strong>Triagem</strong> no menu lateral.</li>
            <li>Descreva o caso no campo de texto, incluindo fatos relevantes, área jurídica e pretensão do cliente.</li>
            <li>Opcionalmente, faça upload de documentos iniciais (petições, contratos, etc.).</li>
            <li>Clique em <strong>"Analisar com IA"</strong>.</li>
            <li>A IA retornará: área jurídica identificada, nível de viabilidade, probabilidade de êxito, complexidade, pontos fortes, fatores de risco, duração estimada e recomendação.</li>
            <li>Se o caso for viável, clique em <strong>"Converter em Caso"</strong> para criá-lo no sistema.</li>
          </ol>

          {/* 5. Gestão de Casos */}
          <SectionHeading id="casos">5. Gestão de Casos</SectionHeading>
          <Sub>Listagem de Casos</Sub>
          <P>A página de Casos exibe todos os seus processos. Utilize os filtros por status (ativo, arquivado, encerrado) e a barra de busca para localizar casos específicos.</P>
          <Sub>Criar Novo Caso</Sub>
          <ol className="space-y-2 mb-4 list-decimal list-inside text-muted-foreground">
            <li>Clique em <strong>"Novo Caso"</strong>.</li>
            <li>Preencha: título, descrição, área jurídica, número do processo (opcional), vara/tribunal (opcional), observações e tags.</li>
            <li>Clique em <strong>"Criar Caso"</strong>.</li>
          </ol>
          <P>Após a criação, você será redirecionado para a página de detalhes do caso.</P>

          {/* 6. Detalhes do Caso */}
          <SectionHeading id="detalhes-caso">6. Detalhes do Caso</SectionHeading>
          <P>A página de detalhes do caso é o centro de operações. Ela contém 16 abas especializadas:</P>

          <Sub>6.1. Resumo</Sub>
          <P>Visão geral do caso com informações principais, status, área jurídica, tags e observações. Permite edição rápida dos dados do caso.</P>

          <Sub>6.2. Partes</Sub>
          <P>Cadastro e gestão das partes envolvidas no processo (autor, réu, terceiros, testemunhas). Para cada parte, registre nome, tipo, CPF/CNPJ, e-mail, telefone e observações.</P>

          <Sub>6.3. Documentos</Sub>
          <P>Upload e gestão de documentos vinculados ao caso. Ao fazer upload, o sistema:</P>
          <ul className="space-y-2 mb-4">
            <Li>Extrai o texto do documento automaticamente.</Li>
            <Li>Classifica o tipo de documento por IA.</Li>
            <Li>Gera um resumo automático.</Li>
            <Li>Analisa o conteúdo jurídico.</Li>
            <Li>Extrai eventos para a timeline.</Li>
          </ul>

          <Sub>6.4. Timeline</Sub>
          <P>Visualização cronológica de todos os eventos do caso, tanto extraídos automaticamente de documentos quanto inseridos manualmente. Cada evento possui data, título, descrição, categoria e nível de relevância.</P>

          <Sub>6.5. Viabilidade</Sub>
          <P>Análise de viabilidade jurídica gerada por IA. Avalia probabilidade de êxito, complexidade, fatores de risco, pontos fortes e recomendações. Clique em "Gerar Análise" para criar ou atualizar.</P>

          <Sub>6.6. Estratégia</Sub>
          <P>Análise estratégica completa por IA, incluindo: teses possíveis, pontos fortes e fracos, contra-argumentos esperados, fatores de risco, jurisprudência relevante e recomendações estratégicas.</P>

          <Sub>6.7. Provas</Sub>
          <P>Checklist de provas necessárias gerada por IA. Para cada prova, indica tipo, descrição, nível de importância e status (pendente, obtida, indisponível). Permite gerenciar o status manualmente.</P>

          <Sub>6.8. Força do Caso (Simulação de Provas)</Sub>
          <P>Simulação do impacto probatório. A IA avalia a força atual do caso, analisa o impacto de cada prova obtida e projeta a força potencial caso provas faltantes sejam obtidas.</P>

          <Sub>6.9. Mapa do Caso (Diagnóstico Visual)</Sub>
          <P>Painel visual com scores de 0 a 100 em múltiplas dimensões: viabilidade, evidências, complexidade, urgência, risco, timing e intensidade do conflito. Apresentado em formato de gráfico radar.</P>

          <Sub>6.10. Conhecimento</Sub>
          <P>Base de conhecimento jurídico do caso. Armazena teses, jurisprudências, precedentes e insights gerados pela IA ou inseridos manualmente. Os itens podem ser marcados como favoritos ou arquivados.</P>

          <Sub>6.11. Radar Estratégico</Sub>
          <P>Visão consolidada de inteligência estratégica: probabilidade de sucesso, score de risco, score de confiança, vantagens e fraquezas estratégicas, provas recomendadas e ações sugeridas.</P>

          <Sub>6.12. Assistente IA</Sub>
          <P>Assistente de IA contextual que conhece todos os dados do caso. Permite fazer perguntas livres sobre o processo e receber respostas fundamentadas nos documentos e análises já realizadas.</P>

          <Sub>6.13. Documentos Jurídicos (Docs IA)</Sub>
          <P>Geração de peças jurídicas por IA. Selecione o tipo de documento (petição inicial, contestação, recurso, parecer, etc.) e a IA gerará um rascunho baseado nos dados e estratégia do caso, respeitando seu estilo de redação configurado.</P>

          <Sub>6.14. Monitor Processual</Sub>
          <P>Configuração de monitoramento do processo judicial. Cadastre o número do processo e o tribunal para acompanhar movimentações e receber alertas de novas publicações.</P>

          <Sub>6.15. Prazos</Sub>
          <P>Gestão de prazos processuais. A IA calcula prazos automaticamente com base nas movimentações detectadas. Cada prazo possui data, tipo, nível de risco e responsável. Status: pendente, em andamento ou concluído.</P>

          <Sub>6.16. Relatório</Sub>
          <P>Geração de relatório completo do caso, consolidando todas as análises, timeline, provas e recomendações em um documento estruturado para impressão ou compartilhamento com o cliente.</P>

          {/* 7. Documentos */}
          <SectionHeading id="documentos">7. Documentos</SectionHeading>
          <P>A página global de Documentos exibe todos os documentos de todos os casos. Utilize os filtros para buscar por caso específico, tipo de documento ou status de processamento. Permite download e visualização dos detalhes de análise.</P>

          {/* 8. Timeline */}
          <SectionHeading id="timeline">8. Timeline Global</SectionHeading>
          <P>Visualização cronológica unificada de todos os eventos de todos os casos. Filtre por caso, categoria ou período. Ideal para ter uma visão consolidada de toda a atividade jurídica do escritório.</P>

          {/* 9. Relatórios */}
          <SectionHeading id="relatorios">9. Relatórios</SectionHeading>
          <P>Selecione um caso e gere um relatório estruturado que consolida: dados do caso, partes envolvidas, timeline de eventos, análise de viabilidade, estratégia, provas e recomendações. O relatório é gerado por IA e pode ser copiado ou impresso.</P>

          {/* 10. Busca */}
          <SectionHeading id="busca">10. Busca</SectionHeading>
          <P>Busca unificada em todo o sistema. Digite termos e o sistema buscará em: títulos de casos, descrições, documentos (nome e conteúdo extraído), eventos da timeline e entradas de conhecimento. Os resultados são agrupados por tipo.</P>

          {/* 11. Perfil */}
          <SectionHeading id="perfil">11. Perfil</SectionHeading>
          <P>Gerencie seus dados pessoais e profissionais:</P>
          <ul className="space-y-2 mb-4">
            <Li><strong>Nome completo</strong></Li>
            <Li><strong>E-mail</strong> (somente leitura)</Li>
            <Li><strong>Telefone</strong></Li>
            <Li><strong>Número da OAB</strong></Li>
            <Li><strong>Especialidade jurídica</strong></Li>
            <Li><strong>Foto de perfil</strong></Li>
          </ul>

          {/* 12. Configurações */}
          <SectionHeading id="configuracoes">12. Configurações</SectionHeading>
          <Sub>Chaves de IA</Sub>
          <P>Configure suas próprias chaves de API para provedores de IA: OpenAI, Google AI e Perplexity. As chaves são armazenadas de forma criptografada. Se não configurar, o sistema utilizará os modelos padrão da plataforma.</P>
          <Sub>Políticas de Armazenamento</Sub>
          <P>Defina se documentos devem ser excluídos do armazenamento interno após processamento (quando integrado com armazenamento externo).</P>

          {/* 13. Estilo de Redação */}
          <SectionHeading id="estilo-redacao">13. Estilo de Redação</SectionHeading>
          <P>O VirtuaLexis pode aprender seu estilo de escrita jurídica para gerar documentos que se pareçam com os que você escreveria.</P>
          <ol className="space-y-2 mb-4 list-decimal list-inside text-muted-foreground">
            <li>Acesse <strong>Estilo de Redação</strong> no menu lateral.</li>
            <li>Crie um <strong>perfil de escrita</strong> (ex: "Petições Cíveis", "Recursos Trabalhistas").</li>
            <li>Faça upload de <strong>documentos de amostra</strong> — peças jurídicas que representem seu estilo.</li>
            <li>Clique em <strong>"Analisar Estilo"</strong>. A IA identificará padrões de: tom, vocabulário, estrutura, frases características e padrões argumentativos.</li>
            <li>O perfil será utilizado automaticamente na geração de documentos jurídicos (aba Docs IA).</li>
          </ol>

          {/* 14. Parceiros */}
          <SectionHeading id="parceiros">14. Programa de Parceiros</SectionHeading>
          <P>O programa de parceiros permite que advogados indiquem colegas e recebam recompensas.</P>
          <ul className="space-y-2 mb-4">
            <Li><strong>Código de indicação:</strong> Cada parceiro recebe um código único para compartilhar.</Li>
            <Li><strong>Níveis:</strong> Bronze, Prata, Ouro — evolua conforme o número de indicações convertidas.</Li>
            <Li><strong>Recompensas:</strong> Acompanhe seus créditos e benefícios acumulados.</Li>
          </ul>

          {/* 15. Armazenamento Externo */}
          <SectionHeading id="armazenamento">15. Armazenamento Externo</SectionHeading>
          <P>Conecte serviços de armazenamento em nuvem para manter seus documentos sincronizados:</P>
          <Sub>Provedores Suportados</Sub>
          <ul className="space-y-2 mb-4">
            <Li><strong>Google Drive</strong></Li>
            <Li><strong>OneDrive</strong></Li>
            <Li><strong>SharePoint</strong></Li>
          </ul>
          <Sub>Como Configurar</Sub>
          <ol className="space-y-2 mb-4 list-decimal list-inside text-muted-foreground">
            <li>Acesse <strong>Armazenamento Externo</strong> no menu lateral.</li>
            <li>Clique em <strong>"Conectar"</strong> no provedor desejado.</li>
            <li>Autorize o acesso na janela de autenticação do provedor.</li>
            <li>Configure as <strong>pastas de destino</strong> para organização dos documentos.</li>
            <li>Ative a sincronização automática, se desejado.</li>
          </ol>
          <P>Documentos enviados ao caso podem ser automaticamente copiados para a pasta configurada no seu armazenamento externo, e vice-versa.</P>

          {/* 16. Admin */}
          <SectionHeading id="admin">16. Painel Administrativo (Superadmin)</SectionHeading>
          <P>Disponível apenas para administradores do sistema. Acesso pelo menu lateral em "Painel Admin".</P>
          <Sub>Gestão de Contas</Sub>
          <P>Visualize todos os usuários cadastrados. Altere o status de acesso (ativar, pausar, suspender, cancelar). Adicione notas e defina o nome do escritório e plano.</P>
          <Sub>Gestão de Licenças</Sub>
          <P>Crie e gerencie licenças: trial, manual, parceria, assinatura ou vitalícia. Defina datas de expiração e vincule a provedores de pagamento (Stripe).</P>
          <Sub>CMS (Gestão de Conteúdo)</Sub>
          <P>Edite o conteúdo das páginas públicas do site (Política de Privacidade, Termos de Serviço, Licença SaaS, Aviso de IA) através de um editor de texto rico integrado.</P>

          <div className="mt-16 mb-8 p-6 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <strong>VirtuaLexis</strong> — Inteligência Jurídica com IA · Manual do Usuário v1.0
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
