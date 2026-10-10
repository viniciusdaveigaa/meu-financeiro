import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Download, FileSpreadsheet, FileText, Info, X } from 'lucide-react'

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

  const confirmDownload = (options = {}) =>
    open({
      kind: 'download',
      title: options.title || 'Confirmar Download',
      message: options.message || 'Você confirma o download deste arquivo gerado pelo Saldo Claro?',
      fileName: options.fileName || 'arquivo',
      fileType: options.fileType || 'Arquivo para download',
      fileFormat:
        options.fileFormat ||
        (options.fileName?.endsWith('.pdf')
          ? 'PDF'
          : options.fileName?.endsWith('.csv')
          ? 'CSV'
          : ''),
      description: options.description || '',
      details: options.details || [],
      confirmLabel: options.confirmLabel || 'Baixar arquivo',
      cancelLabel: options.cancelLabel || 'Cancelar',
      danger: false
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
    <DialogContext.Provider value={{ confirm, alert, confirmDownload }}>
      {children}
      {dialog && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) finish(false)
          }}
        >
          <div
            className={`dialog-box ${dialog.kind} ${dialog.danger ? 'danger' : ''} ${
              dialog.kind === 'download' ? 'download-dialog' : ''
            }`}
            role={dialog.kind === 'alert' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
          >
            <div className="dialog-header">
              <span
                className={`dialog-badge-icon ${
                  dialog.kind === 'download'
                    ? 'download'
                    : dialog.danger
                    ? 'danger'
                    : 'info'
                }`}
              >
                {dialog.kind === 'download' ? (
                  <Download size={20} />
                ) : dialog.kind === 'confirm' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Info size={20} />
                )}
              </span>
              <div>
                <span className="dialog-tag">
                  {dialog.kind === 'download' ? 'SALDO CLARO • DOWNLOAD SEGURO' : 'SALDO CLARO'}
                </span>
                <h3>{dialog.title}</h3>
              </div>
            </div>

            {dialog.kind === 'download' ? (
              <div className="download-dialog-content">
                <p className="dialog-message">{dialog.message}</p>

                <div className="download-info-card">
                  <div className="download-file-row">
                    <span className="download-file-icon">
                      {dialog.fileFormat === 'PDF' ? (
                        <FileText size={22} />
                      ) : (
                        <FileSpreadsheet size={22} />
                      )}
                    </span>
                    <div className="download-file-meta">
                      <strong className="download-file-name">{dialog.fileName}</strong>
                      <span className="download-file-type">
                        {dialog.fileType}
                        {dialog.fileFormat && (
                          <span className="download-ext-tag">{dialog.fileFormat}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {dialog.description && (
                    <p className="download-file-desc">{dialog.description}</p>
                  )}

                  {dialog.details && dialog.details.length > 0 && (
                    <div className="download-details-grid">
                      {dialog.details.map((item, idx) => (
                        <div key={idx} className="download-detail-item">
                          <span className="detail-label">{item.label}</span>
                          <strong className="detail-val">{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="dialog-message">{dialog.message}</p>
            )}

            <div className="dialog-actions">
              {(dialog.kind === 'confirm' || dialog.kind === 'download') && (
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
                className={`btn ${
                  dialog.danger ? 'btn-danger' : 'btn-primary'
                } btn-sm`}
                autoFocus
                onClick={() => finish(true)}
              >
                {dialog.kind === 'download' && <Download size={14} />}
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
