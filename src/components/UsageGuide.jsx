import {
  Activity,
  Calculator,
  CreditCard,
  Eye,
  Keyboard,
  Layers,
  LayoutDashboard,
  Palette,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Target,
  Zap
} from 'lucide-react'

export function UsageGuide({ onGoToDashboard }) {
  const topics = [
    {
      icon: Activity,
      number: '01',
      title: 'Como é calculada a Saúde Financeira (0 a 100)?',
      text: 'A nota é calculada combinando 3 fatores principais: (1) Taxa de Economia: quanto maior a fatia da sua renda que você não gasta, mais pontos você ganha; (2) Respeito aos Orçamentos: gastar dentro dos limites definidos preserva sua pontuação, enquanto ultrapassar limites gera penalidades proporcionais; (3) Média e ritmo diário. Pontuação: 80-100 (Excelente), 60-79 (Saudável), 40-59 (Em atenção) e abaixo de 40 (Precisa de cuidado).'
    },
    {
      icon: Palette,
      number: '02',
      title: 'Como cadastrar novas categorias personalizadas?',
      text: 'Vá na aba "Planejamento" > "Categorias" ou clique em "+ Nova Categoria" direto no modal de lançamento. Você pode dar um nome exclusivo (ex: Pets, Investimentos, Barbearia), escolher entre diversos ícones profissionais e selecionar a cor desejada. A nova categoria fica disponível instantaneamente no extrato, orçamentos e relatórios.'
    },
    {
      icon: LayoutDashboard,
      number: '03',
      title: 'Painel, Gráficos e Reset',
      text: 'Navegue pelos meses pelo seletor de calendário ou clicando diretamente nas barras e pontos do gráfico. Se você navegou clicando no gráfico, basta clicar no botão "Resetar mês" no topo do gráfico para voltar instantaneamente ao mês atual.'
    },
    {
      icon: Eye,
      number: '04',
      title: 'Modo Privacidade (Estilo Nubank)',
      text: 'Clique no ícone de olho no topo da página (ao lado do seu avatar) para ocultar todos os valores em dinheiro na tela. Seus números viram barras discretas animadas, perfeito para usar em público ou no trabalho.'
    },
    {
      icon: Layers,
      number: '05',
      title: 'Compras Parceladas',
      text: 'Ao registrar um gasto no cartão de crédito, marque "Compra parcelada" e escolha o número de parcelas. O sistema distribui automaticamente os lançamentos com o valor de cada parcela nos meses seguintes.'
    },
    {
      icon: Repeat,
      number: '06',
      title: 'Despesas e Ganhos Recorrentes',
      text: 'Marque "Repetir todo mês" para salário, aluguel, condomínio e assinaturas. Nos meses seguintes, os valores são gerados pontualmente e você pode pausar ou retomar a qualquer momento.'
    },
    {
      icon: Target,
      number: '07',
      title: 'Orçamentos Mensais',
      text: 'Defina tetos máximos de gastos para suas categorias (incluindo as personalizadas). As barras visuais mostram em tempo real quanto você já consumiu e alertam se o limite for ultrapassado.'
    },
    {
      icon: PiggyBank,
      number: '08',
      title: 'Caixinhas e Metas',
      text: 'Crie caixinhas para guardar dinheiro (viagem, reserva de emergência, etc.). Você escolhe se o aporte entra como saída no extrato ou apenas transfere o saldo para a reserva.'
    }
  ]

  return (
    <section className="guide-view-container">
      <div className="guide-hero-banner">
        <div className="guide-hero-content">
          <span className="badge-pill">CENTRAL DE AJUDA</span>
          <h1>Dicas e atalhos para seu dia a dia</h1>
          <p>
            Aprenda a aproveitar todos os recursos do Saldo Claro e tenha total domínio sobre suas finanças pessoais.
          </p>
          <div className="guide-quick-action">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onGoToDashboard}
            >
              Voltar ao Meu Painel
            </button>
          </div>
        </div>

        <div className="guide-shortcut-card">
          <span className="shortcut-icon"><Keyboard size={24} /></span>
          <div>
            <strong>Atalho Rápido</strong>
            <p>Pressione <kbd className="kbd-shortcut">N</kbd> no teclado para abrir um novo lançamento a qualquer momento.</p>
          </div>
        </div>
      </div>

      {/* Featured Health Formula Explainer */}
      <div className="guide-featured-box">
        <div className="featured-icon-badge">
          <Calculator size={24} />
        </div>
        <div className="featured-content">
          <h3>Entenda a nota da sua Saúde Financeira</h3>
          <p>
            Nossa inteligência financeira avalia o equilíbrio entre quanto você ganha, quanto gasta e como respeita suas metas:
          </p>
          <div className="formula-cards-row">
            <div className="formula-pill">
              <strong>Taxa de Poupança</strong>
              <span>Quanto maior a sobra do salário, maior a nota (impacto direto positivo)</span>
            </div>
            <div className="formula-pill">
              <strong>Cumprimento de Tetos</strong>
              <span>Gastar até 100% do orçamento é seguro; ultrapassar desconta pontos</span>
            </div>
            <div className="formula-pill">
              <strong>Ritmo de Gastos</strong>
              <span>Compara a média diária com a projeção de fechamento do período</span>
            </div>
          </div>
        </div>
      </div>

      <div className="guide-cards-grid">
        {topics.map((t) => {
          const Icon = t.icon
          return (
            <article key={t.number} className="guide-topic-card">
              <div className="topic-header">
                <span className="topic-icon"><Icon size={20} /></span>
                <span className="topic-number">{t.number}</span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </article>
          )
        })}
      </div>

      <div className="guide-security-notice">
        <div className="sec-icon"><ShieldCheck size={28} /></div>
        <div className="sec-text">
          <h4>Privacidade e Segurança Garantidas</h4>
          <p>
            Seus dados são protegidos por políticas RLS (Row Level Security) diretamente no Supabase.
            Apenas a sua conta autenticada possui acesso aos seus registros.
          </p>
        </div>
      </div>
    </section>
  )
}
