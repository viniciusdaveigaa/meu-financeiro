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
import { validatePasswordStrength } from '../utils/formatters'
import { Logo } from './ui'

export function Auth({ onSession }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleGoogleLogin = async () => {
    setMessage('')
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) {
        setMessage('Erro ao conectar com o Google: ' + error.message)
      }
    } catch {
      setMessage('Falha na conexão com o Google. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

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

        const pwdErr = validatePasswordStrength(password)
        if (pwdErr) {
          setMessage(pwdErr)
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
          if (
            error.message.toLowerCase().includes('password') ||
            error.message.toLowerCase().includes('least') ||
            error.message.toLowerCase().includes('character')
          ) {
            setMessage('A senha deve ter no mínimo 9 caracteres e conter letra maiúscula, minúscula, número e símbolo.')
          } else {
            setMessage(error.message)
          }
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

            {/* Login com o Google */}
            <button
              type="button"
              className="btn-google-auth"
              onClick={handleGoogleLogin}
              disabled={submitting}
              title="Continuar com a sua conta Google"
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'login' ? 'Continuar com o Google' : 'Cadastrar com o Google'}</span>
            </button>

            <div className="auth-divider">
              <span>ou use seu e-mail</span>
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
                    placeholder={mode === 'login' ? 'Digite sua senha' : 'Mínimo de 9 caracteres'}
                    minLength={mode === 'login' ? 1 : 9}
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
                {mode === 'signup' && (
                  <small className="field-hint">
                    Mínimo de 9 caracteres com letras maiúsculas, minúsculas, números e símbolos.
                  </small>
                )}
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
