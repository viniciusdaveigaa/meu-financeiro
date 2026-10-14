import { supabase } from '../supabase'

const STORAGE_READS_PREFIX = 'sc_read_updates'

// Registros reais e fidedignos das atualizações efetivamente implementadas no sistema
export const INITIAL_UPDATES_SEED = [
  {
    id: 'seed-upd-privacy-responsive',
    title: 'Visualização Ampliada da Política de Privacidade e Menus 2x2 no Mobile',
    description: 'O modal de Privacidade, Termos de Uso e LGPD foi ampliado no computador para 960px com visualização espaçosa e confortável. No celular, os menus de abas foram reestruturados em um grid de 2 colunas totalmente visível e acessível, eliminando opções cortadas.',
    category: 'improvement',
    version: '2.2.0',
    published_at: '2026-10-13T22:40:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-date-fix-normal-accounts',
    title: 'Correção de Data e Mês em Lançamentos de Contas Bancárias',
    description: 'Lançamentos em contas correntes, débito, dinheiro e receitas agora mantêm rigorosamente a data e o mês escolhidos no extrato, reservando a virada de fatura estritamente para despesas a crédito.',
    category: 'fix',
    version: '2.2.0',
    published_at: '2026-10-13T22:15:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-multi-csv-import',
    title: 'Importação Simultânea de Múltiplos Arquivos CSV',
    description: 'Agora você pode selecionar e importar mais de um arquivo CSV de uma só vez na tela de Extrato. O extrator processa todos os extratos em lote com detecção inteligente de duplicatas e categorização automática.',
    category: 'feature',
    version: '2.2.0',
    published_at: '2026-10-13T21:45:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-bulk-delete-month',
    title: 'Exclusão em Lote dos Lançamentos do Mês Selecionado',
    description: 'Novo botão ao final da página de Extrato de Transações para excluir todos os lançamentos do mês ativo de forma segura, com tela de confirmação de segurança detalhando a quantidade de registros afetados.',
    category: 'feature',
    version: '2.2.0',
    published_at: '2026-10-13T21:20:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-category-all-icons',
    title: 'Biblioteca Completa de Ícones no Cadastro Rápido de Categorias',
    description: 'Ao cadastrar uma categoria diretamente na criação de um lançamento financeiro, agora estão disponíveis todos os ícones da biblioteca completa do sistema, padronizando a experiência com a tela de configurações.',
    category: 'improvement',
    version: '2.2.0',
    published_at: '2026-10-13T20:50:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-card-validation-clarity',
    title: 'Validação e Descrições no Cadastro de Cartões de Crédito',
    description: 'Melhoria na interface de cadastro de cartões com avisos obrigatórios para preenchimento dos dias de fechamento e vencimento da fatura, além de descrições claras para evitar erros nos ciclos financeiros.',
    category: 'improvement',
    version: '2.2.0',
    published_at: '2026-10-13T20:20:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-csv-nubank',
    title: 'Importação Aprimorada do Nubank e Extratos Pix',
    description: 'Sanitização inteligente de lançamentos Pix no extrato CSV do Nubank, remoção de poluição de agência e conta nas descrições, categorização automática inteligente (Assinaturas, Transporte, Alimentação) e ampliação de limite de caracteres para garantir importação perfeita.',
    category: 'fix',
    version: '2.2.0',
    published_at: '2026-10-13T19:30:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-planning-order',
    title: 'Reorganização da Seção de Planejamento',
    description: 'A aba Planejamento foi reestruturada para priorizar suas contas: a navegação agora inicia por Contas e Recorrências, seguida de Caixinhas de Reserva, Categorias e Orçamentos Mensais, com abertura padrão imediata.',
    category: 'improvement',
    version: '2.2.0',
    published_at: '2026-10-13T19:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-bank-logos-hd',
    title: 'Logos Bancárias com Alta Nitidez e Ampliação Visual',
    description: 'Eliminação completa de margens vazias nos arquivos vetoriais e ampliação da área útil dos badges das instituições financeiras (Nubank, Mercado Pago, Itaú, Bradesco, Santander, Banco do Brasil, C6 Bank e outros) no extrato e formulários.',
    category: 'improvement',
    version: '2.2.0',
    published_at: '2026-10-13T18:30:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-news-grouped',
    title: 'Novidades Agrupadas por Dia com Notificação Automática',
    description: 'A Central de Novidades agora organiza todas as atualizações agrupadas cronologicamente por dia (Hoje, Ontem e datas anteriores) e exibe o painel de novidades automaticamente toda vez que houver uma nova funcionalidade ou melhoria disponível.',
    category: 'feature',
    version: '2.2.0',
    published_at: '2026-10-13T18:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-1',
    title: 'Personalização de Cores do Aplicativo',
    description: 'Agora você pode escolher as cores da interface por meio de um seletor visual nativo (color picker) ou informar diretamente o código HEX (ex: #2563EB). Inclui paletas pré-configuradas, prévia em tempo real, restauração das cores padrão e cálculo automático de contraste WCAG AA tanto no modo claro quanto no modo escuro.',
    category: 'feature',
    version: '2.1.0',
    published_at: '2026-10-13T17:30:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-2',
    title: 'Retirada de Dinheiro das Caixinhas de Reserva',
    description: 'Adicionada a funcionalidade de resgatar dinheiro das caixinhas de economia. O sistema exibe o saldo disponível, impede saques superiores ao guardado, oferece atalhos rápidos (25%, 50%, 100%) e inclui uma opção para ocultar o resgate do extrato financeiro sem comprometer os cálculos patrimoniais, finalizado com uma tela de confirmação de segurança.',
    category: 'feature',
    version: '2.1.0',
    published_at: '2026-10-13T16:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-3',
    title: 'Cartões de Crédito e Débito com Controle de Faturas',
    description: 'Separação explícita entre compras no débito e compras no crédito. Para cartões de crédito, você pode configurar os dias de fechamento e vencimento: compras no crédito entram automaticamente na fatura aberta correspondente e não debitam o saldo bancário de imediato, respeitando o ciclo financeiro.',
    category: 'improvement',
    version: '2.1.0',
    published_at: '2026-10-13T15:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-4',
    title: 'Logos Oficiais das Instituições Financeiras em SVG',
    description: 'Revisão visual completa das marcas bancárias com vetores oficiais autênticos em alta definição para as principais instituições financeiras brasileiras (Banco do Brasil, Itaú, Bradesco, Santander, Caixa, Inter, C6 Bank e outras), com suporte a códigos COMPE e fallback seguro.',
    category: 'improvement',
    version: '2.1.0',
    published_at: '2026-10-13T14:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-5',
    title: 'Importação Modular de Extratos CSV por Banco',
    description: 'Reestruturação da importação de arquivos bancários em 3 passos intuitivos: seleção prévia da instituição, instruções específicas para exportação, tratamento flexível de separadores decimais e de colunas, destaque de linhas inconsistentes e detecção inteligente de transações duplicadas.',
    category: 'feature',
    version: '2.1.0',
    published_at: '2026-10-13T13:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-6',
    title: 'Consentimento de Termos e Política de Privacidade (LGPD)',
    description: 'Implementação de fluxo auditável de apresentação e aceitação dos Termos de Uso e Política de Privacidade, integrado ao banco de dados com isolamento RLS, histórico de versões aceitas e painel informativo sobre os direitos do titular.',
    category: 'security',
    version: '2.1.0',
    published_at: '2026-10-13T12:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-7',
    title: 'Otimização de Navegação e Performance (0ms)',
    description: 'Implementação de cache em memória para abertura instantânea das abas de Extrato, Contas e Configurações, além de uma animação suave e acolhedora durante o encerramento de sessão.',
    category: 'improvement',
    version: '2.0.5',
    published_at: '2026-10-12T18:00:00Z',
    is_published: true
  },
  {
    id: 'seed-upd-8',
    title: 'Proteção de Identidade no Login Google',
    description: 'Detecção inteligente do método de login OAuth para contas Google, ocultando de forma coerente opções desnecessárias de troca de senha no sistema.',
    category: 'security',
    version: '2.0.4',
    published_at: '2026-10-11T14:00:00Z',
    is_published: true
  }
]

