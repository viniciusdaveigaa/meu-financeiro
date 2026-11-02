import { useState, useEffect, useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Landmark,
  PiggyBank,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet
} from 'lucide-react'
import {
  formatMonthName,
  getPaidInvoicesMap,
  getSavedCardLimits,
  isCreditEntry,
  isNeutralEntry,
  setInvoicePaidStatus
} from '../utils/formatters'
import { prefetchSavings } from './SavingsPanel'
import { BankLogoBadge, Money } from './ui'

export function FinancialAccountsHub({
  userId,
  month,
  entries = [],
  allEntries = [],
  accounts = [],
  onFilterAccount,
  onNewTransfer,
  onNavigatePlanning
}) {
  const [activeSection, setActiveSection] = useState('all') // 'all' | 'accounts' | 'cards' | 'wealth'
  const [paidInvoices, setPaidInvoices] = useState(() => getPaidInvoicesMap(userId))
  const [cardLimits, setCardLimits] = useState(() => getSavedCardLimits(userId))
  const [savingsTotal, setSavingsTotal] = useState(0)
  const [savingsBoxesCount, setSavingsBoxesCount] = useState(0)

  useEffect(() => {
    setPaidInvoices(getPaidInvoicesMap(userId))
    setCardLimits(getSavedCardLimits(userId))
  }, [userId, accounts])

  useEffect(() => {
    const syncLimitsAndInvoices = () => {
      setPaidInvoices(getPaidInvoicesMap(userId))
      setCardLimits(getSavedCardLimits(userId))
    }
    window.addEventListener('account-logos-changed', syncLimitsAndInvoices)
    window.addEventListener('finance-data-changed', syncLimitsAndInvoices)
    return () => {
      window.removeEventListener('account-logos-changed', syncLimitsAndInvoices)
      window.removeEventListener('finance-data-changed', syncLimitsAndInvoices)
    }
  }, [userId])

  // Carrega o saldo total guardado nas Caixinhas de Reserva para o Patrimônio
  useEffect(() => {
    let mounted = true
    const loadSavingsSummary = async () => {
      const data = await prefetchSavings()
      if (!mounted || !data) return
      const boxes = data.boxes || []
      const contribs = data.contributions || []
      setSavingsBoxesCount(boxes.length)
      const totalSaved = boxes.reduce((acc, box) => {
        const boxTotal = contribs
          .filter((c) => c.box_id === box.id)
          .reduce((s, c) => s + (c.type === 'withdrawal' ? -Number(c.amount) : Number(c.amount)), 0)
        return acc + Math.max(0, boxTotal)
      }, 0)
      setSavingsTotal(totalSaved)
    }
    loadSavingsSummary()
    window.addEventListener('finance-data-changed', loadSavingsSummary)
    return () => {
      mounted = false
      window.removeEventListener('finance-data-changed', loadSavingsSummary)
    }
  }, [])

  // Separa contas bancárias normais e cartões de crédito
  const bankAccounts = useMemo(
    () => (accounts || []).filter((a) => a.kind !== 'card' || a.card_type === 'debit'),
    [accounts]
  )
  const creditCards = useMemo(
    () => (accounts || []).filter((a) => a.kind === 'card' && a.card_type !== 'debit'),
    [accounts]
  )

  // Calcula saldos por conta bancária (mês atual e acumulado até o mês)
  const bankBalances = useMemo(() => {
    return bankAccounts.map((acc) => {
      // Lançamentos do mês vinculados a esta conta (exceto compras a crédito)
      const monthTx = entries.filter(
        (item) => item.account_id === acc.id && item.payment_method !== 'credit'
      )
      const monthIncomes = monthTx
        .filter((item) => item.type === 'income')
        .reduce((s, item) => s + Number(item.amount), 0)
      const monthExpenses = monthTx
        .filter((item) => item.type === 'expense')
        .reduce((s, item) => s + Number(item.amount), 0)

      // Saldo acumulado histórico da conta
      const histTx = allEntries.filter(
        (item) =>
          item.type !== 'marker' &&
          item.account_id === acc.id &&
          item.payment_method !== 'credit'
      )
      const accumulatedBalance = histTx.reduce(
        (s, item) => s + (item.type === 'income' ? 1 : -1) * Number(item.amount),
        0
      )

      return {
        ...acc,
        monthIncomes,
        monthExpenses,
        monthNet: monthIncomes - monthExpenses,
        accumulatedBalance,
        txCount: monthTx.length
      }
    })
  }, [bankAccounts, entries, allEntries])

  // Calcula faturas de cada cartão de crédito no mês selecionado + limite utilizado
  const creditCardInvoices = useMemo(() => {
    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentDay = today.getDate()

    return creditCards.map((card) => {
      // Lançamentos de crédito deste cartão no mês selecionado
      const invoiceItems = entries.filter(
        (item) => item.account_id === card.id && isCreditEntry(item, card)
      )
      const invoiceTotal = invoiceItems.reduce((s, item) => s + Number(item.amount), 0)

      // Total comprometido em faturas abertas/futuras para barra de limite
      const futureAndCurrentItems = allEntries.filter((item) => {
        if (item.type === 'marker' || item.account_id !== card.id || !isCreditEntry(item, card)) return false
        const itemMonth = item.date?.slice(0, 7) || ''
        const invPaid = Boolean(paidInvoices[`${card.id}_${itemMonth}`])
        return itemMonth >= month && !invPaid
      })
      const usedLimit = futureAndCurrentItems.reduce((s, item) => s + Number(item.amount), 0)

      const limitValue = Number(card.credit_limit) || Number(cardLimits[card.id]) || 0
      const availableLimit = limitValue > 0 ? Math.max(0, limitValue - usedLimit) : null
      const limitPercent = limitValue > 0 ? Math.min(100, Math.round((usedLimit / limitValue) * 100)) : null

      const isPaid = Boolean(paidInvoices[`${card.id}_${month}`])

      let statusLabel = 'Fatura Aberta'
      let statusTone = 'open'
      if (isPaid) {
        statusLabel = 'Fatura Paga'
        statusTone = 'paid'
      } else if (month < currentMonthKey) {
        statusLabel = 'Fatura Fechada'
        statusTone = 'closed'
      } else if (month === currentMonthKey && card.closing_day && currentDay >= Number(card.closing_day)) {
        statusLabel = 'Fatura Fechada'
        statusTone = 'closed'
      }

      return {
        ...card,
        invoiceTotal,
        itemsCount: invoiceItems.length,
        usedLimit,
        limitValue,
        availableLimit,
        limitPercent,
        isPaid,
        statusLabel,
        statusTone
      }
    })
  }, [creditCards, entries, allEntries, month, paidInvoices, cardLimits])

  // Resumo Anual e Evolução Patrimonial
  const selectedYear = month ? month.slice(0, 4) : String(new Date().getFullYear())
  const annualSummary = useMemo(() => {
    const yearItems = allEntries.filter(
      (item) =>
        item.type !== 'marker' &&
        item.date?.startsWith(selectedYear) &&
        !isNeutralEntry(item)
    )
    const yearIncome = yearItems
      .filter((i) => i.type === 'income')
      .reduce((s, i) => s + Number(i.amount), 0)
    const yearExpense = yearItems
      .filter((i) => i.type === 'expense')
      .reduce((s, i) => s + Number(i.amount), 0)

    const monthsWithExpenses = new Set(
      yearItems.filter((i) => i.type === 'expense').map((i) => i.date.slice(0, 7))
    ).size
    const avgMonthlyExpense = monthsWithExpenses > 0 ? yearExpense / monthsWithExpenses : 0

    // Saldo líquido histórico de todas as movimentações até o momento
    const totalLiquidBalance = allEntries
      .filter((item) => item.type !== 'marker' && !isNeutralEntry(item))
      .reduce((s, item) => s + (item.type === 'income' ? 1 : -1) * Number(item.amount), 0)

    const totalNetWorth = totalLiquidBalance + savingsTotal

    return {
      yearIncome,
      yearExpense,
      yearNet: yearIncome - yearExpense,
      avgMonthlyExpense,
      totalLiquidBalance,
      savingsTotal,
      totalNetWorth
    }
  }, [allEntries, selectedYear, savingsTotal])

  const handleToggleInvoicePaid = (cardId) => {
    const currentlyPaid = Boolean(paidInvoices[`${cardId}_${month}`])
    const updated = setInvoicePaidStatus(userId, cardId, month, !currentlyPaid)
    setPaidInvoices(updated)
  }

  return (
    <section className="fin-hub-section" aria-label="Contas, Faturas e Patrimônio">
      <div className="fin-hub-header">
        <div className="fin-hub-title-group">
          <span className="eyebrow">Visão Consolidada</span>
          <h3 className="card-title">Contas, Faturas de Cartão & Patrimônio</h3>
        </div>

        <div className="fin-hub-Controls">
          <div className="fin-hub-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === 'all'}
              className={`fin-hub-tab ${activeSection === 'all' ? 'active' : ''}`}
              onClick={() => setActiveSection('all')}
            >
              Resumo Completo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === 'cards'}
              className={`fin-hub-tab ${activeSection === 'cards' ? 'active' : ''}`}
              onClick={() => setActiveSection('cards')}
            >
              <CreditCard size={14} />
              <span>Faturas ({creditCards.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === 'accounts'}
              className={`fin-hub-tab ${activeSection === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveSection('accounts')}
            >
              <Landmark size={14} />
              <span>Saldos ({bankAccounts.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === 'wealth'}
              className={`fin-hub-tab ${activeSection === 'wealth' ? 'active' : ''}`}
              onClick={() => setActiveSection('wealth')}
            >
              <TrendingUp size={14} />
              <span>Patrimônio & {selectedYear}</span>
            </button>
          </div>

          {bankAccounts.length >= 2 && onNewTransfer && (
            <button
              type="button"
              className="btn btn-secondary btn-sm fin-transfer-quick-btn"
              onClick={onNewTransfer}
              title="Transferir valor entre duas contas bancárias"
            >
              <ArrowLeftRight size={14} />
              <span>Transferir entre contas</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. PAINEL DE FATURAS DE CARTÃO DE CRÉDITO */}
      {(activeSection === 'all' || activeSection === 'cards') && creditCardInvoices.length > 0 && (
        <div className="fin-hub-block">
          <div className="fin-block-subhead">
            <span className="fin-block-label">
              <CreditCard size={15} /> Faturas de Cartão de Crédito — {formatMonthName(month)}
            </span>
            <button
              type="button"
              className="btn-link-subtle"
              onClick={() => onNavigatePlanning?.('accounts')}
            >
              Gerenciar cartões / limites <ArrowRight size={13} />
            </button>
          </div>

          <div className="fin-cards-grid">
            {creditCardInvoices.map((card) => (
              <article
                key={card.id}
                className={`fin-invoice-card status-${card.statusTone}`}
              >
                <div className="fin-invoice-top">
                  <div className="fin-acc-identity">
                    <BankLogoBadge
                      logoId={card.logo}
                      accountName={card.name}
                      kind="card"
                      size={36}
                    />
                    <div className="fin-acc-meta">
                      <strong>{card.name}</strong>
                      <small>
                        {card.closing_day ? `Fecha dia ${card.closing_day}` : 'Sem fechamento'}
                        {card.due_day ? ` • Vence dia ${card.due_day}` : ''}
                      </small>
                    </div>
                  </div>

                  <span className={`fin-invoice-badge ${card.statusTone}`}>
                    {card.isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {card.statusLabel}
                  </span>
                </div>

                <div className="fin-invoice-middle">
                  <div>
                    <span className="fin-val-caption">Total da fatura no mês</span>
                    <strong className="fin-invoice-amount">
                      <Money value={card.invoiceTotal} />
                    </strong>
                  </div>
                  <span className="fin-tx-count">
                    {card.itemsCount} {card.itemsCount === 1 ? 'compra' : 'compras'}
                  </span>
                </div>

                {/* Barra de Limite do Cartão */}
                {card.limitValue > 0 ? (
                  <div className="fin-limit-box">
                    <div className="fin-limit-labels">
                      <span>
                        Limite usado: <strong><Money value={card.usedLimit} /></strong> ({card.limitPercent}%)
                      </span>
                      <span>
                        Disponível: <strong className="pos"><Money value={card.availableLimit} /></strong>
                      </span>
                    </div>
                    <div className="fin-limit-track" aria-hidden="true">
                      <div
                        className={`fin-limit-fill ${
                          card.limitPercent >= 85 ? 'danger' : card.limitPercent >= 60 ? 'warn' : 'ok'
                        }`}
                        style={{ width: `${card.limitPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="fin-define-limit-btn"
                    onClick={() => onNavigatePlanning?.('accounts')}
                  >
                    + Definir limite do cartão nas configurações
                  </button>
                )}

                <div className="fin-invoice-actions">
                  <button
                    type="button"
                    className={`btn btn-xs ${card.isPaid ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleToggleInvoicePaid(card.id)}
                  >
                    <Check size={13} />
                    <span>{card.isPaid ? 'Reabrir fatura' : 'Marcar fatura paga'}</span>
                  </button>
                  {onFilterAccount && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => onFilterAccount(card.id)}
                    >
                      <Eye size={13} />
                      <span>Ver compras</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 2. CARDS DE SALDO POR CONTA BANCÁRIA */}
      {(activeSection === 'all' || activeSection === 'accounts') && bankBalances.length > 0 && (
        <div className="fin-hub-block">
          <div className="fin-block-subhead">
            <span className="fin-block-label">
              <Landmark size={15} /> Saldo por Conta Bancária
            </span>
            <button
              type="button"
              className="btn-link-subtle"
              onClick={() => onNavigatePlanning?.('accounts')}
            >
              Adicionar / editar contas <ArrowRight size={13} />
            </button>
          </div>

          <div className="fin-accounts-grid">
            {bankBalances.map((acc) => (
              <article key={acc.id} className="fin-bank-card">
                <div className="fin-bank-top">
                  <div className="fin-acc-identity">
                    <BankLogoBadge
                      logoId={acc.logo}
                      accountName={acc.name}
                      kind={acc.kind}
                      size={34}
                    />
                    <div className="fin-acc-meta">
                      <strong>{acc.name}</strong>
                      <small>{acc.kind === 'card' ? 'Cartão de Débito' : 'Conta Corrente / Digital'}</small>
                    </div>
                  </div>
                  {onFilterAccount && (
                    <button
                      type="button"
                      className="icon-btn fin-filter-acc-btn"
                      onClick={() => onFilterAccount(acc.id)}
                      title={`Ver extrato de ${acc.name}`}
                    >
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>

                <div className="fin-bank-balances">
                  <div className="fin-bal-main">
                    <span>Saldo acumulado</span>
                    <strong className={acc.accumulatedBalance < 0 ? 'neg' : 'pos'}>
                      <Money value={acc.accumulatedBalance} />
                    </strong>
                  </div>
                  <div className="fin-bal-month">
                    <span>Movimento no mês</span>
                    <strong className={acc.monthNet < 0 ? 'neg' : ''}>
                      <Money value={acc.monthNet} prefix={acc.monthNet > 0 ? '+ ' : ''} />
                    </strong>
                  </div>
                </div>

                <div className="fin-bank-flows">
                  <span className="flow-pill pos">
                    <ArrowUpRight size={12} /> <Money value={acc.monthIncomes} />
                  </span>
                  <span className="flow-pill neg">
                    <ArrowDownRight size={12} /> <Money value={acc.monthExpenses} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 3. PATRIMÔNIO TOTAL & RESUMO ANUAL */}
      {(activeSection === 'all' || activeSection === 'wealth') && (
        <div className="fin-hub-block">
          <div className="fin-block-subhead">
            <span className="fin-block-label">
              <Sparkles size={15} /> Evolução Patrimonial & Resumo de {selectedYear}
            </span>
            <button
              type="button"
              className="btn-link-subtle"
              onClick={() => onNavigatePlanning?.('savings')}
            >
              Ver Caixinhas de Reserva ({savingsBoxesCount}) <ArrowRight size={13} />
            </button>
          </div>

          <div className="fin-wealth-grid">
            <article className="fin-wealth-card primary">
              <div className="fin-wealth-icon">
                <Wallet size={20} />
              </div>
              <div className="fin-wealth-info">
                <span>Patrimônio Total Consolidado</span>
                <strong><Money value={annualSummary.totalNetWorth} /></strong>
                <small>
                  Contas (<Money value={annualSummary.totalLiquidBalance} />) + Caixinhas (<Money value={annualSummary.savingsTotal} />)
                </small>
              </div>
            </article>

            <article className="fin-wealth-card">
              <div className="fin-wealth-icon savings">
                <PiggyBank size={20} />
              </div>
              <div className="fin-wealth-info">
                <span>Guardado em Caixinhas</span>
                <strong className="pos"><Money value={annualSummary.savingsTotal} /></strong>
                <small>{savingsBoxesCount} {savingsBoxesCount === 1 ? 'caixinha ativa' : 'caixinhas ativas'}</small>
              </div>
            </article>

            <article className="fin-wealth-card">
              <div className="fin-wealth-icon income">
                <TrendingUp size={20} />
              </div>
              <div className="fin-wealth-info">
                <span>Balanço Acumulado em {selectedYear}</span>
                <strong className={annualSummary.yearNet >= 0 ? 'pos' : 'neg'}>
                  <Money value={annualSummary.yearNet} />
                </strong>
                <small>
                  Entradas: <Money value={annualSummary.yearIncome} /> • Saídas: <Money value={annualSummary.yearExpense} />
                </small>
              </div>
            </article>

            <article className="fin-wealth-card">
              <div className="fin-wealth-icon neutral">
                <Calendar size={20} />
              </div>
              <div className="fin-wealth-info">
                <span>Média Mensal de Gastos ({selectedYear})</span>
                <strong><Money value={annualSummary.avgMonthlyExpense} /></strong>
                <small>Cálculo automático sobre meses movimentados</small>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
