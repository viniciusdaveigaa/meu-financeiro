import { useState, useMemo } from 'react'
import {
  Activity,
  Calculator,
  Check,
  CreditCard,
  Eye,
  FileSpreadsheet,
  Info,
  Keyboard,
  Layers,
  LayoutDashboard,
  Lock,
  Newspaper,
  Palette,
  PiggyBank,
  Repeat,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  User,
  Wallet,
  X,
  Zap
} from 'lucide-react'

export function UsageGuide({
  onGoToDashboard,
  onNavigateTab,
  onOpenSettings,
  onOpenCustomization,
  onOpenPrivacy,
  onOpenNews,
  onNewTransaction
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    {
      id: 'all',
      name: 'Todos os tópicos',
      icon: Sparkles
    },
    {
      id: 'visual',
      name: 'Visual e Cores',
      icon: Palette
    },
    {
      id: 'savings',
      name: 'Caixinhas e Metas',
      icon: PiggyBank
    },
    {
      id: 'cards',
      name: 'Contas e Cartões',
      icon: CreditCard
    },
    {
      id: 'import',
      name: 'Importação CSV',
      icon: FileSpreadsheet
    },
    {
      id: 'planning',
      name: 'Lançamentos e Metas',
      icon: Target
    },
    {
      id: 'security',
      name: 'Conta e Segurança',
      icon: ShieldCheck
    }
  ]

  const topics = [
    // 1. VISUAL E PERSONALIZAÇÃO
    {
      id: 'customization-themes',
      category: 'visual',
      number: '01',
      tag: 'Novidade',
      icon: Palette,
      title: 'Galeria de Temas e Cores Personalizadas',
      summary: 'Mude a identidade visual do aplicativo com 12 temas predefinidos ou personalize com código HEX.',
      text: 'Você pode transformar completamente as cores do Saldo Claro a qualquer momento. Escolha entre 12 temas prontos (como Verde original, Rosa claro, Rosa escuro, Roxo, Azul oceano, Amarelo dourado e Preto e grafite) com apenas um clique, ou informe seus próprios códigos de cor HEX e use o seletor de cores nativo. As alterações entram em vigor na mesma hora sem recarregar a página e permanecem salvas na sua conta.',
      steps: [
        'Clique no menu do seu perfil no topo direito e escolha "Personalização".',
        'Selecione qualquer tema predefinido na galeria para ver e aplicar as novas cores.',
        'Para cores exclusivas, informe o código HEX (ex: #2563EB) ou use o seletor de cores.',
        'Use o botão "Restaurar cores padrão" se quiser voltar à identidade clássica a qualquer momento.'
      ],
      action: onOpenCustomization ? { label: 'Abrir Personalização de Cores', onClick: onOpenCustomization } : null
    },
    {
      id: 'privacy-mode',
      category: 'visual',
      number: '02',
      tag: 'Recurso',
      icon: Eye,
      title: 'Modo Privacidade de Valores',
      summary: 'Oculte os valores em dinheiro na tela com barras discretas para uso seguro em locais públicos.',
      text: 'O modo privacidade permite mascarar instantaneamente todos os valores monetários exibidos no aplicativo (saldos, faturas, receitas e despesas). Seus números são substituídos por barras discretas e elegantes, garantindo total sigilo quando você estiver navegando em locais públicos, transporte ou no trabalho.',
      steps: [
        'Clique no ícone de olho no cabeçalho superior (ao lado do seu perfil).',
        'Todos os valores em dinheiro da tela são imediatamente ocultados.',
        'Clique novamente no ícone de olho a qualquer momento para voltar a visualizar os números.',
        'A sua preferência é lembrada para os próximos acessos.'
      ]
    },

    // 2. CAIXINHAS E METAS
    {
      id: 'savings-create',
      category: 'savings',
      number: '03',
      tag: 'Recurso',
      icon: PiggyBank,
      title: 'Criar Caixinhas e Reservar Dinheiro',
      summary: 'Separe suas economias por objetivos e guarde valores com acompanhamento de progresso.',
      text: 'As Caixinhas são ideais para separar suas economias por finalidades específicas, como Reserva de Emergência, Viagem, Reforma ou Compras Planejadas. Você define um valor alvo e acompanha a barra de progresso em tempo real conforme adiciona novos aportes.',
      steps: [
        'Na aba "Planejamento", vá até a seção "Caixinhas e Metas" e clique em "+ Nova Caixinha".',
        'Dê um nome, defina o valor pretendido e escolha um ícone representativo.',
        'Para guardar dinheiro, abra a caixinha e clique em "Guardar dinheiro".',
        'Escolha se deseja registrar o aporte como saída no extrato ou apenas movimentar o saldo interno.'
      ],
      action: onNavigateTab ? { label: 'Ir para Caixinhas no Planejamento', onClick: () => onNavigateTab('planning') } : null
    },
    {
      id: 'savings-withdraw',
      category: 'savings',
      number: '04',
      tag: 'Novidade',
      icon: Wallet,
      title: 'Retirar Dinheiro das Caixinhas',
      summary: 'Resgate valores guardados a qualquer momento e controle como a retirada aparece no extrato.',
      text: 'Sempre que você precisar utilizar o dinheiro guardado em uma caixinha, é possível realizar resgates parciais ou totais. O sistema recalcula o saldo da caixinha automaticamente e dá total liberdade para você decidir se a quantia retirada deve gerar uma entrada no seu extrato bancário.',
      steps: [
        'Acesse a caixinha desejada na aba "Planejamento" e clique em "Retirar dinheiro".',
        'Informe o valor que deseja resgatar (o sistema valida se a quantia não supera o saldo guardado).',
        'Marque se deseja creditar o valor na sua conta bancária (gerando entrada no extrato) ou apenas reduzir a reserva.',
        'Confirme a retirada e o saldo é atualizado imediatamente.'
      ],
      action: onNavigateTab ? { label: 'Ver Caixinhas e Reservas', onClick: () => onNavigateTab('planning') } : null
    },

    // 3. CONTAS E CARTÕES
    {
      id: 'cards-management',
      category: 'cards',
      number: '05',
      tag: 'Recurso',
      icon: CreditCard,
      title: 'Cadastrar Cartões de Crédito e Débito',
      summary: 'Organize suas contas bancárias e cartões com limites, dia de fechamento e vencimento.',
      text: 'Gerencie todas as suas formas de pagamento em um local unificado. Você pode cadastrar contas correntes, carteiras em espécie e cartões de crédito ou débito, configurando o limite disponível e os dias exatos de fechamento e vencimento da fatura.',
      steps: [
        'Acesse a aba "Avançado" e localize a seção "Gestão de Contas e Cartões".',
        'Preencha o nome do cartão ou conta, o tipo (Conta, Cartão de Crédito ou Débito) e o limite.',
        'Para cartões de crédito, informe o dia de fechamento e o dia de vencimento da fatura.',
        'As contas ficam disponíveis instantaneamente nos formulários de transações e filtros do extrato.'
      ],
      action: onNavigateTab ? { label: 'Gerenciar Contas e Cartões', onClick: () => onNavigateTab('advanced') } : null
    },
    {
      id: 'cards-invoices',
      category: 'cards',
      number: '06',
      tag: 'Recurso',
      icon: Layers,
      title: 'Faturas Automáticas e Compras Parceladas',
      summary: 'Cálculo inteligente do mês da fatura com base no fechamento e divisão de parcelas.',
      text: 'Ao registrar um gasto no cartão de crédito, o sistema calcula automaticamente a qual fatura mensal a compra pertence. Compras feitas até o dia de fechamento entram na fatura atual; compras após o fechamento entram automaticamente na fatura do mês seguinte (o chamado "melhor dia de compra"). Para compras parceladas, o valor é distribuído automaticamente pelos meses futuros.',
      steps: [
        'No lançamento de despesa, selecione o cartão de crédito cadastrado.',
        'O sistema identifica o mês da fatura correspondente de acordo com o dia de fechamento.',
        'Se a compra foi dividida, marque "Compra parcelada" e defina o número de parcelas.',
        'Cada parcela é registrada pontualmente nos meses seguintes com o valor exato.'
      ]
    },
    {
      id: 'bank-logos',
      category: 'cards',
      number: '07',
      tag: 'Novidade',
      icon: LayoutDashboard,
      title: 'Identificação com Logos Bancárias Oficiais',
      summary: 'Marcas institucionais autênticas em vetor oficial para fácil identificação das contas.',
      text: 'Todas as instituições financeiras cadastradas contam com identificação visual oficial em vetor SVG de alta nitidez, integradas a partir do catálogo institucional do Open Finance Brasil e Banco Central. O sistema reconhece a logo automaticamente pelo nome informado, código COMPE bancário ou seleção manual no formulário.',
      steps: [
        'Suporte aos principais bancos brasileiros (Banco do Brasil, Itaú, Bradesco, Santander, Caixa, Inter, C6 Bank, Mercado Pago, PicPay, BTG, Neon, PagBank, Sicoob, Sicredi, Safra, XP, Pan, Banrisul, BV e outros).',
        'Identificação automática através do nome ou código da instituição bancária.',
        'Ícones neutros limpos para carteiras de dinheiro em espécie e outros bancos não listados.',
        'Contêineres padronizados e legíveis com perfeito contraste nos modos claro e escuro.'
      ]
    },

    // 4. IMPORTAÇÃO DE EXTRATOS
    {
      id: 'csv-import',
      category: 'import',
      number: '08',
      tag: 'Novidade',
      icon: FileSpreadsheet,
      title: 'Importação de Extratos CSV por Banco',
      summary: 'Importe dezenas de transações de uma só vez a partir da planilha CSV do seu banco.',
      text: 'Em vez de digitar seus lançamentos um a um, você pode exportar o arquivo CSV do aplicativo ou internet banking da sua instituição financeira e importá-lo diretamente no Saldo Claro. O importador possui compatibilidade com dezenas de bancos e com o formato CSV genérico padrão.',
      steps: [
        'Na aba "Extrato", clique no botão "Importar CSV" no topo da página.',
        'Selecione a instituição financeira emissora do extrato ou a opção genérica.',
        'Arraste ou selecione o arquivo .csv exportado do seu banco.',
        'Escolha a conta bancária à qual as transações devem ser vinculadas.'
      ],
      action: onNavigateTab ? { label: 'Ir para o Extrato e Importar', onClick: () => onNavigateTab('transactions') } : null
    },
    {
      id: 'csv-duplicates',
      category: 'import',
      number: '09',
      tag: 'Novidade',
      icon: ShieldCheck,
      title: 'Conferência Prévia e Prevenção de Duplicatas',
      summary: 'Revise os lançamentos antes de salvar e evite transações repetidas com detecção inteligente.',
      text: 'Antes de salvar os dados no seu histórico, o importador exibe uma prévia completa de todas as transações lidas no arquivo. O filtro anti-duplicidade inteligente compara datas, valores e descrições com os lançamentos já existentes no seu extrato e sinaliza duplicatas em potencial, evitando que você importe lançamentos repetidos por engano.',
      steps: [
        'Revise a lista de transações na etapa de pré-visualização da importação.',
        'Transações duplicadas são destacadas visualmente com aviso preventivo.',
        'Mantenha a opção "Ignorar duplicadas" marcada ou selecione/desmarque linhas manualmente.',
        'Clique em "Importar Selecionadas" para concluir o cadastro em lote.'
      ]
    },

    // 5. LANÇAMENTOS E PLANEJAMENTO
    {
      id: 'recurring-entries',
      category: 'planning',
      number: '10',
      tag: 'Recurso',
      icon: Repeat,
      title: 'Lançamentos Recorrentes Todo Mês',
      summary: 'Automatize despesas e receitas fixas como salário, aluguel, condomínio e assinaturas.',
      text: 'Chega de lançar as mesmas contas manualmente todos os meses. Ao criar uma receita ou despesa fixa, ative a repetição mensal para que o sistema gere a previsão automaticamente no início de cada mês. Você pode pausar, ajustar valores ou cancelar a recorrência quando quiser.',
      steps: [
        'Ao criar ou editar um lançamento, marque a opção "Repetir todo mês".',
        'Nos meses seguintes, o lançamento é gerado pontualmente na data estipulada.',
        'Para gerenciar as repetições ativas, acesse "Planejamento" > "Recorrências".',
        'Você pode pausar uma despesa temporariamente ou ajustar seu valor para os meses futuros.'
      ],
      action: onNavigateTab ? { label: 'Ver Recorrências no Planejamento', onClick: () => onNavigateTab('planning') } : null
    },
    {
      id: 'custom-categories',
      category: 'planning',
      number: '11',
      tag: 'Recurso',
      icon: Layers,
      title: 'Criar e Personalizar Categorias',
      summary: 'Crie categorias sob medida para sua rotina com nomes, ícones e cores exclusivas.',
      text: 'Adapte o aplicativo exatamente à sua realidade financeira. Você pode cadastrar novas categorias (como Pets, Barbearia, Viagens, Estudos ou Investimentos), escolhendo entre dezenas de ícones profissionais e selecionando a cor que melhor combina com a despesa.',
      steps: [
        'Vá na aba "Planejamento" > "Categorias" ou clique em "+ Nova Categoria" direto na janela de transação.',
        'Informe o nome da categoria, escolha um ícone na biblioteca e selecione uma cor da paleta.',
        'A nova categoria fica disponível instantaneamente no extrato, orçamentos e relatórios.',
        'Você pode editar o ícone ou renomear categorias existentes a qualquer momento.'
      ]
    },
    {
      id: 'monthly-budgets',
      category: 'planning',
      number: '12',
      tag: 'Recurso',
      icon: Target,
      title: 'Orçamentos Mensais e Tetos de Gastos',
      summary: 'Defina limites de despesa por categoria e acompanhe o consumo em tempo real.',
      text: 'Estabeleça limites máximos de gastos para suas categorias no mês. As barras visuais mostram em tempo real a porcentagem já consumida e mudam de cor conforme você se aproxima do teto, alertando antes que você ultrapasse seu orçamento.',
      steps: [
        'Acesse a aba "Planejamento" e role até a seção "Orçamentos Mensais".',
        'Defina o teto máximo de gastos que você pretende manter no mês para cada categoria.',
        'Acompanhe o consumo: verde (seguro), amarelo (atenção) e vermelho (orçamento estourado).',
        'O cumprimento dos orçamentos influencia diretamente na nota da sua Saúde Financeira.'
      ]
    },
    {
      id: 'financial-health',
      category: 'planning',
      number: '13',
      tag: 'Cálculo',
      icon: Activity,
      title: 'Como é Calculada a Saúde Financeira (0 a 100)?',
      summary: 'Entenda a lógica que avalia taxa de poupança, limites de gastos e ritmo diário.',
      text: 'A nota de Saúde Financeira varia de 0 a 100 pontos e avalia a sustentabilidade das suas finanças através de três fatores complementares: (1) Taxa de Poupança: quanto maior a fatia da renda poupada no mês, mais pontos você acumula; (2) Respeito aos Orçamentos: gastar dentro dos limites preserva sua pontuação, enquanto estouros geram penalidades; (3) Ritmo e Média Diária: mede a velocidade de consumo da renda em relação aos dias restantes do mês.',
      steps: [
        '80 a 100 (Excelente): altas taxas de economia e gastos rigorosamente dentro dos limites.',
        '60 a 79 (Saudável): finanças equilibradas com reservas consistentes.',
        '40 a 59 (Em atenção): despesas próximas do limite da renda mensal.',
        'Abaixo de 40 (Requer cuidado): gastos superando as receitas ou múltiplos orçamentos estourados.'
      ]
    },

    // 6. CONTA E SEGURANÇA
    {
      id: 'account-settings',
      category: 'security',
      number: '14',
      tag: 'Novidade',
      icon: Settings,
      title: 'Configurações da Conta: Dados, E-mail e Senha',
      summary: 'Atualize seus dados cadastrais, e-mail de acesso e credenciais de segurança.',
      text: 'Na tela de configurações da conta, você gerencia suas informações pessoais através de cards padronizados, organizados e responsivos. É possível alterar seu nome de exibição no aplicativo, atualizar seu endereço de e-mail de acesso e redefinir sua senha com validações de segurança em tempo real.',
      steps: [
        'Clique no menu do seu perfil no topo direito e selecione "Configurações".',
        'Card "Dados da Conta": edite seu nome completo ou nome de exibição preferido.',
        'Card "E-mail de Acesso": solicite a alteração do seu e-mail cadastrado.',
        'Card "Segurança e Senha": altere sua senha informando uma nova chave com no mínimo 6 caracteres.'
      ],
      action: onOpenSettings ? { label: 'Abrir Configurações da Conta', onClick: onOpenSettings } : null
    },
    {
      id: 'privacy-terms-lgpd',
      category: 'security',
      number: '15',
      tag: 'Novidade',
      icon: ShieldCheck,
      title: 'Privacidade, Termos de Uso e Consentimento LGPD',
      summary: 'Documentação transparente em conformidade com a LGPD e registro de consentimento.',
      text: 'O Saldo Claro foi projetado com respeito integral à sua privacidade e segue as diretrizes da Lei Geral de Proteção de Dados (LGPD). Todos os usuários contam com um fluxo de consentimento informado transparente antes de utilizar o sistema e podem consultar os Termos de Uso e a Política de Privacidade completos a qualquer momento pelo menu de perfil.',
      steps: [
        'Acesse o menu de perfil e clique em "Privacidade e Termos".',
        'A aba "Termos de Uso" explica as condições de utilização responsável da plataforma.',
        'A aba "Política de Privacidade" detalha quais dados são coletados, como são protegidos e os seus direitos.',
        'O rodapé da tela apresenta o status de aceitação do documento registrado na sua conta.'
      ],
      action: onOpenPrivacy ? { label: 'Consultar Privacidade e Termos', onClick: onOpenPrivacy } : null
    },
    {
      id: 'news-center',
      category: 'security',
      number: '16',
      tag: 'Novidade',
      icon: Newspaper,
      title: 'Central de Novidades e Atualizações',
      summary: 'Acompanhe as melhorias lançadas no aplicativo e consulte o histórico de versões.',
      text: 'Fique sempre informado sobre novas funcionalidades, melhorias de desempenho e correções implementadas no Saldo Claro. Quando houver uma novidade que você ainda não viu, um indicador visual discreto aparece no menu do seu perfil. Você pode consultar o histórico cronológico de atualizações e filtrar por categoria.',
      steps: [
        'Clique no menu do seu perfil e selecione "Novidades".',
        'Consulte a lista de atualizações organizadas por versão, data e categoria.',
        'Filtre por tipo: "Todas", "Novidades" (novos recursos), "Melhorias" ou "Correções".',
        'Use o botão "Marcar todas como lidas" para limpar o indicador visual de avisos.'
      ],
      action: onOpenNews ? { label: 'Ver Histórico de Novidades', onClick: onOpenNews } : null
    },
    {
      id: 'data-security-rls',
      category: 'security',
      number: '17',
      tag: 'Segurança',
      icon: Lock,
      title: 'Proteção Criptográfica e Segurança RLS',
      summary: 'Isolamento de dados por usuário com Row Level Security no Supabase.',
      text: 'Suas informações financeiras são armazenadas com proteção rigorosa através de políticas RLS (Row Level Security) diretamente no banco de dados Supabase. Cada registro é criptograficamente vinculado à sua conta autenticada, garantindo que nenhum outro usuário tenha acesso às suas despesas, receitas ou saldos.',
      steps: [
        'Acesso protegido por autenticação segura via tokens JWT.',
        'Políticas RLS ativas em todas as tabelas (transações, contas, orçamentos, caixinhas e perfil).',
        'Comunicação 100% criptografada de ponta a ponta via protocolo seguro HTTPS/TLS.',
        'Seus dados pertencem exclusivamente a você e podem ser exportados a qualquer momento.'
      ]
    }
  ]

  // Filtro inteligente por busca e categoria
  const filteredTopics = useMemo(() => {
    let result = topics

    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.text.toLowerCase().includes(q) ||
          t.steps.some((s) => s.toLowerCase().includes(q))
      )
    }

    return result
  }, [topics, selectedCategory, searchQuery])

  return (
    <section className="guide-view-container" aria-label="Central de Ajuda">
      {/* Hero Banner Superior */}
      <div className="guide-hero-banner">
        <div className="guide-hero-content">
          <span className="badge-pill">CENTRAL DE AJUDA</span>
          <h1>Dicas e guia de uso do Saldo Claro</h1>
          <p>
            Aprenda a aproveitar todos os recursos do sistema, organize suas finanças com facilidade
            e tenha total domínio sobre seu dinheiro no dia a dia.
          </p>
          <div className="guide-quick-action">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onGoToDashboard}
            >
              Voltar ao Meu Painel
            </button>
            {onNewTransaction && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onNewTransaction}
                style={{ marginLeft: 8 }}
              >
                + Novo Lançamento
              </button>
            )}
          </div>
        </div>

        <div className="guide-shortcut-card">
          <span className="shortcut-icon"><Keyboard size={24} /></span>
          <div>
            <strong>Atalhos de Teclado</strong>
            <p>
              Pressione <kbd className="kbd-shortcut">N</kbd> para abrir um novo lançamento rápido ou <kbd className="kbd-shortcut">ESC</kbd> para fechar janelas.
            </p>
          </div>
        </div>
      </div>

      {/* Caixa em Destaque: Fórmula da Saúde Financeira */}
      <div className="guide-featured-box">
        <div className="featured-icon-badge">
          <Calculator size={24} />
        </div>
        <div className="featured-content">
          <h3>Entenda a nota da sua Saúde Financeira (0 a 100)</h3>
          <p>
            O Saldo Claro avalia automaticamente o equilíbrio das suas finanças combinando três pilares essenciais:
          </p>
          <div className="formula-cards-row">
            <div className="formula-pill">
              <strong>1. Taxa de Poupança</strong>
              <span>Quanto maior a sobra do salário no mês, mais pontos você acumula (impacto direto positivo).</span>
            </div>
            <div className="formula-pill">
              <strong>2. Cumprimento de Tetos</strong>
              <span>Gastar até 100% do orçamento mantém a pontuação; estourar o limite gera descontos proporcionais.</span>
            </div>
            <div className="formula-pill">
              <strong>3. Ritmo Diário de Gastos</strong>
              <span>Compara sua média de despesas diárias com a projeção de fechamento para os dias restantes do mês.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Ferramentas: Busca e Filtro de Categorias */}
      <div className="guide-toolbar">
        <div className="guide-search-wrapper">
          <Search size={18} className="guide-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tópicos da ajuda (ex: cartão, caixinha, cor, csv, senha...)"
            className="guide-search-input"
            aria-label="Buscar tópicos da ajuda"
          />
          {searchQuery && (
            <button
              type="button"
              className="guide-search-clear"
              onClick={() => setSearchQuery('')}
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="guide-categories-pills" role="tablist" aria-label="Categorias da ajuda">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            const count = cat.id === 'all'
              ? topics.length
              : topics.filter((t) => t.category === cat.id).length

            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`guide-category-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={15} />
                <span>{cat.name}</span>
                <span className="guide-category-count-badge">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback de busca ativa */}
      {searchQuery && (
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          Mostrando {filteredTopics.length} {filteredTopics.length === 1 ? 'tópico encontrado' : 'tópicos encontrados'} para "{searchQuery}".
        </div>
      )}

      {/* Grid de Cards de Tópicos */}
      {filteredTopics.length > 0 ? (
        <div className="guide-cards-grid">
          {filteredTopics.map((t) => {
            const Icon = t.icon
            return (
              <article key={t.id} className="guide-topic-card">
                <div className="topic-header">
                  <span className="topic-icon"><Icon size={20} /></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`guide-topic-badge ${t.tag === 'Novidade' ? 'badge-recent' : ''}`}>
                      {t.tag}
                    </span>
                    <span className="topic-number">{t.number}</span>
                  </div>
                </div>

                <h3>{t.title}</h3>
                <p>{t.text}</p>

                {t.steps && t.steps.length > 0 && (
                  <div className="guide-topic-steps">
                    {t.steps.map((step, idx) => (
                      <div key={idx} className="guide-step-item">
                        <span className="guide-step-dot" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {t.action && (
                  <div style={{ marginTop: 'auto', paddingTop: 14 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={t.action.onClick}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {t.action.label}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="guide-empty-state">
          <div className="guide-empty-icon">
            <Search size={28} />
          </div>
          <h3>Nenhum tópico encontrado</h3>
          <p>Não encontramos instruções correspondentes ao termo pesquisado. Tente palavras como "cartão", "caixinha", "cor", "extrato" ou "senha".</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
          >
            Limpar filtros e ver todos os tópicos
          </button>
        </div>
      )}

      {/* Aviso de Privacidade e Segurança */}
      <div className="guide-security-notice">
        <div className="sec-icon"><ShieldCheck size={28} /></div>
        <div className="sec-text">
          <h4 style={{ fontWeight: 800, marginBottom: 4 }}>Privacidade e Segurança Garantidas</h4>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            Seus registros financeiros são protegidos por políticas RLS (Row Level Security) diretamente no banco de dados Supabase.
            Apenas a sua conta autenticada possui acesso aos seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>
      </div>
    </section>
  )
}
