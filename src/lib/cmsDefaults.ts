/**
 * Conteúdo HTML padrão para cada página CMS, extraído dos componentes React.
 * Usado no editor para pré-carregar o conteúdo quando html_content está vazio.
 */

const cmsDefaults: Record<string, string> = {
  // ── Páginas Legais ──────────────────────────────────────────────

  "privacy-policy": `<h1>Política de Privacidade – VirtuaLexis</h1>
<p><strong>Última atualização:</strong> Junho de 2025</p>
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
<li>Documentos e dados de casos podem ser processados por modelos de IA para análise, classificação e geração de conteúdo jurídico.</li>
<li>Os dados enviados para processamento por IA são tratados de forma segura e não são utilizados para treinar modelos de terceiros.</li>
<li>O usuário tem controle sobre quais dados são processados e pode optar por não utilizar funcionalidades de IA.</li>
</ul>
<hr />
<h2>4. Compartilhamento de Dados</h2>
<p><strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong>, exceto:</p>
<ul>
<li><strong>Provedores de infraestrutura:</strong> utilizamos serviços seguros para armazenamento de dados.</li>
<li><strong>Provedores de IA:</strong> dados podem ser enviados para APIs de IA exclusivamente para processamento funcional.</li>
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
<p>Esta política é válida a partir da data de sua última atualização e se aplica a todos os usuários da plataforma VirtuaLexis.</p>`,

  "terms-of-service": `<h1>Termos de Serviço – VirtuaLexis</h1>
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
<p>Ao utilizar o VirtuaLexis, você confirma que leu, compreendeu e concorda com estes Termos de Serviço.</p>`,

  "saas-license": `<h1>Contrato de Licença de Uso de Software (SaaS) – VirtuaLexis</h1>
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
<p>Este contrato é regido pela legislação brasileira.</p>`,

  "ai-disclaimer": `<h1>Aviso Legal sobre Uso de Inteligência Artificial – VirtuaLexis</h1>
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
<p>Ao utilizar funcionalidades baseadas em inteligência artificial no VirtuaLexis, o usuário declara estar ciente destas limitações e concorda em assumir a responsabilidade profissional sobre o uso das informações geradas.</p>`,

  // ── Landing Page Seções ──────────────────────────────────────────

  "hero": `<h1>Inteligência jurídica real para advogados reais.</h1>
<p>Estruture casos, analise documentos e gere peças jurídicas com IA — tudo em uma plataforma projetada para a prática do dia a dia.</p>`,

  "about": `<h2>Sobre o VirtuaLexis</h2>
<p>O VirtuaLexis nasce com uma missão clara: criar infraestrutura operacional real para escritórios de advocacia. Não se trata de substituir o advogado, mas de amplificar sua capacidade estratégica com tecnologia de ponta, dados estruturados e inteligência artificial aplicada à prática jurídica do dia a dia.</p>`,

  "problem": `<h2>O problema</h2>
<p>Advogados perdem horas com tarefas operacionais: organizar documentos, calcular prazos, redigir peças repetitivas e acompanhar movimentações processuais manualmente.</p>`,

  "solution": `<h2>A solução</h2>
<p>O VirtuaLexis centraliza a operação jurídica em uma plataforma inteligente que automatiza processos, organiza informações e gera documentos com apoio de IA.</p>`,

  "security": `<h2>Segurança e conformidade com a LGPD</h2>
<ul>
<li><strong>Criptografia de dados</strong> — Todos os dados são criptografados em repouso e em trânsito.</li>
<li><strong>Isolamento multi-tenant</strong> — Cada escritório possui ambiente isolado e seguro.</li>
<li><strong>Logs de auditoria</strong> — Registro completo de todas as ações na plataforma.</li>
<li><strong>Controle de acesso</strong> — Permissões granulares por usuário e função.</li>
<li><strong>Exportação de dados</strong> — Seus dados sempre disponíveis para exportação.</li>
</ul>`,

  "cta": `<h2>Estruture sua advocacia com inteligência.</h2>
<p>Comece gratuitamente e descubra como o VirtuaLexis transforma sua prática jurídica.</p>`,

  "login": `<p style="text-align:center;">Gerencie seus casos jurídicos com inteligência</p>`,
};

export default cmsDefaults;
