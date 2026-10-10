import { useState, useRef } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Download,
  FileSpreadsheet,
  Info,
  Layers,
  Upload,
  X
} from 'lucide-react'
import { supabase } from '../supabase'
import { parseCsvText, downloadSampleCsv } from '../utils/exportImport'
import { formatMoney, formatDateLabel } from '../utils/formatters'
import { getCategoryLabel } from '../constants/categories'
import { useAppDialog } from './Dialog'
import { Money } from './ui'

export function CsvImportModal({ accounts = [], onClose, onImportSuccess }) {
  const dialog = useAppDialog()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) processFile(selectedFile)
  }

  const processFile = (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      return dialog.alert('Selecione um arquivo com formato .csv.', {
        title: 'Formato inválido'
      })
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const result = parseCsvText(text)
      if (!result.success) {
        dialog.alert(result.error, { title: 'Erro ao ler arquivo' })
        setParsedData(null)
        setFile(null)
        return
      }
      setParsedData(result)
    }
    reader.readAsText(selectedFile, 'UTF-8')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) processFile(droppedFile)
  }

  const handleConfirmImport = async () => {
    if (!parsedData || !parsedData.rows.length) return

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user?.id) {
        throw new Error('Usuário não autenticado.')
      }
      const userId = authData.user.id

      // Mapeamento de contas existentes para tentar vincular pelo nome
      const accNameToId = {}
      accounts.forEach((a) => {
        accNameToId[a.name.toLowerCase()] = a.id
      })

      // Prepara os lotes de inserção
      const payloadRows = parsedData.rows.map((row) => {
        let accountId = null

        // 1. Tenta achar conta mencionada na linha do CSV
        if (row.account_name) {
          const matched = accounts.find((a) =>
            a.name.toLowerCase().includes(row.account_name.toLowerCase())
          )
          if (matched) accountId = matched.id
        }

        // 2. Se não achou, usa a conta selecionada pelo usuário no formulário
        if (!accountId && selectedAccountId) {
          accountId = selectedAccountId
        }

        return {
          user_id: userId,
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          category: row.category || 'Outros',
          account_id: accountId || null
        }
      })

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(payloadRows)

      if (insertError) {
        throw insertError
      }

      window.dispatchEvent(new Event('finance-data-changed'))
      if (onImportSuccess) onImportSuccess(payloadRows.length)

      await dialog.alert(
        `Importação concluída! ${payloadRows.length} lançamentos foram adicionados ao seu extrato com sucesso.`,
        { title: 'Sucesso na importação' }
      )
      onClose()
    } catch (err) {
      dialog.alert(err.message || 'Ocorreu um erro ao salvar os lançamentos.', {
        title: 'Falha na importação'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSample = async () => {
    const confirmed = await dialog.confirmDownload({
      title: 'Baixar Modelo de Planilha CSV',
      message: 'Confirme o download do modelo de exemplo pré-formatado:',
      fileName: 'modelo-importacao-saldo-claro.csv',
      fileType: 'Planilha de Exemplo (.csv)',
      fileFormat: 'CSV',
      description: 'Arquivo com colunas pré-configuradas (Data, Tipo, Descrição, Categoria, Valor e Conta) para facilitar o preenchimento e importação.',
      details: [
        { label: 'Formato', value: 'Delimitado por ponto e vírgula (;)' },
        { label: 'Exemplos', value: '6 lançamentos de demonstração' },
        { label: 'Codificação', value: 'UTF-8 com suporte ao Excel' },
        { label: 'Finalidade', value: 'Preencher e importar no sistema' }
      ],
      confirmLabel: 'Baixar Modelo'
    })

    if (!confirmed) return
    downloadSampleCsv()
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div className="modal-sheet csv-import-sheet" role="dialog" aria-modal="true">
        <header className="modal-head">
          <div className="import-title-group">
            <span className="import-icon-badge">
              <FileSpreadsheet size={20} />
            </span>
            <div>
              <h3>Importar Lançamentos via CSV</h3>
              <p>Envie o extrato do seu banco ou preencha uma planilha para importar em lote.</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn-close"
            onClick={onClose}
            aria-label="Fechar"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </header>

        <div className="import-body">
          {/* Caixa de Upload / Dropzone */}
          {!parsedData ? (
            <div
              className={`dropzone-box ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <span className="dropzone-icon">
                <Upload size={32} />
              </span>
              <h4>Arraste o seu arquivo .CSV aqui</h4>
              <p>Ou clique para selecionar um arquivo do seu computador ou celular.</p>
              <div className="dropzone-tips">
                <span>Formatos suportados: Nubank, Inter, Itaú, C6, Excel, Google Planilhas</span>
              </div>
            </div>
          ) : (
            <div className="import-preview-wrapper">
              {/* Barra de Status do Arquivo Carregado */}
              <div className="file-status-bar">
                <div className="file-info-col">
                  <strong>{file?.name}</strong>
                  <small>{parsedData.totalCount} lançamentos válidos identificados</small>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setParsedData(null)
                    setFile(null)
                  }}
                  disabled={loading}
                >
                  Trocar arquivo
                </button>
              </div>

              {/* Métricas do que será importado */}
              <div className="import-kpis-row">
                <div className="import-kpi-item pos">
                  <span>Total em Entradas</span>
                  <strong>+ <Money value={parsedData.totalIncome} /></strong>
                </div>
                <div className="import-kpi-item neg">
                  <span>Total em Saídas</span>
                  <strong>- <Money value={parsedData.totalExpense} /></strong>
                </div>
                <div className="import-kpi-item neutral">
                  <span>Saldo Importado</span>
                  <strong><Money value={parsedData.totalIncome - parsedData.totalExpense} /></strong>
                </div>
              </div>

              {/* Seletor de Conta Padrão */}
              {accounts.length > 0 && (
                <div className="import-account-picker">
                  <label htmlFor="import-account-select">
                    <strong>Vincular a qual conta ou cartão?</strong>
                    <small>(Caso o arquivo não especifique a fonte financeira de cada item)</small>
                  </label>
                  <select
                    id="import-account-select"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Não especificar conta (deixar avulso)</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.kind === 'card' ? 'Cartão' : 'Conta'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tabela de Amostra dos Lançamentos */}
              <div className="import-table-container">
                <span className="import-table-caption">
                  Prévia dos primeiros lançamentos a serem adicionados:
                </span>
                <table className="import-preview-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 6).map((r, i) => (
                      <tr key={i}>
                        <td className="cell-date">{formatDateLabel(r.date)}</td>
                        <td className="cell-desc" title={r.description}>{r.description}</td>
                        <td className="cell-cat">{getCategoryLabel(r.category)}</td>
                        <td className={`cell-val ${r.type === 'income' ? 'pos' : 'neg'}`}>
                          {r.type === 'income' ? '+ ' : '- '}
                          {formatMoney(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.rows.length > 6 && (
                  <p className="more-rows-hint">
                    ... e mais {parsedData.rows.length - 6} lançamentos prontos para importação.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dica para baixar o modelo de exemplo */}
          <div className="import-help-footer">
            <button
              type="button"
              className="btn-sample-csv"
              onClick={handleDownloadSample}
              title="Baixar planilha modelo de exemplo"
            >
              <Download size={14} /> Baixar modelo de CSV de exemplo
            </button>
          </div>
        </div>

        <footer className="modal-foot">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          {parsedData && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmImport}
              disabled={loading || !parsedData.rows.length}
            >
              <Check size={16} />
              {loading
                ? 'Importando lançamentos...'
                : `Confirmar e Importar ${parsedData.rows.length} lançamentos`}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

