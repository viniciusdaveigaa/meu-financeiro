import { useState } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Sparkles,
  Tag,
  X
} from 'lucide-react'
import { getCategoryMeta } from '../utils/updatesService'

export function NewsPopup({
  isOpen,
  onClose,
  updates = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenFullHistory
}) {
  if (!isOpen) return null

  // Exibe as 4 novidades mais recentes no painel rápido
  const recentUpdates = updates.slice(0, 4)

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date)
    } catch {
      return ''
    }
  }

  return (
    <>
      {/* Backdrop transparente/escuro para fechar ao clicar fora */}
      <div className="news-popup-backdrop" onClick={onClose} />

      <aside
        className="news-popup-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-popup-title"
      >
        {/* Cabeçalho */}
        <header className="news-popup-header">
          <div className="news-title-row">
            <div className="news-icon-circle">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 id="news-popup-title">Novidades do Sistema</h3>
              <span className="news-subtitle">
                {unreadCount > 0 ? (
                  <span className="text-emerald-bold">{unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}</span>
                ) : (
                  'Todas as novidades em dia'
                )}
              </span>
            </div>
          </div>

          <div className="news-header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={onMarkAllAsRead}
                title="Marcar todas as novidades como lidas"
              >
                <CheckCheck size={14} />
                <span>Marcar lidas</span>
              </button>
            )}
            <button
              type="button"
              className="btn-close-subtle"
              onClick={onClose}
              aria-label="Fechar painel de novidades"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Lista de Atualizações Recentes */}
        <div className="news-popup-body">
          {recentUpdates.length === 0 ? (
            <div className="news-empty-state">
              <Bell size={32} className="text-muted" />
              <p>Nenhuma novidade recente publicada no momento.</p>
            </div>
          ) : (
            recentUpdates.map((item) => {
              const meta = getCategoryMeta(item.category)
              return (
                <article
                  key={item.id}
                  className={`news-item-card ${item.isRead ? 'read' : 'unread'}`}
                >
                  <div className="news-item-meta">
                    <span
                      className="category-pill"
                      style={{ color: meta.color, backgroundColor: meta.bg }}
                    >
                      {meta.label}
                    </span>
                    {item.version && (
                      <span className="version-pill">v{item.version}</span>
                    )}
                    <span className="news-item-date">
                      <Clock size={12} />
                      {formatDate(item.published_at)}
                    </span>
                    {!item.isRead && (
                      <span className="unread-dot-badge" title="Novidade não lida" />
                    )}
                  </div>

                  <h4 className="news-item-title">{item.title}</h4>
                  <p className="news-item-desc">{item.description}</p>

                  <div className="news-item-actions">
                    {!item.isRead ? (
                      <button
                        type="button"
                        className="btn-mark-read-item"
                        onClick={() => onMarkAsRead(item.id)}
                      >
                        <Check size={13} />
                        <span>Marcar como lida</span>
                      </button>
                    ) : (
                      <span className="read-status-label">
                        <CheckCheck size={12} />
                        Lida
                      </span>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Rodapé com atalho para o histórico completo */}
        <footer className="news-popup-footer">
          <button
            type="button"
            className="btn-view-all-news"
            onClick={() => {
              onClose()
              onOpenFullHistory()
            }}
          >
            <span>Ver histórico completo de atualizações</span>
            <ChevronRight size={16} />
          </button>
        </footer>
      </aside>
    </>
  )
}
