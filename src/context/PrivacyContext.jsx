import { createContext, useCallback, useContext, useState } from 'react'

const STORAGE_KEY = 'sc_privacy_mode'
const PrivacyContext = createContext({ hidden: false, toggle: () => {} })

export function PrivacyProvider({ children }) {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        /* armazenamento indisponível */
      }
      return next
    })
  }, [])

  return <PrivacyContext.Provider value={{ hidden, toggle }}>{children}</PrivacyContext.Provider>
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}

