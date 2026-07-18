import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { configured, supabase } from './supabase'

const categories = ['Salario', 'Caixinha', 'Moradia', 'Alimentacao', 'Transporte', 'Lazer', 'Saude', 'Educacao', 'Assinaturas', 'Outros']
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const isoToday = new Date().toISOString().slice(0, 10)
const emptyEntry = { type: 'expense', description: '', amount: '', category: 'Alimentacao', date: isoToday, account_id: '', installment: false, installments: 1, recurring: false }
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' })

function getMonthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` }
function changeMonth(value, direction) { const date = new Date(`${value}-01T12:00:00`); date.setMonth(date.getMonth() + direction); return getMonthKey(date) }
function getMonthRange(value) { const [year, month] = value.split('-').map(Number); return { from: `${value}-01`, to: new Date(year, month, 0).toISOString().slice(0, 10) } }
function dateInMonth(value, day) { const [year, month] = value.split('-').map(Number); const safeDay = Math.min(day, new Date(year, month, 0).getDate()); return `${value}-${String(safeDay).padStart(2, '0')}` }
function dateLabel(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') }
function total(items, type) { return items.filter((item) => item.type === type && item.affects_balance !== false).reduce((sum, item) => sum + Number(item.amount), 0) }
function formatAmountInput(value) { const digits = String(value ?? '').replace(/\D/g, ''); if (!digits) return ''; return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function amountToInput(value) { return value === '' || value == null ? '' : formatAmountInput(Math.round(Number(value) * 100)) }
function inputToAmount(value) { const digits = String(value ?? '').replace(/\D/g, ''); return digits ? Number(digits) / 100 : 0 }

const DialogContext = createContext(null)

function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)
  const previousFocusRef = useRef(null)
  const finish = (result) => { const resolve = resolverRef.current; resolverRef.current = null; setDialog(null); resolve?.(result); requestAnimationFrame(() => previousFocusRef.current?.focus()) }
  const open = (options) => new Promise((resolve) => { resolverRef.current?.(false); previousFocusRef.current = document.activeElement; resolverRef.current = resolve; setDialog(options) })
  const confirm = (message, options = {}) => open({ kind: 'confirm', message, title: options.title || 'Confirmar exclusao', confirmLabel: options.confirmLabel || 'Excluir' })
  const alert = (message, options = {}) => open({ kind: 'alert', message, title: options.title || 'Algo precisa de atencao', confirmLabel: options.confirmLabel || 'Entendi' })

  useEffect(() => {
    if (!dialog) return
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => { if (event.key === 'Escape') { event.preventDefault(); finish(false) } }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown) }
  }, [dialog])

  return <DialogContext.Provider value={{ confirm, alert }}>{children}{dialog && <div className="app-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) finish(false) }}><section className={`app-dialog ${dialog.kind}`} role={dialog.kind === 'alert' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message"><span className="app-dialog-icon" aria-hidden="true">{dialog.kind === 'confirm' ? '!' : 'i'}</span><p className="eyebrow">SALDO CLARO</p><h2 id="app-dialog-title">{dialog.title}</h2><p id="app-dialog-message">{dialog.message}</p><div className="app-dialog-actions">{dialog.kind === 'confirm' && <button type="button" className="dialog-cancel" onClick={() => finish(false)}>Cancelar</button>}<button type="button" className="dialog-confirm" autoFocus onClick={() => finish(true)}>{dialog.confirmLabel}</button></div></section></div>}</DialogContext.Provider>
}

function useAppDialog() {
  return useContext(DialogContext)
}

function Auth({ onSession }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    const result = mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup' && result.data.session) onSession(result.data.session)
    else if (mode === 'signup') setMessage('Conta criada. Confira seu e-mail para confirmar o acesso.')
    else onSession(result.data.session)
  }
  return <main className="auth-shell"><section className="auth-intro"><p className="eyebrow">FINANCAS PESSOAIS</p><h1>Dinheiro em ordem.<br />Mente tranquila.</h1><p>Um espaco simples e seguro para entender para onde seu dinheiro vai.</p><div className="orb" /></section><section className="auth-card"><span className="logo">saldo<span>claro</span></span><h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Comece sem complicacao'}</h2><p className="muted">{mode === 'login' ? 'Entre para ver seu resumo financeiro.' : 'Crie sua conta gratuita em poucos segundos.'}</p><form onSubmit={submit}><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<input type="password" minLength="6" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{message && <p className="form-message">{message}</p>}<button>{mode === 'login' ? 'Entrar' : 'Criar conta'}</button></form><p className="switch">{mode === 'login' ? 'Ainda nao tem uma conta?' : 'Ja possui uma conta?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Cadastre-se' : 'Entrar'}</button></p></section></main>
}

function FlowChart({ entries }) {
  const [mode, setMode] = useState('line')
  const anchor = entries.length ? new Date(`${entries.map((item) => item.date).sort().at(-1)}T12:00:00`) : new Date()
  const points = Array.from({ length: 6 }, (_, index) => { const date = new Date(anchor); date.setMonth(date.getMonth() - (5 - index)); const key = getMonthKey(date); const items = entries.filter((item) => item.date.startsWith(key)); return { key, label: shortMonth.format(date).replace('.', ''), income: total(items, 'income'), expense: total(items, 'expense') } })
  let runningBalance = 0
  const balancePoints = points.map((point) => ({ ...point, balance: (runningBalance += point.income - point.expense) }))
  const highest = Math.max(...points.flatMap((point) => [point.income, point.expense]), 1)
  const coordinate = (amount, index) => `${22 + index * 54},${124 - (amount / highest) * 104}`
  const balanceValues = balancePoints.map((point) => point.balance)
  const balanceMin = Math.min(...balanceValues, 0)
  const balanceSpan = Math.max(Math.max(...balanceValues) - balanceMin, 1)
  const balanceCoordinate = (amount, index) => `${22 + index * 54},${124 - ((amount - balanceMin) / balanceSpan) * 104}`
  return <article className="panel chart-panel"><div className="panel-head"><div><p className="eyebrow">EVOLUCAO</p><h2>{mode === 'balance' ? 'Saldo acumulado' : 'Entradas e saidas'}</h2></div><div className="chart-tabs"><button className={mode === 'line' ? 'active' : ''} onClick={() => setMode('line')}>Linhas</button><button className={mode === 'bar' ? 'active' : ''} onClick={() => setMode('bar')}>Barras</button><button className={mode === 'balance' ? 'active' : ''} onClick={() => setMode('balance')}>Saldo</button></div></div><div className="legend"><span><i className="income-dot" /> Entradas</span><span><i className="expense-dot" /> Saidas</span></div><svg viewBox="0 0 314 150" role="img" aria-label="Grafico financeiro dos ultimos seis meses"><path className="grid-line" d="M20 20H300M20 72H300M20 124H300" />{mode === 'line' && <><polyline className="income-line" points={points.map((point, index) => coordinate(point.income, index)).join(' ')} /><polyline className="expense-line" points={points.map((point, index) => coordinate(point.expense, index)).join(' ')} /></>}{mode === 'bar' && points.map((point, index) => <g key={point.key}><rect className="income-bar" x={12 + index * 54} y={124 - (point.income / highest) * 104} width="16" height={(point.income / highest) * 104} rx="4" /><rect className="expense-bar" x={31 + index * 54} y={124 - (point.expense / highest) * 104} width="16" height={(point.expense / highest) * 104} rx="4" /></g>)}{mode === 'balance' && <><path className="balance-area" d={`M22 124 L${balancePoints.map((point, index) => balanceCoordinate(point.balance, index)).join(' L')} L292 124 Z`} /><polyline className="balance-line" points={balancePoints.map((point, index) => balanceCoordinate(point.balance, index)).join(' ')} /></>}{points.map((point, index) => <text key={point.key} x={22 + index * 54} y="146" textAnchor="middle">{point.label}</text>)}</svg></article>
}

function SavingsPanel() {
  const dialog = useAppDialog()
  const [boxes, setBoxes] = useState([])
  const [contributions, setContributions] = useState([])
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [amounts, setAmounts] = useState({})
  const [countAsExpense, setCountAsExpense] = useState({})
  const [ready, setReady] = useState(true)
  const load = async () => { const [boxResult, contributionResult] = await Promise.all([supabase.from('savings_boxes').select('*').order('created_at'), supabase.from('savings_contributions').select('*')]); if (boxResult.error || contributionResult.error) { setReady(false); return } setReady(true); setBoxes(boxResult.data || []); setContributions(contributionResult.data || []) }
  useEffect(() => { load() }, [])
  const createBox = async (event) => { event.preventDefault(); if (!name.trim()) return; const { data } = await supabase.auth.getUser(); const { error } = await supabase.from('savings_boxes').insert({ user_id: data.user.id, name: name.trim(), target_amount: target ? Number(target) : null }); if (!error) { setName(''); setTarget(''); load() } }
  const contribute = async (box) => { const amount = inputToAmount(amounts[box.id]); if (!(amount > 0)) return; const { error } = await supabase.rpc('add_savings_contribution_v2', { p_box_id: box.id, p_amount: amount, p_date: isoToday, p_count_as_expense: countAsExpense[box.id] !== false }); if (error) return dialog.alert(error.message, { title: 'Aporte nao realizado' }); setAmounts({ ...amounts, [box.id]: '' }); await load(); window.dispatchEvent(new Event('finance-data-changed')) }
  const removeBox = async (id) => { if (!await dialog.confirm('A caixinha e todo o historico de aportes serao excluidos. As movimentacoes financeiras existentes serao mantidas.', { title: 'Excluir esta caixinha?' })) return; await supabase.from('savings_boxes').delete().eq('id', id); load() }
  if (!ready) return <section className="savings-disabled"><p className="empty">Execute a migration <code>003_savings_boxes.sql</code> para ativar as caixinhas.</p></section>
  return <section className="savings"><div className="savings-head"><div><p className="eyebrow">CAIXINHAS</p><h3>Dinheiro reservado</h3></div><span>{money.format(contributions.reduce((sum, item) => sum + Number(item.amount), 0))}</span></div><div className="savings-grid">{boxes.map((box) => { const saved = contributions.filter((item) => item.box_id === box.id).reduce((sum, item) => sum + Number(item.amount), 0); const progress = box.target_amount ? Math.min((saved / Number(box.target_amount)) * 100, 100) : 0; return <article className="saving-box" key={box.id}><button className="saving-remove" onClick={() => removeBox(box.id)}>x</button><span className="saving-icon">$</span><b>{box.name}</b><strong>{money.format(saved)}</strong>{box.target_amount && <><small>Meta: {money.format(box.target_amount)}</small><i><em style={{ width: `${progress}%` }} /></i></>}<label className="saving-expense-flag"><input type="checkbox" checked={countAsExpense[box.id] !== false} onChange={(event) => setCountAsExpense({ ...countAsExpense, [box.id]: event.target.checked })} />Contar como saida</label><div><input type="text" inputMode="numeric" autoComplete="off" placeholder="0,00" aria-label="Valor do aporte em reais" value={amounts[box.id] || ''} onChange={(event) => setAmounts({ ...amounts, [box.id]: formatAmountInput(event.target.value) })} /><button onClick={() => contribute(box)}>Guardar</button></div></article> })}</div><form className="new-saving" onSubmit={createBox}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da nova caixinha" /><input type="number" min="0.01" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Meta (opcional)" /><button>Criar caixinha</button></form></section>
}

function AdvancedPanel() {
  const dialog = useAppDialog()
  const [accounts, setAccounts] = useState([])
  const [recurring, setRecurring] = useState([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState('account')
  const [ready, setReady] = useState(true)
  const load = async () => { const [accountResult, recurringResult] = await Promise.all([supabase.from('accounts').select('*').order('created_at'), supabase.from('recurring_transactions').select('*').order('created_at', { ascending: false })]); if (accountResult.error || recurringResult.error) { setReady(false); return } setReady(true); setAccounts(accountResult.data || []); setRecurring(recurringResult.data || []) }
  useEffect(() => { load() }, [])
  useEffect(() => { const run = async () => { const monthKey = getMonthKey(new Date()); const currentMonth = `${monthKey}-01`; const due = recurring.filter((item) => item.active && item.start_date <= currentMonth && (!item.last_generated_month || item.last_generated_month < currentMonth)); if (!due.length) return; let generated = false; for (const item of due) { const { error } = await supabase.from('transactions').insert({ user_id: item.user_id, account_id: item.account_id, type: item.type, description: item.description, amount: item.amount, category: item.category, date: dateInMonth(monthKey, item.day_of_month) }); if (!error) { await supabase.from('recurring_transactions').update({ last_generated_month: currentMonth }).eq('id', item.id); generated = true } } if (generated) window.dispatchEvent(new Event('finance-data-changed')); load() }; run() }, [recurring])
  const add = async (event) => { event.preventDefault(); if (!name.trim()) return; const { data } = await supabase.auth.getUser(); const { error } = await supabase.from('accounts').insert({ name: name.trim(), kind, user_id: data.user.id }); if (!error) { setName(''); load() } }
  const removeAccount = async (id) => { if (!await dialog.confirm('A conta ou cartao sera removido, mas os lancamentos vinculados continuarao no seu historico.', { title: 'Excluir conta ou cartao?' })) return; await supabase.from('accounts').delete().eq('id', id); load() }
  const toggleRecurring = async (item) => { await supabase.from('recurring_transactions').update({ active: !item.active }).eq('id', item.id); load() }
  if (!ready) return <div className="advanced-block"><p className="empty">Execute a migration <code>002_daily_control.sql</code> para ativar contas, cartoes, parcelas e recorrencias.</p></div>
  return <div className="advanced-block"><div className="account-list">{accounts.map((account) => <div key={account.id}><span className={`account-icon ${account.kind}`}>{account.kind === 'card' ? 'C' : 'B'}</span><b>{account.name}<small>{account.kind === 'card' ? 'Cartao' : 'Conta'}</small></b><button className="delete" onClick={() => removeAccount(account.id)}>x</button></div>)}</div><form className="inline-form" onSubmit={add}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nova conta ou cartao" /><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="account">Conta</option><option value="card">Cartao</option></select><button>Adicionar</button></form><div className="recurring-list">{recurring.length ? recurring.map((item) => <div key={item.id}><span>{item.description}<small>Todo dia {item.day_of_month} · {item.category}</small></span><b className={item.type}>{item.type === 'income' ? '+' : '-'} {money.format(item.amount)}</b><button className="text-button" onClick={() => toggleRecurring(item)}>{item.active ? 'Pausar' : 'Retomar'}</button></div>) : <p className="empty">Lancamentos mensais aparecerao aqui.</p>}</div><SavingsPanel /></div>
}

function BudgetPanel({ month, budgets, expensesByCategory, onSave, ready }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const startEdit = () => { setDraft(Object.fromEntries(budgets.map((budget) => [budget.category, budget.amount]))); setEditing(true) }
  const submit = (event) => { event.preventDefault(); onSave(draft); setEditing(false) }
  if (!ready) return <article className="panel budget-panel"><p className="eyebrow">ORCAMENTOS</p><h2>Planeje seus gastos</h2><p className="empty">Execute a atualizacao de banco em <code>supabase/schema.sql</code> para ativar os orcamentos.</p></article>
  return <article className="panel budget-panel"><div className="panel-head"><div><p className="eyebrow">ORCAMENTOS</p><h2>Limites de {monthLabel.format(new Date(`${month}-01T12:00:00`))}</h2></div><button className="text-button" onClick={editing ? () => setEditing(false) : startEdit}>{editing ? 'Cancelar' : 'Editar'}</button></div>{editing ? <form className="budget-form" onSubmit={submit}>{categories.map((category) => <label key={category}>{category}<input type="number" min="0" step="0.01" placeholder="Sem limite" value={draft[category] ?? ''} onChange={(event) => setDraft({ ...draft, [category]: event.target.value })} /></label>)}<button>Salvar orcamentos</button></form> : <div className="budget-list">{budgets.map((budget) => { const spent = expensesByCategory[budget.category] || 0; const ratio = Math.min((spent / Number(budget.amount)) * 100, 100); return <div className="budget-row" key={budget.category}><div><span>{budget.category}</span><b>{money.format(spent)} <small>de {money.format(budget.amount)}</small></b></div><i><em style={{ width: `${ratio}%` }} /></i></div> })}</div>}<p className="eyebrow advanced-title">CONTAS, CARTOES E RECORRENTES</p><AdvancedPanel /></article>
}

function TransactionModal({ entry, onClose, onSave }) {
  const dialog = useAppDialog()
  const [draft, setDraft] = useState(entry ? { ...entry, amount: amountToInput(entry.amount), installment: Number(entry.installment_total) > 1, installments: Number(entry.installment_total) > 1 ? entry.installment_total : 1, recurring: false } : emptyEntry)
  const [accounts, setAccounts] = useState([])
  const [advancedReady, setAdvancedReady] = useState(false)
  const editing = Boolean(entry?.id)
  useEffect(() => { supabase.from('accounts').select('*').order('created_at').then(({ data, error }) => { setAdvancedReady(!error); setAccounts(data || []) }) }, [])
  const submit = (event) => { event.preventDefault(); const amount = inputToAmount(draft.amount); if (!(amount > 0)) return dialog.alert('Informe um valor maior que zero.', { title: 'Valor invalido' }); if (draft.installment_group_id && draft.recurring) return dialog.alert('Uma parcela existente nao pode ser transformada em recorrencia.', { title: 'Recorrencia indisponivel' }); onSave({ ...draft, amount }) }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><button className="close" type="button" onClick={onClose}>x</button><p className="eyebrow">{editing ? 'EDITAR LANCAMENTO' : 'NOVO LANCAMENTO'}</p><h2>{editing ? 'Atualize a movimentacao' : 'Registrar movimentacao'}</h2><div className="type-picker"><button type="button" className={draft.type === 'expense' ? 'active expense-bg' : ''} onClick={() => setDraft({ ...draft, type: 'expense' })}>Saida</button><button type="button" className={draft.type === 'income' ? 'active income-bg' : ''} onClick={() => setDraft({ ...draft, type: 'income', installment: false, installments: 1 })}>Entrada</button></div><label>Descricao<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required placeholder="Ex.: Mercado" /></label><div className="fields"><label>Valor<input type="text" inputMode="numeric" autoComplete="off" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: formatAmountInput(event.target.value) })} required placeholder="0,00" aria-label="Valor em reais" /></label><label>Data<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></label></div><label>Categoria<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>{advancedReady && <><label>Conta ou cartao<select value={draft.account_id || ''} onChange={(event) => setDraft({ ...draft, account_id: event.target.value })}><option value="">Sem conta definida</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name} ({account.kind === 'card' ? 'Cartao' : 'Conta'})</option>)}</select></label><div className="financial-options"><label className="check-label"><input type="checkbox" checked={draft.installment} disabled={draft.type !== 'expense' || Boolean(draft.installment_group_id)} onChange={(event) => setDraft({ ...draft, installment: event.target.checked, installments: event.target.checked ? 2 : 1, recurring: false })} /> Compra parcelada</label><label className="check-label"><input type="checkbox" checked={draft.recurring} onChange={(event) => setDraft({ ...draft, recurring: event.target.checked, installment: false, installments: 1 })} /> Repetir mensalmente</label></div>{draft.installment && <label>Quantidade de parcelas<input type="number" min="2" max="48" disabled={Boolean(draft.installment_group_id)} value={draft.installments} onChange={(event) => setDraft({ ...draft, installments: event.target.value })} /></label>}{draft.installment_group_id && <p className="installment-note">Este item pertence a um parcelamento existente. A edicao altera somente esta parcela.</p>}</>}<button>{editing ? 'Salvar alteracoes' : 'Salvar lancamento'}</button></form></div>
}

function UsageGuide() {
  const topics = [
    { number: '01', title: 'Comece pelo painel', text: 'Escolha o mes e o ano no seletor superior. Os cards mostram saldo, entradas e saidas do periodo, enquanto os graficos permitem alternar entre linhas, barras e saldo acumulado.' },
    { number: '02', title: 'Registre uma movimentacao', text: 'Use Novo lancamento ou pressione N. Escolha entrada ou saida, informe descricao, valor, data, categoria e, se desejar, a conta ou o cartao relacionado.' },
    { number: '03', title: 'Compras parceladas', text: 'Marque Compra parcelada e escolha de 2 a 48 parcelas. O sistema distribui as parcelas nos meses seguintes. Na edicao de um parcelamento existente, somente a parcela selecionada e alterada.' },
    { number: '04', title: 'Lancamentos recorrentes', text: 'Marque Repetir mensalmente para salario, aluguel e assinaturas. O lancamento sera criado nos meses seguintes e pode ser pausado ou retomado na area de recorrencias.' },
    { number: '05', title: 'Contas e cartoes', text: 'Cadastre onde o dinheiro esta. Depois, associe cada movimentacao a uma conta ou cartao para deixar o historico mais organizado.' },
    { number: '06', title: 'Orcamentos', text: 'Defina um limite mensal por categoria. A barra mostra quanto ja foi usado e muda de estado quando o valor planejado e ultrapassado.' },
    { number: '07', title: 'Caixinhas', text: 'Crie reservas com meta opcional e registre aportes. Se nao contar como saida, o aporte aparece no historico como neutro, sem alterar saldo, graficos ou orcamentos.' },
    { number: '08', title: 'Encontre e corrija', text: 'Busque por descricao ou categoria e filtre por entradas ou saidas. Use Editar para revisar todos os campos ou X para excluir, sempre com confirmacao.' },
  ]
  return <section className="usage-page"><div className="usage-hero"><p className="eyebrow">CENTRAL DE AJUDA</p><h1>Seu dinheiro,<br /><i>sem misterio.</i></h1><p>Um guia direto para aproveitar todos os recursos do Saldo Claro.</p></div><div className="usage-start"><span>ATALHO</span><b>Pressione N em qualquer lugar do painel para criar um lancamento.</b></div><div className="usage-grid">{topics.map((topic) => <article key={topic.number}><span>{topic.number}</span><h2>{topic.title}</h2><p>{topic.text}</p></article>)}</div><aside className="usage-security"><div><p className="eyebrow">PRIVACIDADE</p><h2>Seus dados pertencem a voce.</h2></div><p>Cada conta acessa somente os proprios registros pelas politicas RLS do Supabase. Nunca compartilhe sua senha nem a chave secreta <code>service_role</code>.</p></aside></section>
}

function TransactionEntry({ item, onEdit, onRemove }) {
  const neutral = item.affects_balance === false
  const visualType = neutral ? 'neutral' : item.type
  const signal = neutral ? '' : item.type === 'income' ? '+' : '-'
  return <div className={`entry ${neutral ? 'neutral-entry' : ''}`}><span className={`entry-icon ${visualType}`}>{neutral ? '=' : signal}</span><div><strong>{item.description}</strong><small>{item.category} · {dateLabel(item.date)}{neutral ? ' · Nao altera o saldo' : ''}</small></div><b className={visualType}>{signal} {money.format(item.amount)}</b><button className="edit" onClick={() => onEdit(item)} aria-label="Editar lancamento">Editar</button><button className="delete" onClick={() => onRemove(item.id)} aria-label="Excluir lancamento">x</button></div>
}

function Dashboard({ session }) {
  const dialog = useAppDialog()
  const [view, setView] = useState('dashboard')
  const [month, setMonth] = useState(getMonthKey(new Date()))
  const [entries, setEntries] = useState([])
  const [allEntries, setAllEntries] = useState([])
  const [budgets, setBudgets] = useState([])
  const [budgetReady, setBudgetReady] = useState(true)
  const [advancedReady, setAdvancedReady] = useState(true)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const load = async () => {
    setLoading(true)
    const range = getMonthRange(month)
    const [monthly, historic, budgetResult, accountsResult, recurringResult] = await Promise.all([
      supabase.from('transactions').select('*').gte('date', range.from).lte('date', range.to).order('date', { ascending: false }),
      supabase.from('transactions').select('*').gte('date', `${changeMonth(month, -5)}-01`).lte('date', range.to).order('date', { ascending: true }),
      supabase.from('budgets').select('*').eq('month', `${month}-01`),
      supabase.from('accounts').select('*').order('created_at'),
      supabase.from('recurring_transactions').select('*').order('created_at', { ascending: false }),
    ])
    setEntries(monthly.data || [])
    setAllEntries([...(historic.data || []), { date: range.to, type: 'marker', amount: 0 }])
    if (budgetResult.error) { setBudgetReady(false); setBudgets([]) } else { setBudgetReady(true); setBudgets(budgetResult.data || []) }
    setAdvancedReady(!accountsResult.error && !recurringResult.error)
    setLoading(false)
  }
  useEffect(() => { load() }, [month])
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [view])
  useEffect(() => { const header = document.querySelector('.app-shell>header'); if (!header) return; const nav = document.createElement('nav'); nav.className = 'dashboard-nav'; const dashboardButton = document.createElement('button'); const guideButton = document.createElement('button'); dashboardButton.textContent = 'Painel'; guideButton.textContent = 'Como usar'; dashboardButton.className = view === 'dashboard' ? 'active' : ''; guideButton.className = view === 'guide' ? 'active' : ''; dashboardButton.addEventListener('click', () => setView('dashboard')); guideButton.addEventListener('click', () => setView('guide')); nav.append(dashboardButton, guideButton); header.insertBefore(nav, header.querySelector('.user')); return () => nav.remove() }, [view])
  useEffect(() => { if (view !== 'dashboard') return; const nav = document.querySelector('.month-nav'); if (!nav) return; const [selectedYear, selectedMonth] = month.split('-'); const picker = document.createElement('div'); picker.className = 'month-picker'; const monthSelect = document.createElement('select'); const yearSelect = document.createElement('select'); ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].forEach((label, index) => monthSelect.add(new Option(label, String(index + 1).padStart(2, '0'), false, String(index + 1).padStart(2, '0') === selectedMonth))); const currentYear = new Date().getFullYear(); for (let year = currentYear + 3; year >= currentYear - 10; year--) yearSelect.add(new Option(String(year), String(year), false, String(year) === selectedYear)); if (![...yearSelect.options].some((option) => option.value === selectedYear)) yearSelect.add(new Option(selectedYear, selectedYear, true, true)); const update = () => setMonth(`${yearSelect.value}-${monthSelect.value}`); monthSelect.addEventListener('change', update); yearSelect.addEventListener('change', update); picker.append(monthSelect, yearSelect); nav.insertBefore(picker, nav.lastElementChild); return () => { monthSelect.removeEventListener('change', update); yearSelect.removeEventListener('change', update); picker.remove() } }, [month, view])
  useEffect(() => { const refresh = () => load(); window.addEventListener('finance-data-changed', refresh); return () => window.removeEventListener('finance-data-changed', refresh) }, [month])
  const incomes = total(entries, 'income')
  const expenses = total(entries, 'expense')
  const previousKey = changeMonth(month, -1)
  const previous = allEntries.filter((item) => item.date.startsWith(previousKey))
  const previousExpenses = total(previous, 'expense')
  const expenseChange = previousExpenses ? Math.round(((expenses - previousExpenses) / previousExpenses) * 100) : null
  const expensesByCategory = Object.fromEntries(categories.map((category) => [category, entries.filter((item) => item.type === 'expense' && item.affects_balance !== false && item.category === category).reduce((sum, item) => sum + Number(item.amount), 0)]))
  const grouped = categories.map((category) => ({ category, amount: expensesByCategory[category] })).filter((item) => item.amount > 0)
  const largest = Math.max(...grouped.map((item) => item.amount), 1)
  const filtered = entries.filter((item) => { const neutral = item.affects_balance === false; const matchesType = typeFilter === 'all' || (typeFilter === 'neutral' ? neutral : item.type === typeFilter && !neutral); return matchesType && `${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase()) })
  useEffect(() => { const onKey = (event) => { if (document.querySelector('.app-dialog-backdrop')) return; if (event.key === 'Escape') { setModal(null); return } if (view !== 'dashboard' || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return; if (event.key.toLowerCase() === 'n') setModal({}) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [view])
  const saveTransaction = async (draft) => {
    const payload = { type: draft.type, description: draft.description, amount: draft.amount, category: draft.category, date: draft.date }
    if (advancedReady) payload.account_id = draft.account_id || null
    let result
    if (draft.id && draft.installment && !draft.installment_group_id && Number(draft.installments) > 1) {
      const startMonth = draft.date.slice(0, 7)
      const day = Number(draft.date.slice(-2))
      const groupId = crypto.randomUUID()
      const installmentData = { installment_group_id: groupId, installment_number: 1, installment_total: Number(draft.installments) }
      result = await supabase.from('transactions').update({ ...payload, ...installmentData }).eq('id', draft.id)
      if (!result.error) { const futureRows = Array.from({ length: Number(draft.installments) - 1 }, (_, index) => ({ ...payload, user_id: session.user.id, date: dateInMonth(changeMonth(startMonth, index + 1), day), installment_group_id: groupId, installment_number: index + 2, installment_total: Number(draft.installments) })); result = await supabase.from('transactions').insert(futureRows) }
    } else if (draft.id) result = await supabase.from('transactions').update(payload).eq('id', draft.id)
    else if (advancedReady && Number(draft.installments) > 1) {
      const startMonth = draft.date.slice(0, 7)
      const day = Number(draft.date.slice(-2))
      const groupId = crypto.randomUUID()
      const rows = Array.from({ length: Number(draft.installments) }, (_, index) => ({ ...payload, user_id: session.user.id, date: dateInMonth(changeMonth(startMonth, index), day), installment_group_id: groupId, installment_number: index + 1, installment_total: Number(draft.installments) }))
      result = await supabase.from('transactions').insert(rows)
    } else result = await supabase.from('transactions').insert({ ...payload, user_id: session.user.id })
    if (!result.error && advancedReady && draft.recurring) {
      const recurringResult = await supabase.from('recurring_transactions').insert({ user_id: session.user.id, type: draft.type, description: draft.description, amount: draft.amount, category: draft.category, account_id: draft.account_id || null, day_of_month: Number(draft.date.slice(-2)), start_date: draft.date, last_generated_month: `${draft.date.slice(0, 7)}-01` })
      if (recurringResult.error) await dialog.alert('O lancamento foi salvo, mas nao foi possivel criar a recorrencia.', { title: 'Recorrencia nao criada' })
    }
    if (!result.error) { setModal(null); load() }
  }
  const remove = async (id) => { if (!await dialog.confirm('Esta movimentacao sera removida do seu historico e nao podera ser recuperada.', { title: 'Excluir este lancamento?' })) return; await supabase.from('transactions').delete().eq('id', id); load() }
  const saveBudgets = async (draft) => { const rows = Object.entries(draft).filter(([, amount]) => Number(amount) > 0).map(([category, amount]) => ({ user_id: session.user.id, month: `${month}-01`, category, amount: Number(amount) })); const oldRows = budgets.map((budget) => budget.id); if (oldRows.length) await supabase.from('budgets').delete().in('id', oldRows); if (rows.length) await supabase.from('budgets').insert(rows); load() }
  if (view === 'guide') return <main className="app-shell"><header><span className="logo">saldo<span>claro</span></span><div className="user"><span>{session.user.email}</span><button className="link" onClick={() => supabase.auth.signOut()}>Sair</button></div></header><UsageGuide /></main>
  return <main className="app-shell"><header><span className="logo">saldo<span>claro</span></span><div className="user"><span>{session.user.email}</span><button className="link" onClick={() => supabase.auth.signOut()}>Sair</button></div></header><section className="hero"><div><p className="eyebrow">PAINEL FINANCEIRO</p><h1>Seu dinheiro, mais claro.</h1><p>Acompanhe seus movimentos, seus limites e o ritmo das suas financas.</p></div><button className="add" onClick={() => setModal({})}>+ Novo lancamento</button></section><nav className="month-nav"><button onClick={() => setMonth(changeMonth(month, -1))} aria-label="Mes anterior">&larr;</button><strong>{monthLabel.format(new Date(`${month}-01T12:00:00`))}</strong><button onClick={() => setMonth(changeMonth(month, 1))} aria-label="Proximo mes">&rarr;</button></nav><section className="cards"><article className="balance"><p>Saldo do mes</p><strong>{money.format(incomes - expenses)}</strong><span>{incomes >= expenses ? 'Voce esta no positivo' : 'Atencao aos gastos deste mes'}</span></article><article><p>Entradas</p><strong className="income">{money.format(incomes)}</strong><span>Receitas registradas</span></article><article><p>Saidas</p><strong className="expense">{money.format(expenses)}</strong><span>{expenseChange === null ? 'Primeiro mes com dados' : `${expenseChange > 0 ? '+' : ''}${expenseChange}% em relacao ao mes anterior`}</span></article></section><section className="insights"><div><span className="insight-mark">{expenses > incomes ? '!' : '+'}</span><p><b>{expenses > incomes ? 'Os gastos superaram as entradas.' : 'Seu mes esta equilibrado.'}</b>{grouped.length ? ` Sua maior categoria foi ${grouped.sort((a, b) => b.amount - a.amount)[0].category}, com ${money.format(grouped.sort((a, b) => b.amount - a.amount)[0].amount)}.` : ' Adicione lancamentos para receber insights.'}</p></div></section><section className="analytics-grid"><FlowChart entries={allEntries} /><article className="panel spending"><p className="eyebrow">POR CATEGORIA</p><h2>Onde voce mais gasta</h2>{grouped.length === 0 ? <p className="empty">Seus gastos por categoria aparecerao aqui.</p> : grouped.map((item) => <div className="bar-row" key={item.category}><div><span>{item.category}</span><b>{money.format(item.amount)}</b></div><i><em style={{ width: `${(item.amount / largest) * 100}%` }} /></i></div>)}</article></section><section className="lower-grid"><article className="panel transactions"><div className="panel-head"><div><p className="eyebrow">LANCAMENTOS</p><h2>Movimentacoes do mes</h2></div><span>{filtered.length} itens</span></div><div className="filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar descricao ou categoria" /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Todos os tipos</option><option value="income">Entradas</option><option value="expense">Saidas</option><option value="neutral">Neutros</option></select></div>{loading ? <p className="empty">Carregando...</p> : filtered.length === 0 ? <p className="empty">Nenhum lancamento corresponde aos filtros.</p> : <div className="entries">{filtered.map((item) => <TransactionEntry item={item} key={item.id} onEdit={setModal} onRemove={remove} />)}</div>}</article><BudgetPanel month={month} budgets={budgets} expensesByCategory={expensesByCategory} onSave={saveBudgets} ready={budgetReady} /></section>{modal && <TransactionModal entry={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveTransaction} />}</main>
}

function LoadingScreen() {
  return <main className="loading-screen"><div className="loading-aura" /><span className="logo">saldo<span>claro</span></span><div className="loading-copy"><p className="eyebrow">ORGANIZANDO SUAS FINANCAS</p><h1>Clareza leva<br /><i>um instante.</i></h1></div><div className="loading-progress"><i /><span>Preparando seu painel</span></div></main>
}

function AppContent() {
  const [session, setSession] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef(null)
  const beginSession = (next, showTransition = true) => { clearTimeout(timerRef.current); setSession(next); if (!showTransition) return setTransitioning(false); setTransitioning(true); timerRef.current = setTimeout(() => setTransitioning(false), 3000) }
  useEffect(() => { if (!configured) return; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: listener } = supabase.auth.onAuthStateChange((event, next) => { if (event === 'SIGNED_OUT') beginSession(null, false); if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && next) setSession(next) }); return () => { clearTimeout(timerRef.current); listener.subscription.unsubscribe() } }, [])
  if (!configured) return <main className="setup"><span className="logo">saldo<span>claro</span></span><h1>Conecte seu Supabase</h1><p>Copie <code>.env.example</code> para <code>.env</code>, informe a URL e a chave anon publica do seu projeto. Depois execute o SQL em <code>supabase/schema.sql</code>.</p></main>
  if (transitioning) return <LoadingScreen />
  return session ? <Dashboard session={session} /> : <Auth onSession={beginSession} />
}

export default function App() {
  return <DialogProvider><AppContent /></DialogProvider>
}
