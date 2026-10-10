import {
  CircleHelp,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Target
} from 'lucide-react'

export function MobileNav({
  activeTab,
  onTabChange,
  onNewTransaction
}) {
  return (
    <nav className="mobile-bottom-bar" aria-label="Navegação Principal">
      {/* 1. Início */}
      <button
        type="button"
        className={`mobile-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <span className="nav-tab-icon">
          <LayoutDashboard size={21} strokeWidth={activeTab === 'dashboard' ? 2.3 : 1.8} />
        </span>
        <span className="nav-tab-label">Início</span>
      </button>

      {/* 2. Extrato */}
      <button
        type="button"
        className={`mobile-nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
        onClick={() => onTabChange('transactions')}
      >
        <span className="nav-tab-icon">
          <ReceiptText size={21} strokeWidth={activeTab === 'transactions' ? 2.3 : 1.8} />
        </span>
        <span className="nav-tab-label">Extrato</span>
      </button>

      {/* 3. Botão Central: Novo Lançamento (+) */}
      <div className="mobile-nav-center-slot">
        <button
          type="button"
          className="mobile-nav-center-btn"
          onClick={onNewTransaction}
          aria-label="Novo lançamento"
          title="Novo lançamento"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>
      </div>

      {/* 4. Metas / Planejamento */}
      <button
        type="button"
        className={`mobile-nav-tab ${activeTab === 'planning' ? 'active' : ''}`}
        onClick={() => onTabChange('planning')}
      >
        <span className="nav-tab-icon">
          <Target size={21} strokeWidth={activeTab === 'planning' ? 2.3 : 1.8} />
        </span>
        <span className="nav-tab-label">Metas</span>
      </button>

      {/* 5. Central de Ajuda */}
      <button
        type="button"
        className={`mobile-nav-tab ${activeTab === 'guide' ? 'active' : ''}`}
        onClick={() => onTabChange('guide')}
      >
        <span className="nav-tab-icon">
          <CircleHelp size={21} strokeWidth={activeTab === 'guide' ? 2.3 : 1.8} />
        </span>
        <span className="nav-tab-label">Ajuda</span>
      </button>
    </nav>
  )
}
