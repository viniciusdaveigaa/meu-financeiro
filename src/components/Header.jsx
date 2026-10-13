import { useState, useRef, useEffect } from 'react'
import {
  Bell,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Palette,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Target
} from 'lucide-react'
import { supabase } from '../supabase'
import { Logo, PrivacyToggle } from './ui'

export function Header({
  email,
  userName = '',
  activeTab,
  onTabChange,
  onNewTransaction,
  onOpenSettings,
  onOpenPrivacy,
  onOpenCustomization,
  unreadNewsCount = 0,
  onOpenNewsPopup,
  onOpenNewsHistory,
  onSignOut
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // 1. Fechar o menu automaticamente ao mudar de aba ou navegar
  useEffect(() => {
    setUserMenuOpen(false)
  }, [activeTab])

  // 2. Fechar o menu ao clicar/tocar fora ou ao pressionar Escape
  useEffect(() => {
    if (!userMenuOpen) return

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

  const initial = (userName?.trim() || email || 'U').charAt(0).toUpperCase()
  const shortName = userName?.trim() ? userName.trim().split(' ')[0] : email

  return (
    <header className="app-topbar">
      <div className="topbar-container">
        {/* Brand */}
        <div
          className="topbar-brand"
          onClick={() => {
            setUserMenuOpen(false)
            onTabChange('dashboard')
          }}
        >
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="topbar-nav" aria-label="Navegação Principal">
          <button
            type="button"
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setUserMenuOpen(false)
              onTabChange('dashboard')
            }}
          >
            <LayoutDashboard size={16} />
            <span>Visão Geral</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => {
              setUserMenuOpen(false)
              onTabChange('transactions')
            }}
          >
            <ReceiptText size={16} />
            <span>Extrato</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'planning' ? 'active' : ''}`}
            onClick={() => {
              setUserMenuOpen(false)
              onTabChange('planning')
            }}
          >
            <Target size={16} />
            <span>Planejamento</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => {
              setUserMenuOpen(false)
              onTabChange('guide')
            }}
          >
            <CircleHelp size={16} />
            <span>Ajuda</span>
          </button>
        </nav>

        {/* Action controls */}
        <div className="topbar-actions">
          {/* Botão de Modo Privacidade de Valores */}
          <PrivacyToggle size={20} />

          {/* Central de Novidades (Sino com Badge de Não Lidas) */}
          <button
            type="button"
            className={`topbar-icon-btn news-bell-btn ${unreadNewsCount > 0 ? 'has-unread' : ''}`}
            onClick={onOpenNewsPopup}
            title={unreadNewsCount > 0 ? `${unreadNewsCount} novidades não lidas` : 'Novidades e Atualizações'}
            aria-label="Novidades e atualizações do sistema"
          >
            <Bell size={19} />
            {unreadNewsCount > 0 && (
              <span className="news-badge-count">
                {unreadNewsCount > 9 ? '9+' : unreadNewsCount}
              </span>
            )}
          </button>

          {/* Quick New Transaction button */}
          <button
            type="button"
            className="btn btn-primary btn-sm btn-quick-add"
            onClick={onNewTransaction}
            title="Atalho: pressione a tecla N no teclado"
          >
            <Plus size={16} />
            <span className="btn-text">Novo</span>
            <kbd className="kbd-shortcut">N</kbd>
          </button>

          {/* User Profile */}
          <div className="user-profile-menu" ref={menuRef}>
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              title={userName?.trim() ? `${userName} (${email})` : email}
              aria-label="Perfil do usuário"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <span className="user-avatar">{initial}</span>
              <span className="user-email-text">{shortName}</span>
            </button>

            {userMenuOpen && (
              <div
                className="user-dropdown-card"
                role="menu"
                aria-label="Opções do perfil"
              >
                  <div
                    className="user-dropdown-header clickable-dropdown-header"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenPrivacy?.()
                    }}
                    title="Ver Política de Privacidade e Termos de Uso"
                  >
                    <span className="user-name-title">Conta Conectada</span>
                    <strong className="user-name-display">{userName?.trim() || 'Usuário'}</strong>
                    <span className="user-email-full">{email}</span>
                  </div>
                  <hr className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenSettings?.()
                    }}
                  >
                    <Settings size={16} />
                    <span>Configurações da Conta</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenCustomization?.()
                    }}
                  >
                    <Palette size={16} />
                    <span>Personalização de Cores</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenNewsHistory?.()
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Novidades do Sistema</span>
                    {unreadNewsCount > 0 && (
                      <span className="dropdown-badge-pill">{unreadNewsCount}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenPrivacy?.()
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Privacidade & Termos</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onTabChange('guide')
                    }}
                  >
                    <CircleHelp size={16} />
                    <span>Central de Ajuda</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item danger"
                    onClick={() => {
                      setUserMenuOpen(false)
                      if (onSignOut) {
                        onSignOut()
                      } else {
                        supabase.auth.signOut()
                      }
                    }}
                  >
                    <LogOut size={16} />
                    <span>Encerrar Sessão</span>
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
