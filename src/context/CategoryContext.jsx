import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import {
  defaultCategories,
  defaultCategoryMeta,
  resolveMeta
} from '../constants/categories'

const CategoryContext = createContext(null)

const STORAGE_KEY_PREFIX = 'sc_custom_categories'

export function CategoryProvider({ children, userId = 'default' }) {
  const storageKey = `${STORAGE_KEY_PREFIX}_${userId}`

  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Salva no localStorage sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(customCategories))
    } catch {
      /* storage indisponível */
    }
  }, [customCategories, storageKey])

  // Lista consolidada de nomes de categorias
  const allCategoryNames = useMemo(() => {
    const customNames = customCategories.map((c) => c.name)
    // Combina padrões com customizadas sem duplicação
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
    ({ name, iconName = 'Tag', color = '#475569', bg = '#f1f5f9' }) => {
      const trimmed = name.trim()
      if (!trimmed) return { error: 'O nome da categoria não pode ser vazio.' }

      const exists = allCategoryNames.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      )
      if (exists) {
        return { error: 'Já existe uma categoria com este nome.' }
      }

      const newCat = {
        id: crypto.randomUUID(),
        name: trimmed,
        iconName,
        color,
        bg,
        createdAt: new Date().toISOString()
      }

      setCustomCategories((prev) => [...prev, newCat])
      return { success: true, category: newCat }
    },
    [allCategoryNames]
  )

  // Exclui categoria personalizada
  const deleteCategory = useCallback((categoryIdOrName) => {
    setCustomCategories((prev) =>
      prev.filter(
        (c) => c.id !== categoryIdOrName && c.name.toLowerCase() !== categoryIdOrName.toLowerCase()
      )
    )
  }, [])

  return (
    <CategoryContext.Provider
      value={{
        categories: allCategoryNames,
        defaultCategories,
        customCategories,
        getMeta,
        addCategory,
        deleteCategory
      }}
    >
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategories() {
  const ctx = useContext(CategoryContext)
  if (!ctx) {
    // Fallback caso seja chamado fora do provider
    return {
      categories: defaultCategories,
      defaultCategories,
      customCategories: [],
      getMeta: (name) => resolveMeta(name, []),
      addCategory: () => ({ error: 'Provider not initialized' }),
      deleteCategory: () => {}
    }
  }
  return ctx
}

