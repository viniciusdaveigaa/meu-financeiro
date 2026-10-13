import { useState, useEffect, useRef, useMemo } from 'react'
import { AlertCircle, Bookmark, CreditCard, PiggyBank, Plus, Target } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { configured, supabase } from './supabase'
import { PrivacyProvider } from './context/PrivacyContext'
import { CategoryProvider, useCategories } from './context/CategoryContext'
import { DialogProvider, useAppDialog } from './components/Dialog'
import { Auth } from './components/Auth'
import { Header } from './components/Header'
import { MonthPicker } from './components/MonthPicker'
import { MetricCards } from './components/MetricCards'
import { FinancialPulse } from './components/FinancialPulse'
import { FlowChart } from './components/FlowChart'
import { CategoryBreakdown } from './components/CategoryBreakdown'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { BudgetPanel } from './components/BudgetPanel'
import { SavingsPanel, prefetchSavings } from './components/SavingsPanel'
import { AdvancedPanel } from './components/AdvancedPanel'
import { CategoryManager } from './components/CategoryManager'
import { UsageGuide } from './components/UsageGuide'
import { SettingsModal } from './components/SettingsModal'
import { PrivacyTermsModal } from './components/PrivacyTermsModal'
import { ThemeCustomizationModal } from './components/ThemeCustomizationModal'
import { ConsentPromptModal } from './components/ConsentPromptModal'
import { NewsPopup } from './components/NewsPopup'
import { NewsHistoryModal } from './components/NewsHistoryModal'
import { SignOutScreen } from './components/SignOutScreen'
import { MobileNav } from './components/MobileNav'
import { Logo } from './components/ui'
import { checkUserConsentStatus, recordUserConsent } from './utils/consentService'
import {
  fetchAppUpdates,
  markUpdateAsRead,
  markAllUpdatesAsRead
} from './utils/updatesService'
import { syncUserTheme } from './utils/theme'

import {
  getMonthKey,
  getMonthRange,
  changeMonth,
  dateInMonth,
  greeting
} from './utils/formatters'
import { getSavedAccountLogos, resolveBankLogo } from './constants/bankLogos'

function calculateTotal(items, type) {
  return items
    .filter((item) => item.type === type && item.affects_balance !== false)
    .reduce((sum, item) => sum + Number(item.amount), 0)
}

