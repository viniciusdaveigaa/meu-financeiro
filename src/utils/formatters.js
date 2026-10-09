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
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
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

