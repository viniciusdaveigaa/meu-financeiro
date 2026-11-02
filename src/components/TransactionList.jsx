import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Square,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import {
  dayGroupLabel,
  searchableText,
  formatMonthName,
  isNeutralEntry,
  isCreditEntry,
  resolveIsPaid
} from '../utils/formatters'
import { getCategoryLabel } from '../constants/categories'
import { useCategories } from '../context/CategoryContext'
import { exportToCsv } from '../utils/exportImport'
import { useAppDialog } from './Dialog'
import { CsvImportModal } from './CsvImportModal'
import { ReportModal } from './ReportModal'
import { BankLogoBadge, CategoryIcon, Money } from './ui'

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'income', label: 'Entradas' },
  { id: 'expense', label: 'Saídas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'credit', label: 'Cartão de Crédito' },
  { id: 'neutral', label: 'Reservas / Transf.' },
]

function signedTotal(items) {
  return items.reduce((sum, item) => {
    if (isNeutralEntry(item)) return sum
    return sum + (item.type === 'income' ? 1 : -1) * Number(item.amount)
  }, 0)
}

export function TransactionList({
  entries,
  accounts,
  loading,
  onEdit,
  onDuplicate,
  onRemove,
  onRemoveAllMonth,
  onTogglePaid,
  onBulkDelete,
  onBulkTogglePaid,
  onBulkChangeCategory,
  paidMap = {},
  externalFilter = null,
  onClearExternalFilter,
  onAddNew,
  compact = false,
  limit = 6,
  onViewAll,
  month = ''
}) {
  const dialog = useAppDialog()
  const { categories, getMeta } = useCategories()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [deletingMonth, setDeletingMonth] = useState(false)

  // Estados de seleção múltipla em lote
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)

  // Aplica filtros vindos de cliques em Contas, Cartões ou Categorias na Visão Geral
  useEffect(() => {
    if (!externalFilter) return
    if (externalFilter.accountId) {
      setAccountFilter(externalFilter.accountId)
      setFiltersOpen(true)
    }
    if (externalFilter.category) {
      setCategoryFilter(externalFilter.category)
      setFiltersOpen(true)
    }
    onClearExternalFilter?.()
  }, [externalFilter])

  // Limpa seleção ao trocar de mês
  useEffect(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [month])

  const handleDeleteAllMonth = async () => {
    if (!entries || entries.length === 0 || deletingMonth) return
    const monthLabel = formatMonthName(month)
    const confirmed = await dialog.confirm(
      `Deseja realmente excluir todos os ${entries.length} lançamentos de ${monthLabel}? Esta ação apagará permanentemente todas as movimentações deste mês e não poderá ser desfeita.`,
      {
        title: `Excluir todos os lançamentos de ${monthLabel}?`,
        confirmLabel: 'Sim, excluir tudo',
        cancelLabel: 'Cancelar',
        danger: true
      }
    )
    if (!confirmed) return

    try {
      setDeletingMonth(true)
      if (onRemoveAllMonth) {
        await onRemoveAllMonth()
      }
    } finally {
      setDeletingMonth(false)
    }
  }

  const accountMap = useMemo(
    () => Object.fromEntries((accounts || []).map((account) => [account.id, account])),
    [accounts]
  )

  const filtered = useMemo(() => {
    const query = searchableText(search.trim())
    return entries
      .filter((item) => {
        if (item.show_in_statement === false) return false
        const neutral = isNeutralEntry(item)
        const acc = item.account_id ? accountMap[item.account_id] : null
        const isCredit = isCreditEntry(item, acc)
        const isPaid = resolveIsPaid(item, paidMap)

        if (typeFilter === 'income' && (item.type !== 'income' || neutral)) return false
        if (typeFilter === 'expense' && (item.type !== 'expense' || neutral)) return false
        if (typeFilter === 'pending' && isPaid) return false
        if (typeFilter === 'credit' && !isCredit) return false
        if (typeFilter === 'neutral' && !neutral) return false
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
        if (accountFilter !== 'all' && item.account_id !== accountFilter) return false
        if (
          query &&
          !searchableText(
            `${item.description} ${getCategoryLabel(item.category)} ${accountMap[item.account_id]?.name || ''}`
          ).includes(query)
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'date-asc') return a.date.localeCompare(b.date) || a.created_at?.localeCompare(b.created_at)
        if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount)
        if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount)
        return b.date.localeCompare(a.date) || b.created_at?.localeCompare(a.created_at)
      })
  }, [entries, typeFilter, categoryFilter, accountFilter, search, sortBy, accountMap, paidMap])

  const visible = compact ? filtered.slice(0, limit) : filtered
  const groupByDay = sortBy.startsWith('date')
  const groups = useMemo(() => {
    if (!groupByDay) return [{ key: 'all', label: null, items: visible }]
    const map = new Map()
    visible.forEach((item) => {
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date).push(item)
    })
    return [...map.entries()].map(([date, items]) => ({
      key: date,
      label: dayGroupLabel(date),
      items,
      net: signedTotal(items)
    }))
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

  const filteredIncome = filtered
    .filter((item) => item.type === 'income' && !isNeutralEntry(item))
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const filteredExpense = filtered
    .filter((item) => item.type === 'expense' && !isNeutralEntry(item))
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const pendingTotal = filtered
    .filter((item) => !isNeutralEntry(item) && !resolveIsPaid(item, paidMap))
    .reduce((sum, item) => sum + Number(item.amount), 0)

  // Funções de seleção múltipla
  const toggleSelectId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    if (selectedIds.size === visible.length && visible.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visible.map((i) => i.id)))
    }
  }

  const selectedItemsTotal = useMemo(() => {
    return visible
      .filter((i) => selectedIds.has(i.id))
      .reduce((s, i) => s + Number(i.amount), 0)
  }, [visible, selectedIds])

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length || !onBulkDelete) return
    const confirmed = await dialog.confirm(
      `Deseja realmente excluir os ${ids.length} lançamentos selecionados? Esta ação não pode ser desfeita.`,
      {
        title: `Excluir ${ids.length} lançamentos selecionados?`,
        confirmLabel: 'Sim, excluir selecionados',
        danger: true
      }
    )
    if (!confirmed) return
    setBulkBusy(true)
    try {
      await onBulkDelete(ids)
      setSelectedIds(new Set())
      setSelectionMode(false)
    } finally {
      setBulkBusy(false)
    }
  }

  const handleBulkPaid = async (isPaidVal) => {
    const ids = Array.from(selectedIds)
    if (!ids.length || !onBulkTogglePaid) return
    setBulkBusy(true)
    try {
      await onBulkTogglePaid(ids, isPaidVal)
      setSelectedIds(new Set())
    } finally {
      setBulkBusy(false)
    }
  }

  const handleBulkCatApply = async (catName) => {
    setBulkCategory(catName)
    if (!catName) return
    const ids = Array.from(selectedIds)
    if (!ids.length || !onBulkChangeCategory) return
    setBulkBusy(true)
    try {
      await onBulkChangeCategory(ids, catName)
      setBulkCategory('')
      setSelectedIds(new Set())
    } finally {
      setBulkBusy(false)
    }
  }

  const handleExportCsv = async () => {
    const count = filtered.length
    const filename = `extrato-saldo-claro-${month || 'completo'}.csv`
    const periodLabel = formatMonthName(month) || 'Extrato completo'
    const confirmed = await dialog.confirmDownload({
      title: 'Exportar Extrato em Planilha CSV',
      message: 'Confirme a exportação dos lançamentos para planilha:',
      fileName: filename,
      fileType: 'Planilha de Lançamentos (.csv)',
      fileFormat: 'CSV',
      description: 'Arquivo de planilha com colunas de Data, Tipo, Descrição, Categoria, Valor, Conta e Parcelas.',
      details: [
        { label: 'Referência', value: periodLabel },
        { label: 'Lançamentos', value: `${count} registro${count === 1 ? '' : 's'}` },
        { label: 'Formato', value: 'CSV compatível com Excel' },
        { label: 'Filtro', value: hasFilters ? 'Lançamentos filtrados' : 'Todos os itens' }
      ],
      confirmLabel: 'Baixar Planilha'
    })

    if (!confirmed) return
    exportToCsv({ entries: filtered, month, accounts })
  }

  return (
    <article className={`card tx-card ${compact ? 'is-compact' : ''}`}>
      <header className="card-head">
        <div>
          <span className="eyebrow">{compact ? 'Movimentações' : 'Extrato do mês'}</span>
          <h3 className="card-title">
            {compact ? 'Últimos lançamentos' : `${filtered.length} ${filtered.length === 1 ? 'lançamento' : 'lançamentos'}`}
          </h3>
        </div>
        {compact ? (
          entries.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onViewAll}>
              Ver extrato <ArrowRight size={15} />
            </button>
          )
        ) : (
          <div className="card-head-actions">
            {entries.length > 0 && (
              <button
                type="button"
                className={`btn btn-outline btn-sm ${selectionMode ? 'active' : ''}`}
                onClick={() => {
                  setSelectionMode((v) => !v)
                  setSelectedIds(new Set())
                }}
                title="Selecionar vários lançamentos para ações em lote"
              >
                <CheckSquare size={15} />
                <span className="hide-mobile">{selectionMode ? 'Cancelar seleção' : 'Selecionar'}</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setReportModalOpen(true)}
              title="Gerar relatório financeiro em PDF"
            >
              <FileText size={15} />
              <span className="hide-mobile">Relatório PDF</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportCsv}
              title="Exportar para arquivo .CSV (Excel/Google Planilhas)"
            >
              <Download size={15} />
              <span className="hide-mobile">Exportar CSV</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setCsvModalOpen(true)}
              title="Importar lançamentos a partir de um arquivo .CSV"
            >
              <Upload size={15} />
              <span className="hide-mobile">Importar CSV</span>
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onAddNew}>
              <Plus size={16} /> <span className="hide-mobile">Adicionar</span>
            </button>
          </div>
        )}
      </header>

      {!compact && (
        <>
          <div className="tx-summary tx-summary-4">
            <div><span>Entradas</span><Money value={filteredIncome} className="pos" /></div>
            <div><span>Saídas</span><Money value={filteredExpense} className="neg" /></div>
            <div><span>Saldo</span><Money value={filteredIncome - filteredExpense} /></div>
            <div>
              <span>Pendentes no mês</span>
              <Money value={pendingTotal} className={pendingTotal > 0 ? 'warn-text' : ''} />
            </div>
          </div>

          {/* Barra de ações em lote quando o modo de seleção está ativo */}
          {selectionMode && (
            <div className="tx-bulk-bar" role="region" aria-label="Ações em lote">
              <div className="tx-bulk-left">
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={toggleSelectAllVisible}
                >
                  {selectedIds.size === visible.length && visible.length > 0 ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Square size={14} />
                  )}
                  <span>
                    {selectedIds.size === visible.length && visible.length > 0
                      ? 'Desmarcar todos'
                      : `Selecionar todos (${visible.length})`}
                  </span>
                </button>
                <span className="tx-bulk-counter">
                  <strong>{selectedIds.size}</strong> selecionado{selectedIds.size === 1 ? '' : 's'}
                  {selectedIds.size > 0 && (
                    <> • Total: <strong><Money value={selectedItemsTotal} /></strong></>
                  )}
                </span>
              </div>

              {selectedIds.size > 0 && (
                <div className="tx-bulk-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    disabled={bulkBusy}
                    onClick={() => handleBulkPaid(true)}
                    title="Marcar selecionados como Pago/Recebido"
                  >
                    <CheckCircle2 size={13} /> Marcar Pago
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    disabled={bulkBusy}
                    onClick={() => handleBulkPaid(false)}
                    title="Marcar selecionados como Pendente"
                  >
                    <Clock size={13} /> Marcar Pendente
                  </button>
                  <select
                    className="tx-bulk-cat-select"
                    value={bulkCategory}
                    disabled={bulkBusy}
                    onChange={(e) => handleBulkCatApply(e.target.value)}
                    aria-label="Mudar categoria dos selecionados"
                  >
                    <option value="">Mudar categoria...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getMeta ? getMeta(cat).label : getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost-danger btn-xs"
                    disabled={bulkBusy}
                    onClick={handleBulkDeleteConfirm}
                  >
                    <Trash2 size={13} /> Excluir ({selectedIds.size})
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="tx-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por descrição, categoria ou conta"
                aria-label="Buscar lançamentos"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
                  <X size={15} />
                </button>
              )}
            </label>
            <button
              type="button"
              className={`btn btn-outline btn-filter ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={16} /> Filtros {extraFilters > 0 && <span className="count-badge">{extraFilters}</span>}
            </button>
          </div>

          <div className="chip-row" role="tablist" aria-label="Tipo de lançamento">
            {TYPE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={typeFilter === item.id}
                className={`chip ${typeFilter === item.id ? 'active' : ''}`}
                onClick={() => setTypeFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
            {hasFilters && (
              <button type="button" className="chip chip-clear" onClick={clearFilters}>
                <X size={13} /> Limpar
              </button>
            )}
          </div>

          {filtersOpen && (
            <div className="tx-filters">
              <label className="field">
                <span>Categoria</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="all">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {getMeta ? getMeta(category).label : getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>
              {accounts?.length > 0 && (
                <label className="field">
                  <span>Conta ou cartão</span>
                  <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
                    <option value="all">Todas as contas</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
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
          {Array.from({ length: compact ? 4 : 6 }, (_, index) => (
            <div key={index} className="skeleton-row"><i /><span><b /><b /></span><em /></div>
          ))}
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
                  const neutral = isNeutralEntry(item)
                  const isIncome = item.type === 'income'
                  const account = item.account_id ? accountMap[item.account_id] : null
                  const isCredit = isCreditEntry(item, account)
                  const isPaid = resolveIsPaid(item, paidMap)
                  const installment = Number(item.installment_total) > 1
                  const isSelected = selectedIds.has(item.id)

                  return (
                    <li
                      key={item.id}
                      className={`tx-row ${neutral ? 'is-neutral' : ''} ${!isPaid ? 'is-pending-row' : ''} ${isSelected ? 'is-selected-row' : ''}`}
                    >
                      {selectionMode && !compact && (
                        <button
                          type="button"
                          className={`tx-select-check ${isSelected ? 'checked' : ''}`}
                          onClick={() => toggleSelectId(item.id)}
                          aria-label={isSelected ? 'Desmarcar lançamento' : 'Selecionar lançamento'}
                        >
                          {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                        </button>
                      )}

                      {onTogglePaid && !neutral && (
                        <button
                          type="button"
                          className={`tx-paid-check-btn ${isPaid ? 'paid' : 'pending'}`}
                          onClick={() => onTogglePaid(item, !isPaid)}
                          title={
                            isPaid
                              ? `${isIncome ? 'Recebido' : 'Pago'} — clique para marcar como pendente`
                              : `Pendente — clique para marcar como ${isIncome ? 'recebido' : 'pago'}`
                          }
                          aria-label={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                          {isPaid ? <CheckCircle2 size={17} /> : <Clock size={17} />}
                        </button>
                      )}

                      <button
                        type="button"
                        className="tx-main"
                        onClick={() => (selectionMode && !compact ? toggleSelectId(item.id) : onEdit(item))}
                        aria-label={`Editar ${item.description}`}
                      >
                        <CategoryIcon category={item.category} size={42} />
                        <span className="tx-info">
                          <span className="tx-title">
                            <span className="tx-desc">{item.description}</span>
                            {installment && (
                              <span className="tx-badge">{item.installment_number}/{item.installment_total}</span>
                            )}
                            {!isPaid && !neutral && (
                              <span className="tx-status-pill pending">Pendente</span>
                            )}
                            {isCredit && (
                              <span className="tx-status-pill credit">Crédito</span>
                            )}
                          </span>
                          <span className="tx-meta">
                            <span>{getMeta ? getMeta(item.category).label : getCategoryLabel(item.category)}</span>
                            {account && (
                              <span className="tx-account">
                                <BankLogoBadge
                                  logoId={account.logo}
                                  accountName={account.name}
                                  kind={account.kind}
                                  size={20}
                                />
                                <span>{account.name}</span>
                              </span>
                            )}
                            {neutral && (
                              <span className="tx-neutral">
                                {item.category === 'Transferencia' ? 'Transferência entre contas' : 'Não altera o saldo'}
                              </span>
                            )}
                            {!groupByDay && <span>{item.date.split('-').reverse().join('/')}</span>}
                          </span>
                        </span>
                        <Money
                          value={item.amount}
                          prefix={neutral ? '' : isIncome ? '+ ' : '- '}
                          className={`tx-amount ${neutral ? 'neutral' : isIncome ? 'pos' : 'neg'}`}
                        />
                      </button>

                      <div className="tx-actions">
                        {onDuplicate && (
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => onDuplicate(item)}
                            aria-label="Duplicar lançamento"
                            title="Duplicar lançamento"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => onEdit(item)}
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => onRemove(item)}
                          aria-label="Excluir"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
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

      {!compact && entries.length > 0 && (
        <div className="tx-footer-actions">
          <button
            type="button"
            className="btn-delete-month"
            onClick={handleDeleteAllMonth}
            disabled={deletingMonth}
            title={`Excluir permanentemente todos os ${entries.length} lançamentos deste mês`}
          >
            <Trash2 size={15} />
            <span>{deletingMonth ? 'Excluindo lançamentos...' : `Excluir todos os lançamentos do mês (${entries.length})`}</span>
          </button>
        </div>
      )}

      {reportModalOpen && (
        <ReportModal
          entries={filtered}
          month={month}
          accounts={accounts}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {csvModalOpen && (
        <CsvImportModal
          accounts={accounts}
          entries={entries}
          onClose={() => setCsvModalOpen(false)}
        />
      )}
    </article>
  )
}

