import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)
  const previousFocusRef = useRef(null)

  const finish = (result) => {
    const resolve = resolverRef.current
    resolverRef.current = null
    setDialog(null)
    resolve?.(result)
    requestAnimationFrame(() => previousFocusRef.current?.focus())
  }

  const open = (options) =>
    new Promise((resolve) => {
      resolverRef.current?.(false)
      previousFocusRef.current = document.activeElement
      resolverRef.current = resolve
      setDialog(options)
    })

  const confirm = (message, options = {}) =>
    open({
      kind: 'confirm',
      message,
      title: options.title || 'Confirmar ação',
      confirmLabel: options.confirmLabel || 'Confirmar',
      cancelLabel: options.cancelLabel || 'Cancelar',
      danger: options.danger !== false
    })

  const alert = (message, options = {}) =>
    open({
      kind: 'alert',
      message,
      title: options.title || 'Atenção',
      confirmLabel: options.confirmLabel || 'Entendido',
    })

  useEffect(() => {
    if (!dialog) return
    const prevOverflow = document.body.style.overflow
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        finish(false)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dialog])

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) finish(false)
          }}
        >
          <div
            className={`dialog-box ${dialog.kind} ${dialog.danger ? 'danger' : ''}`}
            role={dialog.kind === 'alert' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
          >
            <div className="dialog-header">
              <span className={`dialog-badge-icon ${dialog.danger ? 'danger' : 'info'}`}>
                {dialog.kind === 'confirm' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Info size={20} />
                )}
              </span>
              <div>
                <span className="dialog-tag">SALDO CLARO</span>
                <h3>{dialog.title}</h3>
              </div>
            </div>
            <p className="dialog-message">{dialog.message}</p>
            <div className="dialog-actions">
              {dialog.kind === 'confirm' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => finish(false)}
                >
                  {dialog.cancelLabel || 'Cancelar'}
                </button>
              )}
              <button
                type="button"
                className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'} btn-sm`}
                autoFocus
                onClick={() => finish(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useAppDialog() {
  return useContext(DialogContext)
}