export function getCategoryMeta(category = 'feature') {
  switch (category) {
    case 'feature':
      return { label: 'Nova Funcionalidade', color: '#15803d', bg: '#dcfce7' }
    case 'improvement':
      return { label: 'Melhoria', color: '#1d4ed8', bg: '#dbeafe' }
    case 'security':
      return { label: 'Segurança', color: '#7e22ce', bg: '#f3e8ff' }
    case 'fix':
      return { label: 'Correção', color: '#b91c1c', bg: '#fee2e2' }
    default:
      return { label: 'Atualização', color: '#475569', bg: '#f1f5f9' }
  }
}

/**
 * Formata um rótulo amigável para o cabeçalho do grupo de novidades.
 */
export function formatNewsGroupDate(isoDate) {
  if (!isoDate) return 'Recentes'
  const today = new Date().toISOString().slice(0, 10)
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yesterday = y.toISOString().slice(0, 10)

  try {
    const [year, month, day] = isoDate.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)
    const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    const dayMonth = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date)

    if (isoDate === today) {
      return `Hoje • ${dayMonth}`
    }
    if (isoDate === yesterday) {
      return `Ontem • ${dayMonth}`
    }

    return `${formattedWeekday}, ${dayMonth}`
  } catch {
    return isoDate
  }
}

