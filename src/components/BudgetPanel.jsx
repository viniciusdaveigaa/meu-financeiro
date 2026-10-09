import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Pencil,
  Plus,
  Sliders,
  Target,
  X
} from 'lucide-react'
import { useCategories } from '../context/CategoryContext'
import { CategoryIcon, Money } from './ui'
import { formatMonthName } from '../utils/formatters'

export function BudgetPanel({
  month,
  budgets,
  expensesByCategory,
  onSave,
  ready
}) {
  const { categories, getMeta } = useCategories()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setDraft(Object.fromEntries(budgets.map((b) => [b.category, b.amount])))
    setEditing(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const saved = await onSave(draft)
    setSaving(false)
    if (saved) setEditing(false)
  }

  if (!ready) {
    return (
      <article className="card budget-card">
        <header className="card-head">
          <div>
            <span className="eyebrow">Planejamento</span>
            <h3 className="card-title">Orçamentos por Categoria</h3>
          </div>
        </header>
        <div className="empty-state">
          <span className="empty-icon"><Info size={22} /></span>
          <h4>Recurso não configurado</h4>
          <p>Execute a atualização em <code>supabase/schema.sql</code> para ativar os orçamentos.</p>
        </div>
      </article>
    )
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  const totalSpentInBudgets = budgets.reduce(
    (sum, b) => sum + (expensesByCategory[b.category] || 0),
    0
  )
  const totalRemaining = Math.max(totalBudget - totalSpentInBudgets, 0)
  const overallUsage = totalBudget > 0 ? Math.round((totalSpentInBudgets / totalBudget) * 100) : 0

  return (
    <article className="card budget-card">
      <header className="card-head">
        <div>
          <span className="eyebrow">Limites do Mês</span>
          <h3 className="card-title">Orçamentos de {formatMonthName(month)}</h3>
        </div>
        <div className="card-head-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={saving}
            onClick={editing ? () => setEditing(false) : startEdit}
          >
            {editing ? (
              <>
                <X size={15} /> Cancelar
              </>
            ) : (
              <>
                <Pencil size={14} /> Ajustar limites
              </>
            )}
          </button>
        </div>
      </header>

      {/* Top Banner KPI */}
      {budgets.length > 0 && totalBudget > 0 && !editing && (
        <div className="budget-kpi-banner">
          <div className="kpi-item">
            <span className="kpi-label">Total planejado</span>
            <strong className="kpi-val"><Money value={totalBudget} /></strong>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Total gasto</span>
            <strong className={`kpi-val ${totalSpentInBudgets > totalBudget ? 'neg' : ''}`}>
              <Money value={totalSpentInBudgets} />
            </strong>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Disponível</span>
            <strong className="kpi-val pos"><Money value={totalRemaining} /></strong>
          </div>
          <div className="kpi-item kpi-usage">
            <span className="kpi-label">Consumo geral</span>
            <div className="kpi-bar-wrap">
              <div className="bar-track">
                <i
                  style={{
                    width: `${Math.min(overallUsage, 100)}%`,
                    background: overallUsage > 100 ? '#e4764c' : overallUsage > 80 ? '#f59e0b' : '#1f9d6b'
                  }}
                />
              </div>
              <span className={`kpi-pct ${overallUsage > 100 ? 'neg' : ''}`}>{overallUsage}%</span>
            </div>
          </div>
        </div>
      )}

      {editing ? (
        <form className="budget-form" onSubmit={submit}>
          <p className="form-info-tip">
            <Sliders size={15} />
            Defina um teto máximo de gastos para cada categoria. Deixe vazio para remover o limite.
          </p>

          <div className="budget-edit-grid">
            {categories.map((cat) => {
              const meta = getMeta(cat)
              return (
                <div key={cat} className="budget-edit-item">
                  <div className="budget-edit-label">
                    <CategoryIcon category={cat} size={32} />
                    <span>{meta.label}</span>
                  </div>
                  <div className="amount-input-compact">
                    <em>R$</em>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Sem teto"
                      value={draft[cat] ?? ''}
                      onChange={(e) => setDraft({ ...draft, [cat]: e.target.value })}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar orçamentos'}
            </button>
          </div>
        </form>
      ) : budgets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Target size={22} /></span>
          <h4>Nenhum orçamento configurado</h4>
          <p>Defina tetos de gastos por categoria para receber alertas e evitar estouros.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={startEdit}>
            <Plus size={15} /> Criar limites para este mês
          </button>
        </div>
      ) : (
        <div className="budget-cards-grid">
          {budgets.map((budget) => {
            const spent = expensesByCategory[budget.category] || 0
            const limit = Number(budget.amount)
            const ratio = limit > 0 ? (spent / limit) * 100 : 0
            const isOver = spent > limit
            const isWarning = ratio >= 80 && !isOver
            const meta = getMeta(budget.category)
            const diff = limit - spent

            return (
              <div key={budget.category} className={`budget-item-card ${isOver ? 'over' : isWarning ? 'warn' : ''}`}>
                <div className="budget-item-head">
                  <div className="budget-item-title">
                    <CategoryIcon category={budget.category} size={36} />
                    <div>
                      <strong>{meta.label}</strong>
                      <small className="budget-ratio-text">
                        {Math.round(ratio)}% consumido
                      </small>
                    </div>
                  </div>
                  <div className="budget-item-values">
                    <span className="spent"><Money value={spent} /></span>
                    <span className="limit">de <Money value={limit} /></span>
                  </div>
                </div>

                <div className="bar-track">
                  <i
                    style={{
                      width: `${Math.min(ratio, 100)}%`,
                      background: isOver ? '#e4764c' : isWarning ? '#f59e0b' : meta.color
                    }}
                  />
                </div>

                <div className="budget-item-foot">
                  {isOver ? (
                    <span className="budget-tag over">
                      <AlertTriangle size={13} />
                      Estourou em <Money value={Math.abs(diff)} />
                    </span>
                  ) : (
                    <span className="budget-tag ok">
                      <CheckCircle2 size={13} />
                      Resta <Money value={diff} />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
