import { ArrowDownRight, ArrowUpRight, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { percentChange } from '../utils/formatters'
import { Money, PrivacyToggle } from './ui'

function Delta({ value, goodWhenUp }) {
  if (value === null) return <span className="delta neutral">Sem base de comparação</span>
  const good = goodWhenUp ? value >= 0 : value <= 0
  const Icon = value >= 0 ? TrendingUp : TrendingDown
  return (
    <span className={`delta ${good ? 'good' : 'bad'}`}>
      <Icon size={13} />
      {value > 0 ? '+' : ''}{value}% vs mês anterior
    </span>
  )
}

export function MetricCards({ incomes, expenses, previousIncomes, previousExpenses }) {
  const balance = incomes - expenses
  const usage = incomes > 0 ? Math.round((expenses / incomes) * 100) : null
  const savingsRate = incomes > 0 ? Math.round((balance / incomes) * 100) : null

  return (
    <section className="metrics">
      <article className={`metric-hero ${balance < 0 ? 'negative' : ''}`}>
        <div className="metric-hero-top">
          <span>Saldo do mês</span>
          <PrivacyToggle className="on-dark" size={20} />
        </div>
        <strong className="metric-hero-value"><Money value={balance} /></strong>
        <div className="metric-hero-bar" aria-hidden="true">
          <i style={{ width: `${Math.min(usage ?? 0, 100)}%` }} />
        </div>
        <span className="metric-hero-foot">
          {usage === null ? 'Registre suas entradas para acompanhar o saldo' : usage > 100 ? `Saídas ${usage - 100}% acima das entradas` : `${usage}% das entradas já foram gastos`}
        </span>
      </article>

      <div className="metric-strip">
        <article className="metric-tile">
          <span className="metric-icon tone-income"><ArrowUpRight size={18} /></span>
          <span className="metric-label">Entradas</span>
          <strong className="metric-value"><Money value={incomes} /></strong>
          <Delta value={percentChange(incomes, previousIncomes)} goodWhenUp />
        </article>

        <article className="metric-tile">
          <span className="metric-icon tone-expense"><ArrowDownRight size={18} /></span>
          <span className="metric-label">Saídas</span>
          <strong className="metric-value"><Money value={expenses} /></strong>
          <Delta value={percentChange(expenses, previousExpenses)} goodWhenUp={false} />
        </article>

        <article className="metric-tile">
          <span className="metric-icon tone-savings"><PiggyBank size={18} /></span>
          <span className="metric-label">Taxa de economia</span>
          <strong className={`metric-value ${savingsRate !== null && savingsRate < 0 ? 'neg' : ''}`}>{savingsRate === null ? '—' : `${savingsRate}%`}</strong>
          <span className={`delta ${savingsRate === null ? 'neutral' : savingsRate >= 20 ? 'good' : savingsRate >= 0 ? 'neutral' : 'bad'}`}>
            {savingsRate === null ? 'Aguardando entradas' : savingsRate >= 20 ? 'Ótimo ritmo de economia' : savingsRate >= 0 ? 'Meta recomendada: 20%' : 'Gastos acima da renda'}
          </span>
        </article>
      </div>
    </section>
  )
}
