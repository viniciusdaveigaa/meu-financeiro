import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Info,
  PiggyBank,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  X
} from 'lucide-react'
import { supabase } from '../supabase'
import {
  formatAmountInput,
  formatMoney,
  inputToAmount,
  localISODate
} from '../utils/formatters'
import { useAppDialog } from './Dialog'
import { Money } from './ui'

// Module-level cache for instant tab opening (0ms)
let savingsCache = null

export const prefetchSavings = async () => {
  try {
    const [boxResult, contributionResult] = await Promise.all([
      supabase.from('savings_boxes').select('id, name, target_amount, created_at').order('created_at'),
      supabase.from('savings_contributions').select('id, box_id, amount, date, type')
    ])

    if (!boxResult.error && !contributionResult.error) {
      savingsCache = {
        boxes: boxResult.data || [],
        contributions: contributionResult.data || []
      }
      return savingsCache
    }
  } catch {}
  return null
}

export function SavingsPanel({ userId, accounts = [] }) {
  const dialog = useAppDialog()
  const [boxes, setBoxes] = useState(() => savingsCache?.boxes || [])
  const [contributions, setContributions] = useState(() => savingsCache?.contributions || [])
  const [loading, setLoading] = useState(() => !savingsCache)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [amounts, setAmounts] = useState({})
  const [countAsExpense, setCountAsExpense] = useState({})
  const [ready, setReady] = useState(true)
  const [creating, setCreating] = useState(false)
  const [openNew, setOpenNew] = useState(false)

  // Estados para modal de retirada
  const [withdrawingBox, setWithdrawingBox] = useState(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawHideStatement, setWithdrawHideStatement] = useState(false)
  const [withdrawAccountId, setWithdrawAccountId] = useState('')
  const [withdrawSecurityStep, setWithdrawSecurityStep] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const load = async (isBackground = false) => {
    try {
      if (!isBackground && !savingsCache) {
        setLoading(true)
      }
      const [boxResult, contributionResult] = await Promise.all([
        supabase.from('savings_boxes').select('id, name, target_amount, created_at').order('created_at'),
        supabase.from('savings_contributions').select('id, box_id, amount, date, type')
      ])

      if (boxResult.error || contributionResult.error) {
        setReady(false)
        return
      }

      setReady(true)
      const newBoxes = boxResult.data || []
      const newContribs = contributionResult.data || []
      savingsCache = { boxes: newBoxes, contributions: newContribs }
      setBoxes(newBoxes)
      setContributions(newContribs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(Boolean(savingsCache))
  }, [])

  useEffect(() => {
    const handleSync = () => load(true)
    window.addEventListener('finance-data-changed', handleSync)
    return () => window.removeEventListener('finance-data-changed', handleSync)
  }, [])

  const getBoxBalance = (boxId) => {
    const total = contributions
      .filter((c) => c.box_id === boxId)
      .reduce((sum, c) => sum + (c.type === 'withdrawal' ? -Number(c.amount) : Number(c.amount)), 0)
    return Math.max(0, total)
  }

  const createBox = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setCreating(true)
    const effectiveUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id
    const { error } = await supabase.from('savings_boxes').insert({
      user_id: effectiveUserId,
      name: name.trim(),
      target_amount: target ? Number(target) : null
    })

    setCreating(false)
    if (error) {
      return dialog.alert(error.message, { title: 'Não foi possível criar a caixinha' })
    }

    setName('')
    setTarget('')
    setOpenNew(false)
    load()
  }

  const contribute = async (box) => {
    const amount = inputToAmount(amounts[box.id])
    if (!(amount > 0)) {
      return dialog.alert('Informe um valor de aporte maior que zero.', {
        title: 'Valor inválido'
      })
    }

    // Otimista: atualiza o saldo local instantaneamente
    const newContrib = { box_id: box.id, amount, type: 'deposit' }
    setContributions((prev) => {
      const next = [...prev, newContrib]
      if (savingsCache) savingsCache.contributions = next
      return next
    })
    setAmounts({ ...amounts, [box.id]: '' })

    const { error } = await supabase.rpc('add_savings_contribution_v2', {
      p_box_id: box.id,
      p_amount: amount,
      p_date: localISODate(),
      p_count_as_expense: countAsExpense[box.id] !== false
    })

    if (error) {
      load() // reverte se houver erro
      return dialog.alert(error.message, { title: 'Falha no aporte' })
    }

    window.dispatchEvent(new Event('finance-data-changed'))
  }

  const openWithdrawModal = (box) => {
    const currentBal = getBoxBalance(box.id)
    if (currentBal <= 0) {
      return dialog.alert('Esta caixinha não possui saldo disponível para retirada.', {
        title: 'Saldo zerado'
      })
    }
    setWithdrawingBox(box)
    setWithdrawAmount('')
    setWithdrawHideStatement(false)
    setWithdrawAccountId(accounts[0]?.id || '')
    setWithdrawSecurityStep(false)
  }

  const closeWithdrawModal = () => {
    if (isWithdrawing) return
    setWithdrawingBox(null)
    setWithdrawAmount('')
    setWithdrawHideStatement(false)
    setWithdrawAccountId('')
    setWithdrawSecurityStep(false)
  }

  const handleStartWithdrawConfirmation = (e) => {
    e.preventDefault()
    if (!withdrawingBox) return

    const amount = inputToAmount(withdrawAmount)
    const currentBal = getBoxBalance(withdrawingBox.id)

    if (!(amount > 0)) {
      return dialog.alert('Informe um valor de retirada maior que zero.', {
        title: 'Valor inválido'
      })
    }
    if (amount > currentBal) {
      return dialog.alert(
        `O valor solicitado (R$ ${formatMoney(amount)}) é maior que o saldo disponível de R$ ${formatMoney(currentBal)}.`,
        { title: 'Saldo insuficiente' }
      )
    }

    // Avança para a etapa de Confirmação de Segurança
    setWithdrawSecurityStep(true)
  }

  const handleExecuteWithdrawal = async () => {
    if (!withdrawingBox) return
    const amount = inputToAmount(withdrawAmount)
    const currentBal = getBoxBalance(withdrawingBox.id)

    if (!(amount > 0) || amount > currentBal) return

    setIsWithdrawing(true)
    const effectiveUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id
    const today = localISODate()
    const showInStatement = !withdrawHideStatement
    const accountId = withdrawAccountId || null

    try {
      // 1. Tenta a função atômica segura no Supabase
      const { error: rpcError } = await supabase.rpc('withdraw_savings_v2', {
        p_box_id: withdrawingBox.id,
        p_amount: amount,
        p_date: today,
        p_show_in_statement: showInStatement,
        p_account_id: accountId
      })

      // Se a RPC falhar ou não existir, aplica fallback transacional via inserts
      if (rpcError) {
        // Fallback: insere na tabela de aportes com type='withdrawal'
        const { error: contribErr } = await supabase.from('savings_contributions').insert({
          box_id: withdrawingBox.id,
          user_id: effectiveUserId,
          amount: amount,
          date: today,
          type: 'withdrawal'
        })
        if (contribErr) throw contribErr

        // Registra movimentação de entrada correspondente
        const { error: txErr } = await supabase.from('transactions').insert({
          user_id: effectiveUserId,
          type: 'income',
          description: `Resgate: ${withdrawingBox.name}`,
          amount: amount,
          affects_balance: true,
          show_in_statement: showInStatement,
          category: 'Caixinha',
          date: today,
          account_id: accountId
        })
        if (txErr) throw txErr
      }

      // Otimista: atualiza estado local imediatamente
      const newWithdrawal = {
        box_id: withdrawingBox.id,
        amount,
        type: 'withdrawal',
        date: today
      }
      setContributions((prev) => {
        const next = [...prev, newWithdrawal]
        if (savingsCache) savingsCache.contributions = next
        return next
      })

      window.dispatchEvent(new Event('finance-data-changed'))
      closeWithdrawModal()

      await dialog.alert(
        `Retirada de R$ ${formatMoney(amount)} da caixinha "${withdrawingBox.name}" realizada com sucesso!`,
        { title: 'Retirada concluída' }
      )
    } catch (err) {
      dialog.alert(err.message || 'Falha ao processar retirada da caixinha.', {
        title: 'Erro na retirada'
      })
      load()
    } finally {
      setIsWithdrawing(false)
    }
  }

  const removeBox = async (id, boxName) => {
    const confirmed = await dialog.confirm(
      `Ao excluir a caixinha “${boxName}”, todos os aportes e retiradas feitos nela serão removidos do histórico. Deseja continuar?`,
      { title: 'Excluir caixinha?', confirmLabel: 'Sim, excluir' }
    )
    if (!confirmed) return

    // Otimista: remove da tela imediatamente
    setBoxes((prev) => {
      const next = prev.filter((b) => b.id !== id)
      if (savingsCache) savingsCache.boxes = next
      return next
    })
    setContributions((prev) => {
      const next = prev.filter((c) => c.box_id !== id)
      if (savingsCache) savingsCache.contributions = next
      return next
    })

    // Exclui os lançamentos no extrato e a caixinha em paralelo
    const [txDel, boxDel] = await Promise.all([
      supabase
        .from('transactions')
        .delete()
        .eq('category', 'Caixinha')
        .or(`description.ilike.Reserva: ${boxName}%,description.ilike.Resgate: ${boxName}%`),
      supabase.from('savings_boxes').delete().eq('id', id)
    ])

    if (boxDel.error) {
      load() // reverte se falhar
      return dialog.alert(boxDel.error.message, { title: 'Falha ao excluir caixinha' })
    }

    window.dispatchEvent(new Event('finance-data-changed'))
  }

  if (!ready) {
    return (
      <article className="card savings-card">
        <header className="card-head">
          <div>
            <span className="eyebrow">Reservas</span>
            <h3 className="card-title">Caixinhas & Metas</h3>
          </div>
        </header>
        <div className="empty-state">
          <span className="empty-icon"><Info size={22} /></span>
          <h4>Recurso não configurado</h4>
          <p>Execute a migração <code>003_savings_boxes.sql</code> no Supabase para ativar este recurso.</p>
        </div>
      </article>
    )
  }

  const totalSavedAll = contributions.reduce(
    (sum, item) => sum + (item.type === 'withdrawal' ? -Number(item.amount) : Number(item.amount)),
    0
  )

  return (
    <article className="card savings-card">
      <header className="card-head">
        <div>
          <span className="eyebrow">Objetivos</span>
          <h3 className="card-title">Caixinhas de Reserva</h3>
        </div>
        <div className="card-head-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setOpenNew(!openNew)}
          >
            {openNew ? <X size={15} /> : <Plus size={15} />}
            {openNew ? 'Fechar' : 'Nova caixinha'}
          </button>
        </div>
      </header>

      {/* Top Banner KPI */}
      <div className="budget-kpi-banner">
        <div className="kpi-item">
          <span className="kpi-label">Total guardado em reservas</span>
          <strong className="kpi-val pos"><Money value={Math.max(0, totalSavedAll)} /></strong>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Caixinhas ativas</span>
          <strong className="kpi-val">{boxes.length}</strong>
        </div>
      </div>

      {openNew && (
        <form onSubmit={createBox} className="new-box-form">
          <h4>Criar nova caixinha</h4>
          <div className="new-box-grid">
            <label className="field">
              <span>Nome da caixinha</span>
              <input
                type="text"
                required
                placeholder="Ex.: Reserva de emergência, Viagem, IPVA"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={creating}
              />
            </label>
            <label className="field">
              <span>Meta de economia (opcional)</span>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Ex.: 5000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={creating}
              />
            </label>
          </div>
          <div className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setOpenNew(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={creating}
            >
              {creating ? 'Criando...' : 'Criar caixinha'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Carregando caixinhas...
        </div>
      ) : boxes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><PiggyBank size={22} /></span>
          <h4>Nenhuma caixinha criada</h4>
          <p>Separe dinheiro para seus planos futuros e acompanhe o progresso de cada meta.</p>
          {!openNew && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setOpenNew(true)}
            >
              <Plus size={15} /> Criar primeira caixinha
            </button>
          )}
        </div>
      ) : (
        <div className="savings-cards-grid">
          {boxes.map((box) => {
            const savedInBox = getBoxBalance(box.id)
            const targetAmount = box.target_amount ? Number(box.target_amount) : null
            const progress = targetAmount
              ? Math.min((savedInBox / targetAmount) * 100, 100)
              : null

            return (
              <div key={box.id} className="saving-box-card">
                <div className="box-card-top">
                  <div className="box-icon-tag">
                    <PiggyBank size={20} />
                  </div>
                  <div className="box-card-header-actions">
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => removeBox(box.id, box.name)}
                      aria-label={`Excluir caixinha ${box.name}`}
                      title="Excluir caixinha"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="box-card-info">
                  <h4 className="box-name">{box.name}</h4>
                  <div className="box-saved-val">
                    <Money value={savedInBox} />
                  </div>

                  {targetAmount ? (
                    <div className="box-target-block">
                      <div className="box-target-labels">
                        <small>Meta: <Money value={targetAmount} /></small>
                        <small className="pct">{Math.round(progress)}%</small>
                      </div>
                      <div className="bar-track">
                        <i style={{ width: `${progress}%`, background: 'var(--brand-accent, var(--emerald-600, #1f9d6b))' }} />
                      </div>
                    </div>
                  ) : (
                    <small className="box-no-target">Sem meta definida</small>
                  )}
                </div>

                {/* Área de Ações: Guardar e Retirar */}
                <div className="box-contribute-form">
                  <div className="box-form-row-header">
                    <label className="checkbox-mini">
                      <input
                        type="checkbox"
                        checked={countAsExpense[box.id] !== false}
                        onChange={(e) =>
                          setCountAsExpense({
                            ...countAsExpense,
                            [box.id]: e.target.checked
                          })
                        }
                      />
                      <span>Contar aporte no extrato</span>
                    </label>

                    {savedInBox > 0 && (
                      <button
                        type="button"
                        className="btn-link-action withdraw-link"
                        onClick={() => openWithdrawModal(box)}
                        title="Retirar dinheiro desta caixinha"
                      >
                        <ArrowUpFromLine size={13} /> Retirar dinheiro
                      </button>
                    )}
                  </div>

                  <div className="box-contribute-input-row">
                    <div className="amount-input-compact">
                      <em>R$</em>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        aria-label="Valor a guardar"
                        value={amounts[box.id] || ''}
                        onChange={(e) =>
                          setAmounts({
                            ...amounts,
                            [box.id]: formatAmountInput(e.target.value)
                          })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => contribute(box)}
                    >
                      <ArrowDownToLine size={14} /> Guardar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Retirada com Confirmação de Segurança */}
      {withdrawingBox && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isWithdrawing) closeWithdrawModal()
          }}
        >
          <div className="modal-sheet withdraw-savings-sheet" role="dialog" aria-modal="true">
            <header className="modal-head">
              <div>
                <span className="eyebrow">Caixinha de Reserva</span>
                <h3>
                  {withdrawSecurityStep ? 'Confirmação de Segurança' : 'Retirar Dinheiro'}
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn-close"
                onClick={closeWithdrawModal}
                disabled={isWithdrawing}
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </header>

            {!withdrawSecurityStep ? (
              /* ETAPA 1: Formulário de Resgate */
              <form onSubmit={handleStartWithdrawConfirmation} className="withdraw-modal-body">
                <div className="withdraw-box-banner">
                  <div className="banner-box-name">
                    <PiggyBank size={20} />
                    <span>{withdrawingBox.name}</span>
                  </div>
                  <div className="banner-box-balance">
                    <small>Saldo disponível na caixinha:</small>
                    <strong><Money value={getBoxBalance(withdrawingBox.id)} /></strong>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="withdraw-amount-input">
                    <span>Quanto deseja retirar?</span>
                  </label>
                  <div className="amount-input-group">
                    <span className="currency-prefix">R$</span>
                    <input
                      id="withdraw-amount-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      autoFocus
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(formatAmountInput(e.target.value))}
                    />
                  </div>

                  {/* Atalhos de Porcentagem */}
                  <div className="quick-pct-chips">
                    {[
                      { label: '25%', factor: 0.25 },
                      { label: '50%', factor: 0.5 },
                      { label: '100% (Tudo)', factor: 1.0 }
                    ].map((chip) => {
                      const currentBal = getBoxBalance(withdrawingBox.id)
                      const calcVal = (currentBal * chip.factor).toFixed(2)
                      return (
                        <button
                          key={chip.label}
                          type="button"
                          className="chip"
                          onClick={() => setWithdrawAmount(formatAmountInput(calcVal))}
                        >
                          {chip.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Seleção de Conta de Destino (Opcional) */}
                {accounts.length > 0 && (
                  <div className="field">
                    <label htmlFor="withdraw-account-select">
                      <span>Devolver para qual conta bancária?</span>
                    </label>
                    <select
                      id="withdraw-account-select"
                      value={withdrawAccountId}
                      onChange={(e) => setWithdrawAccountId(e.target.value)}
                    >
                      <option value="">Saldo Geral / Sem conta vinculada</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.kind === 'card' ? 'Cartão' : 'Conta'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Saldo Restante Dinâmico */}
                {(() => {
                  const val = inputToAmount(withdrawAmount)
                  const bal = getBoxBalance(withdrawingBox.id)
                  const remaining = bal - val
                  const isOver = val > bal

                  return (
                    <div className={`remaining-balance-box ${isOver ? 'error' : ''}`}>
                      <span>Saldo restante na caixinha:</span>
                      <strong>
                        {isOver ? (
                          <span className="over-hint">Valor superior ao disponível</span>
                        ) : (
                          <Money value={Math.max(0, remaining)} />
                        )}
                      </strong>
                    </div>
                  )
                })()}

                {/* Opção de Excluir do Extrato */}
                <div className="statement-visibility-option">
                  <label className="checkbox-control">
                    <input
                      type="checkbox"
                      checked={withdrawHideStatement}
                      onChange={(e) => setWithdrawHideStatement(e.target.checked)}
                    />
                    <div>
                      <strong>Não mostrar esta retirada no extrato financeiro</strong>
                      <small>
                        A retirada será registrada internamente para manter os saldos e relatórios corretos, mas não aparecerá na lista de movimentações do extrato.
                      </small>
                    </div>
                  </label>
                </div>

                <div className="modal-foot">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeWithdrawModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      !inputToAmount(withdrawAmount) ||
                      inputToAmount(withdrawAmount) > getBoxBalance(withdrawingBox.id)
                    }
                  >
                    Revisar e Continuar
                  </button>
                </div>
              </form>
            ) : (
              /* ETAPA 2: Confirmação de Segurança Exigida */
              <div className="withdraw-modal-body security-confirm-step">
                <div className="security-notice-card">
                  <div className="security-notice-header">
                    <ShieldCheck size={28} className="security-icon" />
                    <div>
                      <h4>Revise os detalhes da retirada</h4>
                      <p>Verifique os dados abaixo antes de efetivar o resgate dos recursos.</p>
                    </div>
                  </div>

                  <dl className="security-summary-list">
                    <div className="summary-row">
                      <dt>Caixinha de origem:</dt>
                      <dd><strong>{withdrawingBox.name}</strong></dd>
                    </div>
                    <div className="summary-row highlight">
                      <dt>Valor a retirar:</dt>
                      <dd className="pos-amount">
                        <strong>R$ {formatMoney(inputToAmount(withdrawAmount))}</strong>
                      </dd>
                    </div>
                    <div className="summary-row">
                      <dt>Saldo restante após a operação:</dt>
                      <dd>
                        <strong>
                          R$ {formatMoney(getBoxBalance(withdrawingBox.id) - inputToAmount(withdrawAmount))}
                        </strong>
                      </dd>
                    </div>
                    <div className="summary-row">
                      <dt>Exibição no extrato financeiro:</dt>
                      <dd>
                        {withdrawHideStatement ? (
                          <span className="badge-badge badge-neutral">Oculto do extrato</span>
                        ) : (
                          <span className="badge-badge badge-success">Visível no extrato</span>
                        )}
                      </dd>
                    </div>
                    {withdrawAccountId && (
                      <div className="summary-row">
                        <dt>Conta creditada:</dt>
                        <dd>
                          {accounts.find((a) => a.id === withdrawAccountId)?.name || 'Conta bancária'}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="modal-foot">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setWithdrawSecurityStep(false)}
                    disabled={isWithdrawing}
                  >
                    Voltar e Alterar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExecuteWithdrawal}
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? 'Processando retirada...' : 'Confirmar Retirada'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
