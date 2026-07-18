import { useEffect, useState } from 'react'
import { configured, supabase } from './supabase'

const categories = ['Moradia', 'Alimentacao', 'Transporte', 'Lazer', 'Saude', 'Educacao', 'Assinaturas', 'Outros']
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const today = new Date().toISOString().slice(0, 10)
const emptyEntry = { type: 'expense', description: '', amount: '', category: 'Alimentacao', date: today }

function Auth({ onSession }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup') setMessage('Conta criada. Confira seu e-mail para confirmar o acesso.')
    else onSession(result.data.session)
  }
  return <main className="auth-shell"><section className="auth-intro"><p className="eyebrow">FINANCAS PESSOAIS</p><h1>Dinheiro em ordem.<br />Mente tranquila.</h1><p>Um espaço simples e seguro para entender para onde seu dinheiro vai.</p><div className="orb" /></section><section className="auth-card"><span className="logo">saldo<span>claro</span></span><h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Comece sem complicacao'}</h2><p className="muted">{mode === 'login' ? 'Entre para ver seu resumo financeiro.' : 'Crie sua conta gratuita em poucos segundos.'}</p><form onSubmit={submit}><label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Senha<input type="password" minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{message && <p className="form-message">{message}</p>}<button>{mode === 'login' ? 'Entrar' : 'Criar conta'}</button></form><p className="switch">{mode === 'login' ? 'Ainda nao tem uma conta?' : 'Ja possui uma conta?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Cadastre-se' : 'Entrar'}</button></p></section></main>
}

function Dashboard({ session }) {
  const [entries, setEntries] = useState([])
  const [entry, setEntry] = useState(emptyEntry)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false }); setEntries(data || []); setLoading(false) }
  useEffect(() => { load() }, [])
  const incomes = entries.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
  const expenses = entries.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
  const save = async (event) => { event.preventDefault(); const { error } = await supabase.from('transactions').insert({ ...entry, amount: Number(entry.amount), user_id: session.user.id }); if (!error) { setEntry(emptyEntry); setOpen(false); load() } }
  const remove = async (id) => { await supabase.from('transactions').delete().eq('id', id); setEntries((items) => items.filter((item) => item.id !== id)) }
  const grouped = categories.map((category) => ({ category, amount: entries.filter((item) => item.type === 'expense' && item.category === category).reduce((sum, item) => sum + Number(item.amount), 0) })).filter((item) => item.amount > 0)
  const largest = Math.max(...grouped.map((item) => item.amount), 1)
  return <main className="app-shell"><header><span className="logo">saldo<span>claro</span></span><div className="user"><span>{session.user.email}</span><button className="link" onClick={() => supabase.auth.signOut()}>Sair</button></div></header><section className="hero"><div><p className="eyebrow">VISÃO GERAL</p><h1>Seu dinheiro, mais claro.</h1><p>Registre o que entra e sai. O restante fica facil de enxergar.</p></div><button className="add" onClick={() => setOpen(true)}>+ Novo lancamento</button></section><section className="cards"><article className="balance"><p>Saldo atual</p><strong>{money.format(incomes - expenses)}</strong><span>{incomes >= expenses ? 'Voce esta no positivo' : 'Atencao aos gastos este mes'}</span></article><article><p>Entradas</p><strong className="income">{money.format(incomes)}</strong><span>Total registrado</span></article><article><p>Saidas</p><strong className="expense">{money.format(expenses)}</strong><span>Total registrado</span></article></section><section className="content-grid"><article className="panel"><div className="panel-head"><div><p className="eyebrow">LANCAMENTOS</p><h2>Movimentacoes recentes</h2></div><span>{entries.length} itens</span></div>{loading ? <p className="empty">Carregando...</p> : entries.length === 0 ? <p className="empty">Nenhum lancamento ainda. Comece adicionando sua primeira movimentacao.</p> : <div className="entries">{entries.map((item) => <div className="entry" key={item.id}><span className={`entry-icon ${item.type}`}>{item.type === 'income' ? '+' : '-'}</span><div><strong>{item.description}</strong><small>{item.category} · {new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR')}</small></div><b className={item.type}>{item.type === 'income' ? '+' : '-'} {money.format(item.amount)}</b><button className="delete" onClick={() => remove(item.id)} aria-label="Excluir lancamento">x</button></div>)}</div>}</article><article className="panel spending"><p className="eyebrow">POR CATEGORIA</p><h2>Onde voce mais gasta</h2>{grouped.length === 0 ? <p className="empty">Seus gastos por categoria aparecerao aqui.</p> : grouped.map((item) => <div className="bar-row" key={item.category}><div><span>{item.category}</span><b>{money.format(item.amount)}</b></div><i><em style={{ width: `${(item.amount / largest) * 100}%` }} /></i></div>)}</article></section>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><button className="close" type="button" onClick={() => setOpen(false)}>x</button><p className="eyebrow">NOVO LANCAMENTO</p><h2>Registrar movimentacao</h2><div className="type-picker"><button type="button" className={entry.type === 'expense' ? 'active expense-bg' : ''} onClick={() => setEntry({ ...entry, type: 'expense' })}>Saida</button><button type="button" className={entry.type === 'income' ? 'active income-bg' : ''} onClick={() => setEntry({ ...entry, type: 'income' })}>Entrada</button></div><label>Descricao<input value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })} required placeholder="Ex.: Mercado" /></label><div className="fields"><label>Valor<input type="number" step="0.01" min="0.01" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} required placeholder="0,00" /></label><label>Data<input type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} required /></label></div><label>Categoria<select value={entry.category} onChange={(e) => setEntry({ ...entry, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><button>Salvar lancamento</button></form></div>}</main>
}

export default function App() {
  const [session, setSession] = useState(null)
  useEffect(() => { if (!configured) return; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => listener.subscription.unsubscribe() }, [])
  if (!configured) return <main className="setup"><span className="logo">saldo<span>claro</span></span><h1>Conecte seu Supabase</h1><p>Copie <code>.env.example</code> para <code>.env</code>, informe a URL e a chave anon publica do seu projeto. Depois execute o SQL em <code>supabase/schema.sql</code>.</p></main>
  return session ? <Dashboard session={session} /> : <Auth onSession={setSession} />
}
