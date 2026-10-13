import React from 'react'
import {
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet
} from 'lucide-react'

// Vetores SVG oficiais e de alta precisão para as instituições financeiras brasileiras
export const NubankSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#820AD1" />
    <path
      d="M12 28V15.5C12 13.5 13.5 12 15.5 12C17.5 12 19 13.5 19 15.5V28M19 20C19.5 15.5 22.5 12 26 12C28.2 12 29.5 13.5 29.5 15.5V28"
      stroke="#FFFFFF"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const InterSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#FF7A00" />
    <path
      d="M14 12H20C24.4 12 28 15.6 28 20C28 24.4 24.4 28 20 28H14"
      stroke="#FFFFFF"
      strokeWidth="3.6"
      strokeLinecap="round"
    />
    <path
      d="M14 17H19C20.6 17 22 18.3 22 20C22 21.6 20.6 23 19 23H14"
      stroke="#FFFFFF"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
)

export const ItauSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#EC7000" />
    <rect x="8" y="9" width="24" height="22" rx="6" fill="#003399" />
    <path
      d="M12 14V26M18 18V26M18 14V15M24 18V22C24 24.2 25.8 26 28 26V18"
      stroke="#FFD100"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const BradescoSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#CC092F" />
    <path
      d="M20 11V28M14 28C14 21 16.5 16 20 16C23.5 16 26 21 26 28"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M9 28C9 18 13.5 11 20 11C26.5 11 31 18 31 28"
      stroke="#FFFFFF"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <rect x="17.5" y="8" width="5" height="3" rx="1.5" fill="#FFFFFF" />
  </svg>
)

export const SantanderSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#EC0000" />
    {/* Três labaredas do Santander */}
    <path
      d="M20 9C20.5 13 24 16 25 21C25.8 25 23.5 28 20 28C16.5 28 14.2 25 15 21C16 16 19.5 13 20 9Z"
      fill="#FFFFFF"
    />
    <path
      d="M15 15C15.4 18 17.5 20.5 18 24C18.5 26.5 17 28 15 28C13 28 11.5 26 12 24C12.7 20.5 14.5 18 15 15Z"
      fill="#FFFFFF"
    />
    <path
      d="M25 15C24.6 18 22.5 20.5 22 24C21.5 26.5 23 28 25 28C27 28 28.5 26 28 24C27.3 20.5 25.5 18 25 15Z"
      fill="#FFFFFF"
    />
  </svg>
)

export const CaixaSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#005CA9" />
    {/* X estilizado da Caixa com azul e laranja */}
    <path
      d="M11 11L18 20L11 29H16L20 23.5L24 29H29L22 20L29 11H24L20 16.5L16 11H11Z"
      fill="#FFFFFF"
    />
    <path
      d="M17.5 17L22.5 23H26.5L21.5 17H17.5Z"
      fill="#F37021"
    />
  </svg>
)

export const BBSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#0038A8" />
    {/* Laços e losangos amarelos do Banco do Brasil */}
    <g transform="translate(8, 8) scale(0.6)">
      <path
        d="M20 2L35 15L20 28L5 15L20 2Z"
        stroke="#FCDB00"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M20 10L29 18L20 26L11 18L20 10Z"
        fill="#FCDB00"
      />
      <path
        d="M2 20L15 35L28 20"
        stroke="#FCDB00"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 20L25 5L12 20"
        stroke="#FCDB00"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  </svg>
)

export const C6Svg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#1A1A1A" />
    <circle cx="23" cy="22" r="7" stroke="#FFFFFF" strokeWidth="3" />
    <path
      d="M23 15C19 15 16 18 16 22"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M14 14C11.5 16.5 11 20 12.5 23.5C14 27 17.5 28.5 21 28"
      stroke="#E5B048"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </svg>
)

export const MercadoPagoSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#009EE3" />
    {/* Duas mãos se cumprimentando */}
    <path
      d="M11 21C11 21 14 17 17 19C20 21 22 21 24 19L27 22C24 25 21 24 19 23C17 22 15 24 13 25L11 21Z"
      fill="#FFFFFF"
    />
    <path
      d="M29 19C29 19 26 15 23 17C20 19 18 19 16 17L13 20C16 23 19 22 21 21C23 20 25 22 27 23L29 19Z"
      fill="#FFFFFF"
    />
  </svg>
)

export const PicPaySvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#11C76F" />
    <path
      d="M14 29V11H21C24.5 11 27 13.5 27 17C27 20.5 24.5 23 21 23H18.5V29H14ZM18.5 19H21C22.2 19 23 18.2 23 17C23 15.8 22.2 15 21 15H18.5V19Z"
      fill="#FFFFFF"
    />
  </svg>
)

export const BTGSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#0B2240" />
    <path
      d="M13 13H19C21.5 13 23 14.5 23 16.5C23 18 22 19 20.5 19.5C22.5 20 23.5 21.5 23.5 23.5C23.5 25.8 21.5 27 19 27H13V13Z"
      stroke="#FFFFFF"
      strokeWidth="2.5"
    />
    <path d="M26 13V27M23 13H29" stroke="#B08D57" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

