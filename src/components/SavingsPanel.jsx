import { useState, useEffect } from 'react'
import {
  ArrowDownToLine,
  Check,
  Info,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  X
} from 'lucide-react'
import { supabase } from '../supabase'
import {
  formatAmountInput,
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
      supabase.from('savings_contributions').select('box_id, amount')
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

export function SavingsPanel({ userId }) {
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

  const load = async (isBackground = false) => {
    try {
      if (!isBackground && !savingsCache) {
        setLoading(true)
      }
      const [boxResult, contributionResult] = await Promise.all([
        supabase.from('savings_boxes').select('id, name, target_amount, created_at').order('created_at'),
        supabase.from('savings_contributions').select('box_id, amount')
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
    const newContrib = { box_id: box.id, amount }
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

  const removeBox = async (id, boxName) => {
    const confirmed = await dialog.confirm(
      `Ao excluir a caixinha “${boxName}”, todos os aportes feitos nela serão deletados do extrato e o saldo será retornado para sua conta. Deseja continuar?`,
      { title: 'Excluir caixinha e estornar saldo?', confirmLabel: 'Sim, excluir e estornar' }
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

    // 1 e 2. Exclui os lançamentos no extrato e a caixinha em paralelo
    const [txDel, boxDel] = await Promise.all([
      supabase
        .from('transactions')
        .delete()
        .eq('category', 'Caixinha')
        .or(`description.eq.Reserva: ${boxName},description.ilike.Reserva: ${boxName}%`),
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
    (sum, item) => sum + Number(item.amount),
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
          <strong className="kpi-val pos"><Money value={totalSavedAll} /></strong>
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
            const savedInBox = contributions
              .filter((c) => c.box_id === box.id)
              .reduce((sum, c) => sum + Number(c.amount), 0)

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
                        <i style={{ width: `${progress}%`, background: '#1f9d6b' }} />
                      </div>
                    </div>
                  ) : (
                    <small className="box-no-target">Sem meta definida</small>
                  )}
                </div>

                <div className="box-contribute-form">
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
                    <span>Contar como saída no extrato</span>
                  </label>

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
    </article>
  )
}
