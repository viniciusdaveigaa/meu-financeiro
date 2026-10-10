import { LogOut } from 'lucide-react'
import { Logo } from './ui'

export function SignOutScreen() {
  return (
    <div className="signout-screen-overlay" role="status" aria-live="polite">
      <div className="signout-card">
        <div className="signout-logo-wrap">
          <Logo light />
        </div>

        <div className="signout-icon-pulse">
          <LogOut size={26} />
        </div>

        <h3 className="signout-title">Encerrando sessão...</h3>
        <p className="signout-subtitle">
          Sincronizando suas alterações com segurança. Até logo!
        </p>

        <div className="signout-progress-track">
          <div className="signout-progress-bar" />
        </div>
      </div>
    </div>
  )
}
