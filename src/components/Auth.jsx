import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Zap
} from 'lucide-react'
import { supabase } from '../supabase'
import { Logo } from './ui'

export function Auth({ onSession }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setMessage(
            error.message === 'Invalid login credentials'
              ? 'E-mail ou senha incorretos. Confira seus dados.'
              : error.message
          )
        } else if (data.session) {
          onSession(data.session)
        }
      } else {
        const trimmedName = name.trim()
        if (!trimmedName) {
          setMessage('Por favor, informe seu nome para o cadastro.')
          setSubmitting(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: trimmedName
            }
          }
        })
        if (error) {
          setMessage(error.message)
        } else if (data.session) {
          try {
            await supabase.from('profiles').upsert({
              id: data.session.user.id,
              name: trimmedName
            })
          } catch (e) {
            console.warn('Erro ao salvar profile inicial:', e)
          }
          onSession(data.session)
        } else {
          setMessage('Conta criada com sucesso! Confira sua caixa de entrada para confirmar o e-mail.')
        }
      }
    } catch {
      setMessage('Falha na conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Left Side: Brand presentation */}
        <section className="auth-brand-side">
          <Logo light />

          <div className="auth-brand-content">
            <span className="badge-pill">CONTROLE FINANCEIRO INTELIGENTE</span>
            <h1>Clareza total para o seu dinheiro.</h1>
            <p>
              Acompanhe entradas, gastos, parcelamentos e metas em uma interface rápida, segura e elegante.
            </p>

            <div className="auth-features-list">
              <div className="feature-item">
                <span className="feature-icon"><ShieldCheck size={20} /></span>
                <div>
                  <strong>Segurança e privacidade</strong>
                  <small>Seus dados isolados com criptografia e RLS no Supabase</small>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><Activity size={20} /></span>
                <div>
                  <strong>Metas e Previsões</strong>
                  <small>Saúde financeira, caixinhas e orçamentos em tempo real</small>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><Zap size={20} /></span>
                <div>
                  <strong>Rápido e sem burocracia</strong>
                  <small>Adicione lançamentos em segundos pelo celular ou computador</small>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>Saldo Claro</span>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="auth-form-side">
          <div className="auth-card-clean">
            <div className="auth-header-mobile">
              <Logo />
            </div>

            <div className="auth-headings">
              <h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
              <p className="text-muted">
                {mode === 'login'
                  ? 'Acesse seu painel para gerenciar seus gastos.'
                  : 'Comece a ter controle financeiro em menos de um minuto.'}
              </p>
            </div>

            <form onSubmit={submit} className="auth-form">
              {mode === 'signup' && (
                <div className="field">
                  <span>Seu Nome</span>
                  <div className="input-with-icon">
                    <span className="field-icon"><User size={16} /></span>
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Como prefere ser chamado?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                      required
                      maxLength={60}
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <span>E-mail</span>
                <div className="input-with-icon">
                  <span className="field-icon"><Mail size={16} /></span>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <span>Senha</span>
                <div className="input-with-icon">
                  <span className="field-icon"><Lock size={16} /></span>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="Mínimo de 6 caracteres"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    aria-label="Alternar visualização da senha"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`auth-alert ${message.includes('sucesso') ? 'success' : 'error'}`} role="alert">
                  {message.includes('sucesso') ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? 'Aguarde...' : mode === 'login' ? 'Entrar na conta' : 'Criar minha conta'}
              </button>
            </form>

            <div className="auth-toggle-mode">
              <span>{mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta cadastrada?'}</span>
              <button
                type="button"
                className="link-btn"
                disabled={submitting}
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setMessage('')
                }}
              >
                {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