function MainDashboard({ session, onSignOut }) {
  const dialog = useAppDialog()
  const { categories } = useCategories()

  // App tabs: 'dashboard' | 'transactions' | 'planning' | 'guide'
  const [activeTab, setActiveTab] = useState('dashboard')
  const [planningSubTab, setPlanningSubTab] = useState('budgets') // 'budgets' | 'savings' | 'accounts' | 'categories'
  const [visitedPlanningTabs, setVisitedPlanningTabs] = useState(() => new Set(['budgets']))
  const [month, setMonth] = useState(getMonthKey(new Date()))

  useEffect(() => {
    setVisitedPlanningTabs((prev) => {
      if (prev.has(planningSubTab)) return prev
      const next = new Set(prev)
      next.add(planningSubTab)
      return next
    })
  }, [planningSubTab])

  // Data states
  const [entries, setEntries] = useState([])
  const [allEntries, setAllEntries] = useState([])
  const [budgets, setBudgets] = useState([])
  const [accounts, setAccounts] = useState([])
  const [recurring, setRecurring] = useState([])
  const [budgetReady, setBudgetReady] = useState(true)
  const [advancedReady, setAdvancedReady] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modal, setModal] = useState(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false)
  const [userName, setUserName] = useState(() => session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '')

  // Consent & Terms gate states
  const [consentRequired, setConsentRequired] = useState(false)
  const [isConsentUpdate, setIsConsentUpdate] = useState(false)
  const [previousConsent, setPreviousConsent] = useState(null)

  // News and Updates system states
  const [newsPopupOpen, setNewsPopupOpen] = useState(false)
  const [newsHistoryOpen, setNewsHistoryOpen] = useState(false)
  const [appUpdates, setAppUpdates] = useState([])
  const [unreadNewsCount, setUnreadNewsCount] = useState(0)

  // Sincronização do Consentimento
  useEffect(() => {
    if (!session?.user?.id) return

    let isMounted = true
    const checkConsent = async () => {
      try {
        const status = await checkUserConsentStatus(session.user.id)
        if (!isMounted) return
        if (!status.hasValidConsent) {
          setConsentRequired(true)
          setIsConsentUpdate(Boolean(status.isUpdatePrompt))
          setPreviousConsent(status.latestConsent)
        } else {
          setConsentRequired(false)
        }
      } catch (err) {
        console.error('Erro ao verificar consentimento:', err)
      }
    }

    checkConsent()

    const onConsentChanged = () => checkConsent()
    window.addEventListener('consent-updated', onConsentChanged)
    return () => {
      isMounted = false
      window.removeEventListener('consent-updated', onConsentChanged)
    }
  }, [session?.user?.id])

  const handleAcceptConsent = async () => {
    if (!session?.user?.id) return
    await recordUserConsent(session.user.id)
    setConsentRequired(false)
  }

  // Sincronização de preferências de tema do usuário entre dispositivos
  useEffect(() => {
    if (session?.user?.id) {
      syncUserTheme(session.user.id)
    }
  }, [session?.user?.id])

  // Sincronização de Novidades
  const loadNews = async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetchAppUpdates(session.user.id)
      setAppUpdates(res.updates)
      setUnreadNewsCount(res.unreadCount)
    } catch (err) {
      console.error('Erro ao carregar novidades:', err)
    }
  }

  useEffect(() => {
    loadNews()

    const onNewsChanged = () => loadNews()
    window.addEventListener('news-updated', onNewsChanged)
    return () => {
      window.removeEventListener('news-updated', onNewsChanged)
    }
  }, [session?.user?.id])

  const handleMarkUpdateAsRead = async (updateId) => {
    if (!session?.user?.id) return
    await markUpdateAsRead(session.user.id, updateId)
    setAppUpdates((prev) =>
      prev.map((u) => (u.id === updateId ? { ...u, isRead: true } : u))
    )
    setUnreadNewsCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllUpdatesAsRead = async () => {
    if (!session?.user?.id || !appUpdates.length) return
    const ids = appUpdates.map((u) => u.id)
    await markAllUpdatesAsRead(session.user.id, ids)
    setAppUpdates((prev) => prev.map((u) => ({ ...u, isRead: true })))
    setUnreadNewsCount(0)
  }

  const loadConfig = async () => {
    if (!session?.user?.id) return
    try {
      const [accountsRes, recurringRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at'),
        supabase
          .from('recurring_transactions')
          .select('*')
          .order('created_at', { ascending: false })
      ])

      setAdvancedReady(!accountsRes.error && !recurringRes.error)
      if (!accountsRes.error) {
        const localLogos = getSavedAccountLogos(session.user.id)
        const accountsWithLogos = (accountsRes.data || []).map((acc) => ({
          ...acc,
          logo: acc.logo || localLogos[acc.id] || resolveBankLogo('', acc.name, acc.kind).id
        }))
        setAccounts(accountsWithLogos)
      }
      if (!recurringRes.error) {
        setRecurring(recurringRes.data || [])
      }
    } catch {}
  }

  useEffect(() => {
    if (!session?.user?.id) return
    const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name
    if (metaName) setUserName(metaName)

    supabase
      .from('profiles')
      .select('name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) {
          setUserName(data.name)
        } else if (metaName) {
          supabase
            .from('profiles')
            .upsert({ id: session.user.id, name: metaName })
            .catch(() => {})
        }
      })

    // Carrega contas e regras de recorrência na inicialização
    loadConfig()

    // Pré-carrega caixinhas em segundo plano para abertura instantânea (0ms)
    const prefetchTimer = setTimeout(() => {
      prefetchSavings()
    }, 800)

    return () => clearTimeout(prefetchTimer)
  }, [session?.user?.id])

  const loadSeqRef = useRef(0)

  const loadData = async (refreshConfig = false) => {
    const seq = ++loadSeqRef.current
    setLoading(true)
    setLoadError('')
    const range = getMonthRange(month)
    // Busca os últimos 12 meses trazendo apenas as colunas essenciais para o gráfico histórico
    const twelveMonthsAgo = `${changeMonth(month, -11)}-01`

    try {
      const [
        monthlyRes,
        historicRes,
        budgetRes
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .gte('date', range.from)
          .lte('date', range.to)
          .order('date', { ascending: false }),
        supabase
          .from('transactions')
          .select('id, date, type, amount, affects_balance, category')
          .gte('date', twelveMonthsAgo)
          .lte('date', range.to)
          .order('date', { ascending: true }),
        supabase
          .from('budgets')
          .select('*')
          .eq('month', `${month}-01`)
      ])

      if (seq !== loadSeqRef.current) return

      if (monthlyRes.error || historicRes.error) {
        setLoadError('Não foi possível carregar as informações do mês. Tente novamente.')
      }

      if (!monthlyRes.error) setEntries(monthlyRes.data || [])
      if (!historicRes.error) {
        setAllEntries([
          ...(historicRes.data || []),
          { date: range.to, type: 'marker', amount: 0 }
        ])
      }

      if (budgetRes.error) {
        setBudgetReady(false)
        setBudgets([])
      } else {
        setBudgetReady(true)
        setBudgets(budgetRes.data || [])
      }

      if (refreshConfig) {
        loadConfig()
      }
    } catch {
      if (seq === loadSeqRef.current) {
        setLoadError('Não foi possível conectar ao banco de dados.')
      }
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [month])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [activeTab])

  useEffect(() => {
    const handleFinanceRefresh = () => {
      loadData()
      loadConfig()
    }
    const handleConfigRefresh = () => {
      loadConfig()
    }

    window.addEventListener('finance-data-changed', handleFinanceRefresh)
    window.addEventListener('account-logos-changed', handleConfigRefresh)
    window.addEventListener('recurring-data-changed', handleConfigRefresh)
    return () => {
      window.removeEventListener('finance-data-changed', handleFinanceRefresh)
      window.removeEventListener('account-logos-changed', handleConfigRefresh)
      window.removeEventListener('recurring-data-changed', handleConfigRefresh)
    }
  }, [month])

  // Keyboard shortcut 'N' for new transaction
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.querySelector('.dialog-backdrop') || document.querySelector('.modal-backdrop')) return
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setModal({})
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculations
  const incomes = useMemo(() => calculateTotal(entries, 'income'), [entries])
  const expenses = useMemo(() => calculateTotal(entries, 'expense'), [entries])

  const previousKey = changeMonth(month, -1)
  const previousEntries = useMemo(() => {
    return allEntries.filter((item) => item.date?.startsWith(previousKey))
  }, [allEntries, previousKey])
  const previousIncomes = useMemo(() => calculateTotal(previousEntries, 'income'), [previousEntries])
  const previousExpenses = useMemo(() => calculateTotal(previousEntries, 'expense'), [previousEntries])

  const allKnownCategories = useMemo(() => {
    const fromEntries = entries.map((e) => e.category).filter(Boolean)
    return Array.from(new Set([...categories, ...fromEntries]))
  }, [categories, entries])

  const expensesByCategory = useMemo(() => {
    return Object.fromEntries(
      allKnownCategories.map((cat) => [
        cat,
        entries
          .filter(
            (item) =>
              item.type === 'expense' &&
              item.affects_balance !== false &&
              item.category === cat
          )
          .reduce((sum, item) => sum + Number(item.amount), 0)
      ])
    )
  }, [entries, allKnownCategories])

  const groupedCategories = useMemo(() => {
    return allKnownCategories
      .map((cat) => ({ category: cat, amount: expensesByCategory[cat] || 0 }))
      .filter((item) => item.amount > 0)
  }, [allKnownCategories, expensesByCategory])

  // Save transaction handler
  const saveTransaction = async (draft) => {
    const isCreditPurchase = draft.type === 'expense' && draft.payment_method === 'credit'
    const affectsBalance = isCreditPurchase ? false : (draft.affects_balance !== false)

    const payload = {
      type: draft.type,
      description: draft.description,
      amount: draft.amount,
      category: draft.category,
      date: draft.date,
      affects_balance: affectsBalance,
      show_in_statement: draft.show_in_statement !== false,
      payment_method: draft.payment_method || null,
      invoice_month: isCreditPurchase ? (draft.invoice_month || draft.date.slice(0, 7)) : null
    }

    if (advancedReady) {
      payload.account_id = draft.account_id || null
    }

    // Fallback gracioso caso colunas novas ainda não tenham sido migradas no Supabase
    const safeInsert = async (table, rows) => {
      let res = await supabase.from(table).insert(rows)
      if (res.error && (res.error.message?.includes('payment_method') || res.error.message?.includes('invoice_month') || res.error.message?.includes('show_in_statement'))) {
        const cleanRows = Array.isArray(rows)
          ? rows.map(({ payment_method, invoice_month, show_in_statement, ...rest }) => rest)
          : (({ payment_method, invoice_month, show_in_statement, ...rest }) => rest)(rows)
        res = await supabase.from(table).insert(cleanRows)
      }
      return res
    }

    const safeUpdate = async (table, data, matchCol, matchVal) => {
      let res = await supabase.from(table).update(data).eq(matchCol, matchVal)
      if (res.error && (res.error.message?.includes('payment_method') || res.error.message?.includes('invoice_month') || res.error.message?.includes('show_in_statement'))) {
        const { payment_method, invoice_month, show_in_statement, ...rest } = data
        res = await supabase.from(table).update(rest).eq(matchCol, matchVal)
      }
      return res
    }

    let result

    // 1. Existing transaction being changed to installments
    if (
      draft.id &&
      draft.installment &&
      !draft.installment_group_id &&
      Number(draft.installments) > 1
    ) {
      const startMonth = draft.start_month || draft.date.slice(0, 7)
      const day = Number(draft.date.slice(-2))
      const groupId = crypto.randomUUID()
      const installmentData = {
        installment_group_id: groupId,
        installment_number: 1,
        installment_total: Number(draft.installments),
        date: dateInMonth(startMonth, day),
        invoice_month: isCreditPurchase ? (draft.invoice_month || startMonth) : null
      }

      result = await safeUpdate('transactions', { ...payload, ...installmentData }, 'id', draft.id)

      if (!result.error) {
        const futureRows = Array.from(
          { length: Number(draft.installments) - 1 },
          (_, idx) => ({
            ...payload,
            user_id: session.user.id,
            date: dateInMonth(changeMonth(startMonth, idx + 1), day),
            invoice_month: isCreditPurchase ? changeMonth(draft.invoice_month || startMonth, idx + 1) : null,
            installment_group_id: groupId,
            installment_number: idx + 2,
            installment_total: Number(draft.installments)
          })
        )
        result = await safeInsert('transactions', futureRows)
      }
    }
    // 2. Existing simple edit
    else if (draft.id) {
      result = await safeUpdate('transactions', payload, 'id', draft.id)
    }
    // 3. New transaction with installments
    else if (advancedReady && Number(draft.installments) > 1) {
      const startMonth = draft.start_month || draft.date.slice(0, 7)
      const day = Number(draft.date.slice(-2))
      const groupId = crypto.randomUUID()
      const rows = Array.from({ length: Number(draft.installments) }, (_, idx) => ({
        ...payload,
        user_id: session.user.id,
        date: dateInMonth(changeMonth(startMonth, idx), day),
        invoice_month: isCreditPurchase ? changeMonth(draft.invoice_month || startMonth, idx) : null,
        installment_group_id: groupId,
        installment_number: idx + 1,
        installment_total: Number(draft.installments)
      }))
      result = await safeInsert('transactions', rows)
    }
    // 4. Regular new transaction
    else {
      if (draft.start_month && draft.start_month !== draft.date?.slice(0, 7)) {
        payload.date = dateInMonth(draft.start_month, Number(draft.date.slice(-2)))
      }
      result = await safeInsert('transactions', { ...payload, user_id: session.user.id })
    }

    // Handle recurring series if checked
    if (!result.error && advancedReady && draft.recurring) {
      const recurringPayload = {
        user_id: session.user.id,
        type: draft.type,
        description: draft.description,
        amount: draft.amount,
        category: draft.category,
        account_id: draft.account_id || null,
        day_of_month: Number(draft.date.slice(-2)),
        start_date: draft.date,
        last_generated_month: `${draft.date.slice(0, 7)}-01`,
        active: true
      }

      let existingQuery = supabase
        .from('recurring_transactions')
        .select('id')
        .eq('type', draft.type)
        .eq('description', draft.description)
        .eq('amount', draft.amount)
        .eq('category', draft.category)
        .eq('day_of_month', recurringPayload.day_of_month)
        .limit(1)

      existingQuery = draft.account_id
        ? existingQuery.eq('account_id', draft.account_id)
        : existingQuery.is('account_id', null)

      const { data: existingRecurring, error: recurringLookupError } =
        await existingQuery.maybeSingle()

      if (recurringLookupError) {
        await dialog.alert(
          'O lançamento foi salvo, mas não foi possível verificar a recorrência.',
          { title: 'Atenção na Recorrência' }
        )
      } else {
        const recurringResult = existingRecurring
          ? await supabase
              .from('recurring_transactions')
              .update(recurringPayload)
              .eq('id', existingRecurring.id)
          : await supabase.from('recurring_transactions').insert(recurringPayload)

        if (recurringResult.error) {
          await dialog.alert(
            'O lançamento foi salvo, mas a repetição mensal não pôde ser cadastrada.',
            { title: 'Atenção' }
          )
        } else {
          window.dispatchEvent(new Event('recurring-data-changed'))
        }
      }
    }

    if (result.error) {
      return dialog.alert(result.error.message, { title: 'Lançamento não salvo' })
    }

    setModal(null)
    loadData()
  }

  // Remove transaction handler
  const removeTransaction = async (item) => {
    let recurringQuery = supabase
      .from('recurring_transactions')
      .select('id')
      .eq('type', item.type)
      .eq('description', item.description)
      .eq('amount', item.amount)
      .eq('category', item.category)
      .eq('day_of_month', Number(item.date.slice(-2)))

    recurringQuery = item.account_id
      ? recurringQuery.eq('account_id', item.account_id)
      : recurringQuery.is('account_id', null)

    const { data: recurringMatches, error: recurringLookupError } =
      await recurringQuery

    if (recurringLookupError) {
      return dialog.alert(
        'Não foi possível verificar a recorrência deste lançamento.',
        { title: 'Erro de exclusão' }
      )
    }

    const removesSeries = Boolean(recurringMatches?.length)
    const message = removesSeries
      ? 'Esta movimentação e sua repetição mensal serão excluídas. Os lançamentos de outros meses serão mantidos no histórico.'
      : `O lançamento “${item.description}” será excluído permanentemente.`

    const confirmed = await dialog.confirm(message, {
      title: removesSeries
        ? 'Excluir lançamento e recorrência?'
        : 'Excluir lançamento?',
      confirmLabel: 'Sim, excluir'
    })

    if (!confirmed) return

    if (removesSeries) {
      const { error: recurringError } = await supabase
        .from('recurring_transactions')
        .delete()
        .in('id', recurringMatches.map((m) => m.id))

      if (recurringError) {
        return dialog.alert(recurringError.message, {
          title: 'Recorrência não excluída'
        })
      }
    }

    const { error } = await supabase.from('transactions').delete().eq('id', item.id)
    if (error) {
      return dialog.alert(error.message, { title: 'Lançamento não excluído' })
    }

    if (modal?.id === item.id) {
      setModal(null)
    }

    if (removesSeries) {
      window.dispatchEvent(new Event('recurring-data-changed'))
    }
    loadData()
  }

  // Save budgets handler
  const saveBudgets = async (draft) => {
    const rows = Object.entries(draft)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([category, amount]) => ({
        user_id: session.user.id,
        month: `${month}-01`,
        category,
        amount: Number(amount)
      }))

    if (rows.length) {
      const { error } = await supabase
        .from('budgets')
        .upsert(rows, { onConflict: 'user_id,month,category' })
      if (error) {
        await dialog.alert(error.message, { title: 'Orçamentos não salvos' })
        return false
      }
    }

    const activeCategories = new Set(rows.map((r) => r.category))
    const removedIds = budgets
      .filter((b) => !activeCategories.has(b.category))
      .map((b) => b.id)

    if (removedIds.length) {
      const { error } = await supabase.from('budgets').delete().in('id', removedIds)
      if (error) {
        await dialog.alert(error.message, { title: 'Erro ao atualizar orçamentos' })
        return false
      }
    }

    await loadData()
    return true
  }

  const displayName = userName?.trim() || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'você'
  const userFirstName = displayName.split(' ')[0]

  return (
    <div className="app-shell-modern">
      {/* Topbar Header */}
      <Header
        email={session.user.email}
        userName={displayName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewTransaction={() => setModal({})}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
        onOpenCustomization={() => setCustomizationModalOpen(true)}
        unreadNewsCount={unreadNewsCount}
        onOpenNewsPopup={() => setNewsPopupOpen(true)}
        onOpenNewsHistory={() => setNewsHistoryOpen(true)}
        onSignOut={onSignOut}
      />

      {/* Main Content Body */}
      <main className="app-main-content">
        {/* If Guide Tab */}
        {activeTab === 'guide' ? (
          <UsageGuide
            onGoToDashboard={() => setActiveTab('dashboard')}
            onNavigateTab={setActiveTab}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenCustomization={() => setCustomizationModalOpen(true)}
            onOpenPrivacy={() => setPrivacyModalOpen(true)}
            onOpenNews={() => setNewsHistoryOpen(true)}
            onNewTransaction={() => setModal({})}
          />
        ) : (
          <>
            {/* Top Period Selector Bar */}
            <section className="dashboard-control-hero">
              <div className="hero-text-block">
                <span className="hero-eyebrow">
                  {activeTab === 'planning'
                    ? 'Planejamento Financeiro'
                    : activeTab === 'transactions'
                    ? 'Extrato Detalhado'
                    : 'Painel Financeiro'}
                </span>
                <h1 className="hero-heading">
                  {activeTab === 'planning' ? (
                    'Metas, Caixinhas e Orçamentos'
                  ) : activeTab === 'transactions' ? (
                    'Extrato de Transações'
                  ) : (
                    <>
                      {greeting()},{' '}
                      <span
                        className="user-highlight clickable-user-name"
                        onClick={() => setPrivacyModalOpen(true)}
                        role="button"
                        tabIndex={0}
                        title="Clique para ver a Política de Privacidade e Termos de Uso"
                      >
                        {userFirstName}
                      </span>
                    </>
                  )}
                </h1>
                <p className="hero-subtext">
                  {activeTab === 'planning'
                    ? 'Defina limites de gastos, acompanhe metas de economia e organize suas contas fixas.'
                    : activeTab === 'transactions'
                    ? 'Consulte, filtre e gerencie todas as suas movimentações financeiras do mês.'
                    : 'Resumo das suas receitas, despesas e metas em tempo real.'}
                </p>
              </div>

              {/* Oculta o seletor de mês na aba de Planejamento */}
              {activeTab !== 'planning' && (
                <div className="hero-actions-block">
                  <MonthPicker month={month} onChange={setMonth} />
                </div>
              )}
            </section>

            {/* Error Banner */}
            {loadError && (
              <div className="alert-banner-error" role="alert">
                <AlertCircle size={18} />
                <span>{loadError}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={loadData}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* TAB 1: VISÃO GERAL */}
            {activeTab === 'dashboard' && (
              <div className="tab-dashboard-layout">
                {/* Metric Cards KPI */}
                <MetricCards
                  incomes={incomes}
                  expenses={expenses}
                  previousIncomes={previousIncomes}
                  previousExpenses={previousExpenses}
                />

                {/* Financial Health / Pulse */}
                <FinancialPulse
                  month={month}
                  incomes={incomes}
                  expenses={expenses}
                  previousExpenses={previousExpenses}
                  budgets={budgets}
                  expensesByCategory={expensesByCategory}
                />

                {/* Charts Grid */}
                <section className="dashboard-analytics-grid">
                  <FlowChart
                    entries={allEntries}
                    month={month}
                    onSelectMonth={(targetMonth) => setMonth(targetMonth)}
                    onResetMonth={() => setMonth(getMonthKey(new Date()))}
                  />
                  <CategoryBreakdown grouped={groupedCategories} />
                </section>

                {/* Quick Transactions Preview */}
                <section className="dashboard-recent-grid">
                  <TransactionList
                    entries={entries}
                    accounts={accounts}
                    loading={loading}
                    onEdit={setModal}
                    onRemove={removeTransaction}
                    onAddNew={() => setModal({})}
                    compact={true}
                    limit={6}
                    onViewAll={() => setActiveTab('transactions')}
                    month={month}
                  />
                </section>
              </div>
            )}

            {/* TAB 2: TRANSAÇÕES / EXTRATO COMPLETO */}
            {activeTab === 'transactions' && (
              <section className="view-section-full">
                <TransactionList
                  entries={entries}
                  accounts={accounts}
                  loading={loading}
                  onEdit={setModal}
                  onRemove={removeTransaction}
                  onAddNew={() => setModal({})}
                  compact={false}
                  month={month}
                />
              </section>
            )}

            {/* TAB 3: PLANEJAMENTO (MELHORADA COM SUB-NAVEGAÇÃO LIMPA) */}
            {activeTab === 'planning' && (
              <section className="planning-view-wrapper">
                {/* Sub tabs for clean planning navigation */}
                <div className="planning-subnav-bar">
                  <button
                    type="button"
                    className={`planning-subnav-btn ${planningSubTab === 'budgets' ? 'active' : ''}`}
                    onClick={() => setPlanningSubTab('budgets')}
                  >
                    <Target size={16} />
                    <span>Orçamentos ({budgets.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`planning-subnav-btn ${planningSubTab === 'savings' ? 'active' : ''}`}
                    onClick={() => setPlanningSubTab('savings')}
                  >
                    <PiggyBank size={16} />
                    <span>Caixinhas de Reserva</span>
                  </button>
                  <button
                    type="button"
                    className={`planning-subnav-btn ${planningSubTab === 'accounts' ? 'active' : ''}`}
                    onClick={() => setPlanningSubTab('accounts')}
                  >
                    <CreditCard size={16} />
                    <span>Contas e Recorrências</span>
                  </button>
                  <button
                    type="button"
                    className={`planning-subnav-btn ${planningSubTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setPlanningSubTab('categories')}
                  >
                    <Bookmark size={16} />
                    <span>Categorias</span>
                  </button>
                </div>

                <div className="planning-subtab-content">
                  {visitedPlanningTabs.has('budgets') && (
                    <div style={{ display: planningSubTab === 'budgets' ? 'block' : 'none' }}>
                      <BudgetPanel
                        month={month}
                        budgets={budgets}
                        expensesByCategory={expensesByCategory}
                        onSave={saveBudgets}
                        ready={budgetReady}
                      />
                    </div>
                  )}

                  {visitedPlanningTabs.has('savings') && (
                    <div style={{ display: planningSubTab === 'savings' ? 'block' : 'none' }}>
                      <SavingsPanel userId={session?.user?.id} accounts={accounts} />
                    </div>
                  )}

                  {visitedPlanningTabs.has('accounts') && (
                    <div style={{ display: planningSubTab === 'accounts' ? 'block' : 'none' }}>
                      <AdvancedPanel
                        month={month}
                        userId={session?.user?.id}
                        initialAccounts={accounts}
                        initialRecurring={recurring}
                      />
                    </div>
                  )}

                  {visitedPlanningTabs.has('categories') && (
                    <div style={{ display: planningSubTab === 'categories' ? 'block' : 'none' }}>
                      <CategoryManager />
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Mobile Navigation & FAB */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewTransaction={() => setModal({})}
      />

      {/* Transaction Modal */}
      {modal && (
        <TransactionModal
          entry={modal.id ? modal : null}
          accounts={accounts}
          advancedReady={advancedReady}
          onClose={() => setModal(null)}
          onSave={saveTransaction}
          onDelete={removeTransaction}
        />
      )}

      {/* Settings / Profile Modal */}
      {settingsModalOpen && (
        <SettingsModal
          currentName={userName?.trim() || session.user.user_metadata?.name || ''}
          currentEmail={session.user.email}
          userId={session.user.id}
          isGoogleUser={
            session?.user?.app_metadata?.provider === 'google' ||
            session?.user?.app_metadata?.providers?.includes('google') ||
            session?.user?.identities?.some((i) => i.provider === 'google')
          }
          onClose={() => setSettingsModalOpen(false)}
          onOpenPrivacy={() => setPrivacyModalOpen(true)}
          onProfileUpdated={({ name: newN }) => {
            if (newN) {
              setUserName(newN)
            }
          }}
        />
      )}

      {/* Privacy & Terms Modal */}
      {privacyModalOpen && (
        <PrivacyTermsModal
          userId={session?.user?.id}
          onClose={() => setPrivacyModalOpen(false)}
        />
      )}

      {/* Theme Customization Modal */}
      {customizationModalOpen && (
        <ThemeCustomizationModal
          userId={session?.user?.id}
          onClose={() => setCustomizationModalOpen(false)}
        />
      )}

      {/* Consent & Terms Gate Modal (Bloqueio mandatório até aceitação explícita) */}
      {consentRequired && (
        <ConsentPromptModal
          isUpdatePrompt={isConsentUpdate}
          previousConsent={previousConsent}
          onAccept={handleAcceptConsent}
          onSignOut={onSignOut}
        />
      )}

      {/* News Quick Popup Sheet */}
      {newsPopupOpen && (
        <NewsPopup
          isOpen={true}
          onClose={() => setNewsPopupOpen(false)}
          updates={appUpdates}
          unreadCount={unreadNewsCount}
          onMarkAsRead={handleMarkUpdateAsRead}
          onMarkAllAsRead={handleMarkAllUpdatesAsRead}
          onOpenFullHistory={() => {
            setNewsPopupOpen(false)
            setNewsHistoryOpen(true)
          }}
        />
      )}

      {/* News Full History Modal */}
      {newsHistoryOpen && (
        <NewsHistoryModal
          isOpen={true}
          onClose={() => setNewsHistoryOpen(false)}
          updates={appUpdates}
          unreadCount={unreadNewsCount}
          onMarkAsRead={handleMarkUpdateAsRead}
          onMarkAllAsRead={handleMarkAllUpdatesAsRead}
        />
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <main className="loading-screen-modern">
      <div className="loading-glow" />
      <Logo light />
      <div className="loading-center-content">
        <span className="badge-pill">SINCRONIZANDO</span>
        <h1>Preparando seu painel...</h1>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" />
        </div>
      </div>
      <span className="loading-tip">Carregando seus dados com segurança</span>
    </main>
  )
}

function AppContent() {
  const [session, setSession] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const timerRef = useRef(null)

  const handleSignOut = async () => {
    setSigningOut(true)
    setTimeout(async () => {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Erro ao encerrar sessão:', err)
      } finally {
        setSession(null)
        setSigningOut(false)
      }
    }, 850)
  }

  const beginSession = (next, showTransition = true) => {
    clearTimeout(timerRef.current)
    setSession(next)
    if (!showTransition) return setTransitioning(false)
    setTransitioning(true)
    timerRef.current = setTimeout(() => setTransitioning(false), 1500)
  }

  useEffect(() => {
    if (!configured) {
      setInitialLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session) {
          setSession(data.session)
        }
      })
      .finally(() => {
        setInitialLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') {
        beginSession(null, false)
      } else if (event === 'SIGNED_IN' && next) {
        setSession(next)
        setInitialLoading(false)
      } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && next) {
        setSession(next)
      }
    })

    return () => {
      clearTimeout(timerRef.current)
      listener.subscription.unsubscribe()
    }
  }, [])

  if (!configured) {
    return (
      <main className="setup-view">
        <Logo />
        <h2>Configure as Chaves do Supabase</h2>
        <p>
          Adicione <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code>.
        </p>
      </main>
    )
  }

  if (initialLoading || transitioning) return <LoadingScreen />

  return (
    <>
      {signingOut && <SignOutScreen />}
      {session ? (
        <CategoryProvider userId={session.user.id}>
          <MainDashboard session={session} onSignOut={handleSignOut} />
        </CategoryProvider>
      ) : (
        <Auth onSession={beginSession} />
      )}
    </>
  )
}

export default function App() {
  return (
    <PrivacyProvider>
      <DialogProvider>
        <AppContent />
        <Analytics />
      </DialogProvider>
    </PrivacyProvider>
  )
}
