import { jsPDF } from 'jspdf'
import { formatMoney, formatMonthName, formatDateLabel } from './formatters.js'
import { getCategoryLabel } from '../constants/categories.js'

/**
 * Normaliza e limpa textos para o PDF mantendo compatibilidade de fontes
 */
function cleanText(str = '') {
  return String(str)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim()
}

/**
 * Trunca texto para não vazar a célula da tabela
 */
function truncateText(str = '', maxLength = 32) {
  const clean = cleanText(str)
  if (clean.length <= maxLength) return clean
  return clean.slice(0, maxLength - 2) + '..'
}

/**
 * Exporta lançamentos em formato CSV compatível com Excel e Google Planilhas
 */
export function exportToCsv({ entries = [], month = '', accounts = [] }) {
  const accountMap = Object.fromEntries((accounts || []).map((acc) => [acc.id, acc.name]))
  const bom = '\uFEFF' // Garante caracteres acentuados corretos no Microsoft Excel
  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Conta / Cartão', 'Parcela']

  const rows = entries.map((item) => {
    const date = item.date || ''
    const type = item.type === 'income' ? 'Receita' : 'Despesa'
    const desc = `"${(item.description || '').replace(/"/g, '""')}"`
    const cat = `"${getCategoryLabel(item.category)}"`
    const amountNum = Number(item.amount || 0)
    const amountStr = amountNum.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    const acc = `"${accountMap[item.account_id] || ''}"`
    const installment = item.installment_total
      ? `${item.installment_number || 1}/${item.installment_total}`
      : ''

    return [date, type, desc, cat, amountStr, acc, installment].join(';')
  })

  const csvContent = bom + [headers.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `extrato-saldo-claro-${month || 'completo'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Gera um modelo de CSV para o usuário preencher e importar
 */
export function downloadSampleCsv() {
  const bom = '\uFEFF'
  const sampleContent =
    bom +
    [
      'Data;Tipo;Descrição;Categoria;Valor;Conta',
      '2026-10-05;Receita;Salário Mensal;Salário;5000,00;Conta Corrente',
      '2026-10-08;Despesa;Supermercado;Alimentação;380,50;Cartão Nubank',
      '2026-10-12;Despesa;Combustível Posto;Transporte;150,00;Conta Inter',
      '2026-10-15;Despesa;Farmácia;Saúde;85,90;Carteira',
      '2026-10-20;Despesa;Assinatura Streaming;Assinaturas;49,90;Cartão Nubank'
    ].join('\r\n')

  const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'modelo-importacao-saldo-claro.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Analisa e processa o texto de um arquivo CSV de forma flexível e resiliente
 */
export function parseCsvText(rawText) {
  if (!rawText || !rawText.trim()) {
    return { success: false, error: 'O arquivo selecionado está vazio.' }
  }

  // Remove BOM se presente
  const cleanRaw = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText

  const lines = cleanRaw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) {
    return { success: false, error: 'O arquivo deve conter pelo menos o cabeçalho e um registro.' }
  }

  // Detecta o delimitador na primeira linha (; ou , ou \t)
  const firstLine = lines[0]
  let delimiter = ';'
  const countSemicolon = (firstLine.match(/;/g) || []).length
  const countComma = (firstLine.match(/,/g) || []).length
  const countTab = (firstLine.match(/\t/g) || []).length

  if (countComma > countSemicolon && countComma >= countTab) {
    delimiter = ','
  } else if (countTab > countSemicolon && countTab > countComma) {
    delimiter = '\t'
  }

  // Quebra a linha respeitando aspas
  const splitLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const rawHeaders = splitLine(lines[0]).map((h) =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  )

  // Mapeamento dinâmico de colunas
  let dateIdx = rawHeaders.findIndex((h) => h.includes('data') || h.includes('date') || h.includes('dia'))
  let descIdx = rawHeaders.findIndex(
    (h) =>
      h.includes('descri') ||
      h.includes('historico') ||
      h.includes('memo') ||
      h.includes('title') ||
      h.includes('estab') ||
      h.includes('item') ||
      h.includes('nome')
  )
  let amountIdx = rawHeaders.findIndex(
    (h) => h.includes('valor') || h.includes('amount') || h.includes('quantia') || h.includes('preco') || h.includes('total')
  )
  let catIdx = rawHeaders.findIndex((h) => h.includes('categ'))
  let typeIdx = rawHeaders.findIndex((h) => h.includes('tipo') || h.includes('type'))
  let accIdx = rawHeaders.findIndex((h) => h.includes('conta') || h.includes('cartao') || h.includes('banco') || h.includes('account'))

  // Fallback posicional se o cabeçalho for atípico
  if (dateIdx === -1) dateIdx = 0
  if (descIdx === -1) descIdx = 1
  if (amountIdx === -1) amountIdx = Math.min(2, rawHeaders.length - 1)

  const parsedRows = []
  let totalIncome = 0
  let totalExpense = 0
  const warnings = []

  const guessCategory = (description = '') => {
    const d = description.toLowerCase()
    if (d.includes('mercado') || d.includes('supermercado') || d.includes('ifood') || d.includes('restaurante') || d.includes('padaria') || d.includes('cafe') || d.includes('lanche')) {
      return 'Alimentacao'
    }
    if (d.includes('uber') || d.includes('99') || d.includes('gasolina') || d.includes('posto') || d.includes('combustivel') || d.includes('estacionamento') || d.includes('pedagio')) {
      return 'Transporte'
    }
    if (d.includes('farmacia') || d.includes('drogaria') || d.includes('medico') || d.includes('consulta') || d.includes('hospital') || d.includes('saude') || d.includes('dentista')) {
      return 'Saude'
    }
    if (d.includes('aluguel') || d.includes('condominio') || d.includes('luz') || d.includes('enel') || d.includes('agua') || d.includes('sabesp') || d.includes('gas') || d.includes('iptu')) {
      return 'Moradia'
    }
    if (d.includes('netflix') || d.includes('spotify') || d.includes('amazon') || d.includes('prime') || d.includes('disney') || d.includes('hbo') || d.includes('youtube') || d.includes('internet') || d.includes('claro') || d.includes('vivo')) {
      return 'Assinaturas'
    }
    if (d.includes('salario') || d.includes('remuneracao') || d.includes('pro-labore') || d.includes('rendimento') || d.includes('dividendo') || d.includes('pix recebido')) {
      return 'Salario'
    }
    if (d.includes('cinema') || d.includes('show') || d.includes('teatro') || d.includes('viagem') || d.includes('hotel') || d.includes('praia') || d.includes('lazer')) {
      return 'Lazer'
    }
    if (d.includes('curso') || d.includes('escola') || d.includes('faculdade') || d.includes('livro') || d.includes('udemy') || d.includes('educacao')) {
      return 'Educacao'
    }
    return 'Outros'
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i])
    if (cols.length < 2) continue

    const rawDate = cols[dateIdx] || ''
    const rawDesc = cols[descIdx] || 'Lançamento importado'
    const rawAmount = cols[amountIdx] || '0'
    const rawCat = catIdx !== -1 ? cols[catIdx] : ''
    const rawType = typeIdx !== -1 ? cols[typeIdx] : ''
    const rawAccount = accIdx !== -1 ? cols[accIdx] : ''

    // Normaliza Data (suporta DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
    let date = ''
    const brMatch = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    const isoMatch = rawDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)

    if (brMatch) {
      const d = String(brMatch[1]).padStart(2, '0')
      const m = String(brMatch[2]).padStart(2, '0')
      const y = brMatch[3]
      date = `${y}-${m}-${d}`
    } else if (isoMatch) {
      const y = isoMatch[1]
      const m = String(isoMatch[2]).padStart(2, '0')
      const d = String(isoMatch[3]).padStart(2, '0')
      date = `${y}-${m}-${d}`
    } else {
      // Se não for uma data válida, pula a linha ou usa a data atual
      const now = new Date()
      date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      warnings.push(`Linha ${i + 1}: data ajustada para hoje (${rawDate || 'vazia'}).`)
    }

    // Normaliza Valor
    let isNegative = false
    let cleanAmountStr = String(rawAmount).replace(/R\$/gi, '').replace(/\s+/g, '')
    if (cleanAmountStr.startsWith('-') || cleanAmountStr.startsWith('(')) {
      isNegative = true
      cleanAmountStr = cleanAmountStr.replace(/[\-\(\)]/g, '')
    }

    // Se tiver vírgula e ponto (ex: 1.250,50 ou 1,250.50)
    let parsedAmount = 0
    if (cleanAmountStr.includes(',') && cleanAmountStr.includes('.')) {
      if (cleanAmountStr.indexOf('.') < cleanAmountStr.indexOf(',')) {
        // Formato brasileiro: 1.250,50
        parsedAmount = Number(cleanAmountStr.replace(/\./g, '').replace(',', '.'))
      } else {
        // Formato americano: 1,250.50
        parsedAmount = Number(cleanAmountStr.replace(/,/g, ''))
      }
    } else if (cleanAmountStr.includes(',')) {
      parsedAmount = Number(cleanAmountStr.replace(',', '.'))
    } else {
      parsedAmount = Number(cleanAmountStr)
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      continue
    }

    // Normaliza Tipo
    let type = 'expense'
    const typeLower = rawType.toLowerCase()
    if (
      typeLower.includes('rec') ||
      typeLower.includes('ent') ||
      typeLower.includes('cred') ||
      typeLower.includes('inc') ||
      typeLower.includes('sal')
    ) {
      type = 'income'
    } else if (
      typeLower.includes('desp') ||
      typeLower.includes('sai') ||
      typeLower.includes('deb') ||
      typeLower.includes('exp')
    ) {
      type = 'expense'
    } else {
      // Se o valor original era negativo em extratos de banco, costuma ser despesa
      // Se for positivo e o banco exporta com sinais invertidos:
      type = isNegative ? 'expense' : 'income'
    }

    if (type === 'income') {
      totalIncome += parsedAmount
    } else {
      totalExpense += parsedAmount
    }

    // Normaliza Categoria
    const category = rawCat ? rawCat.trim() : guessCategory(rawDesc)

    parsedRows.push({
      date,
      description: rawDesc.slice(0, 100),
      amount: parsedAmount,
      type,
      category,
      account_name: rawAccount.trim()
    })
  }

  return {
    success: true,
    rows: parsedRows,
    totalCount: parsedRows.length,
    totalIncome,
    totalExpense,
    warnings
  }
}

/**
 * Gera um relatório profissional em PDF usando jsPDF
 */
export function generatePdfReport({
  entries = [],
  month = '',
  accounts = [],
  filterLabel = 'Extrato Completo'
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const accountMap = Object.fromEntries((accounts || []).map((acc) => [acc.id, acc.name]))

  // Métricas
  const incomes = entries
    .filter((i) => i.type === 'income' && i.affects_balance !== false)
    .reduce((sum, i) => sum + Number(i.amount), 0)
  const expenses = entries
    .filter((i) => i.type === 'expense' && i.affects_balance !== false)
    .reduce((sum, i) => sum + Number(i.amount), 0)
  const net = incomes - expenses
  const savingsRate = incomes > 0 ? Math.max(0, Math.round(((incomes - expenses) / incomes) * 100)) : 0

  // Despesas por Categoria
  const catTotals = {}
  entries
    .filter((i) => i.type === 'expense' && i.affects_balance !== false)
    .forEach((i) => {
      catTotals[i.category] = (catTotals[i.category] || 0) + Number(i.amount)
    })
  const topCategories = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  let y = 14

  const drawHeader = () => {
    // Faixa e Marca
    doc.setFillColor(15, 118, 110)
    doc.rect(14, y, 4, 15, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(15, 118, 110)
    doc.text('SALDO CLARO', 22, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text('Relatório Financeiro do Extrato', 22, y + 13)

    // Data de emissão à direita
    doc.setFontSize(8.5)
    doc.setTextColor(148, 163, 184)
    const nowStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    doc.text(`Emitido em: ${nowStr}`, 196, y + 6, { align: 'right' })
    doc.text(`Referência: ${formatMonthName(month) || 'Período Atual'}`, 196, y + 12, { align: 'right' })

    y += 20
    doc.setDrawColor(226, 232, 240)
    doc.line(14, y, 196, y)
    y += 8
  }

  drawHeader()

  // Cards de Resumo (4 colunas)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, 182, 22, 2.5, 2.5, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, y, 182, 22, 2.5, 2.5, 'S')

  const colW = 182 / 4
  const startX = 14

  // Card 1: Entradas
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('TOTAL ENTRADAS', startX + 6, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(21, 128, 61)
  doc.text(formatMoney(incomes), startX + 6, y + 16)

  // Card 2: Saídas
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('TOTAL SAÍDAS', startX + colW + 6, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(185, 28, 28)
  doc.text(formatMoney(expenses), startX + colW + 6, y + 16)

  // Card 3: Saldo
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('SALDO DO PERÍODO', startX + colW * 2 + 6, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(net >= 0 ? 15 : 185, net >= 0 ? 118 : 28, net >= 0 ? 110 : 28)
  doc.text(formatMoney(net), startX + colW * 2 + 6, y + 16)

  // Card 4: Economia & Qtd
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('LANÇAMENTOS', startX + colW * 3 + 6, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(51, 65, 85)
  doc.text(`${entries.length} itens (${savingsRate}%)`, startX + colW * 3 + 6, y + 16)

  y += 28

  // Seção Top Categorias (se houver despesas)
  if (topCategories.length > 0) {
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('Principais Grupos de Despesa', 14, y)
    y += 4

    let catX = 14
    const catItemW = 182 / topCategories.length
    topCategories.forEach(([catKey, total]) => {
      const pct = expenses > 0 ? Math.round((total / expenses) * 100) : 0
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(catX, y, catItemW - 3, 11, 1.5, 1.5, 'F')

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(truncateText(getCategoryLabel(catKey), 12), catX + 3, y + 4.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 41, 59)
      doc.text(`${formatMoney(total)} (${pct}%)`, catX + 3, y + 8.8)

      catX += catItemW
    })

    y += 16
  }

  // Título da Tabela
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`Extrato Detalhado (${entries.length} movimentações)`, 14, y)
  y += 5

  // Cabeçalho da Tabela
  const drawTableHeader = (curY) => {
    doc.setFillColor(15, 118, 110)
    doc.rect(14, curY, 182, 7, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)

    doc.text('DATA', 16, curY + 4.8)
    doc.text('DESCRIÇÃO', 36, curY + 4.8)
    doc.text('CATEGORIA', 100, curY + 4.8)
    doc.text('CONTA / CARTÃO', 138, curY + 4.8)
    doc.text('VALOR (R$)', 193, curY + 4.8, { align: 'right' })

    return curY + 7
  }

  y = drawTableHeader(y)

  // Linhas de Lançamentos
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  entries.forEach((item, index) => {
    // Quebra de página se necessário
    if (y > 274) {
      doc.addPage()
      y = 16
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Saldo Claro — Extrato (continuação) • ${formatMonthName(month)}`, 14, y - 4)
      y = drawTableHeader(y)
    }

    const isEven = index % 2 === 0
    if (isEven) {
      doc.setFillColor(250, 250, 250)
      doc.rect(14, y, 182, 6.5, 'F')
    }

    const isIncome = item.type === 'income'
    const dateFormatted = item.date ? formatDateLabel(item.date).slice(0, 5) : '-'
    const descText = truncateText(item.description, 36)
    const catText = truncateText(getCategoryLabel(item.category), 20)
    const accText = truncateText(accountMap[item.account_id] || '-', 20)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(dateFormatted, 16, y + 4.5)

    doc.setTextColor(15, 23, 42)
    doc.text(descText, 36, y + 4.5)

    doc.setTextColor(100, 116, 139)
    doc.text(catText, 100, y + 4.5)
    doc.text(accText, 138, y + 4.5)

    // Valor com sinal e cor
    doc.setFont('helvetica', 'bold')
    if (isIncome) {
      doc.setTextColor(21, 128, 61)
      doc.text(`+ ${formatMoney(item.amount)}`, 193, y + 4.5, { align: 'right' })
    } else {
      doc.setTextColor(185, 28, 28)
      doc.text(`- ${formatMoney(item.amount)}`, 193, y + 4.5, { align: 'right' })
    }

    y += 6.5
  })

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, 285, 196, 285)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Saldo Claro • Relatório Financeiro Oficial • Página ${i} de ${totalPages}`,
      105,
      290,
      { align: 'center' }
    )
  }

  // Baixa o arquivo PDF
  const filename = `relatorio-extrato-${month || 'saldo-claro'}.pdf`
  doc.save(filename)
}
