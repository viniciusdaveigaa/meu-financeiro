import { useMemo, useState } from 'react'
import { ArrowRight, CreditCard, Landmark, Pencil, Plus, ReceiptText, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { dayGroupLabel, searchableText } from '../utils/formatters'
import { getCategoryLabel, getCategoryMeta } from '../constants/categories'
import { useCategories } from '../context/CategoryContext'
import { CategoryIcon, Money } from './ui'

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'income', label: 'Entradas' },
  { id: 'expense', label: 'Saídas' },
  { id: 'neutral', label: 'Reservas' },
]

function signedTotal(items) {
  return items.reduce((sum, item) => {
    if (item.affects_balance === false) return sum
    return sum + (item.type === 'income' ? 1 : -1) * Number(item.amount)
  }, 0)
}

export function TransactionList({ entries, accounts, loading, onEdit, onRemove, onAddNew, compact = false, limit = 6, onViewAll }) {
  const { categories, getMeta } = useCategories()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const accountMap = useMemo(() => Object.fromEntries((accounts || []).map((account) => [account.id, account])), [accounts])

  const filtered = useMemo(() => {
    const query = searchableText(search.trim())
    return entries
      .filter((item) => {
        const neutral = item.affects_balance === false
        if (typeFilter === 'income' && (item.type !== 'income' || neutral)) return false
        if (typeFilter === 'expense' && (item.type !== 'expense' || neutral)) return false
        if (typeFilter === 'neutral' && !neutral) return false
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
        if (accountFilter !== 'all' && item.account_id !== accountFilter) return false
        if (query && !searchableText(`${item.description} ${getCategoryLabel(item.category)} ${accountMap[item.account_id]?.name || ''}`).includes(query)) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'date-asc') return a.date.localeCompare(b.date) || a.created_at?.localeCompare(b.created_at)
        if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount)
        if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount)
        return b.date.localeCompare(a.date) || b.created_at?.localeCompare(a.created_at)
      })
  }, [entries, typeFilter, categoryFilter, accountFilter, search, sortBy, accountMap])

  const visible = compact ? filtered.slice(0, limit) : filtered
  const groupByDay = sortBy.startsWith('date')
  const groups = useMemo(() => {
    if (!groupByDay) return [{ key: 'all', label: null, items: visible }]
    const map = new Map()
    visible.forEach((item) => {
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date).push(item)
    })
    return [...map.entries()].map(([date, items]) => ({ key: date, label: dayGroupLabel(date), items, net: signedTotal(items) }))
  }, [visible, groupByDay])

  const extraFilters = (categoryFilter !== 'all') + (accountFilter !== 'all') + (sortBy !== 'date-desc')
  const hasFilters = Boolean(search || typeFilter !== 'all' || extraFilters)
  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setAccountFilter('all')
    setSortBy('date-desc')
  }

  const filteredIncome = filtered.filter((item) => item.type === 'income' && item.affects_balance !== false).reduce((sum, item) => sum + Number(item.amount), 0)
  const filteredExpense = filtered.filter((item) => item.type === 'expense' && item.affects_balance !== false).reduce((sum, item) => sum + Number(item.amount), 0)

  return (
    <article className={`card tx-card ${compact ? 'is-compact' : ''}`}>
      <header className="card-head">
        <div>
          <span className="eyebrow">{compact ? 'Movimentações' : 'Extrato do mês'}</span>
          <h3 className="card-title">{compact ? 'Últimos lançamentos' : `${filtered.length} ${filtered.length === 1 ? 'lançamento' : 'lançamentos'}`}</h3>
        </div>
        {compact ? (
          entries.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onViewAll}>
              Ver extrato <ArrowRight size={15} />
            </button>
          )
        ) : (
          <button type="button" className="btn btn-primary btn-sm hide-mobile" onClick={onAddNew}>
            <Plus size={16} /> Adicionar
          </button>
        )}
      </header>

      {!compact && (
        <>
          <div className="tx-summary">
            <div><span>Entradas</span><Money value={filteredIncome} className="pos" /></div>
            <div><span>Saídas</span><Money value={filteredExpense} className="neg" /></div>
            <div><span>Saldo</span><Money value={filteredIncome - filteredExpense} /></div>
          </div>

          <div className="tx-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descrição, categoria ou conta" aria-label="Buscar lançamentos" />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca"><X size={15} /></button>
              )}
            </label>
            <button type="button" className={`btn btn-outline btn-filter ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>
              <SlidersHorizontal size={16} /> Filtros {extraFilters > 0 && <span className="count-badge">{extraFilters}</span>}
            </button>
          </div>

          <div className="chip-row" role="tablist" aria-label="Tipo de lançamento">
            {TYPE_FILTERS.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={typeFilter === item.id} className={`chip ${typeFilter === item.id ? 'active' : ''}`} onClick={() => setTypeFilter(item.id)}>
                {item.label}
              </button>
            ))}
            {hasFilters && (
              <button type="button" className="chip chip-clear" onClick={clearFilters}><X size={13} /> Limpar</button>
            )}
          </div>

          {filtersOpen && (
            <div className="tx-filters">
              <label className="field">
                <span>Categoria</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="all">Todas as categorias</option>
                  {categories.map((category) => <option key={category} value={category}>{getCategoryLabel(category)}</option>)}
                </select>
              </label>
              {accounts?.length > 0 && (
                <label className="field">
                  <span>Conta ou cartão</span>
                  <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
                    <option value="all">Todas as contas</option>
                    {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                  </select>
                </label>
              )}
              <label className="field">
                <span>Ordenar por</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="date-desc">Mais recentes</option>
                  <option value="date-asc">Mais antigos</option>
                  <option value="amount-desc">Maior valor</option>
                  <option value="amount-asc">Menor valor</option>
                </select>
              </label>
            </div>
          )}
        </>
      )}

      {loading && entries.length === 0 ? (
        <div className="tx-skeleton" aria-label="Carregando">
          {Array.from({ length: compact ? 4 : 6 }, (_, index) => <div key={index} className="skeleton-row"><i /><span><b /><b /></span><em /></div>)}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><ReceiptText size={22} /></span>
          <h4>{hasFilters ? 'Nada encontrado' : 'Nenhum lançamento neste mês'}</h4>
          <p>{hasFilters ? 'Tente ajustar ou limpar os filtros.' : 'Registre sua primeira movimentação para começar.'}</p>
          {hasFilters ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>Limpar filtros</button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={onAddNew}><Plus size={15} /> Novo lançamento</button>
          )}
        </div>
      ) : (
        <div className="tx-groups">
          {groups.map((group) => (
            <section key={group.key} className="tx-group">
              {group.label && (
                <div className="tx-group-head">
                  <span>{group.label}</span>
                  {!compact && <Money value={group.net} className={group.net >= 0 ? 'pos' : 'neg'} />}
                </div>
              )}
              <ul className="tx-list">
                {group.items.map((item) => {
                  const neutral = item.affects_balance === false
                  const isIncome = item.type === 'income'
                  const account = item.account_id ? accountMap[item.account_id] : null
                  const installment = Number(item.installment_total) > 1
                  return (
                    <li key={item.id} className={`tx-row ${neutral ? 'is-neutral' : ''}`}>
                      <button type="button" className="tx-main" onClick={() => onEdit(item)} aria-label={`Editar ${item.description}`}>
                        <CategoryIcon category={item.category} size={42} />
                        <span className="tx-info">
                          <span className="tx-title">
                            <span className="tx-desc">{item.description}</span>
                            {installment && <span className="tx-badge">{item.installment_number}/{item.installment_total}</span>}
                          </span>
                          <span className="tx-meta">
                            <span>{getMeta ? getMeta(item.category).label : getCategoryLabel(item.category)}</span>
                            {account && (
                              <span className="tx-account">
                                {account.kind === 'card' ? <CreditCard size={12} /> : <Landmark size={12} />}
                                {account.name}
                              </span>
                            )}
                            {neutral && <span className="tx-neutral">Não altera o saldo</span>}
                            {!groupByDay && <span>{item.date.split('-').reverse().join('/')}</span>}
                          </span>
                        </span>
                        <Money value={item.amount} prefix={neutral ? '' : isIncome ? '+ ' : '- '} className={`tx-amount ${neutral ? 'neutral' : isIncome ? 'pos' : 'neg'}`} />
                      </button>
                      <div className="tx-actions">
                        <button type="button" className="icon-btn" onClick={() => onEdit(item)} aria-label="Editar" title="Editar"><Pencil size={15} /></button>
                        <button type="button" className="icon-btn danger" onClick={() => onRemove(item)} aria-label="Excluir" title="Excluir"><Trash2 size={15} /></button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          {compact && filtered.length > limit && (
            <button type="button" className="tx-more" onClick={onViewAll}>
              Ver mais {filtered.length - limit} lançamentos <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </article>
  )
}
