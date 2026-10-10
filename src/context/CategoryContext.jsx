import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabase'
import {
  defaultCategories,
  defaultCategoryMeta,
  resolveMeta
} from '../constants/categories'

const CategoryContext = createContext(null)

const STORAGE_KEY_PREFIX = 'sc_custom_categories'

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export function CategoryProvider({ children, userId = 'default' }) {
  const storageKey = `${STORAGE_KEY_PREFIX}_${userId}`

  // Inicializa a partir do localStorage para carregamento instantâneo sem piscar
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Salva no localStorage como cache sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(customCategories))
    } catch {
      /* storage indisponível */
    }
  }, [customCategories, storageKey])

  // Busca do Supabase e migra dados locais se existirem
  const fetchAndSyncCategories = useCallback(async () => {
    if (!supabase || !userId || userId === 'default') return

    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) {
        console.warn('Aviso: Não foi possível carregar categorias do Supabase:', error.message)
        return
      }

      let remoteCategories = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        iconName: row.icon_name || 'Tag',
        color: row.color || '#475569',
        bg: row.bg || '#f1f5f9',
        createdAt: row.created_at
      }))

      // Auto-migração: caso haja categorias no localStorage (ex.: criadas no PC antes da sincronização)
      // que ainda não estejam salvas no Supabase, envia automaticamente para o banco.
      let localStored = []
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) localStored = JSON.parse(stored)
      } catch {
        localStored = []
      }

      const toMigrate = localStored.filter(
        (loc) => loc?.name && !remoteCategories.some((rem) => rem.name.toLowerCase() === loc.name.toLowerCase())
      )

      if (toMigrate.length > 0) {
        const rowsToInsert = toMigrate.map((cat) => ({
          id: isValidUUID(cat.id) ? cat.id : generateUUID(),
          user_id: userId,
          name: cat.name.trim(),
          icon_name: cat.iconName || 'Tag',
          color: cat.color || '#475569',
          bg: cat.bg || '#f1f5f9'
        }))

        const { data: inserted, error: insertError } = await supabase
          .from('custom_categories')
          .upsert(rowsToInsert, { onConflict: 'user_id,name' })
          .select()

        if (!insertError && inserted) {
          const migratedItems = inserted.map((row) => ({
            id: row.id,
            name: row.name,
            iconName: row.icon_name || 'Tag',
            color: row.color || '#475569',
            bg: row.bg || '#f1f5f9',
            createdAt: row.created_at
          }))

          const combined = [...remoteCategories]
          migratedItems.forEach((m) => {
            if (!combined.some((c) => c.id === m.id)) {
              combined.push(m)
            }
          })
          remoteCategories = combined
        }
      }

      setCustomCategories(remoteCategories)
      try {
        localStorage.setItem(storageKey, JSON.stringify(remoteCategories))
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.warn('Exceção ao sincronizar categorias:', err)
    }
  }, [storageKey, userId])

  // Efeito para sincronização e Realtime
  useEffect(() => {
    fetchAndSyncCategories()

    if (!supabase || !userId || userId === 'default') return

    // Escuta alterações em tempo real para sincronizar entre abas e dispositivos
    const channel = supabase
      .channel(`realtime_categories_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'custom_categories',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchAndSyncCategories()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAndSyncCategories, userId])

  // Lista consolidada de nomes de categorias
  const allCategoryNames = useMemo(() => {
    const customNames = customCategories.map((c) => c.name)
    const set = new Set([...defaultCategories, ...customNames])
    return Array.from(set)
  }, [customCategories])

  // Resolve metadados de uma categoria
  const getMeta = useCallback(
    (name) => {
      return resolveMeta(name, customCategories)
    },
    [customCategories]
  )

  // Adiciona nova categoria
  const addCategory = useCallback(
    async ({ name, iconName = 'Tag', color = '#475569', bg = '#f1f5f9' }) => {
      const trimmed = name.trim()
      if (!trimmed) return { error: 'O nome da categoria não pode ser vazio.' }

      const exists = allCategoryNames.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      )
      if (exists) {
        return { error: 'Já existe uma categoria com este nome.' }
      }

      const newCat = {
        id: generateUUID(),
        name: trimmed,
        iconName,
        color,
        bg,
        createdAt: new Date().toISOString()
      }

      // Atualização otimista local
      setCustomCategories((prev) => [...prev, newCat])

      // Persiste no Supabase
      if (supabase && userId && userId !== 'default') {
        try {
          const { data, error } = await supabase
            .from('custom_categories')
            .insert({
              id: newCat.id,
              user_id: userId,
              name: newCat.name,
              icon_name: newCat.iconName,
              color: newCat.color,
              bg: newCat.bg
            })
            .select()
            .single()

          if (error) {
            console.error('Erro ao salvar categoria no Supabase:', error)
            // Reverte em caso de erro
            setCustomCategories((prev) => prev.filter((c) => c.id !== newCat.id))
            return { error: 'Não foi possível salvar na nuvem: ' + error.message }
          }

          if (data) {
            const confirmed = {
              id: data.id,
              name: data.name,
              iconName: data.icon_name || 'Tag',
              color: data.color || '#475569',
              bg: data.bg || '#f1f5f9',
              createdAt: data.created_at
            }
            setCustomCategories((prev) =>
              prev.map((c) => (c.id === newCat.id ? confirmed : c))
            )
            return { success: true, category: confirmed }
          }
        } catch (err) {
          console.error('Falha de conexão ao salvar categoria:', err)
          setCustomCategories((prev) => prev.filter((c) => c.id !== newCat.id))
          return { error: 'Erro de conexão ao salvar categoria.' }
        }
      }

      return { success: true, category: newCat }
    },
    [allCategoryNames, userId]
  )

  // Exclui categoria personalizada
  const deleteCategory = useCallback(
    async (categoryIdOrName) => {
      const toRemove = customCategories.find(
        (c) => c.id === categoryIdOrName || c.name.toLowerCase() === categoryIdOrName.toLowerCase()
      )
      if (!toRemove) return

      // Remoção otimista local
      setCustomCategories((prev) => prev.filter((c) => c.id !== toRemove.id))

      // Persiste no Supabase
      if (supabase && userId && userId !== 'default') {
        try {
          const { error } = await supabase
            .from('custom_categories')
            .delete()
            .eq('id', toRemove.id)
            .eq('user_id', userId)

          if (error) {
            console.error('Erro ao remover categoria no Supabase:', error)
            setCustomCategories((prev) => [...prev, toRemove])
          }
        } catch (err) {
          console.error('Falha de conexão ao remover categoria:', err)
          setCustomCategories((prev) => [...prev, toRemove])
        }
      }
    },
    [customCategories, userId]
  )

  return (
    <CategoryContext.Provider
      value={{
        categories: allCategoryNames,
        defaultCategories,
        customCategories,
        getMeta,
        addCategory,
        deleteCategory,
        refreshCategories: fetchAndSyncCategories
      }}
    >
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategories() {
  const ctx = useContext(CategoryContext)
  if (!ctx) {
    return {
      categories: defaultCategories,
      defaultCategories,
      customCategories: [],
      getMeta: (name) => resolveMeta(name, []),
      addCategory: async () => ({ error: 'Provider not initialized' }),
      deleteCategory: async () => {},
      refreshCategories: async () => {}
    }
  }
  return ctx
}
