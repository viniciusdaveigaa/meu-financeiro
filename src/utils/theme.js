/**
 * Utilitário de Temas e Personalização de Cores do Saldo Claro
 * Aplica variáveis CSS dinamicamente com cálculo de tons e contraste.
 */

export const DEFAULT_THEME = {
  id: 'emerald',
  name: 'Esmeralda (Padrão)',
  primaryColor: '#10382f',       // Cor dos elementos principais em verde escuro
  accentColor: '#1f9d6b',        // Destaque dos botões e links
  darkElementsColor: '#0a251f',  // Topbar, cabeçalhos escuros e fundos profundos
  selectedBgColor: '#dcfce7',    // Fundo de elementos selecionados / badges
  interactiveColor: '#164e40'    // Menus, abas ativas e elementos interativos
}

export const PRESET_THEMES = [
  DEFAULT_THEME,
  {
    id: 'blue',
    name: 'Azul Safira',
    primaryColor: '#1e3a8a',
    accentColor: '#2563eb',
    darkElementsColor: '#0c1f38',
    selectedBgColor: '#dbeafe',
    interactiveColor: '#1d4ed8'
  },
  {
    id: 'purple',
    name: 'Roxo Elétrico',
    primaryColor: '#581c87',
    accentColor: '#8b5cf6',
    darkElementsColor: '#1e0c38',
    selectedBgColor: '#ede9fe',
    interactiveColor: '#6d28d9'
  },
  {
    id: 'wine',
    name: 'Vinho Elegante',
    primaryColor: '#881337',
    accentColor: '#e11d48',
    darkElementsColor: '#2d0a14',
    selectedBgColor: '#ffe4e6',
    interactiveColor: '#9f1239'
  },
  {
    id: 'graphite',
    name: 'Grafite Minimalista',
    primaryColor: '#27272a',
    accentColor: '#52525b',
    darkElementsColor: '#18181b',
    selectedBgColor: '#e4e4e7',
    interactiveColor: '#3f3f46'
  },
  {
    id: 'amber',
    name: 'Âmbar Solar',
    primaryColor: '#78350f',
    accentColor: '#d97706',
    darkElementsColor: '#261605',
    selectedBgColor: '#fef3c7',
    interactiveColor: '#92400e'
  }
]

export const STORAGE_KEY_THEME = 'sc_theme_preferences'

/** Valida código HEX de 6 caracteres (#RRGGBB) */
export function isValidHex(hex) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

/** Normaliza para #RRGGBB */
export function normalizeHex(hex) {
  if (!hex) return '#10382f'
  let clean = hex.trim()
  if (!clean.startsWith('#')) clean = `#${clean}`
  if (clean.length === 4) {
    clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`
  }
  return clean
}

/** Converte HEX para { r, g, b } */
export function hexToRgb(hex) {
  const norm = normalizeHex(hex)
  const num = parseInt(norm.slice(1), 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

/** Ajusta brilho de uma cor HEX (percentual: -100 a 100) */
export function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex)
  const amt = Math.round(2.55 * percent)
  const newR = Math.min(255, Math.max(0, r + amt))
  const newG = Math.min(255, Math.max(0, g + amt))
  const newB = Math.min(255, Math.max(0, b + amt))
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`
}

/** Calcula cor de contraste ideal (preto ou branco) para um fundo */
export function getContrastColor(hex) {
  const { r, g, b } = hexToRgb(hex)
  // Fórmula de luminância relativa WCAG
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 150 ? '#0a251f' : '#ffffff'
}

/** Retorna o tema salvo no localStorage ou o padrão */
export function getSavedTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_THEME,
        ...parsed
      }
    }
  } catch {}
  return DEFAULT_THEME
}

/** Aplica as variáveis CSS do tema diretamente ao :root do documento */
export function applyTheme(theme) {
  if (!theme || typeof document === 'undefined') return

  const root = document.documentElement
  const primary = normalizeHex(theme.primaryColor || DEFAULT_THEME.primaryColor)
  const accent = normalizeHex(theme.accentColor || DEFAULT_THEME.accentColor)
  const dark = normalizeHex(theme.darkElementsColor || DEFAULT_THEME.darkElementsColor)
  const selected = normalizeHex(theme.selectedBgColor || DEFAULT_THEME.selectedBgColor)
  const interactive = normalizeHex(theme.interactiveColor || DEFAULT_THEME.interactiveColor)

  const darkerPrimary = adjustBrightness(dark, -25)
  const lighterSelected = adjustBrightness(selected, 25)

  // Atualiza as variáveis CSS principais do ecossistema de estilos
  root.style.setProperty('--emerald-950', darkerPrimary)
  root.style.setProperty('--emerald-900', dark)
  root.style.setProperty('--emerald-800', primary)
  root.style.setProperty('--emerald-700', interactive)
  root.style.setProperty('--emerald-600', adjustBrightness(interactive, 15))
  root.style.setProperty('--emerald-500', accent)
  root.style.setProperty('--emerald-100', selected)
  root.style.setProperty('--emerald-50', lighterSelected)

  // Variáveis semânticas dedicadas
  root.style.setProperty('--brand-primary', primary)
  root.style.setProperty('--brand-dark', dark)
  root.style.setProperty('--brand-accent', accent)
  root.style.setProperty('--brand-selected-bg', selected)
  root.style.setProperty('--brand-interactive', interactive)
  root.style.setProperty('--brand-accent-contrast', getContrastColor(accent))
  root.style.setProperty('--brand-primary-contrast', getContrastColor(primary))
}

/** Salva o tema e aplica imediatamente */
export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme))
  } catch {}
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent('app-theme-changed', { detail: theme }))
}

/** Restaura as cores originais padrão */
export function resetToDefaultTheme() {
  saveTheme(DEFAULT_THEME)
  return DEFAULT_THEME
}

/** Inicializa o tema no arranque da aplicação */
export function initTheme() {
  const current = getSavedTheme()
  applyTheme(current)
  return current
}

