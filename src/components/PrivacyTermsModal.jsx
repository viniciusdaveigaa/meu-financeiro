import {
  Check,
  ChevronRight,
  Database,
  FileText,
  KeyRound,
  Lock,
  Scale,
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react'

export function PrivacyTermsModal({ onClose }) {
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
        <div className="sheet-handle" />

        {/* Header */}
        <header className="modal-head privacy-modal-header">
          <div className="privacy-head-title">
            <span className="privacy-icon-badge">
              <ShieldCheck size={22} />
            </span>
            <div className="privacy-head-text">
              <h3 id="privacy-modal-title">Política de Privacidade & Termos de Uso</h3>
              <p>Transparência total sobre a proteção e o tratamento dos seus dados.</p>
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

        {/* Content Body */}
        <div className="privacy-modal-body">
          {/* Top Callout */}
          <div className="privacy-hero-banner">
            <div className="privacy-badge">
              <Lock size={14} />
              <span>Privacidade por Design • Seus dados são seus</span>
            </div>
            <h4>Seu dinheiro, sua privacidade. Sem concessões.</h4>
            <p>
              O <strong>Saldo Claro</strong> foi construído sob uma premissa fundamental:
              ajudá-lo a organizar suas finanças com máxima clareza sem que ninguém — nem anunciantes,
              nem instituições financeiras, nem outros usuários — tenha acesso aos seus lançamentos.
            </p>
          </div>

          {/* Cards Grid / Sections */}
          <div className="privacy-sections-grid">
            {/* Section 1 */}
            <article className="privacy-section-card">
              <div className="privacy-sec-icon">
                <Database size={20} />
              </div>
              <div className="privacy-sec-content">
                <h5>1. Isolamento Matemático (Row Level Security - RLS)</h5>
                <p>
                  Utilizamos a tecnologia de <strong>Row Level Security</strong> integrada ao PostgreSQL.
                  Isso significa que, a nível de banco de dados, cada consulta ou inserção é restrita exclusivamente
                  ao seu identificador de usuário (UID).
                </p>
                <span className="privacy-sec-tag">Garantia: Zero vazamento entre contas</span>
              </div>
            </article>

            {/* Section 2 */}
            <article className="privacy-section-card">
              <div className="privacy-sec-icon">
                <FileText size={20} />
              </div>
              <div className="privacy-sec-content">
                <h5>2. Dados Coletados e Sua Finalidade</h5>
                <p>
                  Coletamos estritamente o necessário para o funcionamento do sistema:
                </p>
                <ul className="privacy-bullet-list">
                  <li><strong>Identificação:</strong> Seu e-mail e nome (para autenticação segura e saudação personalizada).</li>
                  <li><strong>Lançamentos e Metas:</strong> Descrições, valores, datas e contas financeiras informadas voluntariamente por você para compor seus gráficos e extratos.</li>
                </ul>
              </div>
            </article>

            {/* Section 3 */}
            <article className="privacy-section-card">
              <div className="privacy-sec-icon">
                <ShieldCheck size={20} />
              </div>
              <div className="privacy-sec-content">
                <h5>3. Não Compartilhamento e Não Comercialização</h5>
                <p>
                  <strong>Nós não vendemos, não alugamos e não compartilhamos seus dados financeiros</strong> com birôs de crédito (Serasa, SPC, Boa Vista), bancos, seguradoras ou redes de publicidade.
                  O sistema não exibe anúncios nem monetiza seu histórico pessoal.
                </p>
              </div>
            </article>

            {/* Section 4 */}
            <article className="privacy-section-card">
              <div className="privacy-sec-icon">
                <KeyRound size={20} />
              </div>
              <div className="privacy-sec-content">
                <h5>4. Criptografia e Segurança de Acesso</h5>
                <p>
                  Todo o tráfego é transmitido por conexões criptografadas de ponta a ponta (HTTPS/TLS 1.3).
                  Senhas são armazenadas através de funções de hash criptográfico irreversíveis.
                  Para quem utiliza login com o Google, a autenticação é delegada com segurança direta via protocolo OAuth 2.0.
                </p>
              </div>
            </article>

            {/* Section 5 */}
            <article className="privacy-section-card">
              <div className="privacy-sec-icon">
                <Scale size={20} />
              </div>
              <div className="privacy-sec-content">
                <h5>5. Seus Direitos (Conformidade com a LGPD)</h5>
                <p>
                  Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
                </p>
                <ul className="privacy-bullet-list">
                  <li><strong>Direito de Exclusão:</strong> Você pode excluir qualquer lançamento, conta ou caixinha a qualquer momento com efeito imediato.</li>
                  <li><strong>Direito de Portabilidade:</strong> Você pode exportar seus dados em formato aberto (CSV/Planilha) quando desejar.</li>
                  <li><strong>Exclusão de Conta:</strong> Solicite a remoção definitiva da sua conta e de todos os dados atrelados pelo menu de configurações ou suporte.</li>
                </ul>
              </div>
            </article>

            {/* Section 6 */}
            <article className="privacy-section-card">
              <div className="privacy-sec-icon">
                <UserCheck size={20} />
              </div>
              <div className="privacy-sec-content">
                <h5>6. Responsabilidades do Usuário</h5>
                <p>
                  Para manter seu ambiente seguro:
                </p>
                <ul className="privacy-bullet-list">
                  <li>Utilize senhas fortes e exclusivas (mínimo de 9 caracteres com letras, números e símbolos).</li>
                  <li>Nunca compartilhe seu link ou dados de acesso com terceiros.</li>
                  <li>Lembre-se de clicar em <strong>"Encerrar Sessão"</strong> caso utilize dispositivos públicos ou compartilhados.</li>
                </ul>
              </div>
            </article>
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="modal-foot privacy-modal-foot">
          <div className="privacy-foot-info">
            <Check size={16} className="text-emerald" />
            <span>Última atualização: Outubro de 2026 • Versão 2.0</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
          >
            Entendi e concordo
          </button>
        </footer>
      </div>
    </div>
  )
}
