import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { usePrivacy } from '../context/PrivacyContext'
import { useCategories } from '../context/CategoryContext'
import { formatMoney } from '../utils/formatters'
import { resolveBankLogo } from '../constants/bankLogos'

/** Valor monetário que respeita o modo privacidade (barra cinza, como no Nubank). */
export function Money({ value, prefix = '', className = '' }) {
  const { hidden } = usePrivacy()
  if (hidden) return <span className={`money-mask ${className}`} role="img" aria-label="Valor oculto" />
  return <span className={`money ${className}`}>{prefix}{formatMoney(value)}</span>
}

/** Botão de olho para ocultar/mostrar valores. */
export function PrivacyToggle({ className = '', size = 20 }) {
  const { hidden, toggle } = usePrivacy()
  const label = hidden ? 'Mostrar valores' : 'Ocultar valores'
  return (
    <button
      type="button"
      className={`privacy-toggle ${hidden ? 'is-hidden' : ''} ${className}`}
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={label}
      title={label}
    >
      {hidden ? <EyeOff size={size} strokeWidth={2} /> : <Eye size={size} strokeWidth={2} />}
    </button>
  )
}

/** Ícone da categoria com cor própria (dinâmico via CategoryContext). */
export function CategoryIcon({ category, size = 40 }) {
  const { getMeta } = useCategories()
  const meta = getMeta(category)
  const Icon = meta.icon
  return (
    <span
      className="cat-icon"
      style={{
        width: size,
        height: size,
        background: meta.bg,
        color: meta.color
      }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.46)} strokeWidth={2} />
    </span>
  )
}

/** Interruptor acessível. */
export function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

/** Marca do Saldo Claro. */
export function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16.5 9 11l4 3.5L20 7" />
          <path d="M15 7h5v5" />
        </svg>
      </span>
      <span className="logo-word">saldo<em>claro</em></span>
    </span>
  )
}

/** Logotipo / Ícone visual oficial de banco ou cartão de crédito. */
export function BankLogoBadge({ logoId, accountName = '', kind = 'account', size = 32, className = '' }) {
  const [imgError, setImgError] = useState(false)
  const logo = resolveBankLogo(logoId, accountName, kind)

  useEffect(() => {
    setImgError(false)
  }, [logo?.id, logo?.logoUrl])

  const hasLogoUrl = Boolean(logo?.logoUrl && !imgError)
  const Icon = logo?.icon

  return (
    <span
      className={`bank-logo-badge ${hasLogoUrl ? 'has-logo-img' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        ...(!hasLogoUrl && logo?.bg ? { background: logo.bg, color: logo.color } : {})
      }}
      title={logo?.name || 'Instituição Bancária'}
      aria-label={logo?.name || 'Instituição Bancária'}
    >
      {hasLogoUrl ? (
        <img
          src={logo.logoUrl}
          alt={logo.displayName || logo.name}
          className="bank-logo-img"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : Icon ? (
        <Icon size={Math.round(size * 0.52)} strokeWidth={2.2} />
      ) : (
        <span
          className="bank-logo-text"
          style={{ fontSize: Math.max(9, Math.round(size * 0.34)) }}
        >
          {logo?.shortLabel || logo?.name?.slice(0, 3) || 'BCO'}
        </span>
      )}
    </span>
  )
}

