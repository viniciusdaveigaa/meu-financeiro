import { useState } from 'react'
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileText,
  Lock,
  LogOut,
  Scale,
  ShieldAlert,
  ShieldCheck,
  X
} from 'lucide-react'
import {
  CURRENT_LEGAL_DATE,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  PRIVACY_POLICY_SECTIONS,
  TERMS_OF_USE_SECTIONS
} from '../constants/legalDocuments'

export function ConsentPromptModal({
  isUpdatePrompt = false,
  previousConsent = null,
  onAccept,
  onSignOut
}) {
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewingDoc, setViewingDoc] = useState(null) // 'terms' | 'privacy' | null

  const handleConfirm = async () => {
    if (!agreed || saving) return
    setSaving(true)
    try {
      await onAccept()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop consent-backdrop">
      <div
        className="modal-sheet consent-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        <span className="sheet-handle" aria-hidden="true" />

        {/* Cabeçalho */}
        <header className="modal-head consent-header">
          <div className="consent-head-icon">
            <ShieldCheck size={28} />
          </div>
          <div className="consent-head-titles">
            <span className="eyebrow">Segurança e Transparência</span>
            <h2 id="consent-title">Antes de continuar</h2>
          </div>
        </header>

        {/* Se estiver visualizando o documento completo inline */}
        {viewingDoc ? (
          <div className="consent-doc-viewer">
            <div className="doc-viewer-header">
              <div className="doc-title-row">
                {viewingDoc === 'terms' ? <Scale size={18} /> : <Lock size={18} />}
                <h4>{viewingDoc === 'terms' ? 'Termos de Uso do Saldo Claro' : 'Política de Privacidade'}</h4>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => setViewingDoc(null)}
              >
                Voltar ao consentimento
              </button>
            </div>
            <div className="doc-scroll-content">
              {(viewingDoc === 'terms' ? TERMS_OF_USE_SECTIONS : PRIVACY_POLICY_SECTIONS).map((sec, i) => (
                <article key={i} className="doc-sec-item">
                  <h5>{sec.title}</h5>
                  <p>{sec.content}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          /* Corpo principal do Consentimento */
          <div className="consent-body">
            {isUpdatePrompt ? (
              <div className="consent-update-banner">
                <div className="update-badge">
                  <ShieldAlert size={14} />
                  <span>Termos Atualizados • Versão {CURRENT_TERMS_VERSION}</span>
                </div>
                <p>
                  Atualizamos nossos documentos de governança para reforçar a transparência e as garantias da Lei Geral de Proteção de Dados (LGPD).
                  Seu consentimento anterior (versão {previousConsent?.terms_version || '2.0'}) precisa ser renovado.
                </p>
              </div>
            ) : (
              <div className="consent-welcome-banner">
                <p>
                  Bem-vindo ao <strong>Saldo Claro</strong>. Para proteger seus dados financeiros e assegurar transparência absoluta, solicitamos que conheça e concorde com os nossos termos de serviço.
                </p>
              </div>
            )}

            {/* Destaques de Garantia do Usuário */}
            <div className="consent-highlights-grid">
              <div className="highlight-pill-card">
                <Lock size={16} className="text-emerald" />
                <div>
                  <strong>Isolamento Matemático (RLS)</strong>
                  <small>Seus lançamentos são restritos ao seu login no banco de dados.</small>
                </div>
              </div>
              <div className="highlight-pill-card">
                <Scale size={16} className="text-emerald" />
                <div>
                  <strong>Zero Compartilhamento</strong>
                  <small>Nunca vendemos seus dados para bancos, anúncios ou terceiros.</small>
                </div>
              </div>
            </div>

            {/* Links para leitura dos documentos */}
            <div className="consent-links-card">
              <span className="links-card-label">Consulte os documentos oficiais vigentes:</span>
              <div className="doc-links-row">
                <button
                  type="button"
                  className="doc-link-btn"
                  onClick={() => setViewingDoc('terms')}
                >
                  <FileText size={15} />
                  <span>Termos de Uso (v{CURRENT_TERMS_VERSION})</span>
                  <ExternalLink size={12} className="link-arrow" />
                </button>
                <button
                  type="button"
                  className="doc-link-btn"
                  onClick={() => setViewingDoc('privacy')}
                >
                  <Lock size={15} />
                  <span>Política de Privacidade (v{CURRENT_PRIVACY_VERSION})</span>
                  <ExternalLink size={12} className="link-arrow" />
                </button>
              </div>
              <small className="legal-note-text">
                Vigência oficial: {CURRENT_LEGAL_DATE} • Documento padrão em conformidade com a LGPD (Lei nº 13.709/2018).
              </small>
            </div>

            {/* Checkbox de Aceitação Explícita Obrigatória */}
            <div className="consent-checkbox-area">
              <label className="checkbox-consent-control">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={saving}
                />
                <div className="checkbox-text-block">
                  <strong>Li e concordo integralmente com os Termos de Uso e com a Política de Privacidade.</strong>
                  <small>
                    Declaro estar ciente de que o aplicativo processa meus dados unicamente para minha própria gestão financeira pessoal.
                  </small>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Rodapé com Botão Aceitar e Opção de Sair */}
        <footer className="modal-foot consent-footer">
          <div className="consent-refuse-info">
            <button
              type="button"
              className="btn-refuse-signout"
              onClick={onSignOut}
              disabled={saving}
              title="Encerrar sessão caso não concorde com os termos"
            >
              <LogOut size={14} />
              <span>Não concordo / Sair do sistema</span>
            </button>
            <small>As funcionalidades do app dependem desta aceitação.</small>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-accept"
            disabled={!agreed || saving}
            onClick={handleConfirm}
          >
            {saving ? 'Registrando aceitação...' : 'Aceitar e continuar'}
          </button>
        </footer>
      </div>
    </div>
  )
}

