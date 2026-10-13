/**
 * Sistema Modular de Importação de Extratos CSV por Banco
 * Suporta Nubank, Itaú, Bradesco, Banco do Brasil, Banco Inter, C6 Bank, Caixa, Santander e Modelo Genérico.
 */

// Heurística de detecção de separador de campos
export function detectDelimiter(headerLine = '') {
  const counts = {
    ';': (headerLine.match(/;/g) || []).length,
    ',': (headerLine.match(/,/g) || []).length,
    '\t': (headerLine.match(/\t/g) || []).length
  }
  if (counts[';'] >= counts[','] && counts[';'] >= counts['\t'] && counts[';'] > 0) return ';'
  if (counts['\t'] > counts[','] && counts['\t'] > 0) return '\t'
  return ','
}

// Normalização de número brasileiro ou americano
export function parseFinancialAmount(rawAmount) {
  if (rawAmount == null || rawAmount === '') return 0
  let str = String(rawAmount)
    .replace(/R\$/gi, '')
    .replace(/[a-zA-Z]/g, '')
    .replace(/\s+/g, '')

  let isNegative = false
  if (str.startsWith('-') || str.startsWith('(') || str.endsWith('-') || str.endsWith('D')) {
    isNegative = true
  }
  str = str.replace(/[\-\(\)CD+]/gi, '')

  let num = 0
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Padrão brasileiro: 1.234,56
      num = Number(str.replace(/\./g, '').replace(',', '.'))
    } else {
      // Padrão americano: 1,234.56
      num = Number(str.replace(/,/g, ''))
    }
  } else if (str.includes(',')) {
    num = Number(str.replace(',', '.'))
  } else {
    num = Number(str)
  }

  if (isNaN(num)) return 0
  return isNegative ? -Math.abs(num) : Math.abs(num)
}

// Normalização universal de data (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
export function parseDateString(rawDate = '') {
  if (!rawDate) return null
  const clean = String(rawDate).trim()

  const brMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (brMatch) {
    const d = String(brMatch[1]).padStart(2, '0')
    const m = String(brMatch[2]).padStart(2, '0')
    const y = brMatch[3]
    return `${y}-${m}-${d}`
  }

  const isoMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = String(isoMatch[2]).padStart(2, '0')
    const d = String(isoMatch[3]).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return null
}

// Divisão correta de linha CSV respeitando aspas
export function splitCsvRow(line, delimiter = ';') {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''))
  return result
}

// Heurística de categoria automática
export function guessCategory(description = '') {
  const d = description.toLowerCase()
  if (d.includes('mercado') || d.includes('supermercado') || d.includes('ifood') || d.includes('restaurante') || d.includes('padaria') || d.includes('cafe') || d.includes('lanche') || d.includes('pao de acucar') || d.includes('carrefour') || d.includes('assai')) {
    return 'Alimentacao'
  }
  if (d.includes('uber') || d.includes('99') || d.includes('gasolina') || d.includes('posto') || d.includes('combustivel') || d.includes('estacionamento') || d.includes('pedagio') || d.includes('sem parar') || d.includes('veloe')) {
    return 'Transporte'
  }
  if (d.includes('farmacia') || d.includes('drogaria') || d.includes('medico') || d.includes('consulta') || d.includes('hospital') || d.includes('saude') || d.includes('dentista') || d.includes('raia') || d.includes('drogasil')) {
    return 'Saude'
  }
  if (d.includes('aluguel') || d.includes('condominio') || d.includes('luz') || d.includes('enel') || d.includes('agua') || d.includes('sabesp') || d.includes('gas') || d.includes('iptu') || d.includes('cpfl')) {
    return 'Moradia'
  }
  if (d.includes('netflix') || d.includes('spotify') || d.includes('amazon') || d.includes('prime') || d.includes('disney') || d.includes('hbo') || d.includes('youtube') || d.includes('internet') || d.includes('claro') || d.includes('vivo') || d.includes('tim')) {
    return 'Assinaturas'
  }
  if (d.includes('salario') || d.includes('remuneracao') || d.includes('pro-labore') || d.includes('rendimento') || d.includes('dividendo') || d.includes('pix recebido') || d.includes('ted recebida') || d.includes('deposito recebido')) {
    return 'Salario'
  }
  if (d.includes('cinema') || d.includes('show') || d.includes('teatro') || d.includes('viagem') || d.includes('hotel') || d.includes('praia') || d.includes('lazer') || d.includes('airbnb') || d.includes('booking')) {
    return 'Lazer'
  }
  if (d.includes('curso') || d.includes('escola') || d.includes('faculdade') || d.includes('livro') || d.includes('udemy') || d.includes('educacao') || d.includes('alura')) {
    return 'Educacao'
  }
  return 'Outros'
}

/**
 * Interpretadores específicos de cada banco
 */
