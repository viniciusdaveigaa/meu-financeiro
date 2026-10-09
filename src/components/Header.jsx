import { useState } from 'react'
import {
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  Target
} from 'lucide-react'
import { supabase } from '../supabase'
import { Logo, PrivacyToggle } from './ui'

export function Header({
  email,
  activeTab,
  onTabChange,
  onNewTransaction
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const initial = email ? email.charAt(0).toUpperCase() : 'U'

  return (
    <header className="app-topbar">
      <div className="topbar-container">
        {/* Brand */}
        <div className="topbar-brand" onClick={() => onTabChange('dashboard')}>
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="topbar-nav" aria-label="Navegação Principal">
          <button
            type="button"
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            <LayoutDashboard size={16} />
            <span>Visão Geral</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => onTabChange('transactions')}
          >
            <ReceiptText size={16} />
            <span>Extrato</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'planning' ? 'active' : ''}`}
            onClick={() => onTabChange('planning')}
          >
            <Target size={16} />
            <span>Planejamento</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => onTabChange('guide')}
          >
            <CircleHelp size={16} />
            <span>Ajuda</span>
          </button>
        </nav>

        {/* Action controls */}
        <div className="topbar-actions">
          {/* Nubank-style Privacy Eye button */}
          <PrivacyToggle size={20} />

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
          <div className="user-profile-menu">
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              title={email}
              aria-label="Perfil do usuário"
              aria-expanded={userMenuOpen}
            >
              <span className="user-avatar">{initial}</span>
              <span className="user-email-text">{email}</span>
            </button>

            {userMenuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setUserMenuOpen(false)} />
                <div className="user-dropdown-card">
                  <div className="user-dropdown-header">
                    <span className="user-name-title">Conta Conectada</span>
                    <strong className="user-email-full">{email}</strong>
                  </div>
                  <hr className="dropdown-divider" />
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
                    onClick={() => supabase.auth.signOut()}
                  >
                    <LogOut size={16} />
                    <span>Encerrar Sessão</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
