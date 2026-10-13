import { useState, useEffect, useRef } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CreditCard,
  Info,
  Landmark,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  Trash2,
  X
} from 'lucide-react'
import { supabase } from '../supabase'
import {
  amountToInput,
  changeMonth,
  dateInMonth,
  formatAmountInput,
  inputToAmount
} from '../utils/formatters'
import { getCategoryLabel } from '../constants/categories'
import {
  BANK_LOGOS,
  getSavedAccountLogos,
  saveAccountLogo,
  removeAccountLogo,
  resolveBankLogo
} from '../constants/bankLogos'
import { useCategories } from '../context/CategoryContext'
import { useAppDialog } from './Dialog'
import { BankLogoBadge, CategoryIcon, Money } from './ui'

export function AdvancedPanel({
  month,
  userId,
  initialAccounts = [],
  initialRecurring = []
}) {
  const dialog = useAppDialog()
  const { categories, getMeta } = useCategories()
  const [accounts, setAccounts] = useState(() => initialAccounts || [])
  const [recurring, setRecurring] = useState(() => initialRecurring || [])
  const [loading, setLoading] = useState(
    () => (!initialAccounts || initialAccounts.length === 0) && (!initialRecurring || initialRecurring.length === 0)
  )
  const [name, setName] = useState('')
  const [kind, setKind] = useState('account')
  const [cardType, setCardType] = useState('credit')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [logo, setLogo] = useState('')
  const [ready, setReady] = useState(true)
  const [addingAccount, setAddingAccount] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [savingRecurring, setSavingRecurring] = useState(false)
  const generatingRef = useRef(false)

  // Sincroniza estado se o componente pai repassar novos dados atualizados
  useEffect(() => {
    if (initialAccounts && initialAccounts.length > 0) {
      setAccounts(initialAccounts)
      setLoading(false)
    }
  }, [initialAccounts])

  useEffect(() => {
    if (initialRecurring && initialRecurring.length > 0) {
      setRecurring(initialRecurring)
      setLoading(false)
    }
  }, [initialRecurring])

  const load = async (isBackground = false) => {
    try {
      if (!isBackground && accounts.length === 0 && recurring.length === 0) {
        setLoading(true)
      }
      const currentUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id || 'default'

      const [accountResult, recurringResult] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at'),
        supabase
          .from('recurring_transactions')
          .select('*')
          .order('created_at', { ascending: false })
      ])

      if (accountResult.error || recurringResult.error) {
        setReady(false)
        return
      }

      setReady(true)
      const localLogos = getSavedAccountLogos(currentUserId)
      const accountsWithLogos = (accountResult.data || []).map((acc) => ({
        ...acc,
        logo: acc.logo || localLogos[acc.id] || resolveBankLogo('', acc.name, acc.kind).id
      }))
      setAccounts(accountsWithLogos)
      setRecurring(recurringResult.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const hasInitial = (initialAccounts && initialAccounts.length > 0) || (initialRecurring && initialRecurring.length > 0)
    load(hasInitial)
  }, [])

  useEffect(() => {
    const refresh = () => load()
    window.addEventListener('recurring-data-changed', refresh)
    window.addEventListener('account-logos-changed', refresh)
    return () => {
      window.removeEventListener('recurring-data-changed', refresh)
      window.removeEventListener('account-logos-changed', refresh)
    }
  }, [])

  // Auto-generate recurring transactions up to current selected month (em lote rápido)
  useEffect(() => {
    const run = async () => {
      const targetMonth = `${month}-01`
      const due = recurring.filter(
        (item) =>
          item.active &&
          item.start_date <= targetMonth &&
          (!item.last_generated_month || item.last_generated_month < targetMonth)
      )

      if (!due.length || generatingRef.current) return
      generatingRef.current = true
      let generated = false
      let generationFailed = false

      try {
        const allRows = []
        const itemIdsToUpdate = []

        for (const item of due) {
          const lastMonth = (
            item.last_generated_month || `${item.start_date.slice(0, 7)}-01`
          ).slice(0, 7)
          let cursor = changeMonth(lastMonth, 1)

          while (cursor <= month) {
            allRows.push({
              user_id: item.user_id,
              account_id: item.account_id,
              type: item.type,
              description: item.description,
              amount: item.amount,
              category: item.category,
              date: dateInMonth(cursor, item.day_of_month)
            })
            cursor = changeMonth(cursor, 1)
          }
          itemIdsToUpdate.push(item.id)
        }

        if (allRows.length > 0) {
          const { error: insertErr } = await supabase.from('transactions').insert(allRows)
          if (!insertErr) {
            await Promise.all(
              itemIdsToUpdate.map((id) =>
                supabase
                  .from('recurring_transactions')
                  .update({ last_generated_month: targetMonth })
                  .eq('id', id)
              )
            )
            generated = true
          } else {
            generationFailed = true
          }
        }

        if (generated) {
          window.dispatchEvent(new Event('finance-data-changed'))
          await load()
        }
        if (generationFailed) {
          await dialog.alert(
            'Alguns lançamentos recorrentes não puderam ser gerados. Tente recarregar o painel.',
            { title: 'Recorrências incompletas' }
          )
        }
      } finally {
        generatingRef.current = false
      }
    }

    run()
  }, [recurring, month])

  const addAccount = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setAddingAccount(true)
    const currentUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id || 'default'
    const cleanName = name.trim()

    const payload = {
      name: cleanName,
      kind,
      card_type: kind === 'card' ? (cardType || 'credit') : null,
      closing_day: kind === 'card' && cardType !== 'debit' && closingDay ? Math.min(31, Math.max(1, parseInt(closingDay, 10))) : null,
      due_day: kind === 'card' && cardType !== 'debit' && dueDay ? Math.min(31, Math.max(1, parseInt(dueDay, 10))) : null,
      user_id: currentUserId
    }

    let insertRes = await supabase
      .from('accounts')
      .insert({ ...payload, logo: logo || null })
      .select()

    if (insertRes.error) {
      insertRes = await supabase
        .from('accounts')
        .insert({ name: cleanName, kind, user_id: currentUserId, logo: logo || null })
        .select()
    }

    setAddingAccount(false)
    if (insertRes.error) {
      return dialog.alert(insertRes.error.message, { title: 'Falha ao cadastrar conta' })
    }

    const created = insertRes.data?.[0]
    const chosenLogo = logo || resolveBankLogo('', cleanName, kind).id
    if (created?.id) {
      saveAccountLogo(currentUserId, created.id, chosenLogo)
    }

    setName('')
    setLogo('')
    setCardType('credit')
    setClosingDay('')
    setDueDay('')
    window.dispatchEvent(new Event('finance-data-changed'))
    window.dispatchEvent(new Event('account-logos-changed'))
    load()
  }

  const updateAccount = async (e) => {
    e.preventDefault()
    if (!editingAccount || !editingAccount.name.trim()) return

    setSavingEdit(true)
    const currentUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id || 'default'
    const cleanName = editingAccount.name.trim()

    const cardTypeVal = editingAccount.kind === 'card' ? (editingAccount.card_type || 'credit') : null
    const closingVal = editingAccount.kind === 'card' && cardTypeVal !== 'debit' && editingAccount.closing_day ? Math.min(31, Math.max(1, parseInt(editingAccount.closing_day, 10))) : null
    const dueVal = editingAccount.kind === 'card' && cardTypeVal !== 'debit' && editingAccount.due_day ? Math.min(31, Math.max(1, parseInt(editingAccount.due_day, 10))) : null

    let updateRes = await supabase
      .from('accounts')
      .update({
        name: cleanName,
        kind: editingAccount.kind,
        card_type: cardTypeVal,
        closing_day: closingVal,
        due_day: dueVal,
        logo: editingAccount.logo || null
      })
      .eq('id', editingAccount.id)

    if (updateRes.error) {
      updateRes = await supabase
        .from('accounts')
        .update({
          name: cleanName,
          kind: editingAccount.kind
        })
        .eq('id', editingAccount.id)
    }

    setSavingEdit(false)
    if (updateRes.error) {
      return dialog.alert(updateRes.error.message, { title: 'Falha ao atualizar conta' })
    }

    const chosenLogo = editingAccount.logo || resolveBankLogo('', cleanName, editingAccount.kind).id
    saveAccountLogo(currentUserId, editingAccount.id, chosenLogo)

    setEditingAccount(null)
    window.dispatchEvent(new Event('finance-data-changed'))
    window.dispatchEvent(new Event('account-logos-changed'))
    load()
  }

  const removeAccount = async (id, accName) => {
    const confirmed = await dialog.confirm(
      `A conta/cartão “${accName}” será removido, mas os lançamentos vinculados a ela continuarão no seu histórico.`,
      { title: 'Excluir conta ou cartão?', confirmLabel: 'Sim, excluir' }
    )
    if (!confirmed) return

    const currentUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id || 'default'

    // Otimista: remove da tela instantaneamente
    setAccounts((prev) => prev.filter((a) => a.id !== id))

    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) {
      load() // reverte se falhar
      return dialog.alert(error.message, { title: 'Conta não excluída' })
    }

    removeAccountLogo(currentUserId, id)
    window.dispatchEvent(new Event('finance-data-changed'))
    window.dispatchEvent(new Event('account-logos-changed'))
  }

  const toggleRecurring = async (item) => {
    // Otimista: atualiza o switch imediatamente
    setRecurring((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, active: !r.active } : r))
    )

    const { error } = await supabase
      .from('recurring_transactions')
      .update({ active: !item.active })
      .eq('id', item.id)

    if (error) {
      load() // reverte
      return dialog.alert(error.message, { title: 'Falha ao atualizar recorrência' })
    }
  }

  const saveRecurringAdjustment = async (updatedDraft) => {
    const amountVal = inputToAmount(updatedDraft.amount)
    if (!amountVal || amountVal <= 0) {
      return dialog.alert('Informe um valor válido maior que zero.', { title: 'Valor inválido' })
    }
    const day = Math.min(31, Math.max(1, parseInt(updatedDraft.day_of_month, 10) || 1))

    setSavingRecurring(true)
    const { error } = await supabase
      .from('recurring_transactions')
      .update({
        type: updatedDraft.type,
        description: updatedDraft.description.trim(),
        amount: amountVal,
        category: updatedDraft.category,
        day_of_month: day,
        account_id: updatedDraft.account_id || null
      })
      .eq('id', updatedDraft.id)

    setSavingRecurring(false)

    if (error) {
      return dialog.alert(error.message, { title: 'Falha ao atualizar recorrência' })
    }

    setEditingRecurring(null)
    window.dispatchEvent(new Event('recurring-data-changed'))
    window.dispatchEvent(new Event('finance-data-changed'))
    await load()
  }

  const removeRecurring = async (item) => {
    const confirmed = await dialog.confirm(
      `A repetição mensal de “${item.description}” será cancelada. Lançamentos já gerados nos meses anteriores serão mantidos.`,
      { title: 'Excluir recorrência?', confirmLabel: 'Sim, cancelar' }
    )
    if (!confirmed) return

    // Otimista: remove da tela instantaneamente
    setRecurring((prev) => prev.filter((r) => r.id !== item.id))

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', item.id)

    if (error) {
      load() // reverte
      return dialog.alert(error.message, { title: 'Recorrência não excluída' })
    }
  }

  if (!ready) {
    return (
      <article className="card">
        <header className="card-head">
          <div>
            <span className="eyebrow">Configurações</span>
            <h3 className="card-title">Contas e Recorrências</h3>
          </div>
        </header>
        <div className="empty-state">
          <span className="empty-icon"><Info size={22} /></span>
          <h4>Recurso não configurado</h4>
          <p>Execute a migração <code>002_daily_control.sql</code> para ativar contas, cartões e recorrências.</p>
        </div>
      </article>
    )
  }

  return (
    <article className="card advanced-card">
      <header className="card-head">
        <div>
          <span className="eyebrow">Gestão Diária</span>
          <h3 className="card-title">Contas, Cartões e Recorrências</h3>
        </div>
      </header>

      <div className="advanced-split-grid">
        {/* Left: Accounts & Cards */}
        <section className="advanced-subcol">
          <div className="subcol-head">
            <div>
              <h4 className="subcol-title">Contas e Cartões</h4>
              <p className="subcol-desc">Vincule suas compras e pagamentos a cada fonte.</p>
            </div>
          </div>

          <div className="accounts-list">
            {accounts.map((acc) => {
              const isEditing = editingAccount?.id === acc.id

              if (isEditing) {
                return (
                  <form key={acc.id} onSubmit={updateAccount} className="account-edit-row">
                    <input
                      type="text"
                      required
                      value={editingAccount.name}
                      onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                      placeholder="Nome da conta"
                      disabled={savingEdit}
                      autoFocus
                    />
                    <select
                      value={editingAccount.kind}
                      onChange={(e) => setEditingAccount({ ...editingAccount, kind: e.target.value })}
                      disabled={savingEdit}
                    >
                      <option value="account">Conta</option>
                      <option value="card">Cartão</option>
                    </select>

                    {editingAccount.kind === 'card' && (
                      <select
                        value={editingAccount.card_type || 'credit'}
                        onChange={(e) => setEditingAccount({ ...editingAccount, card_type: e.target.value })}
                        disabled={savingEdit}
                        title="Tipo do cartão"
                      >
                        <option value="credit">Crédito</option>
                        <option value="debit">Débito</option>
                      </select>
                    )}

                    {editingAccount.kind === 'card' && editingAccount.card_type !== 'debit' && (
                      <>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Dia fecha"
                          title="Dia de fechamento da fatura (1 a 31)"
                          style={{ width: '85px' }}
                          value={editingAccount.closing_day || ''}
                          onChange={(e) => setEditingAccount({ ...editingAccount, closing_day: e.target.value })}
                          disabled={savingEdit}
                        />
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Dia vence"
                          title="Dia de vencimento da fatura (1 a 31)"
                          style={{ width: '85px' }}
                          value={editingAccount.due_day || ''}
                          onChange={(e) => setEditingAccount({ ...editingAccount, due_day: e.target.value })}
                          disabled={savingEdit}
                        />
                      </>
                    )}

                    <select
                      value={editingAccount.logo || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, logo: e.target.value })}
                      disabled={savingEdit}
                      className="account-logo-select"
                      title="Escolha o logotipo da instituição"
                    >
                      <option value="">Logo: Automático</option>
                      {BANK_LOGOS.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    <div className="acc-actions-group">
                      <button
                        type="submit"
                        className="btn btn-primary btn-xs"
                        disabled={savingEdit || !editingAccount.name.trim()}
                        title="Salvar alterações"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => setEditingAccount(null)}
                        disabled={savingEdit}
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                )
              }

              return (
                <div key={acc.id} className="account-row-item">
                  <BankLogoBadge
                    logoId={acc.logo}
                    accountName={acc.name}
                    kind={acc.kind}
                    size={36}
                  />
                  <div className="acc-info">
                    <strong>{acc.name}</strong>
                    <div className="acc-meta-tags">
                      {acc.kind === 'card' ? (
                        <>
                          <span className={`badge-pill ${acc.card_type === 'debit' ? 'badge-debit' : 'badge-credit'}`}>
                            {acc.card_type === 'debit' ? 'Cartão de Débito' : 'Cartão de Crédito'}
                          </span>
                          {acc.card_type !== 'debit' && (acc.closing_day || acc.due_day) && (
                            <small className="acc-dates-text">
                              {acc.closing_day ? `Fecha dia ${acc.closing_day}` : ''}
                              {acc.closing_day && acc.due_day ? ' • ' : ''}
                              {acc.due_day ? `Vence dia ${acc.due_day}` : ''}
                            </small>
                          )}
                        </>
                      ) : (
                        <small>Conta corrente / Carteira</small>
                      )}
                    </div>
                  </div>
                  <div className="acc-actions-group">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setEditingAccount({ ...acc })}
                      aria-label={`Editar ${acc.name}`}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => removeAccount(acc.id, acc.name)}
                      aria-label={`Excluir ${acc.name}`}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}

            {loading && accounts.length === 0 && (
              <p className="text-empty-hint">Carregando contas...</p>
            )}
            {!loading && accounts.length === 0 && (
              <p className="text-empty-hint">Nenhuma conta ou cartão cadastrado.</p>
            )}
          </div>

          <form onSubmit={addAccount} className="inline-add-form">
            <input
              type="text"
              required
              placeholder="Nome (ex: Cartão Principal, Banco Digital)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={addingAccount}
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              disabled={addingAccount}
            >
              <option value="account">Conta</option>
              <option value="card">Cartão</option>
            </select>
            {kind === 'card' && (
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                disabled={addingAccount}
                title="Tipo do cartão"
              >
                <option value="credit">Crédito</option>
                <option value="debit">Débito</option>
              </select>
            )}
            {kind === 'card' && cardType === 'credit' && (
              <>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Dia fecha"
                  title="Dia de fechamento da fatura (1 a 31)"
                  style={{ width: '90px' }}
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  disabled={addingAccount}
                />
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Dia vence"
                  title="Dia de vencimento da fatura (1 a 31)"
                  style={{ width: '90px' }}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  disabled={addingAccount}
                />
              </>
            )}
            <select
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              disabled={addingAccount}
              className="account-logo-select"
              title="Escolha o logotipo da instituição"
            >
              <option value="">Logo: Automático</option>
              {BANK_LOGOS.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              disabled={addingAccount}
            >
              <Plus size={14} /> Adicionar
            </button>
          </form>
        </section>

        {/* Right: Recurring Transactions */}
        <section className="advanced-subcol">
          <div className="subcol-head">
            <div>
              <h4 className="subcol-title">Lançamentos Recorrentes</h4>
              <p className="subcol-desc">Movimentações que se repetem todo mês automaticamente.</p>
            </div>
          </div>

          <div className="recurring-list">
            {recurring.map((item) => {
              const isIncome = item.type === 'income'
              return (
                <div key={item.id} className={`recurring-row-card ${!item.active ? 'paused' : ''}`}>
                  <CategoryIcon category={item.category} size={36} />
                  <div className="rec-info">
                    <strong>{item.description}</strong>
                    <small>
                      Todo dia {item.day_of_month} • {getCategoryLabel(item.category)}
                      {!item.active && ' • (Pausado)'}
                    </small>
                  </div>
                  <div className="rec-actions">
                    <strong className={`rec-val ${isIncome ? 'pos' : 'neg'}`}>
                      {isIncome ? '+ ' : '- '}
                      <Money value={item.amount} />
                    </strong>
                    <div className="rec-btn-group">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setEditingRecurring(item)}
                        title="Ajustar valores e detalhes desta recorrência"
                      >
                        <Pencil size={13} />
                        Ajustar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => toggleRecurring(item)}
                        title={item.active ? 'Pausar geração' : 'Retomar geração'}
                      >
                        {item.active ? <Pause size={13} /> : <Play size={13} />}
                        {item.active ? 'Pausar' : 'Retomar'}
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => removeRecurring(item)}
                        aria-label="Excluir recorrência"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {loading && recurring.length === 0 && (
              <p className="text-empty-hint">Carregando recorrências...</p>
            )}
            {!loading && recurring.length === 0 && (
              <p className="text-empty-hint">
                Nenhum lançamento recorrente ativo. Ao cadastrar um salário ou conta fixa, marque "Repetir todo mês".
              </p>
            )}
          </div>
        </section>
      </div>

      {editingRecurring && (
        <RecurringAdjustModal
          item={editingRecurring}
          accounts={accounts}
          categories={categories}
          getMeta={getMeta}
          onClose={() => setEditingRecurring(null)}
          onSave={saveRecurringAdjustment}
          saving={savingRecurring}
        />
      )}
    </article>
  )
}