export const BANK_CONFIGS = [
  {
    id: 'nubank',
    name: 'Nubank',
    logoId: 'nubank',
    defaultDelimiter: ',',
    acceptedExtensions: '.csv',
    tips: 'Acesse o app Nubank > Conta > Extrato > Exportar extrato CSV. Se for cartão, Fatura > Exportar CSV.',
    detectPattern: (header) => header.includes('identificador') || header.includes('title,amount') || (header.includes('data,valor') && header.includes('descri'))
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    logoId: 'itau',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'No Itaú Internet Banking ou App: Conta Corrente > Extrato > Salvar em outros formatos > CSV (Excel).',
    detectPattern: (header) => header.includes('lançamento') || header.includes('itau') || (header.includes('data') && header.includes('saldo') && header.includes('valor'))
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    logoId: 'inter',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'No Internet Banking do Inter: Conta Digital > Extrato > Exportar > CSV.',
    detectPattern: (header) => header.includes('data lançamento') || (header.includes('inter') && header.includes('extrato'))
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    logoId: 'bb',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'No Autoatendimento BB: Extrato > Conta Corrente > Exportar em arquivo > CSV.',
    detectPattern: (header) => header.includes('dependência') || header.includes('balancete') || header.includes('número do documento')
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    logoId: 'bradesco',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'No Bradesco Net Empresa ou Correntista: Extrato > Salvar como arquivo > Planilha (CSV).',
    detectPattern: (header) => header.includes('docto.') || (header.includes('crédito') && header.includes('débito'))
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    logoId: 'c6',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'No app do C6 Bank: Extrato da Conta > Exportar extrato > Formato CSV.',
    detectPattern: (header) => header.includes('c6') || (header.includes('transação') && header.includes('valor'))
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    logoId: 'caixa',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'No Internet Banking Caixa: Contas > Extrato > Baixar arquivo > CSV.',
    detectPattern: (header) => header.includes('data_mov') || header.includes('deb_cred') || header.includes('nr_doc')
  },
  {
    id: 'santander',
    name: 'Santander',
    logoId: 'santander',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'No Santander Internet Banking: Conta > Extrato de Movimentações > Baixar > Planilha CSV.',
    detectPattern: (header) => header.includes('santander') || (header.includes('docto') && header.includes('saldo'))
  },
  {
    id: 'generic',
    name: 'Outro Banco / Genérico',
    logoId: 'banco',
    defaultDelimiter: ';',
    acceptedExtensions: '.csv',
    tips: 'Qualquer planilha CSV contendo colunas de Data, Descrição e Valor (com separador vírgula ou ponto e vírgula).',
    detectPattern: () => true
  }
]

/**
 * Detecta automaticamente a instituição financeira com base no cabeçalho do arquivo
 */
export function autoDetectBankFromHeader(firstLine = '') {
  const norm = firstLine.toLowerCase()
  for (const config of BANK_CONFIGS) {
    if (config.id !== 'generic' && config.detectPattern(norm)) {
      return config.id
    }
  }
  return 'generic'
}

/**
 * Interpretador mestre modular
 */
