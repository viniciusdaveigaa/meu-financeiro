import {
  Baby,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Laptop,
  MonitorPlay,
  Palette,
  PawPrint,
  PiggyBank,
  Plane,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  UtensilsCrossed,
  Wallet
} from 'lucide-react'

// Ícones disponíveis para seleção pelo usuário
export const iconCatalog = {
  Briefcase: { label: 'Trabalho / Salário', icon: Briefcase },
  PiggyBank: { label: 'Poupança / Reserva', icon: PiggyBank },
  House: { label: 'Moradia / Casa', icon: House },
  UtensilsCrossed: { label: 'Alimentação / Restaurante', icon: UtensilsCrossed },
  Coffee: { label: 'Café / Lanche', icon: Coffee },
  Car: { label: 'Transporte / Carro', icon: Car },
  Ticket: { label: 'Lazer / Eventos', icon: Ticket },
  HeartPulse: { label: 'Saúde / Farmácia', icon: HeartPulse },
  GraduationCap: { label: 'Educação / Cursos', icon: GraduationCap },
  MonitorPlay: { label: 'Assinaturas / Streaming', icon: MonitorPlay },
  ShoppingBag: { label: 'Compras / Shopping', icon: ShoppingBag },
  PawPrint: { label: 'Pets / Animais', icon: PawPrint },
  Dumbbell: { label: 'Academia / Fitness', icon: Dumbbell },
  Gift: { label: 'Presentes / Doações', icon: Gift },
  Plane: { label: 'Viagem / Férias', icon: Plane },
  Baby: { label: 'Filhos / Bebê', icon: Baby },
  Laptop: { label: 'Eletrônicos / Tecnologia', icon: Laptop },
  Sparkles: { label: 'Beleza / Cuidados', icon: Sparkles },
  CreditCard: { label: 'Finanças / Contas', icon: CreditCard },
  Wallet: { label: 'Investimentos', icon: Wallet },
  Tag: { label: 'Outros / Diversos', icon: Tag },
}

// Cores disponíveis para seleção de categoria
export const colorPalette = [
  { name: 'Verde Esmeralda', color: '#15803d', bg: '#dcfce7' },
  { name: 'Azul Real', color: '#2563eb', bg: '#dbeafe' },
  { name: 'Laranja Terracota', color: '#c2410c', bg: '#ffedd5' },
  { name: 'Roxo Nobre', color: '#7e22ce', bg: '#f3e8ff' },
  { name: 'Rosa Rubi', color: '#be123c', bg: '#ffe4e6' },
  { name: 'Âmbar Dourado', color: '#b45309', bg: '#fef3c7' },
  { name: 'Ciano Oceano', color: '#0e7490', bg: '#cffafe' },
  { name: 'Índigo Violeta', color: '#4338ca', bg: '#e0e7ff' },
  { name: 'Teal Floresta', color: '#0f766e', bg: '#ccfbf1' },
  { name: 'Grafite Neutro', color: '#475569', bg: '#f1f5f9' },
]

export const defaultCategories = [
  'Salario',
  'Caixinha',
  'Moradia',
  'Alimentacao',
  'Transporte',
  'Lazer',
  'Saude',
  'Educacao',
  'Assinaturas',
  'Outros'
]

export const defaultCategoryMeta = {
  Salario: { label: 'Salário', icon: Briefcase, color: '#15803d', bg: '#e3f4e8', iconName: 'Briefcase' },
  Caixinha: { label: 'Caixinha', icon: PiggyBank, color: '#0f766e', bg: '#dcf2ee', iconName: 'PiggyBank' },
  Moradia: { label: 'Moradia', icon: House, color: '#1d4ed8', bg: '#e3ebfb', iconName: 'House' },
  Alimentacao: { label: 'Alimentação', icon: UtensilsCrossed, color: '#c2410c', bg: '#fcebdf', iconName: 'UtensilsCrossed' },
  Transporte: { label: 'Transporte', icon: Car, color: '#a16207', bg: '#f8efd6', iconName: 'Car' },
  Lazer: { label: 'Lazer', icon: Ticket, color: '#7e22ce', bg: '#f1e6fa', iconName: 'Ticket' },
  Saude: { label: 'Saúde', icon: HeartPulse, color: '#be123c', bg: '#fbe4ea', iconName: 'HeartPulse' },
  Educacao: { label: 'Educação', icon: GraduationCap, color: '#4338ca', bg: '#e7e7fb', iconName: 'GraduationCap' },
  Assinaturas: { label: 'Assinaturas', icon: MonitorPlay, color: '#0e7490', bg: '#ddf1f5', iconName: 'MonitorPlay' },
  Outros: { label: 'Outros', icon: Tag, color: '#475569', bg: '#eceff3', iconName: 'Tag' },
}

// Fallback universal para quando nenhuma meta existir
export function resolveMeta(categoryName, customList = []) {
  if (!categoryName) return defaultCategoryMeta.Outros

  // 1. Procurar nas customizadas primeiro
  const custom = customList.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName
  )
  if (custom) {
    const iconObj = iconCatalog[custom.iconName]?.icon || Tag
    return {
      label: custom.name,
      icon: iconObj,
      color: custom.color || '#475569',
      bg: custom.bg || '#f1f5f9',
      iconName: custom.iconName || 'Tag',
      isCustom: true,
      id: custom.id
    }
  }

  // 2. Procurar nas padrões
  if (defaultCategoryMeta[categoryName]) {
    return defaultCategoryMeta[categoryName]
  }

  // 3. Fallback genérico com o nome original
  return {
    label: categoryName,
    icon: Tag,
    color: '#475569',
    bg: '#eceff3',
    iconName: 'Tag',
    isCustom: false
  }
}

// Backward compatibility exports
export const categories = defaultCategories
export const categoryMeta = defaultCategoryMeta

export function getCategoryLabel(category) {
  return defaultCategoryMeta[category]?.label || category
}

export function getCategoryMeta(category) {
  return defaultCategoryMeta[category] || { ...defaultCategoryMeta.Outros, label: category || 'Outros' }
}
