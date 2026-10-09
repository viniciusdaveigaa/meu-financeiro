import { useState, useEffect, useRef } from 'react'
import {
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
import { changeMonth, dateInMonth } from '../utils/formatters'
import { getCategoryLabel } from '../constants/categories'
import { useAppDialog } from './Dialog'
import { CategoryIcon, Money } from './ui'

export function AdvancedPanel({ month }) {
  const dialog = useAppDialog()
  const [accounts, setAccounts] = useState([])
  const [recurring, setRecurring] = useState([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState('account')
  const [ready, setReady] = useState(true)
  const [addingAccount, setAddingAccount] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const generatingRef = useRef(false)

  const load = async () => {
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
    setAccounts(accountResult.data || [])
    setRecurring(recurringResult.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const refresh = () => load()
    window.addEventListener('recurring-data-changed', refresh)
    return () => window.removeEventListener('recurring-data-changed', refresh)
  }, [])

  // Auto-generate recurring transactions up to current selected month
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
        for (const item of due) {
          const lastMonth = (
            item.last_generated_month || `${item.start_date.slice(0, 7)}-01`
          ).slice(0, 7)
          const rows = []
          let cursor = changeMonth(lastMonth, 1)

          while (cursor <= month) {
            rows.push({
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

          if (!rows.length) continue

          const { error } = await supabase.from('transactions').insert(rows)
          if (!error) {
            const { error: updateError } = await supabase
              .from('recurring_transactions')
              .update({ last_generated_month: targetMonth })
              .eq('id', item.id)

            generated = generated || !updateError
            generationFailed = generationFailed || Boolean(updateError)
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
    const { data } = await supabase.auth.getUser()
    const { error } = await supabase.from('accounts').insert({
      name: name.trim(),
      kind,
      user_id: data.user.id
    })

    setAddingAccount(false)
    if (error) {
      return dialog.alert(error.message, { title: 'Falha ao cadastrar conta' })
    }

    setName('')
    load()
  }

  const updateAccount = async (e) => {
    e.preventDefault()
    if (!editingAccount || !editingAccount.name.trim()) return

    setSavingEdit(true)
    const { error } = await supabase
      .from('accounts')
      .update({
        name: editingAccount.name.trim(),
        kind: editingAccount.kind
      })
      .eq('id', editingAccount.id)

    setSavingEdit(false)
    if (error) {
      return dialog.alert(error.message, { title: 'Falha ao atualizar conta' })
    }

    setEditingAccount(null)
    window.dispatchEvent(new Event('finance-data-changed'))
    load()
  }

  const removeAccount = async (id, accName) => {
    const confirmed = await dialog.confirm(
      `A conta/cartão “${accName}” será removido, mas os lançamentos vinculados a ela continuarão no seu histórico.`,
      { title: 'Excluir conta ou cartão?', confirmLabel: 'Sim, excluir' }
    )
    if (!confirmed) return

    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) {
      return dialog.alert(error.message, { title: 'Conta não excluída' })
    }
    load()
  }

  const toggleRecurring = async (item) => {
    const { error } = await supabase
      .from('recurring_transactions')
      .update({ active: !item.active })
      .eq('id', item.id)

    if (error) {
      return dialog.alert(error.message, { title: 'Falha ao atualizar recorrência' })
    }
    load()
  }

  const removeRecurring = async (item) => {
    const confirmed = await dialog.confirm(
      `A repetição mensal de “${item.description}” será cancelada. Lançamentos já gerados nos meses anteriores serão mantidos.`,
      { title: 'Excluir recorrência?', confirmLabel: 'Sim, cancelar' }
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', item.id)

    if (error) {
      return dialog.alert(error.message, { title: 'Recorrência não excluída' })
    }
    await load()
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
                  <span className={`acc-icon-badge ${acc.kind}`}>
                    {acc.kind === 'card' ? <CreditCard size={18} /> : <Landmark size={18} />}
                  </span>
                  <div className="acc-info">
                    <strong>{acc.name}</strong>
                    <small>{acc.kind === 'card' ? 'Cartão de crédito' : 'Conta corrente / Carteira'}</small>
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

            {accounts.length === 0 && (
              <p className="text-empty-hint">Nenhuma conta ou cartão cadastrado.</p>
            )}
          </div>

          <form onSubmit={addAccount} className="inline-add-form">
            <input
              type="text"
              required
              placeholder="Nome (ex: Nubank, Inter)"
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

            {recurring.length === 0 && (
              <p className="text-empty-hint">
                Nenhum lançamento recorrente ativo. Ao cadastrar um salário ou conta fixa, marque "Repetir todo mês".
              </p>
            )}
          </div>
        </section>
      </div>
    </article>
  )
}
