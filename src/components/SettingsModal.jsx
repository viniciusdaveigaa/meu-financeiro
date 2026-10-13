import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Mail,
  Save,
  Scale,
  ShieldCheck,
  User,
  X
} from 'lucide-react'
import { supabase } from '../supabase'
import { greeting, validatePasswordStrength } from '../utils/formatters'
import { CURRENT_LEGAL_DATE, CURRENT_TERMS_VERSION } from '../constants/legalDocuments'

export function SettingsModal({
  currentName = '',
  currentEmail = '',
  userId = '',
  isGoogleUser = false,
  onClose,
  onProfileUpdated,
  onOpenPrivacy
}) {
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'email' | 'password'

  // Profile / Name state
  const [name, setName] = useState(currentName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameError, setNameError] = useState('')

  // Email state
  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailError, setEmailError] = useState('')

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Handle Save Name
  const handleSaveName = async (e) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess('')

    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Informe um nome válido.')
      return
    }

    setNameSaving(true)
    try {
      // 1. Atualiza nos metadados do auth
      const { data: authData, error: authErr } = await supabase.auth.updateUser({
        data: { name: trimmed }
      })

      if (authErr) throw authErr

      // 2. Atualiza na tabela profiles
      if (userId) {
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            name: trimmed
          })
        } catch (tableErr) {
          console.warn('Aviso: profiles table update:', tableErr)
        }
      }

      setNameSuccess('Nome atualizado com sucesso!')
      if (onProfileUpdated) {
        onProfileUpdated({ name: trimmed })
      }
    } catch (err) {
      setNameError(err.message || 'Erro ao atualizar nome.')
    } finally {
      setNameSaving(false)
    }
  }

  // Handle Save Email
  const handleSaveEmail = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')

    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Informe um e-mail válido.')
      return
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setEmailError('O novo e-mail deve ser diferente do e-mail atual.')
      return
    }

    setEmailSaving(true)
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: trimmed
      })

      if (error) throw error

      setEmailSuccess(
        'Solicitação de alteração enviada! Verifique a caixa de entrada do seu novo e-mail para confirmar a alteração.'
      )
      setNewEmail('')
      if (onProfileUpdated && data?.user?.email) {
        onProfileUpdated({ email: data.user.email })
      }
    } catch (err) {
      setEmailError(err.message || 'Erro ao solicitar alteração de e-mail.')
    } finally {
      setEmailSaving(false)
    }
  }

  // Handle Save Password
  const handleSavePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    const pwdErr = validatePasswordStrength(newPassword)
    if (pwdErr) {
      setPasswordError(pwdErr)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas digitadas não coincidem.')
      return
    }

    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        if (
          error.message.toLowerCase().includes('password') ||
          error.message.toLowerCase().includes('least') ||
          error.message.toLowerCase().includes('character')
        ) {
          throw new Error('A nova senha deve ter no mínimo 9 caracteres e conter letra maiúscula, minúscula, número e símbolo.')
        }
        throw error
      }

      setPasswordSuccess('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message || 'Erro ao alterar senha.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const firstName = name.trim().split(' ')[0] || 'você'

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-sheet settings-modal-sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <header className="modal-head">
          <div className="settings-head-title">
            <span className="settings-icon-badge">
              <User size={20} />
            </span>
            <div className="settings-head-text">
              <h3>Configurações da Conta</h3>
              <p>Gerencie seu nome de exibição, e-mail de acesso e credenciais de segurança.</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn modal-close-btn"
            onClick={onClose}
            aria-label="Fechar configurações"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        {/* Settings Navigation Cards Grid (Padronizado) */}
        <div className="settings-cards-grid" role="tablist" aria-label="Opções de configurações da conta">
          {/* Card 1: Dados da conta */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            className={`settings-nav-card ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="settings-card-icon-box">
              <User size={18} />
            </div>
            <div className="settings-card-content">
              <strong className="settings-card-title">Dados da conta</strong>
              <span className="settings-card-desc">Nome de exibição</span>
            </div>
          </button>

          {/* Card 2: E-mail */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'email'}
            className={`settings-nav-card ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <div className="settings-card-icon-box">
              <Mail size={18} />
            </div>
            <div className="settings-card-content">
              <strong className="settings-card-title">E-mail</strong>
              <span className="settings-card-desc">
                {isGoogleUser ? 'Conta Google' : 'E-mail de acesso'}
              </span>
            </div>
          </button>

          {/* Card 3: Senha */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'password'}
            className={`settings-nav-card ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <div className="settings-card-icon-box">
              <Lock size={18} />
            </div>
            <div className="settings-card-content">
              <strong className="settings-card-title">Senha</strong>
              <span className="settings-card-desc">
                {isGoogleUser ? 'Login Google' : 'Chave de segurança'}
              </span>
            </div>
          </button>
        </div>

        <div className="settings-modal-body">
          {/* TAB 1: MEU PERFIL (NOME) */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveName} className="settings-form-pane">
              <div className="settings-info-box">
                <p>
                  O seu nome será usado para personalizar o painel inicial e cumprimentá-lo no início de cada sessão.
                </p>
                <div className="settings-preview-greeting">
                  <span className="preview-label">Como aparecerá na página inicial:</span>
                  <strong>{greeting()}, <span className="highlight-name">{firstName}</span>! 👋</strong>
                </div>
              </div>

              {nameSuccess && (
                <div className="auth-alert success" role="alert">
                  <CheckCircle2 size={16} />
                  <span>{nameSuccess}</span>
                </div>
              )}
              {nameError && (
                <div className="auth-alert error" role="alert">
                  <AlertCircle size={16} />
                  <span>{nameError}</span>
                </div>
              )}

              <div className="field">
                <label htmlFor="settings-name-input">
                  <span>Nome completo</span>
                </label>
                <div className="input-with-icon">
                  <span className="field-icon"><User size={16} /></span>
                  <input
                    id="settings-name-input"
                    type="text"
                    required
                    placeholder="Ex.: Vinicius da Veiga"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    disabled={nameSaving}
                  />
                </div>
              </div>

              <div className="field">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>E-mail cadastrado</span>
                  {isGoogleUser && (
                    <span className="google-badge-pill">
                      <svg viewBox="0 0 24 24" width="13" height="13">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Conectado com o Google
                    </span>
                  )}
                </div>
                <div className="input-with-icon">
                  <span className="field-icon"><Mail size={16} /></span>
                  <input
                    type="text"
                    value={currentEmail}
                    disabled
                    readOnly
                    className="input-disabled"
                  />
                </div>
                {isGoogleUser ? (
                  <small className="field-hint">
                    Seu e-mail e credenciais de acesso são protegidos diretamente pela sua <strong>Conta Google</strong>.
                  </small>
                ) : (
                  <small className="field-hint">
                    Para alterar seu e-mail de acesso, acesse a aba <strong>E-mail</strong> acima.
                  </small>
                )}
              </div>

              <div className="modal-foot-settings">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={nameSaving || !name.trim() || name.trim() === currentName}
                >
                  <Save size={15} />
                  {nameSaving ? 'Salvando...' : 'Salvar Nome'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: E-MAIL */}
          {activeTab === 'email' && (
            isGoogleUser ? (
              <div className="google-auth-notice-card">
                <div className="notice-icon-wrapper">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <h4>E-mail vinculado ao Google</h4>
                <p>
                  Sua conta está conectada através do login oficial do Google. O e-mail associado ao seu acesso é:
                </p>
                <div className="google-account-badge">
                  <Mail size={15} />
                  <span>{currentEmail}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                  A alteração direta de e-mail fica desabilitada no app para manter a sincronização com seu login do Google.
                </p>
                <a
                  href="https://myaccount.google.com/email"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="google-auth-link-btn"
                >
                  Gerenciar e-mail na Conta Google ↗
                </a>
              </div>
            ) : (
              <form onSubmit={handleSaveEmail} className="settings-form-pane">
                <div className="settings-info-box">
                  <p>
                    Ao trocar de e-mail, uma mensagem de confirmação será enviada para o novo endereço antes que a alteração seja concluída.
                  </p>
                </div>

                {emailSuccess && (
                  <div className="auth-alert success" role="alert">
                    <CheckCircle2 size={16} />
                    <span>{emailSuccess}</span>
                  </div>
                )}
                {emailError && (
                  <div className="auth-alert error" role="alert">
                    <AlertCircle size={16} />
                    <span>{emailError}</span>
                  </div>
                )}

                <div className="field">
                  <span>E-mail atual</span>
                  <div className="input-with-icon">
                    <span className="field-icon"><Mail size={16} /></span>
                    <input
                      type="text"
                      value={currentEmail}
                      disabled
                      readOnly
                      className="input-disabled"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="settings-new-email">
                    <span>Novo e-mail</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="field-icon"><Mail size={16} /></span>
                    <input
                      id="settings-new-email"
                      type="email"
                      required
                      placeholder="novo.email@exemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={emailSaving}
                    />
                  </div>
                </div>

                <div className="modal-foot-settings">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={emailSaving || !newEmail.trim()}
                  >
                    <Save size={15} />
                    {emailSaving ? 'Atualizando...' : 'Atualizar E-mail'}
                  </button>
                </div>
              </form>
            )
          )}

          {/* TAB 3: SENHA */}
          {activeTab === 'password' && (
            isGoogleUser ? (
              <div className="google-auth-notice-card">
                <div className="notice-icon-wrapper">
                  <ShieldCheck size={28} color="#15803d" />
                </div>
                <h4>Protegido pela Conta Google</h4>
                <p>
                  Você não precisa e não possui uma senha direta neste site. A sua autenticação, biometria e verificação em duas etapas são garantidas pelo Google.
                </p>
                <div className="google-security-pill">
                  <CheckCircle2 size={16} />
                  <span>Autenticação OAuth 2.0 Ativa</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                  A opção de troca de senha está desabilitada porque seu acesso não utiliza senha local.
                </p>
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="google-auth-link-btn"
                >
                  Configurações de segurança Google ↗
                </a>
              </div>
            ) : (
              <form onSubmit={handleSavePassword} className="settings-form-pane">
                <div className="settings-info-box">
                  <p>
                    Defina uma senha forte com no mínimo 9 caracteres, contendo letras maiúsculas, minúsculas, números e símbolos.
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="auth-alert success" role="alert">
                    <CheckCircle2 size={16} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="auth-alert error" role="alert">
                    <AlertCircle size={16} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="settings-new-password">
                    <span>Nova senha</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="field-icon"><Lock size={16} /></span>
                    <input
                      id="settings-new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 9 caracteres"
                      minLength={9}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordSaving}
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
                  <small className="field-hint">
                    Mínimo de 9 caracteres com letras maiúsculas, minúsculas, números e símbolos.
                  </small>
                </div>

                <div className="field">
                  <label htmlFor="settings-confirm-password">
                    <span>Confirmar nova senha</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="field-icon"><KeyRound size={16} /></span>
                    <input
                      id="settings-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a nova senha"
                      minLength={9}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordSaving}
                    />
                  </div>
                </div>

                <div className="modal-foot-settings">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordSaving || !newPassword || !confirmPassword}
                  >
                    <ShieldCheck size={15} />
                    {passwordSaving ? 'Alterando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            )
          )}

          {/* TAB 4: PRIVACIDADE E TERMOS */}
          {activeTab === 'privacy' && (
            <div className="settings-privacy-tab-pane">
              <div className="privacy-card-summary">
                <div className="privacy-card-badge">
                  <ShieldCheck size={22} className="text-emerald" />
                  <div>
                    <strong>Governança de Privacidade & Termos</strong>
                    <small>Seus dados financeiros isolados e protegidos por design</small>
                  </div>
                </div>
                <div className="consent-detail-meta">
                  <span>Versão vigente: <strong>v{CURRENT_TERMS_VERSION}</strong></span>
                  <span>Data de vigência: <strong>{CURRENT_LEGAL_DATE}</strong></span>
                </div>
              </div>

              <div className="privacy-data-info-block">
                <h5>Dados vinculados à sua conta:</h5>
                <p>
                  O seu e-mail, nome, contas cadastradas, caixinhas e lançamentos são de acesso exclusivo seu via <strong>Row Level Security (RLS)</strong> no banco de dados. Nós não comercializamos e não compartilhamos suas informações com birôs de crédito ou redes de publicidade.
                </p>
              </div>

              <div className="privacy-quick-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose()
                    if (onOpenPrivacy) onOpenPrivacy()
                  }}
                >
                  <FileText size={15} />
                  <span>Consultar Termos de Uso e Política Completos</span>
                </button>
              </div>

              <div className="privacy-rights-notice">
                <h5>Seus direitos fundamentais (LGPD Art. 18):</h5>
                <ul>
                  <li><strong>Portabilidade de Dados:</strong> Baixe todos os seus lançamentos em formato CSV através da aba Extrato a qualquer momento.</li>
                  <li><strong>Correção e Atualização:</strong> Edite seus registros e dados cadastrais diretamente pelo aplicativo.</li>
                  <li><strong>Eliminação e Exclusão Total:</strong> Remova movimentações individualmente com efeito imediato ou solicite o expurgo definitivo de sua conta.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Link to Privacy & Terms */}
        <footer className="settings-modal-footer-strip">
          <button
            type="button"
            className="btn-privacy-strip-link"
            onClick={() => {
              onClose()
              if (onOpenPrivacy) onOpenPrivacy()
            }}
          >
            <ShieldCheck size={15} />
            <span>Consultar Política de Privacidade, Termos de Uso & Direitos LGPD</span>
          </button>
        </footer>
      </div>
    </div>
  )
}

