import { useState, useRef, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CopyCheck,
  Download,
  FileSpreadsheet,
  Info,
  Layers,
  Search,
  Upload,
  X
} from 'lucide-react'
import { supabase } from '../supabase'
import {
  BANK_CONFIGS,
  autoDetectBankFromHeader,
  parseBankCsv,
  markDuplicateTransactions
} from '../utils/bankParsers'
import { downloadSampleCsv } from '../utils/exportImport'
import { formatMoney, formatDateLabel } from '../utils/formatters'
import { getCategoryLabel } from '../constants/categories'
import { useAppDialog } from './Dialog'
import { BankLogoBadge, CategoryIcon, Money } from './ui'

export function CsvImportModal({ accounts = [], entries = [], onClose, onImportSuccess }) {
  const dialog = useAppDialog()
  const fileInputRef = useRef(null)

  // Etapa do fluxo: 'select_bank' (1) | 'upload' (2) | 'preview' (3)
  const [step, setStep] = useState('select_bank')
  const [selectedBankId, setSelectedBankId] = useState('nubank')
  const [bankSearch, setBankSearch] = useState('')
  const [autoDetect, setAutoDetect] = useState(true)

  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(true)
  const [selectedRowIds, setSelectedRowIds] = useState(new Set())
  const [showInvalidDetails, setShowInvalidDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const currentBankConfig = useMemo(
    () => BANK_CONFIGS.find((b) => b.id === selectedBankId) || BANK_CONFIGS[BANK_CONFIGS.length - 1],
    [selectedBankId]
  )

  const filteredBanks = useMemo(() => {
    const q = bankSearch.toLowerCase().trim()
    if (!q) return BANK_CONFIGS
    return BANK_CONFIGS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.includes(q)
    )
  }, [bankSearch])

  const handleSelectBank = (bankId) => {
    setSelectedBankId(bankId)
    // Tenta pré-selecionar uma conta cadastrada que corresponda ao banco
    const matchedAccount = accounts.find((a) =>
      a.name.toLowerCase().includes(bankId) ||
      (bankId === 'bb' && (a.name.toLowerCase().includes('brasil') || a.name.toLowerCase().includes('bb'))) ||
      (bankId === 'itau' && (a.name.toLowerCase().includes('itau') || a.name.toLowerCase().includes('itaú')))
    )
    if (matchedAccount) {
      setSelectedAccountId(matchedAccount.id)
    }
    setStep('upload')
  }

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
      let activeBankId = selectedBankId

      // Identificação automática opcional por cabeçalho
      if (autoDetect) {
        const detected = autoDetectBankFromHeader(text.slice(0, 500))
        if (detected && detected !== 'generic' && detected !== selectedBankId) {
          activeBankId = detected
          setSelectedBankId(detected)
        }
      }

      const parseResult = parseBankCsv(text, activeBankId)
      if (!parseResult.success) {
        dialog.alert(parseResult.error, { title: 'Erro ao interpretar extrato' })
        setParsedData(null)
        setFile(null)
        return
      }

      // Detecção de duplicatas com o histórico atual
      const { rows: markedRows, duplicateCount } = markDuplicateTransactions(
        parseResult.rows,
        entries
      )

      // Seleciona por padrão as linhas válidas (exceto duplicatas se ignoreDuplicates estiver ativo)
      const initialSelected = new Set(
        markedRows
          .filter((r) => !ignoreDuplicates || !r.isDuplicate)
          .map((r) => r.id)
      )

      setParsedData({
        ...parseResult,
        rows: markedRows,
        duplicateCount
      })
      setSelectedRowIds(initialSelected)
      setStep('preview')
    }

    reader.readAsText(selectedFile, 'UTF-8')
  }

  const handleToggleIgnoreDuplicates = (checked) => {
    setIgnoreDuplicates(checked)
    if (!parsedData) return

    const nextSelected = new Set(selectedRowIds)
    parsedData.rows.forEach((row) => {
      if (row.isDuplicate) {
        if (checked) {
          nextSelected.delete(row.id)
        } else {
          nextSelected.add(row.id)
        }
      }
    })
    setSelectedRowIds(nextSelected)
  }

  const toggleRowSelection = (id) => {
    const next = new Set(selectedRowIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedRowIds(next)
  }

  const toggleAllRows = () => {
    if (!parsedData) return
    if (selectedRowIds.size === parsedData.rows.length) {
      setSelectedRowIds(new Set())
    } else {
      setSelectedRowIds(new Set(parsedData.rows.map((r) => r.id)))
    }
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

    const rowsToImport = parsedData.rows.filter((r) => selectedRowIds.has(r.id))
    if (rowsToImport.length === 0) {
      return dialog.alert('Selecione pelo menos uma transação para importar.', {
        title: 'Nenhum lançamento selecionado'
      })
    }

    const confirmed = await dialog.confirm(
      `Deseja importar ${rowsToImport.length} lançamentos para o seu extrato? Esta operação é definitiva e atualizará seus relatórios financeiros.`,
      {
        title: 'Confirmar importação de lançamentos?',
        confirmLabel: `Sim, importar ${rowsToImport.length} registros`
      }
    )
    if (!confirmed) return

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user?.id) {
        throw new Error('Usuário não autenticado.')
      }
      const userId = authData.user.id

      // Monta os registros finais
      const payloadRows = rowsToImport.map((row) => ({
        user_id: userId,
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category || 'Outros',
        account_id: selectedAccountId || null,
        affects_balance: true,
        show_in_statement: true
      }))

      // Inserção em lotes de 100 para segurança e robustez transacional
      const BATCH_SIZE = 100
      for (let i = 0; i < payloadRows.length; i += BATCH_SIZE) {
        const chunk = payloadRows.slice(i, i + BATCH_SIZE)
        const { error: insertError } = await supabase.from('transactions').insert(chunk)
        if (insertError) {
          throw insertError
        }
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
      message: 'Confirme o download do modelo padrão pré-formatado:',
      fileName: 'modelo-importacao-saldo-claro.csv',
      fileType: 'Planilha de Exemplo (.csv)',
      fileFormat: 'CSV',
      description: 'Arquivo com colunas pré-configuradas (Data, Tipo, Descrição, Categoria, Valor e Conta) para preenchimento manual.',
      details: [
        { label: 'Formato', value: 'Delimitado por ponto e vírgula (;)' },
        { label: 'Codificação', value: 'UTF-8' }
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
              <h3>Importar Extrato Bancário</h3>
              <p>
                {step === 'select_bank' && 'Passo 1 de 3: Selecione a instituição financeira de origem'}
                {step === 'upload' && `Passo 2 de 3: Envie o extrato do ${currentBankConfig.name}`}
                {step === 'preview' && 'Passo 3 de 3: Prévia e conferência das transações'}
              </p>
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
          {/* PASSO 1: Seleção da Instituição Financeira */}
          {step === 'select_bank' && (
            <div className="bank-selection-flow">
              <div className="bank-search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar banco ou instituição..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="bank-cards-grid">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    className="bank-pick-card"
                    onClick={() => handleSelectBank(bank.id)}
                  >
                    <BankLogoBadge logoId={bank.logoId} size={42} />
                    <div className="bank-card-text">
                      <strong>{bank.name}</strong>
                      <small>Extrato CSV</small>
                    </div>
                  </button>
                ))}
              </div>

              <div className="import-help-footer">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleDownloadSample}
                >
                  <Download size={13} /> Baixar planilha modelo (.CSV)
                </button>
              </div>
            </div>
          )}

          {/* PASSO 2: Orientações do Banco e Upload */}
          {step === 'upload' && (
            <div className="bank-upload-flow">
              <div className="bank-header-selected">
                <button
                  type="button"
                  className="btn-back-link"
                  onClick={() => setStep('select_bank')}
                >
                  <ArrowLeft size={14} /> Trocar instituição
                </button>
                <div className="bank-badge-title">
                  <BankLogoBadge logoId={currentBankConfig.logoId} size={32} />
                  <h4>{currentBankConfig.name}</h4>
                </div>
              </div>

              {/* Dicas e Orientações específicas do banco */}
              <div className="bank-instructions-box">
                <Info size={18} className="info-icon" />
                <div>
                  <strong>Como exportar no {currentBankConfig.name}:</strong>
                  <p>{currentBankConfig.tips}</p>
                </div>
              </div>

              {/* Caixa de Dropzone */}
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
                  <Upload size={34} />
                </span>
                <h4>Arraste o arquivo CSV do {currentBankConfig.name} aqui</h4>
                <p>Ou clique para selecionar um arquivo do seu computador ou celular.</p>
                <div className="dropzone-tips">
                  <span>Formato suportado: Arquivos delimitados .CSV em UTF-8</span>
                </div>
              </div>

              <label className="checkbox-mini auto-detect-toggle">
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                />
                <span>Detectar automaticamente o banco se o extrato for de outra instituição</span>
              </label>
            </div>
          )}

          {/* PASSO 3: Prévia, Validação e Duplicatas */}
          {step === 'preview' && parsedData && (
            <div className="import-preview-wrapper">
              <div className="file-status-bar">
                <div className="file-info-col">
                  <div className="file-name-row">
                    <BankLogoBadge logoId={currentBankConfig.logoId} size={24} />
                    <strong>{file?.name}</strong>
                    <span className="badge-badge badge-neutral">{currentBankConfig.name}</span>
                  </div>
                  <small>
                    {parsedData.totalCount} transações identificadas com sucesso
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setParsedData(null)
                    setFile(null)
                    setStep('upload')
                  }}
                  disabled={loading}
                >
                  Trocar arquivo
                </button>
              </div>

              {/* KPIs de Resumo da Importação */}
              <div className="import-kpis-row">
                <div className="kpi-mini-card">
                  <span>Prontos para importar</span>
                  <strong>{selectedRowIds.size} de {parsedData.totalCount}</strong>
                </div>
                <div className="kpi-mini-card">
                  <span>Total Entradas</span>
                  <strong className="pos"><Money value={parsedData.totalIncome} /></strong>
                </div>
                <div className="kpi-mini-card">
                  <span>Total Saídas</span>
                  <strong className="neg"><Money value={parsedData.totalExpense} /></strong>
                </div>
                {parsedData.duplicateCount > 0 && (
                  <div className="kpi-mini-card warning">
                    <span>Possíveis Duplicatas</span>
                    <strong className="warn-text">{parsedData.duplicateCount}</strong>
                  </div>
                )}
              </div>

              {/* Barra de Controles: Conta de Destino e Tratamento de Duplicatas */}
              <div className="import-settings-bar">
                <div className="account-select-group">
                  <label htmlFor="import-account-picker">Vincular à conta:</label>
                  <select
                    id="import-account-picker"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Sem conta definida (Saldo Geral)</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.kind === 'card' ? 'Cartão' : 'Conta'})
                      </option>
                    ))}
                  </select>
                </div>

                {parsedData.duplicateCount > 0 && (
                  <label className="checkbox-mini duplicate-toggle">
                    <input
                      type="checkbox"
                      checked={ignoreDuplicates}
                      onChange={(e) => handleToggleIgnoreDuplicates(e.target.checked)}
                    />
                    <span>Ignorar duplicatas detectadas ({parsedData.duplicateCount})</span>
                  </label>
                )}
              </div>

              {/* Tabela de Prévia dos Lançamentos */}
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36px' }}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.size === parsedData.rows.length && parsedData.rows.length > 0}
                          onChange={toggleAllRows}
                          aria-label="Selecionar todos"
                        />
                      </th>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.map((row) => {
                      const isSelected = selectedRowIds.has(row.id)
                      return (
                        <tr
                          key={row.id}
                          className={`${row.isDuplicate ? 'is-duplicate-row' : ''} ${!isSelected ? 'is-unselected' : ''}`}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(row.id)}
                            />
                          </td>
                          <td className="cell-date">{formatDateLabel(row.date)}</td>
                          <td className="cell-desc" title={row.description}>
                            <strong>{row.description}</strong>
                          </td>
                          <td className="cell-cat">
                            <span className="cat-pill">
                              <CategoryIcon category={row.category} size={13} />
                              {getCategoryLabel(row.category)}
                            </span>
                          </td>
                          <td className="cell-type">
                            <span className={`type-tag ${row.type === 'income' ? 'tag-inc' : 'tag-exp'}`}>
                              {row.type === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className={`cell-val ${row.type === 'income' ? 'pos' : 'neg'}`}>
                            <Money value={row.amount} />
                          </td>
                          <td className="cell-status">
                            {row.isDuplicate ? (
                              <span className="badge-badge badge-warning" title="Lançamento com data, valor e descrição semelhantes aos já existentes">
                                <AlertTriangle size={11} /> Possível duplicata
                              </span>
                            ) : (
                              <span className="badge-badge badge-success">
                                <Check size={11} /> Válido
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Alerta de Linhas Inválidas Ignoradas */}
              {parsedData.invalidRows && parsedData.invalidRows.length > 0 && (
                <div className="invalid-rows-panel">
                  <div className="invalid-head">
                    <span className="invalid-title">
                      <AlertCircle size={15} />
                      {parsedData.invalidRows.length} linha(s) ignorada(s) por inconsistência
                    </span>
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => setShowInvalidDetails(!showInvalidDetails)}
                    >
                      {showInvalidDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                  </div>
                  {showInvalidDetails && (
                    <ul className="invalid-list">
                      {parsedData.invalidRows.map((inv, idx) => (
                        <li key={idx}>
                          <strong>Linha {inv.line}:</strong> {inv.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="modal-foot">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep('upload')}
                disabled={loading}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={loading || selectedRowIds.size === 0}
              >
                {loading ? 'Salvando no extrato...' : `Confirmar Importação (${selectedRowIds.size})`}
              </button>
            </>
          ) : step === 'upload' ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep('select_bank')}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
