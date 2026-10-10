import {
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet
} from 'lucide-react'

export const BANK_LOGOS = [
  {
    id: 'nubank',
    name: 'Nubank',
    shortLabel: 'Nu',
    color: '#820AD1',
    bg: '#F5EEFE'
  },
  {
    id: 'inter',
    name: 'Inter',
    shortLabel: 'Inter',
    color: '#FF7A00',
    bg: '#FFF4EA'
  },
  {
    id: 'itau',
    name: 'Itaú',
    shortLabel: 'Itaú',
    color: '#EC7000',
    bg: '#FFF3EB'
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    shortLabel: 'Brad',
    color: '#CC092F',
    bg: '#FDF0F2'
  },
  {
    id: 'santander',
    name: 'Santander',
    shortLabel: 'Sant',
    color: '#EC0000',
    bg: '#FEF0F0'
  },
  {
    id: 'caixa',
    name: 'Caixa',
    shortLabel: 'CEF',
    color: '#005CA9',
    bg: '#EEF6FC'
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    shortLabel: 'BB',
    color: '#0038A8',
    bg: '#EFF4FC'
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    shortLabel: 'C6',
    color: '#1A1A1A',
    bg: '#F2F2F2'
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    shortLabel: 'MP',
    color: '#009EE3',
    bg: '#EDF8FD'
  },
  {
    id: 'picpay',
    name: 'PicPay',
    shortLabel: 'Pic',
    color: '#11C76F',
    bg: '#EFFBF4'
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    shortLabel: 'BTG',
    color: '#0B2240',
    bg: '#EDF1F7'
  },
  {
    id: 'neon',
    name: 'Neon',
    shortLabel: 'Neon',
    color: '#00B4D8',
    bg: '#EAF9FD'
  },
  {
    id: 'dinheiro',
    name: 'Dinheiro / Carteira',
    icon: Wallet,
    color: '#10B981',
    bg: '#ECFDF5'
  },
  {
    id: 'cartao',
    name: 'Cartão de Crédito',
    icon: CreditCard,
    color: '#6366F1',
    bg: '#EEF2FF'
  },
  {
    id: 'banco',
    name: 'Conta Corrente',
    icon: Landmark,
    color: '#0284C7',
    bg: '#F0F9FF'
  },
  {
    id: 'poupanca',
    name: 'Poupança / Reserva',
    icon: PiggyBank,
    color: '#EC4899',
    bg: '#FDF2F8'
  },
  {
    id: 'investimento',
    name: 'Investimentos',
    icon: TrendingUp,
    color: '#8B5CF6',
    bg: '#F5F3FF'
  }
]

export function resolveBankLogo(logoId, accountName = '', kind = 'account') {
  if (logoId) {
    const found = BANK_LOGOS.find((l) => l.id === logoId)
    if (found) return found
  }

  const nameNorm = accountName.toLowerCase()
  if (nameNorm.includes('nu') || nameNorm.includes('roxinh')) {
    return BANK_LOGOS.find((l) => l.id === 'nubank')
  }
  if (nameNorm.includes('inter')) {
    return BANK_LOGOS.find((l) => l.id === 'inter')
  }
  if (nameNorm.includes('itau') || nameNorm.includes('itaú')) {
    return BANK_LOGOS.find((l) => l.id === 'itau')
  }
  if (nameNorm.includes('bradesco')) {
    return BANK_LOGOS.find((l) => l.id === 'bradesco')
  }
  if (nameNorm.includes('santander')) {
    return BANK_LOGOS.find((l) => l.id === 'santander')
  }
  if (nameNorm.includes('caixa') || nameNorm.includes('cef')) {
    return BANK_LOGOS.find((l) => l.id === 'caixa')
  }
  if (nameNorm.includes('brasil') || nameNorm.includes('bb')) {
    return BANK_LOGOS.find((l) => l.id === 'bb')
  }
  if (nameNorm.includes('c6')) {
    return BANK_LOGOS.find((l) => l.id === 'c6')
  }
  if (nameNorm.includes('mercado') || nameNorm.includes('mp')) {
    return BANK_LOGOS.find((l) => l.id === 'mercadopago')
  }
  if (nameNorm.includes('picpay')) {
    return BANK_LOGOS.find((l) => l.id === 'picpay')
  }
  if (nameNorm.includes('btg')) {
    return BANK_LOGOS.find((l) => l.id === 'btg')
  }
  if (nameNorm.includes('neon')) {
    return BANK_LOGOS.find((l) => l.id === 'neon')
  }
  if (nameNorm.includes('dinheiro') || nameNorm.includes('carteira')) {
    return BANK_LOGOS.find((l) => l.id === 'dinheiro')
  }

  // Fallback baseado no tipo (kind)
  if (kind === 'card') {
    return BANK_LOGOS.find((l) => l.id === 'cartao')
  }
  return BANK_LOGOS.find((l) => l.id === 'banco')
}

const STORAGE_KEY_PREFIX = 'sc_account_logos'

export function getSavedAccountLogos(userId = 'default') {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${userId}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveAccountLogo(userId = 'default', accountId, logoId) {
  try {
    const current = getSavedAccountLogos(userId)
    current[accountId] = logoId
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_${userId}`, JSON.stringify(current))
    window.dispatchEvent(new Event('account-logos-changed'))
  } catch {}
}

export function removeAccountLogo(userId = 'default', accountId) {
  try {
    const current = getSavedAccountLogos(userId)
    delete current[accountId]
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_${userId}`, JSON.stringify(current))
    window.dispatchEvent(new Event('account-logos-changed'))
  } catch {}
}