export const NeonSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#00B4D8" />
    <path
      d="M13 28V12L27 28V12"
      stroke="#FFFFFF"
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const PagBankSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#00A868" />
    <circle cx="20" cy="20" r="11" stroke="#FFFFFF" strokeWidth="2.6" fill="none" />
    <path
      d="M17 24V16H21C22.5 16 23.5 17 23.5 18.5C23.5 20 22.5 21 21 21H17"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="24" cy="22" r="1.5" fill="#FED100" />
  </svg>
)

export const SicoobSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#003641" />
    <path d="M20 10L27 20H13L20 10Z" fill="#00AE9D" />
    <path d="M20 30L13 20H27L20 30Z" fill="#78BE20" />
    <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
  </svg>
)

export const SicrediSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#007D40" />
    <path
      d="M20 12C20 16 16 20 12 20C16 20 20 24 20 28C20 24 24 20 28 20C24 20 20 16 20 12Z"
      fill="#FFFFFF"
    />
  </svg>
)

export const SafraSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#102142" />
    <path
      d="M14 26C14 21 17 19 20 19C23 19 26 21 26 26M20 14V17"
      stroke="#D4AF37"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <circle cx="20" cy="13" r="2" fill="#D4AF37" />
  </svg>
)

export const XPSvg = ({ size = 24 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
    <rect width="40" height="40" rx="9" fill="#000000" />
    <path
      d="M13 14L20 26M20 14L13 26M21 14H27C28.5 14 29.5 15 29.5 16.5C29.5 18 28.5 19 27 19H22V26"
      stroke="#FFFFFF"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Catálogo Mestre de Instituições Financeiras com Códigos COMPE e SVGs Autênticos
export const BANK_LOGOS = [
  {
    id: 'nubank',
    name: 'Nubank',
    code: '260',
    shortLabel: 'Nu',
    color: '#820AD1',
    bg: '#F5EEFE',
    SvgComponent: NubankSvg,
    aliases: ['nubank', 'nu', 'roxinho', 'nu pagamentos', 'nu financeiro']
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    code: '077',
    shortLabel: 'Inter',
    color: '#FF7A00',
    bg: '#FFF4EA',
    SvgComponent: InterSvg,
    aliases: ['inter', 'banco inter', 'intermedium', 'inter s.a.']
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    code: '341',
    shortLabel: 'Itaú',
    color: '#EC7000',
    bg: '#FFF3EB',
    SvgComponent: ItauSvg,
    aliases: ['itau', 'itaú', 'unibanco', 'personnalite', 'personalite', 'itaucard']
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    code: '237',
    shortLabel: 'Brad',
    color: '#CC092F',
    bg: '#FDF0F2',
    SvgComponent: BradescoSvg,
    aliases: ['bradesco', 'banco bradesco', 'next', 'prime']
  },
  {
    id: 'santander',
    name: 'Santander',
    code: '033',
    shortLabel: 'Sant',
    color: '#EC0000',
    bg: '#FEF0F0',
    SvgComponent: SantanderSvg,
    aliases: ['santander', 'banco santander', 'select', 'van gogh']
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica Federal',
    code: '104',
    shortLabel: 'CEF',
    color: '#005CA9',
    bg: '#EEF6FC',
    SvgComponent: CaixaSvg,
    aliases: ['caixa', 'cef', 'economica', 'poupança caixa', 'caixa federal']
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    code: '001',
    shortLabel: 'BB',
    color: '#0038A8',
    bg: '#EFF4FC',
    SvgComponent: BBSvg,
    aliases: ['bb', 'banco do brasil', 'ourocard', 'estilo bb']
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    code: '336',
    shortLabel: 'C6',
    color: '#1A1A1A',
    bg: '#F2F2F2',
    SvgComponent: C6Svg,
    aliases: ['c6', 'c6 bank', 'c6bank']
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    code: '323',
    shortLabel: 'MP',
    color: '#009EE3',
    bg: '#EDF8FD',
    SvgComponent: MercadoPagoSvg,
    aliases: ['mercado pago', 'mercadopago', 'mp', 'mercado livre']
  },
  {
    id: 'picpay',
    name: 'PicPay',
    code: '380',
    shortLabel: 'Pic',
    color: '#11C76F',
    bg: '#EFFBF4',
    SvgComponent: PicPaySvg,
    aliases: ['picpay', 'pic pay', 'original']
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    code: '208',
    shortLabel: 'BTG',
    color: '#0B2240',
    bg: '#EDF1F7',
    SvgComponent: BTGSvg,
    aliases: ['btg', 'btg pactual', 'pactual']
  },
  {
    id: 'neon',
    name: 'Neon Pagamentos',
    code: '735',
    shortLabel: 'Neon',
    color: '#00B4D8',
    bg: '#EAF9FD',
    SvgComponent: NeonSvg,
    aliases: ['neon', 'banco neon']
  },
  {
    id: 'pagbank',
    name: 'PagBank / PagSeguro',
    code: '290',
    shortLabel: 'Pag',
    color: '#00A868',
    bg: '#EDFBF4',
    SvgComponent: PagBankSvg,
    aliases: ['pagbank', 'pagseguro', 'pag bank', 'pag seguro']
  },
  {
    id: 'sicoob',
    name: 'Sicoob',
    code: '756',
    shortLabel: 'Sicoob',
    color: '#003641',
    bg: '#E6F4F6',
    SvgComponent: SicoobSvg,
    aliases: ['sicoob', 'bancoob']
  },
  {
    id: 'sicredi',
    name: 'Sicredi',
    code: '748',
    shortLabel: 'Sicredi',
    color: '#007D40',
    bg: '#EAF7EE',
    SvgComponent: SicrediSvg,
    aliases: ['sicredi', 'bansicredi']
  },
  {
    id: 'safra',
    name: 'Banco Safra',
    code: '422',
    shortLabel: 'Safra',
    color: '#102142',
    bg: '#EEF2F9',
    SvgComponent: SafraSvg,
    aliases: ['safra', 'banco safra']
  },
  {
    id: 'xp',
    name: 'XP Investimentos',
    code: '102',
    shortLabel: 'XP',
    color: '#000000',
    bg: '#FFF8EE',
    SvgComponent: XPSvg,
    aliases: ['xp', 'xp investimentos', 'rico', 'clear']
  },
  {
    id: 'dinheiro',
    name: 'Dinheiro / Carteira',
    code: null,
    shortLabel: 'Cash',
    icon: Wallet,
    color: '#10B981',
    bg: '#ECFDF5'
  },
  {
    id: 'cartao',
    name: 'Cartão de Crédito',
    code: null,
    shortLabel: 'Card',
    icon: CreditCard,
    color: '#6366F1',
    bg: '#EEF2FF'
  },
  {
    id: 'banco',
    name: 'Conta Corrente / Outro Banco',
    code: null,
    shortLabel: 'Bank',
    icon: Landmark,
    color: '#0284C7',
    bg: '#F0F9FF'
  },
  {
    id: 'poupanca',
    name: 'Poupança / Reserva',
    code: null,
    shortLabel: 'Poup',
    icon: PiggyBank,
    color: '#EC4899',
    bg: '#FDF2F8'
  },
  {
    id: 'investimento',
    name: 'Investimentos',
    code: null,
    shortLabel: 'Inv',
    icon: TrendingUp,
    color: '#8B5CF6',
    bg: '#F5F3FF'
  }
]

/**
 * Resolve e associa o banco ou instituição financeira com sua logo oficial,
 * suportando busca por ID, código COMPE bancário ou nome informado pelo usuário.
 */
export function resolveBankLogo(logoId, accountName = '', kind = 'account', bankCode = '') {
  // 1. Busca direta pelo identificador fixo
  if (logoId) {
    const found = BANK_LOGOS.find((l) => l.id === logoId)
    if (found) return found
  }

  // 2. Busca por código de compensação bancária (COMPE)
  if (bankCode) {
    const cleanCode = String(bankCode).padStart(3, '0')
    const foundByCode = BANK_LOGOS.find((l) => l.code === cleanCode)
    if (foundByCode) return foundByCode
  }

  // 3. Busca inteligente por apelidos e palavras-chave no nome da conta
  const nameNorm = accountName.toLowerCase().trim()
  if (nameNorm) {
    for (const bank of BANK_LOGOS) {
      if (bank.aliases && bank.aliases.some((alias) => nameNorm.includes(alias))) {
        return bank
      }
    }

    if (nameNorm.includes('carteira') || nameNorm.includes('dinheiro') || nameNorm.includes('especie') || nameNorm.includes('espécie')) {
      return BANK_LOGOS.find((l) => l.id === 'dinheiro')
    }
    if (nameNorm.includes('invest') || nameNorm.includes('corretora') || nameNorm.includes('cdb') || nameNorm.includes('acoes') || nameNorm.includes('ações')) {
      return BANK_LOGOS.find((l) => l.id === 'investimento')
    }
    if (nameNorm.includes('poupanca') || nameNorm.includes('poupança') || nameNorm.includes('reserva')) {
      return BANK_LOGOS.find((l) => l.id === 'poupanca')
    }
  }

  // 4. Fallback contextual seguro (nunca quebra nem associa incorretamente)
  if (kind === 'card') {
    return BANK_LOGOS.find((l) => l.id === 'cartao')
  }
  return BANK_LOGOS.find((l) => l.id === 'banco')
}

export function findBankByCode(code) {
  if (!code) return null
  const cleanCode = String(code).padStart(3, '0')
  return BANK_LOGOS.find((l) => l.code === cleanCode) || null
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
