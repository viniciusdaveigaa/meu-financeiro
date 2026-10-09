import {
  CircleHelp,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Target
} from 'lucide-react'
import { PrivacyToggle } from './ui'

export function MobileNav({
  activeTab,
  onTabChange,
  onNewTransaction
}) {
  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        className="mobile-fab-btn"
        onClick={onNewTransaction}
        title="Novo lançamento (N)"
        aria-label="Adicionar lançamento"
      >
        <Plus size={26} strokeWidth={2.4} />
      </button>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="mobile-bottom-bar" aria-label="Navegação Mobile">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="mobile-nav-label">Início</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => onTabChange('transactions')}
        >
          <ReceiptText size={20} />
          <span className="mobile-nav-label">Extrato</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'planning' ? 'active' : ''}`}
          onClick={() => onTabChange('planning')}
        >
          <Target size={20} />
          <span className="mobile-nav-label">Metas</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => onTabChange('guide')}
        >
          <CircleHelp size={20} />
          <span className="mobile-nav-label">Ajuda</span>
        </button>

        <div className="mobile-nav-item privacy-slot">
          <PrivacyToggle size={20} />
          <span className="mobile-nav-label">Ocultar</span>
        </div>
      </nav>
    </>
  )
}
