import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User,
  X
} from 'lucide-react'
import { supabase } from '../supabase'

export function SettingsModal({
  currentName = '',
  currentEmail = '',
  userId = '',
  onClose,
  onProfileUpdated
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

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.')
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

      if (error) throw error

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
        <header className="modal-head">
          <div className="settings-head-title">
            <span className="settings-icon-badge">
              <User size={20} />
            </span>
            <div>
              <h3>Configurações da Conta</h3>
              <p>Gerencie seu nome de exibição, e-mail de acesso e credenciais de segurança.</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn-close"
            onClick={onClose}
            aria-label="Fechar configurações"
          >
            <X size={18} />
          </button>
        </header>

        {/* Settings SubTabs */}
        <div className="settings-nav-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            <span>Meu Perfil</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail size={16} />
            <span>E-mail</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={16} />
            <span>Segurança e Senha</span>
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
                  <strong>Bom dia, <span className="highlight-name">{firstName}</span>! 👋</strong>
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
                    autoFocus
                  />
                </div>
              </div>

              <div className="field">
                <span>E-mail cadastrado</span>
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
                <small className="field-hint">
                  Para alterar seu e-mail de acesso, acesse a aba <strong>E-mail</strong> acima.
                </small>
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
                    autoFocus
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
          )}

          {/* TAB 3: SENHA */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="settings-form-pane">
              <div className="settings-info-box">
                <p>
                  Defina uma senha forte com no mínimo 6 caracteres para garantir a segurança da sua conta.
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
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordSaving}
                    autoFocus
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
                    minLength={6}
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
          )}
        </div>
      </div>
    </div>
  )
}

