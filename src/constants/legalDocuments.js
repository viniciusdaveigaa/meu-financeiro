/**
 * Constantes e Textos Oficiais de Termos de Uso e Política de Privacidade
 * Sistema Saldo Claro — Versão Vigente 2.1
 * 
 * NOTA DE CONFORMIDADE:
 * O conteúdo a seguir estabelece as diretrizes de transparência, proteção e tratamento de dados
 * com base na Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
 * Este documento está formalmente registrado no sistema e identificado como versão de produção
 * com transparência técnica sobre a arquitetura de segurança do software.
 */

export const CURRENT_TERMS_VERSION = '2.1'
export const CURRENT_PRIVACY_VERSION = '2.1'
export const CURRENT_LEGAL_DATE = '13 de Outubro de 2026'
export const REQUIRES_NEW_CONSENT = true

export const LEGAL_VERSIONS_HISTORY = [
  {
    version: '2.1',
    date: '13/10/2026',
    requiresConsent: true,
    title: 'Versão 2.1 — Atualização Formal de Transparência e LGPD',
    summary: 'Inclusão do fluxo formal de consentimento em banco de dados, detalhamento das diretrizes de Row Level Security (RLS), especificação das regras de faturas de cartão de crédito e orientações para o exercício de direitos de portabilidade e exclusão de dados.'
  },
  {
    version: '2.0',
    date: '01/09/2026',
    requiresConsent: false,
    title: 'Versão 2.0 — Lançamento do Saldo Claro',
    summary: 'Lançamento inicial da plataforma com criptografia em repouso, autenticação segura (Google OAuth e e-mail) e gestão orçamentária unificada.'
  }
]

export const TERMS_OF_USE_SECTIONS = [
  {
    title: '1. Aceitação dos Termos',
    content: `Ao acessar e utilizar o aplicativo Saldo Claro ("Sistema"), você expressamente declara que leu, compreendeu e concorda integralmente com estes Termos de Uso e com a nossa Política de Privacidade. Caso discorde de qualquer disposição, solicitamos que não prossiga com a utilização do serviço.`
  },
  {
    title: '2. Natureza do Serviço e Finalidade',
    content: `O Saldo Claro é uma ferramenta de gestão, planejamento e organização financeira pessoal. O Sistema fornece cálculos, projeções de orçamento, resumos de faturas e consolidação de lançamentos com base estrita nos dados inseridos voluntariamente pelo próprio usuário ou importados de extratos bancários.
O Sistema NÃO realiza transações bancárias diretas, NÃO movimenta contas de terceiros e NÃO atua como instituição financeira ou consultoria de investimentos regulamentada pela CVM.`
  },
  {
    title: '3. Cadastro, Senha e Responsabilidade da Conta',
    content: `Para utilizar o Saldo Claro, é necessário criar uma conta por meio de autenticação por e-mail ou via Google OAuth.
O usuário é o único responsável pela confidencialidade de suas credenciais de acesso e pela exatidão dos dados fornecidos. Recomendamos o uso de senhas complexas e a utilização de autenticação em dois fatores quando disponível em seu provedor.`
  },
  {
    title: '4. Propriedade Intelectual',
    content: `A interface, marcas, algoritmos, designs e código-fonte do Saldo Claro são de propriedade exclusiva de seus desenvolvedores e protegidos pelas leis de propriedade intelectual. É vedada a reprodução, engenharia reversa ou comercialização não autorizada do software.`
  },
  {
    title: '5. Cancelamento e Exclusão da Conta',
    content: `Você tem total autonomia para encerrar a utilização do aplicativo a qualquer momento. Ao solicitar a exclusão de sua conta, todos os seus dados cadastrais e histórico financeiro serão expurgados definitivamente dos servidores, respeitadas eventuais obrigações de guarda estipuladas em lei.`
  },
  {
    title: '6. Limitação de Responsabilidade',
    content: `O Saldo Claro é fornecido no estado em que se encontra ("as is"). Embora empreguemos as melhores práticas de engenharia de software e segurança cibernética, não nos responsabilizamos por decisões financeiras tomadas com base nas informações organizadas no aplicativo, nem por inconsistências decorrentes de arquivos de extrato bancário formatados incorretamente pelo usuário.`
  }
]

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: '1. Princípios de Privacidade por Design',
    content: `O Saldo Claro foi arquitetado sob o princípio da minimização de dados: coletamos exclusivamente o que é indispensável para que o software cumpra sua função organizadora. Seus lançamentos financeiros pertencem unicamente a você.`
  },
  {
    title: '2. Isolamento de Dados via Row Level Security (RLS)',
    content: `Nosso banco de dados opera com políticas ativas de Row Level Security (RLS) no PostgreSQL. Cada consulta, atualização ou exclusão é validada matematicamente a nível de banco de dados, garantindo que nenhum usuário consiga visualizar, consultar ou alterar dados de outra conta.`
  },
  {
    title: '3. Dados Coletados e Suas Finalidades',
    content: `• Identificação: Endereço de e-mail e nome de exibição para viabilizar login seguro e saudações no painel.
• Dados Financeiros Informados: Valores, datas, categorias, nomes de contas bancárias, caixinhas e movimentações inseridas para compor extratos e gráficos.
• Metadados Técnicos: Registros de consentimento com versão e data/hora para cumprimento de deveres legais de auditoria.`
  },
  {
    title: '4. Não Compartilhamento e Não Comercialização',
    content: `COMPROMISSO ABSOLUTO: Nós NÃO comercializamos, NÃO alugamos e NÃO compartilhamos seus dados financeiros pessoais com birôs de crédito (Serasa, SPC), seguradoras, bancos ou redes de publicidade direcionada. Não exibimos anúncios comerciais na plataforma.`
  },
  {
    title: '5. Seus Direitos nos Termos da LGPD (Art. 18)',
    content: `Como titular dos dados, você pode exercer os seguintes direitos a qualquer momento:
• Confirmação e Acesso: Consultar quais dados estão armazenados sobre você.
• Correção: Atualizar informações incompletas ou incorretas pelo menu de configurações.
• Portabilidade: Exportar todos os seus lançamentos em formato aberto (CSV/Planilha).
• Eliminação: Excluir lançamentos individuais ou solicitar a eliminação completa e irreversível da sua conta.`
  },
  {
    title: '6. Segurança e Criptografia',
    content: `Todo o tráfego de rede utiliza conexões criptografadas com protocolo HTTPS/TLS 1.3 de ponta a ponta. As credenciais de acesso são processadas por funções de dispersão criptográfica irreversível (hash) gerenciadas pelo Supabase Auth.`
  }
]

