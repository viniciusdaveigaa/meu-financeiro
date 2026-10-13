import { supabase } from '../supabase'

const STORAGE_READS_PREFIX = 'sc_read_updates'

// Registros reais e fidedignos das atualizações efetivamente implementadas no sistema
export const INITIAL_UPDATES_SEED = [
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
    description: 'Revisão visual completa das marcas bancárias com vetores oficiais autênticos em alta definição para Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, Caixa Econômica, C6 Bank, PicPay, Mercado Pago, BTG, Neon, Sicoob e Sicredi, com suporte a códigos COMPE e fallback seguro.',
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
    description: 'Implementação de cache em memória para abertura instantânea das abas de Extrato, Metas e Configurações, além de uma animação suave e acolhedora durante o encerramento de sessão.',
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

  // 2. Busca as novidades no Supabase
  try {
    const { data, error } = await supabase
      .from('app_updates')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (!error && data && data.length > 0) {
      updates = data
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
