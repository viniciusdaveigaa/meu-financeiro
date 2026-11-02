import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  Layers,
  Minus,
  Plus,
  Repeat,
  Tag,
  Trash2,
  X
} from 'lucide-react'
import {
  amountToInput,
  calculateInvoiceMonth,
  changeMonth,
  dateInMonth,
  formatAmountInput,
  formatMoney,
  formatMonthName,
  inputToAmount,
  localISODate
} from '../utils/formatters'
import { colorPalette, iconCatalog } from '../constants/categories'
import { useCategories } from '../context/CategoryContext'
import { useAppDialog } from './Dialog'
import { BankLogoBadge } from './ui'

export function TransactionModal({
  entry,
  accounts,
  advancedReady,
  month,
  onClose,
  onSave,
  onDelete
}) {
  const dialog = useAppDialog()
  const { categories, getMeta, addCategory } = useCategories()

  const editing = Boolean(entry?.id)
  const isDuplicate = Boolean(entry?._isDuplicate)
  const hasPrefill = Boolean(entry && (entry.id || entry._isDuplicate || entry.type))
  const today = localISODate()
  const defaultInitialDate = (() => {
    if (entry?.date && !entry?._isDuplicate) return entry.date
    if (month && month !== today.slice(0, 7)) {
      const todayDay = new Date().getDate()
      return dateInMonth(month, todayDay)
    }
    return today
  })()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = localISODate(yesterdayDate)

  const [draft, setDraft] = useState(() => {
    if (hasPrefill) {
      const existingAccount = accounts.find((a) => a.id === entry.account_id)
      const defaultMethod =
        entry.payment_method ||
        (existingAccount?.kind === 'card' && existingAccount?.card_type !== 'debit'
          ? 'credit'
          : 'debit')
      const isCredit =
        entry.type === 'expense' &&
        existingAccount?.kind === 'card' &&
        defaultMethod === 'credit'
      const entryDate = entry._isDuplicate ? defaultInitialDate : (entry.date || defaultInitialDate)
      return {
        type: entry.type || 'expense',
        description: entry.description || (entry.type === 'transfer' ? 'Transferência entre contas' : ''),
        category: entry.category || categories[0] || 'Alimentacao',
        date: entryDate,
        ...entry,
        id: entry._isDuplicate ? undefined : entry.id,
        installment_group_id: entry._isDuplicate ? undefined : entry.installment_group_id,
        account_id: entry.account_id || '',
        to_account_id: entry.to_account_id || '',
        payment_method: defaultMethod,
        invoice_month: isCredit
          ? entry._isDuplicate
            ? calculateInvoiceMonth(entryDate, existingAccount?.closing_day)
            : entry.invoice_month || null
          : null,
        amount: entry.amount ? amountToInput(entry.amount) : '',
        installment: !entry._isDuplicate && Number(entry.installment_total) > 1,
        installments:
          !entry._isDuplicate && Number(entry.installment_total) > 1
            ? Number(entry.installment_total)
            : 2,
        installment_scope: 'single', // 'single' | 'all'
        start_month: entryDate.slice(0, 7),
        is_paid: entry.is_paid !== false,
        recurring: false
      }
    }
    return {
      type: 'expense',
      description: '',
      amount: '',
      category: categories[0] || 'Alimentacao',
      date: defaultInitialDate,
      account_id: '',
      to_account_id: '',
      payment_method: 'debit',
      invoice_month: null,
      installment: false,
      installments: 2,
      installment_scope: 'single',
      start_month: defaultInitialDate.slice(0, 7),
      is_paid: true,
      recurring: false
    }
  })

  const [saving, setSaving] = useState(false)
  const [showQuickAddCat, setShowQuickAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('Tag')
  const [newCatColor, setNewCatColor] = useState(colorPalette[0])

  const set = (patch) => setDraft((current) => ({ ...current, ...patch }))

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const amountValue = inputToAmount(draft.amount)
  const installments = Math.min(Math.max(Number(draft.installments) || 2, 2), 48)
  const lockedInstallment = Boolean(draft.installment_group_id)

  const handleQuickAddCat = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    const result = await addCategory({
      name: newCatName.trim(),
      iconName: newCatIcon,
      color: newCatColor.color,
      bg: newCatColor.bg
    })

    if (result?.error) {
      dialog.alert(result.error, { title: 'Atenção' })
      return
    }

    set({ category: newCatName.trim() })
    setNewCatName('')
    setShowQuickAddCat(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!(amountValue > 0)) {
      return dialog.alert('Informe um valor maior que zero.', { title: 'Valor inválido' })
    }

    if (draft.type === 'transfer') {
      if (!draft.account_id || !draft.to_account_id) {
        return dialog.alert('Selecione a conta de origem e a conta de destino para realizar a transferência.', {
          title: 'Contas obrigatórias'
        })
      }
      if (draft.account_id === draft.to_account_id) {
        return dialog.alert('A conta de destino deve ser diferente da conta de origem.', {
          title: 'Contas iguais'
        })
      }
      setSaving(true)
      try {
        await onSave({
          ...draft,
          description: draft.description.trim() || 'Transferência entre contas',
          amount: amountValue,
          category: 'Transferencia',
          payment_method: 'transfer',
          invoice_month: null,
          installment: false,
          installments: 1,
          is_paid: true
        })
      } finally {
        setSaving(false)
      }
      return
    }

    if (!draft.description.trim()) {
      return dialog.alert('Informe uma descrição para o lançamento.', { title: 'Descrição obrigatória' })
    }
    if (lockedInstallment && draft.recurring) {
      return dialog.alert('Uma parcela existente não pode ser transformada em recorrência.', {
        title: 'Ação não permitida'
      })
    }
    const selAccount = accounts?.find((a) => a.id === draft.account_id)
    const isCredit = draft.type === 'expense' && selAccount?.kind === 'card' && draft.payment_method !== 'debit'
    const computedInvMonth = isCredit
      ? (draft.invoice_month || calculateInvoiceMonth(draft.date, selAccount?.closing_day))
      : null

    setSaving(true)
    try {
      await onSave({
        ...draft,
        description: draft.description.trim(),
        amount: amountValue,
        payment_method: isCredit ? 'credit' : (draft.payment_method || 'debit'),
        invoice_month: computedInvMonth,
        installments: draft.installment ? installments : 1
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="tx-modal-title">
        <span className="sheet-handle" aria-hidden="true" />
        <header className="modal-head">
          <div>
            <span className="eyebrow">
              {editing ? 'Editar lançamento' : isDuplicate ? 'Duplicar lançamento' : 'Novo lançamento'}
            </span>
            <h2 id="tx-modal-title">
              {editing
                ? 'Atualizar movimentação'
                : isDuplicate
                ? 'Confirmar cópia do lançamento'
                : 'Registrar movimentação'}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            disabled={saving}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submit} className="modal-body tx-modal-form">
          <div className="tx-modal-layout">
            {/* Coluna Esquerda: Tipo, Valor, Descrição, Data, Conta */}
            <div className="tx-col-main">
              <div
                className={`type-switch ${!editing && accounts?.length >= 2 ? 'three-tabs' : ''}`}
                role="radiogroup"
                aria-label="Tipo"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.type === 'expense'}
                  className={`expense ${draft.type === 'expense' ? 'active' : ''}`}
                  onClick={() => {
                    const selAccount = accounts?.find((a) => a.id === draft.account_id)
                    const isCredit = selAccount?.kind === 'card' && draft.payment_method === 'credit'
                    const newInvMonth = isCredit ? calculateInvoiceMonth(draft.date, selAccount?.closing_day) : null
                    set({ type: 'expense', invoice_month: newInvMonth })
                  }}
                >
                  <ArrowDownRight size={17} /> Saída
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.type === 'income'}
                  className={`income ${draft.type === 'income' ? 'active' : ''}`}
                  onClick={() => set({ type: 'income', installment: false, installments: 1, invoice_month: null, payment_method: 'debit' })}
                >
                  <ArrowUpRight size={17} /> Entrada
                </button>
                {!editing && accounts?.length >= 2 && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={draft.type === 'transfer'}
                    className={`transfer ${draft.type === 'transfer' ? 'active' : ''}`}
                    onClick={() =>
                      set({
                        type: 'transfer',
                        description: draft.description || 'Transferência entre contas',
                        installment: false,
                        installments: 1,
                        invoice_month: null,
                        payment_method: 'transfer',
                        recurring: false
                      })
                    }
                  >
                    <ArrowLeftRight size={16} /> Transferir
                  </button>
                )}
              </div>

              <label className={`amount-field ${draft.type}`}>
                <span className="amount-caption">
                  Valor{draft.installment ? ' de cada parcela' : draft.type === 'transfer' ? ' da transferência' : ''}
                </span>
                <span className="amount-input">
                  <em>R$</em>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0,00"
                    value={draft.amount}
                    onChange={(event) => set({ amount: formatAmountInput(event.target.value) })}
                    autoFocus={!editing}
                    disabled={saving}
                    aria-label="Valor em reais"
                  />
                </span>
              </label>

              <label className="field">
                <span>Descrição</span>
                <input
                  type="text"
                  placeholder={draft.type === 'transfer' ? 'Ex.: Transferência PIX para reserva' : 'Ex.: Mercado, Salário, Internet'}
                  value={draft.description}
                  onChange={(event) => set({ description: event.target.value })}
                  maxLength={120}
                  disabled={saving}
                  required={draft.type !== 'transfer'}
                />
              </label>

              <div className="field">
                <span>Data</span>
                <div className="date-input-group">
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) => {
                      const newDate = event.target.value
                      const selAccount = accounts?.find((a) => a.id === draft.account_id)
                      const isCredit = draft.type === 'expense' && selAccount?.kind === 'card' && draft.payment_method === 'credit'
                      const newInvMonth = isCredit ? calculateInvoiceMonth(newDate, selAccount?.closing_day) : null
                      set({
                        date: newDate,
                        invoice_month: newInvMonth,
                        start_month: newDate ? newDate.slice(0, 7) : draft.start_month
                      })
                    }}
                    disabled={saving}
                    required
                  />
                  <div className="date-shortcuts">
                    <button
                      type="button"
                      className={`chip ${draft.date === today ? 'active' : ''}`}
                      onClick={() => {
                        const selAccount = accounts?.find((a) => a.id === draft.account_id)
                        const isCredit = draft.type === 'expense' && selAccount?.kind === 'card' && draft.payment_method === 'credit'
                        const newInvMonth = isCredit ? calculateInvoiceMonth(today, selAccount?.closing_day) : null
                        set({ date: today, invoice_month: newInvMonth, start_month: today.slice(0, 7) })
                      }}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      className={`chip ${draft.date === yesterday ? 'active' : ''}`}
                      onClick={() => {
                        const selAccount = accounts?.find((a) => a.id === draft.account_id)
                        const isCredit = draft.type === 'expense' && selAccount?.kind === 'card' && draft.payment_method === 'credit'
                        const newInvMonth = isCredit ? calculateInvoiceMonth(yesterday, selAccount?.closing_day) : null
                        set({ date: yesterday, invoice_month: newInvMonth, start_month: yesterday.slice(0, 7) })
                      }}
                    >
                      Ontem
                    </button>
                  </div>
                </div>
              </div>

              {advancedReady && draft.type === 'transfer' && (
                <div className="transfer-accounts-selector">
                  <div className="field">
                    <span>Conta de Origem (De onde sai)</span>
                    <select
                      value={draft.account_id}
                      onChange={(e) => set({ account_id: e.target.value })}
                      disabled={saving}
                      required
                    >
                      <option value="">Selecione a conta de origem</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} · {acc.kind === 'card' ? 'Cartão' : 'Conta'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <span>Conta de Destino (Para onde vai)</span>
                    <select
                      value={draft.to_account_id}
                      onChange={(e) => set({ to_account_id: e.target.value })}
                      disabled={saving}
                      required
                    >
                      <option value="">Selecione a conta de destino</option>
                      {accounts
                        .filter((acc) => acc.id !== draft.account_id)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} · {acc.kind === 'card' ? 'Cartão' : 'Conta'}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {advancedReady && draft.type !== 'transfer' && (() => {
                const selectedAccount = accounts?.find((a) => a.id === draft.account_id)
                return (
                  <div className="field">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {selectedAccount && (
                        <BankLogoBadge
                          logoId={selectedAccount.logo}
                          accountName={selectedAccount.name}
                          kind={selectedAccount.kind}
                          size={24}
                        />
                      )}
                      Conta ou cartão
                    </span>
                    <select
                      value={draft.account_id}
                      onChange={(event) => {
                        const newAccountId = event.target.value
                        const selAccount = accounts?.find((a) => a.id === newAccountId)
                        if (selAccount?.kind === 'card') {
                          const isCredit = draft.type === 'expense' && selAccount.card_type !== 'debit'
                          const newInvMonth = isCredit ? calculateInvoiceMonth(draft.date, selAccount.closing_day) : null
                          set({
                            account_id: newAccountId,
                            payment_method: isCredit ? 'credit' : 'debit',
                            invoice_month: newInvMonth
                          })
                        } else {
                          set({
                            account_id: newAccountId,
                            payment_method: 'debit',
                            invoice_month: null
                          })
                        }
                      }}
                      disabled={saving}
                    >
                      <option value="">Sem conta definida</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} · {account.kind === 'card' ? (account.card_type === 'debit' ? 'Cartão de Débito' : 'Cartão de Crédito') : 'Conta'}
                        </option>
                      ))}
                    </select>

                    {selectedAccount?.kind === 'card' && draft.type === 'expense' && (
                      <div className="card-purchase-control-card">
                        <span className="control-label-micro">Tipo de compra no cartão:</span>
                        <div className="card-btn-pills">
                          <button
                            type="button"
                            className={`card-pill-btn ${draft.payment_method !== 'debit' ? 'active' : ''}`}
                            onClick={() => {
                              const invMonth = calculateInvoiceMonth(draft.date, selectedAccount.closing_day)
                              set({ payment_method: 'credit', invoice_month: invMonth })
                            }}
                          >
                            <CreditCard size={14} /> Compra no Crédito
                          </button>
                          <button
                            type="button"
                            className={`card-pill-btn ${draft.payment_method === 'debit' ? 'active' : ''}`}
                            onClick={() => {
                              set({ payment_method: 'debit', invoice_month: null })
                            }}
                          >
                            <Landmark size={14} /> Compra no Débito
                          </button>
                        </div>

                        {draft.payment_method !== 'debit' ? (
                          <div className="credit-invoice-info-pill">
                            <div className="invoice-header-line">
                              <Calendar size={13} />
                              <span>Fatura de <strong>{formatMonthName(draft.invoice_month || calculateInvoiceMonth(draft.date, selectedAccount.closing_day))}</strong></span>
                            </div>
                            <small>
                              {selectedAccount.closing_day
                                ? `Fechamento dia ${selectedAccount.closing_day}${selectedAccount.due_day ? ` • Vencimento dia ${selectedAccount.due_day}` : ''}. Entra nas saídas e na fatura do mês.`
                                : 'Lançado na fatura em aberto.'}
                            </small>
                            {!selectedAccount.closing_day && (
                              <div className="credit-invoice-warning-text">
                                <AlertTriangle size={12} />
                                <span>Cartão sem data de fechamento configurada nas Contas. Adicione as datas para organizar suas faturas automaticamente.</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <small className="debit-info-hint-text">
                            Descontará imediatamente do saldo da conta bancária.
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Status Pago / Pendente */}
              {draft.type !== 'transfer' && (
                <div className="field">
                  <span>Situação do lançamento</span>
                  <div className="paid-status-toggle" role="radiogroup" aria-label="Situação de pagamento">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={draft.is_paid !== false}
                      className={`paid-toggle-btn is-paid ${draft.is_paid !== false ? 'active' : ''}`}
                      onClick={() => set({ is_paid: true })}
                    >
                      <CheckCircle2 size={15} />
                      <span>{draft.type === 'income' ? 'Recebido' : 'Pago'}</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={draft.is_paid === false}
                      className={`paid-toggle-btn is-pending ${draft.is_paid === false ? 'active' : ''}`}
                      onClick={() => set({ is_paid: false })}
                    >
                      <Clock size={15} />
                      <span>{draft.type === 'income' ? 'Pendente (A receber)' : 'Pendente (A pagar)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita: Categorias e Opções Avançadas */}
            <div className="tx-col-side">
              {draft.type === 'transfer' ? (
                <div className="transfer-preview-panel">
                  <div className="transfer-preview-head">
                    <ArrowLeftRight size={22} />
                    <div>
                      <h4>Transferência Interna entre Contas</h4>
                      <p>
                        O valor será debitado da conta de origem e creditado na conta de destino sem duplicar suas receitas ou despesas gerais do mês.
                      </p>
                    </div>
                  </div>
                  <div className="transfer-route-cards">
                    <div className="transfer-route-box">
                      <small>Sai de</small>
                      <strong>
                        {accounts.find((a) => a.id === draft.account_id)?.name || 'Selecione a origem'}
                      </strong>
                    </div>
                    <ArrowRight size={18} className="transfer-route-arrow" />
                    <div className="transfer-route-box">
                      <small>Entra em</small>
                      <strong>
                        {accounts.find((a) => a.id === draft.to_account_id)?.name || 'Selecione o destino'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Category selection */}
                  <div className="field">
                    <div className="field-label-row">
                      <span>Categoria</span>
                      <button
                        type="button"
                        className="btn-link-action"
                        onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                      >
                        {showQuickAddCat ? '✕ Cancelar' : '+ Nova Categoria'}
                      </button>
                    </div>

                    {/* Quick add category box */}
                    {showQuickAddCat && (
                      <div className="quick-add-cat-box">
                        <input
                          type="text"
                          placeholder="Nome da nova categoria"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          maxLength={30}
                          autoFocus
                        />
                        <div className="quick-cat-pickers">
                          <div>
                            <span className="quick-picker-label">Escolha o ícone ({Object.keys(iconCatalog).length} disponíveis):</span>
                            <div className="quick-icons-row">
                              {Object.entries(iconCatalog).map(([iconKey, item]) => {
                                const IconComp = item.icon
                                return (
                                  <button
                                    type="button"
                                    key={iconKey}
                                    className={`mini-icon-btn ${newCatIcon === iconKey ? 'active' : ''}`}
                                    onClick={() => setNewCatIcon(iconKey)}
                                    title={item.label}
                                  >
                                    <IconComp size={15} />
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="quick-picker-label">Escolha a cor:</span>
                            <div className="quick-colors-row">
                              {colorPalette.map((c) => (
                                <button
                                  type="button"
                                  key={c.color}
                                  className={`mini-color-btn ${newCatColor.color === c.color ? 'active' : ''}`}
                                  style={{ backgroundColor: c.color }}
                                  onClick={() => setNewCatColor(c)}
                                  title={c.name}
                                >
                                  {newCatColor.color === c.color && <Check size={10} color="#fff" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="quick-cat-preview">
                            <span
                              className="quick-cat-preview-badge"
                              style={{ color: newCatColor.color, backgroundColor: newCatColor.bg }}
                            >
                              {(() => {
                                const PreviewIcon = iconCatalog[newCatIcon]?.icon || Tag
                                return <PreviewIcon size={14} />
                              })()}
                              <span>{newCatName.trim() || 'Nova Categoria'}</span>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={handleQuickAddCat}
                          disabled={!newCatName.trim()}
                        >
                          <Plus size={13} /> Criar e Selecionar
                        </button>
                      </div>
                    )}

                    <div className="category-grid" role="radiogroup" aria-label="Categoria">
                      {categories.map((category) => {
                        const meta = getMeta(category)
                        const Icon = meta.icon
                        const selected = draft.category === category
                        return (
                          <button
                            key={category}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={`category-option ${selected ? 'selected' : ''}`}
                            style={{ '--cat-color': meta.color, '--cat-bg': meta.bg }}
                            onClick={() => set({ category })}
                          >
                            <span className="category-option-icon">
                              <Icon size={16} />
                            </span>
                            <span className="category-option-text">{meta.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {advancedReady && (
                    <div className="option-cards">
                      <label
                        className={`option-card ${draft.installment ? 'checked' : ''} ${
                          draft.type !== 'expense' || lockedInstallment ? 'disabled' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={draft.installment}
                          disabled={draft.type !== 'expense' || lockedInstallment}
                          onChange={(event) =>
                            set({
                              installment: event.target.checked,
                              installments: event.target.checked ? 2 : 1,
                              recurring: false
                            })
                          }
                        />
                        <span className="option-icon"><Layers size={17} /></span>
                        <span>
                          <strong>Compra parcelada</strong>
                          <small>Divide nos próximos meses</small>
                        </span>
                      </label>
                      <label
                        className={`option-card ${draft.recurring ? 'checked' : ''} ${
                          lockedInstallment ? 'disabled' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={draft.recurring}
                          disabled={lockedInstallment}
                          onChange={(event) =>
                            set({
                              recurring: event.target.checked,
                              installment: false,
                              installments: 1
                            })
                          }
                        />
                        <span className="option-icon"><Repeat size={17} /></span>
                        <span>
                          <strong>Repetir todo mês</strong>
                          <small>Contas fixas e salário</small>
                        </span>
                      </label>
                    </div>
                  )}

                  {draft.installment && (() => {
                    const purchaseMonth = draft.date ? draft.date.slice(0, 7) : today.slice(0, 7)
                    const nextInvoiceMonth = changeMonth(purchaseMonth, 1)
                    const effectiveStartMonth = draft.start_month || purchaseMonth
                    return (
                      <div className="installment-box-v2">
                        <div className="installment-top-row">
                          <div className="stepper-wrap">
                            <span className="stepper-label">Qtd. de parcelas:</span>
                            <div className="stepper" aria-label="Número de parcelas">
                              <button
                                type="button"
                                onClick={() => set({ installments: Math.max(installments - 1, 1) })}
                                disabled={lockedInstallment || installments <= 1}
                                aria-label="Menos parcelas"
                              >
                                <Minus size={16} />
                              </button>
                              <span><b>{installments}</b>x</span>
                              <button
                                type="button"
                                onClick={() => set({ installments: Math.min(installments + 1, 48) })}
                                disabled={lockedInstallment || installments >= 48}
                                aria-label="Mais parcelas"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="installment-total-block">
                            <span className="total-label">Total da compra</span>
                            <strong className="total-val">
                              {amountValue > 0
                                ? formatMoney(amountValue * installments)
                                : 'R$ 0,00'}
                            </strong>
                          </div>
                        </div>

                        {!lockedInstallment && (
                          <div className="installment-invoice-picker">
                            <span className="invoice-picker-title">
                              Quando vem a 1ª parcela / cobrança?
                            </span>
                            <div className="invoice-pills-row">
                              <button
                                type="button"
                                className={`invoice-pill ${effectiveStartMonth === purchaseMonth ? 'active' : ''}`}
                                onClick={() => set({ start_month: purchaseMonth })}
                              >
                                <Calendar size={13} />
                                <span>Fatura deste mês ({formatMonthName(purchaseMonth)})</span>
                              </button>
                              <button
                                type="button"
                                className={`invoice-pill ${effectiveStartMonth === nextInvoiceMonth ? 'active' : ''}`}
                                onClick={() => set({ start_month: nextInvoiceMonth })}
                              >
                                <Calendar size={13} />
                                <span>Próxima fatura ({formatMonthName(nextInvoiceMonth)})</span>
                              </button>
                            </div>
                            <p className="invoice-hint-text">
                              {effectiveStartMonth === nextInvoiceMonth
                                ? `A 1ª parcela virá em ${formatMonthName(nextInvoiceMonth)}, e as demais nos meses seguintes.`
                                : `A 1ª parcela virá ainda este mês (${formatMonthName(purchaseMonth)}). Se a fatura atual já fechou, clique em "Próxima fatura".`}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {lockedInstallment && (
                    <div className="installment-scope-box">
                      <span className="scope-box-title">
                        <Layers size={14} /> Compra parcelada ({draft.installment_number}/{draft.installment_total}) — Onde aplicar alterações?
                      </span>
                      <div className="scope-pills-row">
                        <button
                          type="button"
                          className={`invoice-pill ${draft.installment_scope !== 'all' ? 'active' : ''}`}
                          onClick={() => set({ installment_scope: 'single' })}
                        >
                          <span>Somente nesta parcela ({draft.installment_number}/{draft.installment_total})</span>
                        </button>
                        <button
                          type="button"
                          className={`invoice-pill ${draft.installment_scope === 'all' ? 'active' : ''}`}
                          onClick={() => set({ installment_scope: 'all' })}
                        >
                          <span>Em todas as {draft.installment_total} parcelas</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <footer className="modal-foot">
            {editing && onDelete && (
              <button
                type="button"
                className="btn btn-ghost-danger"
                disabled={saving}
                onClick={() => onDelete(entry)}
              >
                <Trash2 size={16} /> Excluir
              </button>
            )}
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar lançamento'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
