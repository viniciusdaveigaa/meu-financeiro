import { useEffect, useRef, useState } from 'react'
import { configured, supabase } from './supabase'

const categories = ['Salario', 'Caixinha', 'Moradia', 'Alimentacao', 'Transporte', 'Lazer', 'Saude', 'Educacao', 'Assinaturas', 'Outros']
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const isoToday = new Date().toISOString().slice(0, 10)
const emptyEntry = { type: 'expense', description: '', amount: '', category: 'Alimentacao', date: isoToday, account_id: '', installments: 1, recurring: false }
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' })

function getMonthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` }
function changeMonth(value, direction) { const date = new Date(`${value}-01T12:00:00`); date.setMonth(date.getMonth() + direction); return getMonthKey(date) }
function getMonthRange(value) { const [year, month] = value.split('-').map(Number); return { from: `${value}-01`, to: new Date(year, month, 0).toISOString().slice(0, 10) } }
function dateInMonth(value, day) { const [year, month] = value.split('-').map(Number); const safeDay = Math.min(day, new Date(year, month, 0).getDate()); return `${value}-${String(safeDay).padStart(2, '0')}` }
function dateLabel(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') }
function total(items, type) { return items.filter((item) => item.type === type).reduce((sum, item) => sum + Number(item.amount), 0) }

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
  const [boxes, setBoxes] = useState([])
  const [contributions, setContributions] = useState([])
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [amounts, setAmounts] = useState({})
  const [ready, setReady] = useState(true)
  const load = async () => { const [boxResult, contributionResult] = await Promise.all([supabase.from('savings_boxes').select('*').order('created_at'), supabase.from('savings_contributions').select('*')]); if (boxResult.error || contributionResult.error) { setReady(false); return } setReady(true); setBoxes(boxResult.data || []); setContributions(contributionResult.data || []) }
  useEffect(() => { load() }, [])
  const createBox = async (event) => { event.preventDefault(); if (!name.trim()) return; const { data } = await supabase.auth.getUser(); const { error } = await supabase.from('savings_boxes').insert({ user_id: data.user.id, name: name.trim(), target_amount: target ? Number(target) : null }); if (!error) { setName(''); setTarget(''); load() } }
  const contribute = async (box) => { const amount = Number(amounts[box.id]); if (!(amount > 0)) return; const { error } = await supabase.rpc('add_savings_contribution', { p_box_id: box.id, p_amount: amount, p_date: isoToday }); if (error) return window.alert(error.message); setAmounts({ ...amounts, [box.id]: '' }); await load(); window.dispatchEvent(new Event('finance-data-changed')) }
  const removeBox = async (id) => { if (!window.confirm('Excluir esta caixinha e o historico de aportes? As saidas financeiras serao mantidas.')) return; await supabase.from('savings_boxes').delete().eq('id', id); load() }
  if (!ready) return <section className="savings-disabled"><p className="empty">Execute a migration <code>003_savings_boxes.sql</code> para ativar as caixinhas.</p></section>
  return <section className="savings"><div className="savings-head"><div><p className="eyebrow">CAIXINHAS</p><h3>Dinheiro reservado</h3></div><span>{money.format(contributions.reduce((sum, item) => sum + Number(item.amount), 0))}</span></div><div className="savings-grid">{boxes.map((box) => { const saved = contributions.filter((item) => item.box_id === box.id).reduce((sum, item) => sum + Number(item.amount), 0); const progress = box.target_amount ? Math.min((saved / Number(box.target_amount)) * 100, 100) : 0; return <article className="saving-box" key={box.id}><button className="saving-remove" onClick={() => removeBox(box.id)}>x</button><span className="saving-icon">$</span><b>{box.name}</b><strong>{money.format(saved)}</strong>{box.target_amount && <><small>Meta: {money.format(box.target_amount)}</small><i><em style={{ width: `${progress}%` }} /></i></>}<div><input type="number" min="0.01" step="0.01" placeholder="Valor do aporte" value={amounts[box.id] || ''} onChange={(event) => setAmounts({ ...amounts, [box.id]: event.target.value })} /><button onClick={() => contribute(box)}>Guardar</button></div></article> })}</div><form className="new-saving" onSubmit={createBox}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da nova caixinha" /><input type="number" min="0.01" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Meta (opcional)" /><button>Criar caixinha</button></form></section>
}

function AdvancedPanel() {
  const [accounts, setAccounts] = useState([])
  const [recurring, setRecurring] = useState([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState('account')
  const [ready, setReady] = useState(true)
  const load = async () => { const [accountResult, recurringResult] = await Promise.all([supabase.from('accounts').select('*').order('created_at'), supabase.from('recurring_transactions').select('*').order('created_at', { ascending: false })]); if (accountResult.error || recurringResult.error) { setReady(false); return } setReady(true); setAccounts(accountResult.data || []); setRecurring(recurringResult.data || []) }
  useEffect(() => { load() }, [])
  useEffect(() => { const run = async () => { const monthKey = getMonthKey(new Date()); const currentMonth = `${monthKey}-01`; const due = recurring.filter((item) => item.active && item.start_date <= currentMonth && (!item.last_generated_month || item.last_generated_month < currentMonth)); if (!due.length) return; let generated = false; for (const item of due) { const { error } = await supabase.from('transactions').insert({ user_id: item.user_id, account_id: item.account_id, type: item.type, description: item.description, amount: item.amount, category: item.category, date: dateInMonth(monthKey, item.day_of_month) }); if (!error) { await supabase.from('recurring_transactions').update({ last_generated_month: currentMonth }).eq('id', item.id); generated = true } } if (generated) window.dispatchEvent(new Event('finance-data-changed')); load() }; run() }, [recurring])
  const add = async (event) => { event.preventDefault(); if (!name.trim()) return; const { data } = await supabase.auth.getUser(); const { error } = await supabase.from('accounts').insert({ name: name.trim(), kind, user_id: data.user.id }); if (!error) { setName(''); load() } }
  const removeAccount = async (id) => { if (!window.confirm('Excluir esta conta ou cartao? Os lancamentos serao mantidos.')) return; await supabase.from('accounts').delete().eq('id', id); load() }
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
  const [draft, setDraft] = useState(entry ? { ...entry, installments: 1, recurring: false } : emptyEntry)
  const [accounts, setAccounts] = useState([])
  const [advancedReady, setAdvancedReady] = useState(false)
  const editing = Boolean(entry?.id)
  useEffect(() => { supabase.from('accounts').select('*').order('created_at').then(({ data, error }) => { setAdvancedReady(!error); setAccounts(data || []) }) }, [])
  const submit = (event) => { event.preventDefault(); onSave({ ...draft, amount: Number(draft.amount) }) }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><button className="close" type="button" onClick={onClose}>x</button><p className="eyebrow">{editing ? 'EDITAR LANCAMENTO' : 'NOVO LANCAMENTO'}</p><h2>{editing ? 'Atualize a movimentacao' : 'Registrar movimentacao'}</h2><div className="type-picker"><button type="button" className={draft.type === 'expense' ? 'active expense-bg' : ''} onClick={() => setDraft({ ...draft, type: 'expense' })}>Saida</button><button type="button" className={draft.type === 'income' ? 'active income-bg' : ''} onClick={() => setDraft({ ...draft, type: 'income' })}>Entrada</button></div><label>Descricao<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required placeholder="Ex.: Mercado" /></label><div className="fields"><label>Valor<input type="number" step="0.01" min="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} required placeholder="0,00" /></label><label>Data<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></label></div><label>Categoria<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>{advancedReady && <><label>Conta ou cartao<select value={draft.account_id || ''} onChange={(event) => setDraft({ ...draft, account_id: event.target.value })}><option value="">Sem conta definida</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name} ({account.kind === 'card' ? 'Cartao' : 'Conta'})</option>)}</select></label>{!editing && <div className="fields"><label>Parcelas<input type="number" min="1" max="48" value={draft.installments} onChange={(event) => setDraft({ ...draft, installments: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={draft.recurring} onChange={(event) => setDraft({ ...draft, recurring: event.target.checked, installments: 1 })} /> Repetir mensalmente</label></div>}</>}<button>{editing ? 'Salvar alteracoes' : 'Salvar lancamento'}</button></form></div>
}

function Dashboard({ session }) {
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
  useEffect(() => { const nav = document.querySelector('.month-nav'); if (!nav) return; const [selectedYear, selectedMonth] = month.split('-'); const picker = document.createElement('div'); picker.className = 'month-picker'; const monthSelect = document.createElement('select'); const yearSelect = document.createElement('select'); ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].forEach((label, index) => monthSelect.add(new Option(label, String(index + 1).padStart(2, '0'), false, String(index + 1).padStart(2, '0') === selectedMonth))); const currentYear = new Date().getFullYear(); for (let year = currentYear + 3; year >= currentYear - 10; year--) yearSelect.add(new Option(String(year), String(year), false, String(year) === selectedYear)); if (![...yearSelect.options].some((option) => option.value === selectedYear)) yearSelect.add(new Option(selectedYear, selectedYear, true, true)); const update = () => setMonth(`${yearSelect.value}-${monthSelect.value}`); monthSelect.addEventListener('change', update); yearSelect.addEventListener('change', update); picker.append(monthSelect, yearSelect); nav.insertBefore(picker, nav.lastElementChild); return () => { monthSelect.removeEventListener('change', update); yearSelect.removeEventListener('change', update); picker.remove() } }, [month])
  useEffect(() => { const refresh = () => load(); window.addEventListener('finance-data-changed', refresh); return () => window.removeEventListener('finance-data-changed', refresh) }, [month])
  const incomes = total(entries, 'income')
  const expenses = total(entries, 'expense')
  const previousKey = changeMonth(month, -1)
  const previous = allEntries.filter((item) => item.date.startsWith(previousKey))
  const previousExpenses = total(previous, 'expense')
  const expenseChange = previousExpenses ? Math.round(((expenses - previousExpenses) / previousExpenses) * 100) : null
  const expensesByCategory = Object.fromEntries(categories.map((category) => [category, entries.filter((item) => item.type === 'expense' && item.category === category).reduce((sum, item) => sum + Number(item.amount), 0)]))
  const grouped = categories.map((category) => ({ category, amount: expensesByCategory[category] })).filter((item) => item.amount > 0)
  const largest = Math.max(...grouped.map((item) => item.amount), 1)
  const filtered = entries.filter((item) => (typeFilter === 'all' || item.type === typeFilter) && `${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase()))
  useEffect(() => { const onKey = (event) => { if (event.key === 'Escape') { setModal(null); return } if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return; if (event.key.toLowerCase() === 'n') setModal({}) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [])
  const saveTransaction = async (draft) => {
    const payload = { type: draft.type, description: draft.description, amount: draft.amount, category: draft.category, date: draft.date }
    if (advancedReady) payload.account_id = draft.account_id || null
    let result
    if (draft.id) result = await supabase.from('transactions').update(payload).eq('id', draft.id)
    else if (advancedReady && Number(draft.installments) > 1) {
      const startMonth = draft.date.slice(0, 7)
      const day = Number(draft.date.slice(-2))
      const groupId = crypto.randomUUID()
      const rows = Array.from({ length: Number(draft.installments) }, (_, index) => ({ ...payload, user_id: session.user.id, date: dateInMonth(changeMonth(startMonth, index), day), installment_group_id: groupId, installment_number: index + 1, installment_total: Number(draft.installments) }))
      result = await supabase.from('transactions').insert(rows)
    } else result = await supabase.from('transactions').insert({ ...payload, user_id: session.user.id })
    if (!result.error && advancedReady && draft.recurring && !draft.id) {
      const recurringResult = await supabase.from('recurring_transactions').insert({ user_id: session.user.id, type: draft.type, description: draft.description, amount: draft.amount, category: draft.category, account_id: draft.account_id || null, day_of_month: Number(draft.date.slice(-2)), start_date: draft.date, last_generated_month: `${draft.date.slice(0, 7)}-01` })
      if (recurringResult.error) window.alert('O lancamento foi salvo, mas nao foi possivel criar a recorrencia.')
    }
    if (!result.error) { setModal(null); load() }
  }
  const remove = async (id) => { if (!window.confirm('Excluir este lancamento?')) return; await supabase.from('transactions').delete().eq('id', id); load() }
  const saveBudgets = async (draft) => { const rows = Object.entries(draft).filter(([, amount]) => Number(amount) > 0).map(([category, amount]) => ({ user_id: session.user.id, month: `${month}-01`, category, amount: Number(amount) })); const oldRows = budgets.map((budget) => budget.id); if (oldRows.length) await supabase.from('budgets').delete().in('id', oldRows); if (rows.length) await supabase.from('budgets').insert(rows); load() }
  return <main className="app-shell"><header><span className="logo">saldo<span>claro</span></span><div className="user"><span>{session.user.email}</span><button className="link" onClick={() => supabase.auth.signOut()}>Sair</button></div></header><section className="hero"><div><p className="eyebrow">PAINEL FINANCEIRO</p><h1>Seu dinheiro, mais claro.</h1><p>Acompanhe seus movimentos, seus limites e o ritmo das suas financas.</p></div><button className="add" onClick={() => setModal({})}>+ Novo lancamento</button></section><nav className="month-nav"><button onClick={() => setMonth(changeMonth(month, -1))} aria-label="Mes anterior">&larr;</button><strong>{monthLabel.format(new Date(`${month}-01T12:00:00`))}</strong><button onClick={() => setMonth(changeMonth(month, 1))} aria-label="Proximo mes">&rarr;</button></nav><section className="cards"><article className="balance"><p>Saldo do mes</p><strong>{money.format(incomes - expenses)}</strong><span>{incomes >= expenses ? 'Voce esta no positivo' : 'Atencao aos gastos deste mes'}</span></article><article><p>Entradas</p><strong className="income">{money.format(incomes)}</strong><span>Receitas registradas</span></article><article><p>Saidas</p><strong className="expense">{money.format(expenses)}</strong><span>{expenseChange === null ? 'Primeiro mes com dados' : `${expenseChange > 0 ? '+' : ''}${expenseChange}% em relacao ao mes anterior`}</span></article></section><section className="insights"><div><span className="insight-mark">{expenses > incomes ? '!' : '+'}</span><p><b>{expenses > incomes ? 'Os gastos superaram as entradas.' : 'Seu mes esta equilibrado.'}</b>{grouped.length ? ` Sua maior categoria foi ${grouped.sort((a, b) => b.amount - a.amount)[0].category}, com ${money.format(grouped.sort((a, b) => b.amount - a.amount)[0].amount)}.` : ' Adicione lancamentos para receber insights.'}</p></div></section><section className="analytics-grid"><FlowChart entries={allEntries} /><article className="panel spending"><p className="eyebrow">POR CATEGORIA</p><h2>Onde voce mais gasta</h2>{grouped.length === 0 ? <p className="empty">Seus gastos por categoria aparecerao aqui.</p> : grouped.map((item) => <div className="bar-row" key={item.category}><div><span>{item.category}</span><b>{money.format(item.amount)}</b></div><i><em style={{ width: `${(item.amount / largest) * 100}%` }} /></i></div>)}</article></section><section className="lower-grid"><article className="panel transactions"><div className="panel-head"><div><p className="eyebrow">LANCAMENTOS</p><h2>Movimentacoes do mes</h2></div><span>{filtered.length} itens</span></div><div className="filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar descricao ou categoria" /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Todos os tipos</option><option value="income">Entradas</option><option value="expense">Saidas</option></select></div>{loading ? <p className="empty">Carregando...</p> : filtered.length === 0 ? <p className="empty">Nenhum lancamento corresponde aos filtros.</p> : <div className="entries">{filtered.map((item) => <div className="entry" key={item.id}><span className={`entry-icon ${item.type}`}>{item.type === 'income' ? '+' : '-'}</span><div><strong>{item.description}</strong><small>{item.category} · {dateLabel(item.date)}</small></div><b className={item.type}>{item.type === 'income' ? '+' : '-'} {money.format(item.amount)}</b><button className="edit" onClick={() => setModal(item)} aria-label="Editar lancamento">Editar</button><button className="delete" onClick={() => remove(item.id)} aria-label="Excluir lancamento">x</button></div>)}</div>}</article><BudgetPanel month={month} budgets={budgets} expensesByCategory={expensesByCategory} onSave={saveBudgets} ready={budgetReady} /></section>{modal && <TransactionModal entry={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveTransaction} />}</main>
}

function LoadingScreen() {
  return <main className="loading-screen"><div className="loading-aura" /><span className="logo">saldo<span>claro</span></span><div className="loading-copy"><p className="eyebrow">ORGANIZANDO SUAS FINANCAS</p><h1>Clareza leva<br /><i>um instante.</i></h1></div><div className="loading-progress"><i /><span>Preparando seu painel</span></div></main>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [transitioning, setTransitioning] = useState(true)
  const timerRef = useRef(null)
  const beginSession = (next, showTransition = true) => { clearTimeout(timerRef.current); setSession(next); if (!showTransition) return setTransitioning(false); setTransitioning(true); timerRef.current = setTimeout(() => setTransitioning(false), 3000) }
  useEffect(() => { if (!configured) return; supabase.auth.getSession().then(({ data }) => beginSession(data.session)); const { data: listener } = supabase.auth.onAuthStateChange((event, next) => { if (event === 'SIGNED_IN') beginSession(next); if (event === 'SIGNED_OUT') beginSession(null, false) }); return () => { clearTimeout(timerRef.current); listener.subscription.unsubscribe() } }, [])
  if (!configured) return <main className="setup"><span className="logo">saldo<span>claro</span></span><h1>Conecte seu Supabase</h1><p>Copie <code>.env.example</code> para <code>.env</code>, informe a URL e a chave anon publica do seu projeto. Depois execute o SQL em <code>supabase/schema.sql</code>.</p></main>
  if (transitioning) return <LoadingScreen />
  return session ? <Dashboard session={session} /> : <Auth onSession={beginSession} />
}
