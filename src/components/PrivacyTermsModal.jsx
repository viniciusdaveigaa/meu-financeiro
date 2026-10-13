import { useState, useEffect } from 'react'
import {
  Check,
  ChevronRight,
  Database,
  Download,
  FileText,
  History,
  KeyRound,
  Lock,
  Scale,
  ShieldCheck,
  Trash2,
  UserCheck,
  X
} from 'lucide-react'
import {
  CURRENT_LEGAL_DATE,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  LEGAL_VERSIONS_HISTORY,
  PRIVACY_POLICY_SECTIONS,
  TERMS_OF_USE_SECTIONS
} from '../constants/legalDocuments'
import { checkUserConsentStatus } from '../utils/consentService'

export function PrivacyTermsModal({ userId = '', onClose }) {
  // Tabs: 'privacy' | 'terms' | 'history' | 'my_data'
  const [activeTab, setActiveTab] = useState('privacy')
  const [userConsent, setUserConsent] = useState(null)

  useEffect(() => {
    if (userId) {
      checkUserConsentStatus(userId).then((res) => {
        if (res.latestConsent) {
          setUserConsent(res.latestConsent)
        }
      })
    }
  }, [userId])

  const formattedAcceptedDate = userConsent?.accepted_at
    ? new Date(userConsent.accepted_at).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    : null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-sheet privacy-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
      >
        <span className="sheet-handle" aria-hidden="true" />

        {/* Header */}
        <header className="modal-head privacy-modal-header">
          <div className="privacy-head-title">
            <span className="privacy-icon-badge">
              <ShieldCheck size={22} />
            </span>
            <div className="privacy-head-text">
              <h3 id="privacy-modal-title">Privacidade, Termos de Uso & Dados</h3>
              <p>Transparência total e conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn modal-close-btn"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        {/* Navegação entre Abas */}
        <div className="privacy-nav-tabs">
          <button
            type="button"
            className={`privacy-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Lock size={14} />
            <span>Política de Privacidade</span>
          </button>
          <button
            type="button"
            className={`privacy-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <Scale size={14} />
            <span>Termos de Uso</span>
          </button>
          <button
            type="button"
            className={`privacy-tab-btn ${activeTab === 'my_data' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_data')}
          >
            <Database size={14} />
            <span>Meus Dados & Direitos</span>
          </button>
          <button
            type="button"
            className={`privacy-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} />
            <span>Histórico de Versões</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="privacy-modal-body">
          {/* Card de Status do Consentimento */}
          {userConsent && (
            <div className="consent-status-banner">
              <div className="status-badge-ok">
                <Check size={14} />
                <span>Consentimento Ativo</span>
              </div>
              <div className="status-meta-info">
                <span>Versão aceita: <strong>Termos v{userConsent.terms_version}</strong> • <strong>Privacidade v{userConsent.privacy_version}</strong></span>
                {formattedAcceptedDate && <small>Registrado em: {formattedAcceptedDate}</small>}
              </div>
            </div>
          )}

          {/* TAB 1: POLÍTICA DE PRIVACIDADE */}
          {activeTab === 'privacy' && (
            <div className="privacy-tab-content">
              <div className="privacy-hero-banner">
                <div className="privacy-badge">
                  <Lock size={14} />
                  <span>Privacidade por Design • Seus dados pertencem a você</span>
                </div>
                <h4>Seu dinheiro, sua privacidade. Sem concessões.</h4>
                <p>
                  O <strong>Saldo Claro</strong> foi construído sob uma premissa fundamental:
                  ajudá-lo a organizar suas finanças com máxima clareza sem que ninguém — nem anunciantes,
                  nem instituições financeiras, nem outros usuários — tenha acesso aos seus lançamentos.
                </p>
              </div>

              <div className="privacy-sections-grid">
                {PRIVACY_POLICY_SECTIONS.map((sec, i) => (
                  <article key={i} className="privacy-section-card">
                    <div className="privacy-sec-icon">
                      {i === 0 ? <Lock size={20} /> : i === 1 ? <Database size={20} /> : i === 2 ? <FileText size={20} /> : i === 3 ? <ShieldCheck size={20} /> : i === 4 ? <Scale size={20} /> : <KeyRound size={20} />}
                    </div>
                    <div className="privacy-sec-content">
                      <h5>{sec.title}</h5>
                      <p style={{ whiteSpace: 'pre-line' }}>{sec.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TERMOS DE USO */}
          {activeTab === 'terms' && (
            <div className="privacy-tab-content">
              <div className="privacy-hero-banner">
                <div className="privacy-badge">
                  <Scale size={14} />
                  <span>Termos de Uso vigentes • Versão {CURRENT_TERMS_VERSION}</span>
                </div>
                <h4>Regras claras e transparentes de utilização.</h4>
                <p>
                  Conheça seus direitos, responsabilidades e a finalidade estrita do Saldo Claro como ferramenta de gestão pessoal autônoma.
                </p>
              </div>

              <div className="privacy-sections-grid">
                {TERMS_OF_USE_SECTIONS.map((sec, i) => (
                  <article key={i} className="privacy-section-card">
                    <div className="privacy-sec-icon">
                      <Scale size={20} />
                    </div>
                    <div className="privacy-sec-content">
                      <h5>{sec.title}</h5>
                      <p style={{ whiteSpace: 'pre-line' }}>{sec.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MEUS DADOS E DIREITOS LGPD */}
          {activeTab === 'my_data' && (
            <div className="privacy-tab-content">
              <div className="data-rights-overview">
                <h4>Quais dados são armazenados na sua conta?</h4>
                <p>
                  Todos os dados abaixo são isolados no banco de dados através da política RLS (Row Level Security), acessíveis exclusivamente com suas credenciais.
                </p>
              </div>

              <div className="stored-data-cards">
                <div className="stored-data-item">
                  <strong>Identificação da Conta</strong>
                  <p>Endereço de e-mail e nome informados no cadastro. Senhas são criptografadas em hash irreversível.</p>
                </div>
                <div className="stored-data-item">
                  <strong>Lançamentos Financeiros</strong>
                  <p>Descrições, valores, datas, categorias e tipos (receita/despesa) que você cadastra ou importa.</p>
                </div>
                <div className="stored-data-item">
                  <strong>Contas e Cartões</strong>
                  <p>Nomes de instituições bancárias, tipo de cartão e dias de fechamento/vencimento configurados.</p>
                </div>
                <div className="stored-data-item">
                  <strong>Caixinhas e Metas</strong>
                  <p>Nomes de objetivos, metas financeiras estipuladas e histórico de aportes/retiradas.</p>
                </div>
              </div>

              <div className="rights-actions-card">
                <h5>Como exercer seus direitos da LGPD:</h5>
                <div className="rights-buttons-list">
                  <div className="right-action-row">
                    <div>
                      <strong>Portabilidade e Cópia dos Dados:</strong>
                      <p>Exporte seu extrato completo a qualquer momento em formato universal CSV clicando no botão "Exportar CSV" na tela de Extrato.</p>
                    </div>
                  </div>
                  <div className="right-action-row">
                    <div>
                      <strong>Correção e Atualização:</strong>
                      <p>Edite qualquer lançamento, conta ou seu nome cadastral diretamente pelo menu de Configurações da Conta.</p>
                    </div>
                  </div>
                  <div className="right-action-row">
                    <div>
                      <strong>Eliminação e Exclusão Total:</strong>
                      <p>Lançamentos e caixinhas podem ser deletados individualmente com efeito imediato. Para solicitação de exclusão definitiva da conta de usuário de nossos servidores, entre em contato pelo suporte ou configurações.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE VERSÕES */}
          {activeTab === 'history' && (
            <div className="privacy-tab-content">
              <div className="history-timeline">
                {LEGAL_VERSIONS_HISTORY.map((ver, idx) => (
                  <div key={idx} className="timeline-version-card">
                    <div className="version-tag-row">
                      <span className="badge-badge badge-neutral">Versão {ver.version}</span>
                      <small className="version-date">{ver.date}</small>
                      {ver.requiresConsent && (
                        <span className="badge-badge badge-success">Exigiu novo consentimento</span>
                      )}
                    </div>
                    <h4>{ver.title}</h4>
                    <p>{ver.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="modal-foot privacy-modal-foot">
          <div className="privacy-foot-info">
            <Check size={16} className="text-emerald" />
            <span>Vigência atual: {CURRENT_LEGAL_DATE} • Documento registrado v{CURRENT_TERMS_VERSION}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  )
}
