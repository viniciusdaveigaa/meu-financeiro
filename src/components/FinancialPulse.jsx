import { CircleAlert, CircleCheck, Info, Lightbulb, ShieldCheck, TriangleAlert } from 'lucide-react'
import { getMonthKey } from '../utils/formatters'
import { getCategoryLabel } from '../constants/categories'
import { Money } from './ui'

export function FinancialPulse({ month, incomes, expenses, previousExpenses, budgets, expensesByCategory }) {
  const now = new Date()
  const currentMonth = getMonthKey(now)
  const [year, monthNumber] = month.split('-').map(Number)
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const elapsedDays = month < currentMonth ? daysInMonth : month === currentMonth ? now.getDate() : 0
  const projectedExpenses = elapsedDays ? (expenses / elapsedDays) * daysInMonth : expenses
  const savingsRate = incomes > 0 ? ((incomes - expenses) / incomes) * 100 : 0
  const dailyAverage = elapsedDays ? expenses / elapsedDays : 0
  const remainingDays = month === currentMonth ? daysInMonth - now.getDate() + 1 : 0
  const dailyAllowance = remainingDays > 0 ? Math.max(incomes - expenses, 0) / remainingDays : null

  const budgetTotal = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0)
  const budgetSpent = budgets.reduce((sum, budget) => sum + (expensesByCategory[budget.category] || 0), 0)
  const budgetUsage = budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0
  const overBudgets = budgets.filter((budget) => (expensesByCategory[budget.category] || 0) > Number(budget.amount))

  const score = incomes > 0 ? Math.max(0, Math.min(100, Math.round(55 + savingsRate * 0.7 - Math.max(0, budgetUsage - 100) * 0.35))) : 0
  const status =
    incomes <= 0 ? { label: 'Sem dados suficientes', tone: 'muted', icon: Info }
    : score >= 80 ? { label: 'Excelente', tone: 'good', icon: ShieldCheck }
    : score >= 60 ? { label: 'Saudável', tone: 'good', icon: CircleCheck }
    : score >= 40 ? { label: 'Em atenção', tone: 'warn', icon: TriangleAlert }
    : { label: 'Precisa de cuidado', tone: 'bad', icon: CircleAlert }
  const StatusIcon = status.icon

  const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]
  const insights = []
  if (month === currentMonth && incomes > 0 && projectedExpenses > incomes) insights.push({ tone: 'bad', text: 'No ritmo atual, as saídas devem superar as entradas até o fim do mês.' })
  if (overBudgets.length) insights.push({ tone: 'bad', text: `${overBudgets.length} ${overBudgets.length === 1 ? 'orçamento estourado' : 'orçamentos estourados'}: ${overBudgets.map((item) => getCategoryLabel(item.category)).join(', ')}.` })
  else if (budgets.length) insights.push({ tone: 'good', text: 'Todos os orçamentos estão dentro do limite.' })
  if (previousExpenses > 0 && expenses > 0) {
    const change = Math.round(((expenses - previousExpenses) / previousExpenses) * 100)
    if (change !== 0) insights.push({ tone: change > 0 ? 'warn' : 'good', text: `Saídas ${Math.abs(change)}% ${change > 0 ? 'maiores' : 'menores'} que no mês anterior.` })
  }
  if (topCategory && topCategory[1] > 0 && expenses > 0) insights.push({ tone: 'neutral', text: `Maior gasto: ${getCategoryLabel(topCategory[0])}, com ${Math.round((topCategory[1] / expenses) * 100)}% das saídas.` })
  if (!insights.length) insights.push({ tone: 'neutral', text: 'Registre movimentações para receber dicas personalizadas.' })

  return (
    <section className="card pulse-card">
      <div className="pulse-score">
        <div className="pulse-ring" style={{ '--score': incomes > 0 ? score : 0 }}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" className="ring-track" />
            <circle cx="50" cy="50" r="42" className={`ring-value tone-${status.tone}`} pathLength="100" strokeDasharray={`${incomes > 0 ? score : 0} 100`} />
          </svg>
          <div className="pulse-ring-center">
            <strong>{incomes > 0 ? score : '—'}</strong>
            <small>de 100</small>
          </div>
        </div>
        <div className="pulse-score-info">
          <span className="eyebrow">Saúde financeira</span>
          <span className={`status-pill tone-${status.tone}`}><StatusIcon size={14} />{status.label}</span>
          <p>Considera sua taxa de economia e o respeito aos orçamentos do mês.</p>
        </div>
      </div>

      <div className="pulse-metrics">
        <div>
          <span>Média diária</span>
          <strong><Money value={dailyAverage} /></strong>
          <small>Gasto médio por dia</small>
        </div>
        <div>
          <span>{month === currentMonth ? 'Projeção do mês' : month < currentMonth ? 'Fechamento' : 'Projeção'}</span>
          <strong className={month === currentMonth && incomes > 0 && projectedExpenses > incomes ? 'neg' : ''}><Money value={projectedExpenses} /></strong>
          <small>{month === currentMonth ? 'Saídas estimadas no ritmo atual' : 'Total de saídas do mês'}</small>
        </div>
        <div>
          <span>Uso do orçamento</span>
          <strong className={budgetUsage > 100 ? 'neg' : ''}>{budgetTotal > 0 ? `${Math.round(budgetUsage)}%` : '—'}</strong>
          <small>{budgetTotal > 0 ? <><Money value={budgetSpent} /> de <Money value={budgetTotal} /></> : 'Nenhum limite definido'}</small>
        </div>
        <div>
          <span>Pode gastar por dia</span>
          <strong>{dailyAllowance === null ? '—' : <Money value={dailyAllowance} />}</strong>
          <small>{dailyAllowance === null ? 'Disponível no mês atual' : `Para fechar no zero em ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`}</small>
        </div>
      </div>

      <ul className="pulse-insights">
        {insights.slice(0, 3).map((insight) => (
          <li key={insight.text} className={`tone-${insight.tone}`}>
            <Lightbulb size={15} />
            <span>{insight.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
