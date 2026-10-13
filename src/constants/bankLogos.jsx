import {
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { findBank as findBankInDirectory } from 'logos-bancos-br'

/**
 * Catálogo Oficial de Instituições Financeiras Brasileiras
 *
 * Todas as logos foram obtidas de fontes institucionais autênticas
 * (Open Finance Brasil e diretórios oficiais dos bancos via projeto logos-bancos-br).
 * Nenhuma imagem é gerada por IA, desenho aproximado ou vetor improvisado.
 */
export const BANK_LOGOS = [
  {
    id: 'nubank',
    name: 'Nubank',
    displayName: 'Nubank',
    code: '260',
    ispb: '18236120',
    shortLabel: 'Nu',
    logoUrl: '/bank-logos/nubank.svg',
    pngUrl: '/bank-logos/png/18236120.png',
    source: 'nuapp.nubank.com.br / Open Finance Brasil',
    color: '#820AD1',
    bg: '#F5EEFE',
    aliases: ['nubank', 'nu', 'roxinho', 'nu pagamentos', 'nu financeiro']
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    displayName: 'Banco Inter',
    code: '077',
    ispb: '00416968',
    shortLabel: 'Inter',
    logoUrl: '/bank-logos/inter.svg',
    pngUrl: '/bank-logos/png/00416968.png',
    source: 'marketing.bancointer.com.br / Open Finance Brasil',
    color: '#FF7A00',
    bg: '#FFF4EA',
    aliases: ['inter', 'banco inter', 'intermedium', 'inter s.a.']
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    displayName: 'Itaú',
    code: '341',
    ispb: '60701190',
    shortLabel: 'Itaú',
    logoUrl: '/bank-logos/itau.svg',
    pngUrl: '/bank-logos/png/60701190.png',
    source: 'itau.com.br / Open Finance Brasil',
    color: '#EC7000',
    bg: '#FFF3EB',
    aliases: ['itau', 'itaú', 'unibanco', 'personnalite', 'personalite', 'itaucard']
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    displayName: 'Bradesco',
    code: '237',
    ispb: '60746948',
    shortLabel: 'Brad',
    logoUrl: '/bank-logos/bradesco.svg',
    pngUrl: '/bank-logos/png/60746948.png',
    source: 'banco.bradesco / Open Finance Brasil',
    color: '#CC092F',
    bg: '#FDF0F2',
    aliases: ['bradesco', 'banco bradesco', 'next', 'prime']
  },
  {
    id: 'santander',
    name: 'Santander',
    displayName: 'Santander',
    code: '033',
    ispb: '90400888',
    shortLabel: 'Sant',
    logoUrl: '/bank-logos/santander.svg',
    pngUrl: '/bank-logos/png/90400888.png',
    source: 'santander.com.br / Open Finance Brasil',
    color: '#EC0000',
    bg: '#FEF0F0',
    aliases: ['santander', 'banco santander', 'select', 'van gogh']
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica Federal',
    displayName: 'Caixa',
    code: '104',
    ispb: '00360305',
    shortLabel: 'CEF',
    logoUrl: '/bank-logos/caixa.svg',
    pngUrl: '/bank-logos/png/00360305.png',
    source: 'caixa.gov.br / Open Finance Brasil',
    color: '#005CA9',
    bg: '#EEF6FC',
    aliases: ['caixa', 'cef', 'economica', 'poupança caixa', 'caixa federal']
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    displayName: 'Banco do Brasil',
    code: '001',
    ispb: '00000000',
    shortLabel: 'BB',
    logoUrl: '/bank-logos/banco-do-brasil.svg',
    pngUrl: '/bank-logos/png/00000000.png',
    source: 'bb.com.br / Open Finance Brasil',
    color: '#0038A8',
    bg: '#EFF4FC',
    aliases: ['bb', 'banco do brasil', 'ourocard', 'estilo bb', 'brasil']
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    displayName: 'C6 Bank',
    code: '336',
    ispb: '31872495',
    shortLabel: 'C6',
    logoUrl: '/bank-logos/c6-bank.svg',
    pngUrl: '/bank-logos/png/31872495.png',
    source: 'c6bank.com.br / Open Finance Brasil',
    color: '#1A1A1A',
    bg: '#F2F2F2',
    aliases: ['c6', 'c6 bank', 'c6bank']
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    displayName: 'Mercado Pago',
    code: '323',
    ispb: '10573521',
    shortLabel: 'MP',
    logoUrl: '/bank-logos/mercado-pago.svg',
    pngUrl: '/bank-logos/png/10573521.png',
    source: 'mercadolivre.com / mlstatic.com / Open Finance Brasil',
    color: '#009EE3',
    bg: '#EDF8FD',
    aliases: ['mercado pago', 'mercadopago', 'mp', 'mercado livre']
  },
  {
    id: 'picpay',
    name: 'PicPay',
    displayName: 'PicPay',
    code: '380',
    ispb: '22896431',
    shortLabel: 'Pic',
    logoUrl: '/bank-logos/picpay.svg',
    pngUrl: '/bank-logos/png/22896431.png',
    source: 'picpay.com / Open Finance Brasil',
    color: '#11C76F',
    bg: '#EFFBF4',
    aliases: ['picpay', 'pic pay', 'original']
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    displayName: 'BTG Pactual',
    code: '208',
    ispb: '30306294',
    shortLabel: 'BTG',
    logoUrl: '/bank-logos/btg-pactual.svg',
    pngUrl: '/bank-logos/png/30306294.png',
    source: 'btgpactual.com / Open Finance Brasil',
    color: '#0B2240',
    bg: '#EDF1F7',
    aliases: ['btg', 'btg pactual', 'pactual']
  },
  {
    id: 'neon',
    name: 'Neon Pagamentos',
    displayName: 'Neon',
    code: '536',
    ispb: '20855875',
    shortLabel: 'Neon',
    logoUrl: '/bank-logos/neon.svg',
    pngUrl: '/bank-logos/png/20855875.png',
    source: 'neon.com.br / Open Finance Brasil',
    color: '#00B4D8',
    bg: '#EAF9FD',
    aliases: ['neon', 'banco neon', '735']
  },
  {
    id: 'pagbank',
    name: 'PagBank / PagSeguro',
    displayName: 'PagBank',
    code: '290',
    ispb: '08561701',
    shortLabel: 'Pag',
    logoUrl: '/bank-logos/pagbank.svg',
    pngUrl: '/bank-logos/png/08561701.png',
    source: 'pagseguro.uol.com.br / Open Finance Brasil',
    color: '#00A868',
    bg: '#EDFBF4',
    aliases: ['pagbank', 'pagseguro', 'pag bank', 'pag seguro']
  },
  {
    id: 'sicoob',
    name: 'Sicoob',
    displayName: 'Sicoob',
    code: '756',
    ispb: '02038232',
    shortLabel: 'Sicoob',
    logoUrl: '/bank-logos/sicoob.svg',
    pngUrl: '/bank-logos/png/02038232.png',
    source: 'sicoob.com.br / Open Finance Brasil',
    color: '#003641',
    bg: '#E6F4F6',
    aliases: ['sicoob', 'bancoob']
  },
  {
    id: 'sicredi',
    name: 'Sicredi',
    displayName: 'Sicredi',
    code: '748',
    ispb: '01181521',
    shortLabel: 'Sicredi',
    logoUrl: '/bank-logos/sicredi.svg',
    pngUrl: '/bank-logos/png/01181521.png',
    source: 'sicredi.com.br / Open Finance Brasil',
    color: '#007D40',
    bg: '#EAF7EE',
    aliases: ['sicredi', 'bansicredi']
  },
  {
    id: 'safra',
    name: 'Banco Safra',
    displayName: 'Safra',
    code: '422',
    ispb: '58160789',
    shortLabel: 'Safra',
    logoUrl: '/bank-logos/safra.svg',
    pngUrl: '/bank-logos/png/58160789.png',
    source: 'safra.com.br / Open Finance Brasil',
    color: '#102142',
    bg: '#EEF2F9',
    aliases: ['safra', 'banco safra']
  },
  {
    id: 'xp',
    name: 'XP Investimentos',
    displayName: 'XP Investimentos',
    code: '348',
    ispb: '33264668',
    shortLabel: 'XP',
    logoUrl: '/bank-logos/xp.svg',
    pngUrl: '/bank-logos/png/33264668.png',
    source: 'xpi.com.br / Open Finance Brasil',
    color: '#000000',
    bg: '#FFF8EE',
    aliases: ['xp', 'xp investimentos', 'rico', 'clear', '102']
  },
  {
    id: 'pan',
    name: 'Banco Pan',
    displayName: 'Banco Pan',
    code: '623',
    ispb: '59285411',
    shortLabel: 'Pan',
    logoUrl: '/bank-logos/banco-pan.svg',
    pngUrl: '/bank-logos/png/59285411.png',
    source: 'bancopan.com.br / Open Finance Brasil',
    color: '#0066CC',
    bg: '#E6F2FF',
    aliases: ['pan', 'banco pan', 'panamericano']
  },
  {
    id: 'banrisul',
    name: 'Banrisul',
    displayName: 'Banrisul',
    code: '041',
    ispb: '92702067',
    shortLabel: 'Banri',
    logoUrl: '/bank-logos/banrisul.svg',
    pngUrl: '/bank-logos/png/92702067.png',
    source: 'banrisul.com.br / Open Finance Brasil',
    color: '#003399',
    bg: '#EBF1FA',
    aliases: ['banrisul', 'banco do estado do rio grande do sul']
  },
  {
    id: 'bv',
    name: 'Banco BV (Votorantim)',
    displayName: 'Banco BV',
    code: '655',
    ispb: '59588111',
    shortLabel: 'BV',
    logoUrl: '/bank-logos/bv.svg',
    pngUrl: '/bank-logos/png/59588111.png',
    source: 'bv.com.br / Open Finance Brasil',
    color: '#002E6E',
    bg: '#EBF2FA',
    aliases: ['bv', 'banco bv', 'votorantim', 'banco votorantim', '413']
  },
  {
    id: 'crefisa',
    name: 'Crefisa',
    displayName: 'Crefisa',
    code: '069',
    ispb: '61033106',
    shortLabel: 'Cref',
    logoUrl: '/bank-logos/crefisa.svg',
    pngUrl: '/bank-logos/png/61033106.png',
    source: 'crefisa.com.br / Open Finance Brasil',
    color: '#FFD100',
    bg: '#FFFDE6',
    aliases: ['crefisa', 'banco crefisa']
  },
  {
    id: 'agibank',
    name: 'Agibank',
    displayName: 'Agibank',
    code: '121',
    ispb: '10664513',
    shortLabel: 'Agi',
    logoUrl: '/bank-logos/agibank.svg',
    pngUrl: '/bank-logos/png/10664513.png',
    source: 'agibank.com.br / Open Finance Brasil',
    color: '#005696',
    bg: '#E8F4FB',
    aliases: ['agibank', 'agi']
  },
  {
    id: 'brb',
    name: 'BRB (Banco de Brasília)',
    displayName: 'BRB',
    code: '070',
    ispb: '00000208',
    shortLabel: 'BRB',
    logoUrl: '/bank-logos/brb.svg',
    pngUrl: '/bank-logos/png/00000208.png',
    source: 'brb.com.br / Open Finance Brasil',
    color: '#003366',
    bg: '#E8F0F8',
    aliases: ['brb', 'banco de brasilia', 'banco de brasília']
  },
  {
    id: 'ailos',
    name: 'Ailos Cooperativa',
    displayName: 'Ailos',
    code: '085',
    ispb: '05463212',
    shortLabel: 'Ailos',
    logoUrl: '/bank-logos/ailos.svg',
    pngUrl: '/bank-logos/png/05463212.png',
    source: 'ailos.coop.br / Open Finance Brasil',
    color: '#009688',
    bg: '#E6F5F3',
    aliases: ['ailos', 'viacredi']
  },
  {
    id: 'dinheiro',
    name: 'Dinheiro / Carteira',
    displayName: 'Carteira (Dinheiro)',
    code: null,
    ispb: null,
    shortLabel: 'Cash',
    icon: Wallet,
    color: '#10B981',
    bg: '#ECFDF5',
    aliases: ['dinheiro', 'carteira', 'especie', 'espécie']
  },
  {
    id: 'cartao',
    name: 'Cartão de Crédito',
    displayName: 'Cartão de Crédito',
    code: null,
    ispb: null,
    shortLabel: 'Card',
    icon: CreditCard,
    color: '#6366F1',
    bg: '#EEF2FF',
    aliases: ['cartao', 'cartão']
  },
  {
    id: 'banco',
    name: 'Conta Corrente / Outro Banco',
    displayName: 'Outro Banco',
    code: null,
    ispb: null,
    shortLabel: 'Bank',
    icon: Landmark,
    color: '#0284C7',
    bg: '#F0F9FF',
    aliases: ['banco', 'conta corrente', 'outro']
  },
  {
    id: 'poupanca',
    name: 'Poupança / Reserva',
    displayName: 'Poupança',
    code: null,
    ispb: null,
    shortLabel: 'Poup',
    icon: PiggyBank,
    color: '#EC4899',
    bg: '#FDF2F8',
    aliases: ['poupanca', 'poupança', 'reserva']
  },
  {
    id: 'investimento',
    name: 'Investimentos / Corretora',
    displayName: 'Investimentos',
    code: null,
    ispb: null,
    shortLabel: 'Inv',
    icon: TrendingUp,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    aliases: ['investimento', 'investimentos', 'corretora', 'cdb', 'ações', 'acoes']
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
    const foundByCode = findBankByCode(bankCode)
    if (foundByCode) return foundByCode
  }

  // 3. Busca inteligente por apelidos e palavras-chave no nome da conta
  const nameNorm = (accountName || '').toLowerCase().trim()
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

  // 4. Fallback contextual seguro
  if (kind === 'card') {
    return BANK_LOGOS.find((l) => l.id === 'cartao')
  }
  return BANK_LOGOS.find((l) => l.id === 'banco')
}

/**
 * Procura um banco pelo código COMPE, com suporte à busca estendida
 * via diretório oficial do Banco Central (logos-bancos-br)
 */
export function findBankByCode(code) {
  if (!code) return null
  const cleanCode = String(code).trim().padStart(3, '0')

  // Procura no catálogo principal com arquivos locais otimizados
  const curated = BANK_LOGOS.find((l) => l.code === cleanCode)
  if (curated) return curated

  // Busca estendida no diretório completo de instituições
  try {
    const bankDir = findBankInDirectory(cleanCode)
    if (bankDir) {
      const hasSvg = Boolean(bankDir.logo?.svg)
      const hasPng = Boolean(bankDir.logo?.png)
      const logoUrl = hasSvg
        ? `/bank-logos/svg/${bankDir.ispb}.svg`
        : hasPng
          ? `/bank-logos/png/${bankDir.ispb}.png`
          : null

      return {
        id: `compe-${cleanCode}`,
        name: bankDir.displayName || bankDir.name,
        displayName: bankDir.displayName || bankDir.shortName || bankDir.name,
        code: cleanCode,
        ispb: bankDir.ispb,
        shortLabel: (bankDir.displayName || bankDir.shortName || 'BCO').slice(0, 4),
        logoUrl,
        pngUrl: hasPng ? `/bank-logos/png/${bankDir.ispb}.png` : null,
        source: bankDir.logo?.source?.uri || 'Banco Central do Brasil / Open Finance Brasil',
        color: '#1E293B',
        bg: '#F1F5F9',
        aliases: [cleanCode, (bankDir.displayName || '').toLowerCase()]
      }
    }
  } catch {}

  return null
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
