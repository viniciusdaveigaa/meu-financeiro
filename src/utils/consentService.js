import { supabase } from '../supabase'
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  REQUIRES_NEW_CONSENT
} from '../constants/legalDocuments'

const CONSENT_STORAGE_PREFIX = 'sc_user_consent'

/**
 * Verifica se o usuário autenticado já aceitou a versão vigente dos Termos e Privacidade.
 * Prioriza a verificação direta no banco Supabase para sincronização entre dispositivos.
 */
export async function checkUserConsentStatus(userId) {
  if (!userId) return { hasValidConsent: true, latestConsent: null }

  try {
    // 1. Tenta consulta no Supabase (Fonte primária sincronizada na nuvem)
    const { data, error } = await supabase
      .from('user_consents')
      .select('terms_version, privacy_version, accepted_at')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) {
      const latest = data[0]
      const isValid =
        latest.terms_version === CURRENT_TERMS_VERSION &&
        latest.privacy_version === CURRENT_PRIVACY_VERSION

      // Atualiza cache local sincronizado
      try {
        localStorage.setItem(
          `${CONSENT_STORAGE_PREFIX}_${userId}`,
          JSON.stringify(latest)
        )
      } catch {}

      return {
        hasValidConsent: !REQUIRES_NEW_CONSENT || isValid,
        latestConsent: latest,
        isUpdatePrompt: Boolean(latest && !isValid)
      }
    }

    // Se o banco retornou vazio (primeiro acesso) e não foi erro de tabela ausente
    if (!error && data && data.length === 0) {
      return {
        hasValidConsent: false,
        latestConsent: null,
        isUpdatePrompt: false
      }
    }
  } catch (err) {
    console.warn('user_consents table query warning:', err)
  }

  // 2. Fallback de contingência no localStorage caso o banco esteja inacessível ou sem migração
  try {
    const raw = localStorage.getItem(`${CONSENT_STORAGE_PREFIX}_${userId}`)
    if (raw) {
      const localConsent = JSON.parse(raw)
      const isValid =
        localConsent.terms_version === CURRENT_TERMS_VERSION &&
        localConsent.privacy_version === CURRENT_PRIVACY_VERSION

      return {
        hasValidConsent: !REQUIRES_NEW_CONSENT || isValid,
        latestConsent: localConsent,
        isUpdatePrompt: Boolean(localConsent && !isValid)
      }
    }
  } catch {}

  return {
    hasValidConsent: false,
    latestConsent: null,
    isUpdatePrompt: false
  }
}

/**
 * Registra o consentimento formal e imutável do usuário no banco de dados e localmente.
 */
export async function recordUserConsent(userId) {
  if (!userId) return { success: false, error: 'Usuário não autenticado.' }

  const consentRecord = {
    user_id: userId,
    terms_version: CURRENT_TERMS_VERSION,
    privacy_version: CURRENT_PRIVACY_VERSION,
    accepted_at: new Date().toISOString(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
  }

  let dbSuccess = false

  try {
    const { error } = await supabase.from('user_consents').insert(consentRecord)
    if (!error) {
      dbSuccess = true
    } else {
      console.warn('user_consents insert error (fallback to local):', error.message)
    }
  } catch (err) {
    console.warn('user_consents insert exception:', err)
  }

  // Persiste no cache local de qualquer forma
  try {
    localStorage.setItem(
      `${CONSENT_STORAGE_PREFIX}_${userId}`,
      JSON.stringify(consentRecord)
    )
  } catch {}

  window.dispatchEvent(new Event('consent-updated'))
  return { success: true, dbSuccess, consentRecord }
}