/**
 * Agrupa uma lista de atualizações por dia (YYYY-MM-DD), ordenando os grupos do mais recente ao mais antigo.
 */
export function groupUpdatesByDate(updates = []) {
  if (!Array.isArray(updates) || updates.length === 0) return []

  const groupsMap = new Map()

  updates.forEach((item) => {
    const isoDate = item.published_at ? item.published_at.slice(0, 10) : '2026-10-13'
    if (!groupsMap.has(isoDate)) {
      groupsMap.set(isoDate, [])
    }
    groupsMap.get(isoDate).push(item)
  })

  return Array.from(groupsMap.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([isoDate, items]) => ({
      date: isoDate,
      label: formatNewsGroupDate(isoDate),
      items
    }))
}

/**
 * Carrega a lista de novidades e o status de leitura sincronizado por usuário.
 */
export async function fetchAppUpdates(userId = '') {
  let updates = []
  const readSet = new Set()

  // 1. Tenta carregar as leituras locais primeiro
  if (userId) {
    try {
      const localReads = localStorage.getItem(`${STORAGE_READS_PREFIX}_${userId}`)
      if (localReads) {
        JSON.parse(localReads).forEach((id) => readSet.add(id))
      }
    } catch {}
  }

  // 2. Busca as novidades no Supabase e mescla com as sementes do sistema
  try {
    const { data, error } = await supabase
      .from('app_updates')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (!error && data && data.length > 0) {
      // Garante que novidades recentes registradas no código apareçam mesmo com dados existentes no banco
      const dbTitles = new Set(data.map((d) => (d.title || '').trim().toLowerCase()))
      const missingSeeds = INITIAL_UPDATES_SEED.filter(
        (s) => !dbTitles.has((s.title || '').trim().toLowerCase())
      )
      updates = [...data, ...missingSeeds].sort(
        (a, b) => new Date(b.published_at) - new Date(a.published_at)
      )
    } else {
      updates = INITIAL_UPDATES_SEED
    }
  } catch {
    updates = INITIAL_UPDATES_SEED
  }

  // 3. Busca leituras sincronizadas na nuvem
  if (userId) {
    try {
      const { data: readsData, error: readsErr } = await supabase
        .from('user_update_reads')
        .select('update_id')
        .eq('user_id', userId)

      if (!readsErr && readsData) {
        readsData.forEach((r) => readSet.add(r.update_id))
        try {
          localStorage.setItem(
            `${STORAGE_READS_PREFIX}_${userId}`,
            JSON.stringify(Array.from(readSet))
          )
        } catch {}
      }
    } catch {}
  }

  const enrichedUpdates = updates.map((u) => ({
    ...u,
    isRead: readSet.has(u.id)
  }))

  const unreadCount = enrichedUpdates.filter((u) => !u.isRead).length

  return {
    updates: enrichedUpdates,
    unreadCount,
    readSet
  }
}

/**
 * Marca uma atualização específica como lida pelo usuário.
 */
export async function markUpdateAsRead(userId, updateId) {
  if (!userId || !updateId) return

  // Atualiza no localStorage imediatamente
  try {
    const key = `${STORAGE_READS_PREFIX}_${userId}`
    const raw = localStorage.getItem(key)
    const set = new Set(raw ? JSON.parse(raw) : [])
    set.add(updateId)
    localStorage.setItem(key, JSON.stringify(Array.from(set)))
  } catch {}

  // Tenta persistir no Supabase (se a tabela existir)
  try {
    await supabase.from('user_update_reads').upsert({
      user_id: userId,
      update_id: updateId,
      read_at: new Date().toISOString()
    })
  } catch {}

  window.dispatchEvent(new Event('news-updated'))
}

/**
 * Marca todas as atualizações não lidas como lidas de uma só vez.
 */
export async function markAllUpdatesAsRead(userId, updateIds = []) {
  if (!userId || !updateIds.length) return

  try {
    const key = `${STORAGE_READS_PREFIX}_${userId}`
    const raw = localStorage.getItem(key)
    const set = new Set(raw ? JSON.parse(raw) : [])
    updateIds.forEach((id) => set.add(id))
    localStorage.setItem(key, JSON.stringify(Array.from(set)))
  } catch {}

  try {
    const rows = updateIds.map((id) => ({
      user_id: userId,
      update_id: id,
      read_at: new Date().toISOString()
    }))
    await supabase.from('user_update_reads').upsert(rows)
  } catch {}

  window.dispatchEvent(new Event('news-updated'))
}

