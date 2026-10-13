import { useState, useMemo } from 'react'
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Filter,
  Search,
  Sparkles,
  Tag,
  X
} from 'lucide-react'
import { getCategoryMeta, groupUpdatesByDate } from '../utils/updatesService'

export function NewsHistoryModal({
  isOpen,
  onClose,
  updates = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const safeUpdates = Array.isArray(updates) ? updates : []

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'feature', label: 'Funcionalidades' },
    { id: 'improvement', label: 'Melhorias' },
    { id: 'security', label: 'Segurança' },
    { id: 'fix', label: 'Correções' }
  ]

  const filteredUpdates = useMemo(() => {
    return safeUpdates.filter((item) => {
      if (!item) return false
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory

      const query = (searchQuery || '').trim().toLowerCase()
      const matchesSearch =
        !query ||
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.version && item.version.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [safeUpdates, selectedCategory, searchQuery])

  // Agrupa as novidades filtradas por dia cronológico
  const groupedUpdates = useMemo(() => {
    return groupUpdatesByDate(filteredUpdates)
  }, [filteredUpdates])

  if (!isOpen) return null

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet news-history-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-handle" aria-hidden="true" />

        {/* Cabeçalho */}
        <header className="modal-head news-history-header">
          <div className="history-head-left">
            <div className="history-icon-box">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="eyebrow">Transparência & Evolução Contínua</span>
              <h2 id="history-title">Histórico de Atualizações</h2>
            </div>
          </div>

          <div className="history-head-right">
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-mark-all-history"
                onClick={onMarkAllAsRead}
                title="Marcar todas as novidades como lidas"
              >
                <CheckCheck size={15} />
                <span className="btn-text-full">Marcar todas como lidas ({unreadCount})</span>
                <span className="btn-text-short">Lidas ({unreadCount})</span>
              </button>
            )}
            <button
              type="button"
              className="icon-btn modal-close-btn btn-icon-close"
              onClick={onClose}
              aria-label="Fechar histórico de atualizações"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Barra de Filtros e Busca */}
        <div className="news-history-controls">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por funcionalidade, palavra-chave ou versão..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="category-filter-pills" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`filter-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Registros da Linha do Tempo */}
        <div className="news-history-body">
          {filteredUpdates.length === 0 ? (
            <div className="news-history-empty">
              <Bell size={40} className="text-muted" />
              <h4>Nenhuma atualização encontrada</h4>
              <p>Tente ajustar os filtros ou os termos de busca digitados.</p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-2"
                  onClick={() => {
                    setSelectedCategory('all')
                    setSearchQuery('')
                  }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="timeline-groups-container">
              {groupedUpdates.map((group) => (
                <section key={group.date} className="timeline-day-group">
                  <div className="timeline-day-header">
                    <div className="timeline-day-title-wrap">
                      <Calendar size={14} className="timeline-day-icon" />
                      <span className="timeline-day-title">{group.label}</span>
                    </div>
                    <span className="timeline-day-badge">
                      {group.items.length} {group.items.length === 1 ? 'novidade' : 'novidades'}
                    </span>
                  </div>

                  <div className="timeline-cards-list">
                    {group.items.map((item) => {
                      const meta = getCategoryMeta(item.category)
                      return (
                        <article
                          key={item.id}
                          className={`timeline-news-card ${item.isRead ? 'read' : 'unread'}`}
                        >
                          <div className="card-top-row">
                            <div className="badges-group">
                              <span
                                className="category-badge"
                                style={{ color: meta.color, backgroundColor: meta.bg }}
                              >
                                {meta.label}
                              </span>
                              {item.version && (
                                <span className="version-tag">v{item.version}</span>
                              )}
                              <span className="date-tag">
                                <Clock size={13} />
                                {formatTime(item.published_at)}
                              </span>
                            </div>

                            <div className="card-actions">
                              {!item.isRead ? (
                                <button
                                  type="button"
                                  className="btn-mark-single-read"
                                  onClick={() => onMarkAsRead(item.id)}
                                  title="Marcar esta novidade como lida"
                                >
                                  <Check size={14} />
                                  <span>Marcar como lida</span>
                                </button>
                              ) : (
                                <span className="status-read-badge">
                                  <CheckCheck size={13} />
                                  Lida
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="timeline-card-title">{item.title}</h3>
                          <p className="timeline-card-desc">{item.description}</p>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <footer className="modal-foot news-history-footer">
          <div className="history-footer-summary">
            <span>
              Exibindo <strong>{filteredUpdates.length}</strong> de {safeUpdates.length} atualizações registradas
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  )
}

