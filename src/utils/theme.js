/**
 * Utilitário de Temas e Personalização de Cores do Saldo Claro
 * Suporta galeria com 12 temas predefinidos, customização manual HEX e sincronização.
 */
import { supabase } from '../supabase'

export const DEFAULT_THEME = {
  id: 'emerald',
  name: 'Verde original',
  description: 'Identidade clássica do Saldo Claro',
  primaryColor: '#10382f',       // Cor dos elementos principais em verde escuro
  accentColor: '#1f9d6b',        // Destaque dos botões e links
  darkElementsColor: '#0a251f',  // Topbar, cabeçalhos escuros e fundos profundos
  selectedBgColor: '#dcfce7',    // Fundo de elementos selecionados / badges
  interactiveColor: '#164e40'    // Menus, abas ativas e elementos interativos
}

export const PRESET_THEMES = [
  DEFAULT_THEME,
  {
    id: 'pink-light',
    name: 'Rosa claro',
    description: 'Rosa delicado, suave e moderno em tons pastel',
    primaryColor: '#e879b9',
    accentColor: '#f4a6cf',
    darkElementsColor: '#3d0a25',
    selectedBgColor: '#fce7f3',
    interactiveColor: '#be185d'
  },
  {
    id: 'pink-dark',
    name: 'Rosa escuro',
    description: 'Rosa intenso, sofisticado e marcante',
    primaryColor: '#be185d',
    accentColor: '#db2777',
    darkElementsColor: '#2b0416',
    selectedBgColor: '#fce7f3',
    interactiveColor: '#9d174d'
  },
  {
    id: 'purple',
    name: 'Roxo',
    description: 'Tons de violeta e ametista',
    primaryColor: '#581c87',
    accentColor: '#8b5cf6',
    darkElementsColor: '#1e0c38',
    selectedBgColor: '#ede9fe',
    interactiveColor: '#6d28d9'
  },
  {
    id: 'ocean-blue',
    name: 'Azul oceano',
    description: 'Azul moderno, dinâmico e profissional',
    primaryColor: '#0369a1',
    accentColor: '#0ea5e9',
    darkElementsColor: '#082f49',
    selectedBgColor: '#e0f2fe',
    interactiveColor: '#0284c7'
  },
  {
    id: 'navy-blue',
    name: 'Azul escuro',
    description: 'Azul-marinho elegante e corporativo',
    primaryColor: '#1e3a8a',
    accentColor: '#2563eb',
    darkElementsColor: '#0f172a',
    selectedBgColor: '#dbeafe',
    interactiveColor: '#1d4ed8'
  },
  {
    id: 'crimson-red',
    name: 'Vermelho',
    description: 'Vermelho contemporâneo e vibrante',
    primaryColor: '#991b1b',
    accentColor: '#dc2626',
    darkElementsColor: '#280606',
    selectedBgColor: '#fee2e2',
    interactiveColor: '#b91c1c'
  },
  {
    id: 'sunset-orange',
    name: 'Laranja',
    description: 'Tons quentes e vibrantes de pôr do sol',
    primaryColor: '#c2410c',
    accentColor: '#ea580c',
    darkElementsColor: '#331206',
    selectedBgColor: '#ffedd5',
    interactiveColor: '#9a3412'
  },
  {
    id: 'golden-amber',
    name: 'Amarelo dourado',
    description: 'Tons dourados, equilibrados e nobres',
    primaryColor: '#854d0e',
    accentColor: '#d97706',
    darkElementsColor: '#2e1c05',
    selectedBgColor: '#fef3c7',
    interactiveColor: '#a16207'
  },
  {
    id: 'cyan-turquoise',
    name: 'Ciano',
    description: 'Tons de azul-claro e turquesa refrescante',
    primaryColor: '#0e7490',
    accentColor: '#06b6d4',
    darkElementsColor: '#082f3a',
    selectedBgColor: '#cffafe',
    interactiveColor: '#0891b2'
  },
  {
    id: 'graphite-black',
    name: 'Preto e grafite',
    description: 'Visual escuro, minimalista e sofisticado',
    primaryColor: '#27272a',
    accentColor: '#52525b',
    darkElementsColor: '#09090b',
    selectedBgColor: '#e4e4e7',
    interactiveColor: '#3f3f46'
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    description: 'Tons suaves de lilás e roxo-claro relaxante',
    primaryColor: '#6b21a8',
    accentColor: '#a855f7',
    darkElementsColor: '#240b3b',
    selectedBgColor: '#f3e8ff',
    interactiveColor: '#7e22ce'
  }
]

export const STORAGE_KEY_THEME = 'sc_theme_preferences'

/** Valida código HEX (#RGB ou #RRGGBB) */
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
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 150 ? '#0a251f' : '#ffffff'
}

/** Identifica se o tema atual corresponde a um dos presets ou é personalizado */
export function detectActivePreset(theme) {
  if (!theme) return DEFAULT_THEME.id
  const match = PRESET_THEMES.find(
    (p) =>
      p.primaryColor.toLowerCase() === theme.primaryColor?.toLowerCase() &&
      p.accentColor.toLowerCase() === theme.accentColor?.toLowerCase() &&
      p.darkElementsColor.toLowerCase() === theme.darkElementsColor?.toLowerCase() &&
      p.selectedBgColor.toLowerCase() === theme.selectedBgColor?.toLowerCase() &&
      p.interactiveColor.toLowerCase() === theme.interactiveColor?.toLowerCase()
  )
  return match ? match.id : 'custom'
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

  // Variáveis semânticas dedicadas e contraste calculado
  root.style.setProperty('--brand-primary', primary)
  root.style.setProperty('--brand-dark', dark)
  root.style.setProperty('--brand-accent', accent)
  root.style.setProperty('--brand-selected-bg', selected)
  root.style.setProperty('--brand-interactive', interactive)
  root.style.setProperty('--primary-contrast', getContrastColor(primary))
  root.style.setProperty('--accent-contrast', getContrastColor(accent))
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

/** Sincroniza preferências do tema da conta do usuário no Supabase */
export async function syncUserTheme(userId) {
  if (!userId) return
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('theme_preferences')
      .eq('id', userId)
      .maybeSingle()

    if (!error && data?.theme_preferences) {
      saveTheme(data.theme_preferences)
    }
  } catch (err) {
    console.warn('Erro ao sincronizar tema do Supabase:', err)
  }
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
