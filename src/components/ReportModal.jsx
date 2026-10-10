import { useState } from 'react'
import {
  Check,
  Download,
  FileDown,
  FileText,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react'
import { exportToCsv, generatePdfReport } from '../utils/exportImport'
import { formatMoney, formatMonthName, formatDateLabel } from '../utils/formatters'
import { getCategoryLabel } from '../constants/categories'
import { Money } from './ui'

export function ReportModal({
  entries = [],
  month = '',
  accounts = [],
  onClose
}) {
  const [downloading, setDownloading] = useState(false)

  const accountMap = Object.fromEntries((accounts || []).map((acc) => [acc.id, acc.name]))

  const incomes = entries
    .filter((i) => i.type === 'income' && i.affects_balance !== false)
    .reduce((sum, i) => sum + Number(i.amount), 0)
  const expenses = entries
    .filter((i) => i.type === 'expense' && i.affects_balance !== false)
    .reduce((sum, i) => sum + Number(i.amount), 0)
  const net = incomes - expenses
  const savingsRate = incomes > 0 ? Math.max(0, Math.round(((incomes - expenses) / incomes) * 100)) : 0

  // Despesas agrupadas por categoria
  const catTotals = {}
  entries
    .filter((i) => i.type === 'expense' && i.affects_balance !== false)
    .forEach((i) => {
      catTotals[i.category] = (catTotals[i.category] || 0) + Number(i.amount)
    })
  const topCategories = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const handleDownloadPdf = () => {
    setDownloading(true)
    try {
      generatePdfReport({
        entries,
        month,
        accounts
      })
    } finally {
      setTimeout(() => setDownloading(false), 800)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCsv = () => {
    exportToCsv({
      entries,
      month,
      accounts
    })
  }

  return (
    <div
      className="modal-backdrop report-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-sheet report-modal-sheet" role="dialog" aria-modal="true">
        <header className="modal-head">
          <div className="report-title-group">
            <span className="report-icon-badge">
              <FileText size={20} />
            </span>
            <div>
              <h3>Relatório Financeiro do Mês</h3>
              <p>
                Período: <strong>{formatMonthName(month) || 'Mês selecionado'}</strong> •{' '}
                {entries.length} {entries.length === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>
          </div>

          <div className="report-head-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadPdf}
              disabled={downloading}
              title="Baixar arquivo PDF formatado"
            >
              <FileDown size={15} />
              <span>{downloading ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm hide-mobile"
              onClick={handlePrint}
              title="Imprimir ou salvar como PDF pelo navegador"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm hide-mobile"
              onClick={handleExportCsv}
              title="Exportar para Excel / CSV"
            >
              <Download size={15} />
              <span>CSV</span>
            </button>
            <button
              type="button"
              className="icon-btn-close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Conteúdo Imprimível do Relatório */}
        <div className="report-printable-area">
          <div className="report-document-header">
            <div className="report-brand">
              <span className="report-brand-title">SALDO CLARO</span>
              <span className="report-brand-sub">Relatório Financeiro Mensal</span>
            </div>
            <div className="report-meta-info">
              <span><strong>Mês:</strong> {formatMonthName(month)}</span>
              <span><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="report-summary-cards">
            <div className="report-card pos">
              <span className="card-label">Total em Entradas</span>
              <strong className="card-val">+ <Money value={incomes} /></strong>
            </div>
            <div className="report-card neg">
              <span className="card-label">Total em Saídas</span>
              <strong className="card-val">- <Money value={expenses} /></strong>
            </div>
            <div className={`report-card ${net >= 0 ? 'pos' : 'neg'}`}>
              <span className="card-label">Saldo Líquido</span>
              <strong className="card-val"><Money value={net} /></strong>
            </div>
            <div className="report-card neutral">
              <span className="card-label">Taxa de Poupança</span>
              <strong className="card-val">{savingsRate}% economizados</strong>
            </div>
          </div>

          {/* Top Categorias */}
          {topCategories.length > 0 && (
            <div className="report-category-section">
              <h4 className="report-section-title">Maiores Categorias de Despesa</h4>
              <div className="report-categories-grid">
                {topCategories.map(([catKey, total]) => {
                  const pct = expenses > 0 ? Math.round((total / expenses) * 100) : 0
                  return (
                    <div key={catKey} className="report-cat-card">
                      <div className="cat-title-row">
                        <span>{getCategoryLabel(catKey)}</span>
                        <strong>{pct}%</strong>
                      </div>
                      <div className="cat-bar-bg">
                        <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <small><Money value={total} /></small>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Extrato Detalhado */}
          <div className="report-statement-section">
            <h4 className="report-section-title">Extrato Detalhado ({entries.length} lançamentos)</h4>
            <div className="report-table-scroll">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Conta / Cartão</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => {
                    const isIncome = item.type === 'income'
                    return (
                      <tr key={item.id || item.date + item.description}>
                        <td className="cell-date">{formatDateLabel(item.date)}</td>
                        <td className="cell-desc"><strong>{item.description}</strong></td>
                        <td className="cell-cat">{getCategoryLabel(item.category)}</td>
                        <td className="cell-acc">{accountMap[item.account_id] || '-'}</td>
                        <td className={`cell-val ${isIncome ? 'pos' : 'neg'}`}>
                          {isIncome ? '+ ' : '- '}
                          {formatMoney(item.amount)}
                        </td>
                      </tr>
                    )
                  })}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>
                        Nenhum lançamento registrado neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <div className="spacer" />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            <FileDown size={16} />
            {downloading ? 'Gerando PDF...' : 'Baixar Relatório em PDF'}
          </button>
        </footer>
      </div>
    </div>
  )
}