export function parseBankCsv(csvText, bankId = 'generic') {
  if (!csvText || typeof csvText !== 'string') {
    return { success: false, error: 'O conteúdo do arquivo CSV está vazio.' }
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) {
    return { success: false, error: 'O arquivo não possui lançamentos suficientes para importação.' }
  }

  // Identifica a linha de cabeçalho
  let headerIndex = 0
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i].toLowerCase()
    if (l.includes('data') || l.includes('date') || l.includes('valor') || l.includes('amount') || l.includes('descri')) {
      headerIndex = i
      break
    }
  }

  const headerLine = lines[headerIndex]
  const delimiter = detectDelimiter(headerLine)
  const headers = splitCsvRow(headerLine, delimiter).map((h) => h.toLowerCase().trim())

  // Mapeamento de colunas
  let dateIdx = headers.findIndex((h) => h.includes('data') || h.includes('date') || h.includes('dt'))
  let descIdx = headers.findIndex((h) => h.includes('descri') || h.includes('lançamento') || h.includes('historico') || h.includes('histórico') || h.includes('title') || h.includes('transação'))
  let amountIdx = headers.findIndex((h) => h.includes('valor') || h.includes('amount') || h.includes('quantia'))
  let catIdx = headers.findIndex((h) => h.includes('categ'))
  let typeIdx = headers.findIndex((h) => h.includes('tipo') || h.includes('type'))

  // Bradesco / Bancos com colunas separadas de Débito e Crédito
  const creditColIdx = headers.findIndex((h) => h.includes('crédito') || h.includes('credito') || h.includes('entrada'))
  const debitColIdx = headers.findIndex((h) => h.includes('débito') || h.includes('debito') || h.includes('saída') || h.includes('saida'))
  const debCredColIdx = headers.findIndex((h) => h.includes('deb_cred') || h.includes('d_c') || h.includes('indicador'))

  if (dateIdx === -1) dateIdx = 0
  if (descIdx === -1) descIdx = 1
  if (amountIdx === -1 && creditColIdx === -1) amountIdx = 2

  const validRows = []
  const invalidRows = []

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    // Ignora linhas de saldo e resumos dos bancos
    const lowerLine = line.toLowerCase()
    if (
      lowerLine.includes('saldo anterior') ||
      lowerLine.includes('saldo do dia') ||
      lowerLine.includes('saldo final') ||
      lowerLine.includes('saldo atual') ||
      lowerLine.includes('total de saídas') ||
      lowerLine.includes('total de entradas') ||
      lowerLine.includes('s a l d o')
    ) {
      continue
    }

    const cols = splitCsvRow(line, delimiter)
    if (cols.length < 2) continue

    const rawDate = cols[dateIdx]
    const rawDesc = cols[descIdx] || 'Lançamento sem descrição'
    const rawCat = catIdx !== -1 ? cols[catIdx] : ''
    const rawType = typeIdx !== -1 ? cols[typeIdx] : ''

    const parsedDate = parseDateString(rawDate)
    if (!parsedDate) {
      invalidRows.push({
        line: i + 1,
        rawContent: line,
        reason: `Data inválida ou não reconhecida: "${rawDate || 'vazio'}"`
      })
      continue
    }

    let parsedAmount = 0
    let detectedType = 'expense'

    // Cenário 1: Colunas separadas de Crédito e Débito (ex.: Bradesco)
    if (creditColIdx !== -1 && debitColIdx !== -1) {
      const credVal = parseFinancialAmount(cols[creditColIdx])
      const debVal = parseFinancialAmount(cols[debitColIdx])

      if (credVal > 0) {
        parsedAmount = credVal
        detectedType = 'income'
      } else if (debVal > 0) {
        parsedAmount = debVal
        detectedType = 'expense'
      }
    }
    // Cenário 2: Indicador D/C (ex.: Caixa)
    else if (debCredColIdx !== -1) {
      parsedAmount = Math.abs(parseFinancialAmount(cols[amountIdx]))
      const indicator = String(cols[debCredColIdx]).toUpperCase()
      detectedType = indicator.includes('C') ? 'income' : 'expense'
    }
    // Cenário 3: Coluna única de valor (Nubank, Itaú, Inter, C6, etc.)
    else {
      const signedVal = parseFinancialAmount(cols[amountIdx])
      parsedAmount = Math.abs(signedVal)

      // Regras bancárias:
      // Se o valor for negativo, é saída (despesa). Se for positivo, é entrada (receita).
      if (signedVal < 0) {
        detectedType = 'expense'
      } else if (signedVal > 0) {
        // Exceção de fatura de cartão onde compras aparecem positivas
        if (bankId === 'nubank' && headers.includes('title') && headers.includes('amount')) {
          detectedType = 'expense'
        } else {
          detectedType = 'income'
        }
      }
    }

    // Sobrescrita se houver coluna de tipo explícita
    if (rawType) {
      const t = rawType.toLowerCase()
      if (t.includes('rec') || t.includes('in') || t.includes('créd') || t.includes('cred')) {
        detectedType = 'income'
      } else if (t.includes('des') || t.includes('exp') || t.includes('déb') || t.includes('deb')) {
        detectedType = 'expense'
      }
    }

    if (!(parsedAmount > 0)) {
      invalidRows.push({
        line: i + 1,
        rawContent: line,
        reason: 'Valor numérico não identificado ou zerado.'
      })
      continue
    }

    validRows.push({
      id: `temp_${i}_${Date.now()}`,
      date: parsedDate,
      description: rawDesc.replace(/\s+/g, ' ').trim(),
      amount: parsedAmount,
      type: detectedType,
      category: rawCat ? rawCat.trim() : guessCategory(rawDesc),
      isDuplicate: false
    })
  }

  return {
    success: true,
    bankId,
    delimiter,
    rows: validRows,
    invalidRows,
    totalCount: validRows.length,
    totalIncome: validRows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
    totalExpense: validRows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  }
}

/**
 * Detecta duplicatas comparando com os lançamentos já cadastrados no sistema
 */
export function markDuplicateTransactions(parsedRows = [], existingTransactions = []) {
  if (!existingTransactions || existingTransactions.length === 0) {
    return { rows: parsedRows, duplicateCount: 0 }
  }

  let duplicateCount = 0

  const updatedRows = parsedRows.map((row) => {
    const isDup = existingTransactions.some((tx) => {
      // 1. Mesma data
      if (tx.date !== row.date) return false
      // 2. Mesmo valor aproximado
      if (Math.abs(Number(tx.amount) - Number(row.amount)) > 0.005) return false
      // 3. Descrição idêntica ou contida
      const rowDescNorm = row.description.toLowerCase().trim()
      const txDescNorm = tx.description.toLowerCase().trim()
      const descMatch =
        rowDescNorm === txDescNorm ||
        rowDescNorm.includes(txDescNorm) ||
        txDescNorm.includes(rowDescNorm)

      return descMatch
    })

    if (isDup) {
      duplicateCount++
      return { ...row, isDuplicate: true }
    }
    return row
  })

  return { rows: updatedRows, duplicateCount }
}