function RecurringAdjustModal({
  item,
  accounts,
  categories,
  getMeta,
  onClose,
  onSave,
  saving
}) {
  const [type, setType] = useState(item.type || 'expense')
  const [description, setDescription] = useState(item.description || '')
  const [amount, setAmount] = useState(amountToInput(item.amount))
  const [category, setCategory] = useState(item.category || categories[0] || 'Alimentacao')
  const [dayOfMonth, setDayOfMonth] = useState(item.day_of_month || 1)
  const [accountId, setAccountId] = useState(item.account_id || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: item.id,
      type,
      description,
      amount,
      category,
      day_of_month: dayOfMonth,
      account_id: accountId
    })
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div className="modal-sheet recurring-adjust-sheet" role="dialog" aria-modal="true">
        <span className="sheet-handle" aria-hidden="true" />
        <header className="modal-head">
          <div>
            <span className="eyebrow">Recorrência Mensal</span>
            <h2>Ajustar Lançamento</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body recurring-adjust-form">
          {/* Seletor de Tipo (Despesa / Receita) */}
          <div className="type-switch" role="radiogroup" aria-label="Tipo">
            <button
              type="button"
              role="radio"
              aria-checked={type === 'expense'}
              className={`expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => setType('expense')}
            >
              <ArrowDownRight size={17} /> Despesa
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={type === 'income'}
              className={`income ${type === 'income' ? 'active' : ''}`}
              onClick={() => setType('income')}
            >
              <ArrowUpRight size={17} /> Receita
            </button>
          </div>

          {/* Campo de Valor em Destaque */}
          <label className={`amount-field ${type}`}>
            <span className="amount-caption">Valor mensal da recorrência</span>
            <span className="amount-input">
              <em>R$</em>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                placeholder="0,00"
                disabled={saving}
                autoFocus
              />
            </span>
          </label>

          {/* Descrição */}
          <label className="field">
            <span>Descrição</span>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Assinatura Netflix, Aluguel"
              disabled={saving}
            />
          </label>

          {/* Linha dupla: Dia do Vencimento e Categoria */}
          <div className="field-row">
            <label className="field">
              <span>Dia do mês (1 a 31)</span>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                disabled={saving}
              />
            </label>

            <label className="field">
              <span>Categoria</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
              >
                {categories.map((cat) => {
                  const meta = getMeta ? getMeta(cat) : null
                  return (
                    <option key={cat} value={cat}>
                      {meta?.label || getCategoryLabel(cat)}
                    </option>
                  )
                })}
              </select>
            </label>
          </div>

          {/* Conta ou Cartão */}
          <label className="field">
            <span>Conta ou Cartão vinculado</span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={saving}
            >
              <option value="">Nenhuma / Não especificado</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.kind === 'card' ? 'Cartão' : 'Conta'})
                </option>
              ))}
            </select>
          </label>

          <footer className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <div className="spacer" />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !description.trim() || !amount}
            >
              <Check size={16} /> {saving ? 'Salvando...' : 'Salvar Ajustes'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
