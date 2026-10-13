const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
export const monthShortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const shortMonthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
export const compactNumber = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/** "Hoje", "Ontem" ou "Segunda, 05 de out". */
export function dayGroupLabel(isoDate) {
  const today = localISODate()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  if (isoDate === today) return 'Hoje'
  if (isoDate === localISODate(yesterdayDate)) return 'Ontem'
  const date = new Date(`${isoDate}T12:00:00`)
  return `${weekdayNames[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')} de ${monthShortNames[date.getMonth()].toLowerCase()}`
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const totalMinutes = hour * 60 + minute

  // Das 05:00 até 11:59 -> "Bom dia"
  if (totalMinutes >= 5 * 60 && totalMinutes < 12 * 60) {
    return 'Bom dia'
  }

  // Das 12:00 até 17:59 -> "Boa tarde"
  if (totalMinutes >= 12 * 60 && totalMinutes < 18 * 60) {
    return 'Boa tarde'
  }

  // Das 18:00 até 23:30 -> "Boa noite"
  if (totalMinutes >= 18 * 60 && totalMinutes <= 23 * 60 + 30) {
    return 'Boa noite'
  }

  // Acima de 23:30 até 04:59 (madrugada) -> "Olá"
  return 'Olá'
}

// Validação de força de senha (regra configurada no Supabase: 9+ chars, maiúscula, minúscula, número e símbolo)
export function validatePasswordStrength(pwd) {
  if (!pwd || pwd.length < 9) {
    return 'A senha deve ter no mínimo 9 caracteres.'
  }
  if (!/[a-z]/.test(pwd)) {
    return 'A senha deve conter pelo menos uma letra minúscula.'
  }
  if (!/[A-Z]/.test(pwd)) {
    return 'A senha deve conter pelo menos uma letra maiúscula.'
  }
  if (!/[0-9]/.test(pwd)) {
    return 'A senha deve conter pelo menos um número.'
  }
  if (!/[^a-zA-Z0-9]/.test(pwd)) {
    return 'A senha deve conter pelo menos um símbolo especial (ex.: @, #, $, !).'
  }
  return null
}

/** Variação percentual arredondada, ou null quando não há base de comparação. */
export function percentChange(current, previous) {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function formatMoney(value, hide = false) {
  if (hide) return '••••••'
  const num = typeof value === 'number' ? value : Number(value) || 0
  return moneyFormatter.format(num)
}

export function localISODate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getMonthKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatMonthName(monthKey) {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  if (!month || !year) return monthKey
  return `${monthNames[month - 1]} de ${year}`
}

export function changeMonth(monthKey, direction) {
  const date = new Date(`${monthKey}-01T12:00:00`)
  date.setMonth(date.getMonth() + direction)
  return getMonthKey(date)
}

export function getMonthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(lastDay).padStart(2, '0')}`
  }
}

export function dateInMonth(monthKey, day) {
  const [year, month] = monthKey.split('-').map(Number)
  const safeDay = Math.min(day, new Date(year, month, 0).getDate())
  return `${monthKey}-${String(safeDay).padStart(2, '0')}`
}

export function formatDateLabel(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function formatAmountInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return (Number(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function amountToInput(value) {
  if (value === '' || value == null) return ''
  return formatAmountInput(Math.round(Number(value) * 100))
}

export function inputToAmount(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

export function searchableText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Determina o mês da fatura ('YYYY-MM') com base na data da compra e no dia de fechamento.
 * Se o dia da compra for maior que o dia de fechamento, a compra entra na próxima fatura.
 */
export function calculateInvoiceMonth(purchaseDateStr, closingDay) {
  if (!purchaseDateStr) return getMonthKey()
  const parts = purchaseDateStr.split('-')
  if (parts.length < 3) return getMonthKey()
  const [yearStr, monthStr, dayStr] = parts
  const baseMonth = `${yearStr}-${monthStr}`
  const day = parseInt(dayStr, 10)
  const close = parseInt(closingDay, 10)

  if (close && day > close) {
    return changeMonth(baseMonth, 1)
  }
  return baseMonth
}

