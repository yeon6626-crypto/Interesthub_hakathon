import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clearAuth, getStoredUser, saveUser } from '@/utils/auth'
import { flushEconomySync } from '@/utils/economySync'
import { consumePendingDiamondRefunds } from '@/utils/diamondRefunds'
import { api } from '@/api/client'
import CareerGachaModal from '@/components/CareerGachaModal'
import CareerCollection from '@/components/CareerCollection'
import CareerCardDetail from '@/components/CareerCardDetail'
import GuildTavern from '@/components/GuildTavern'
import PortfolioSmithy from '@/components/PortfolioSmithy'
import NotificationDropdown from '@/components/NotificationDropdown'
import ProfileDropdown from '@/components/ProfileDropdown'
import MapleSkillWindow from '@/components/MapleSkillWindow'
import {
  loadAcceptedQuests,
  removeAcceptedQuest,
  clearDailyAcceptedQuests,
} from '@/utils/acceptedQuests'
import {
  isLocalQuestId,
  isWeeklyQuest,
  isDailyStudyQuest,
  isDailyExerciseQuest,
  syncQuestRewardsFromCatalog,
} from '@/data/questCatalog'
import {
  loadQuestManualState,
  resetDailyQuestManualState,
  incrementStudyCount,
  incrementExerciseCount,
  markDailyQuestCompleted,
  markWeeklyQuestCompleted,
  getWeeklyQuestProgressInfo,
  isWeeklyQuestReadyToClaim,
  isDailyQuestDoneToday,
} from '@/utils/questManualState'
import {
  fileToBase64,
  verifyQuestImage,
} from '@/services/geminiQuestVerify'
import { isGeminiInCooldown } from '@/services/geminiClient'
import { applyQuestRewardsToUser } from '@/utils/questRewards'
import { fireQuestConfetti } from '@/utils/questConfetti'
import QuestVerdictModal from '@/components/QuestVerdictModal'
import CurrencyShopModal from '@/components/CurrencyShopModal'
import '@/components/CurrencyShopModal.css'
import AdminExchangePanel from '@/components/AdminExchangePanel'
import '@/components/AdminExchangePanel.css'
import { getAdminAccess } from '@/api/client'
import {
  calculateCoinExchange,
  calculateDiamondExchange,
  EXCHANGE_ALERT_MESSAGE,
  DIAMOND_EXCHANGE_ALERT_MESSAGE,
} from '@/utils/currencyExchange'
import { requestDiaPackagePayment } from '@/services/portonePayment'
import {
  hydrateUserEconomy,
  mergeUserFromApi,
  mergeUserState,
  EXP_CAP,
  COLLECTION_COMPLETE_COIN_REWARD,
  LEVEL_MILESTONE_COIN_REWARD,
} from '@/utils/userEconomy'
import {
  isCollectionComplete,
  resetCollection,
} from '@/utils/collection'
import './Dashboard.css'
import '@/components/CareerGacha.css'

const TABS = [
  { id: 'roadmap', label: '진로 로드맵 & 퀘스트' },
  { id: 'tavern', label: '모험가 선술집 (파티 매칭)' },
  { id: 'portfolio', label: '포트폴리오 제련소 (이력서)' },
  { id: 'tarot', label: '운명의 타로 덱 (진로 가챠)' },
]

const QUESTS_PER_PAGE = 3
const QUEST_PAGINATION_THRESHOLD = 4

let notificationId = 0
function createNotification(message) {
  notificationId += 1
  return {
    id: `notif-${Date.now()}-${notificationId}`,
    message,
    read: false,
  }
}

function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => hydrateUserEconomy(getStoredUser()))
  const [acceptedQuests, setAcceptedQuests] = useState([])
  const [questPage, setQuestPage] = useState(1)
  const [activeTab, setActiveTab] = useState('roadmap')
  const [notifications, setNotifications] = useState([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isGachaOpen, setIsGachaOpen] = useState(false)
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [collectionKey, setCollectionKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  /** @type {Record<string, 'idle'|'verifying'>} */
  const [questProofStatus, setQuestProofStatus] = useState({})
  /** @type {{ status: 'SUCCESS'|'FAIL', reason: string, questTitle: string, quest: object } | null} */
  const [verdictModal, setVerdictModal] = useState(null)
  const [questManualState, setQuestManualState] = useState(() =>
    loadQuestManualState(getStoredUser()?._id)
  )
  const [geminiLoadingQuestId, setGeminiLoadingQuestId] = useState(null)
  const proofInputRefs = useRef({})
  const geminiVerifyingRef = useRef(false)
  const isFinalizingQuestRef = useRef(false)
  const currencyProcessingRef = useRef(false)
  const [isCurrencyShopOpen, setIsCurrencyShopOpen] = useState(false)
  const [isCurrencyProcessing, setIsCurrencyProcessing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const dashboardTabs = useMemo(() => {
    if (!isAdmin) return TABS
    return [...TABS, { id: 'admin', label: '관리자 모드' }]
  }, [isAdmin])

  const addNotification = useCallback((message) => {
    setNotifications((prev) => [createNotification(message), ...prev])
  }, [])

  const updateUserState = useCallback((userData) => {
    setUser((prev) => {
      const next = mergeUserState(prev, userData)
      saveUser(next)
      return next
    })
  }, [])

  const adjustCoins = useCallback((delta) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = mergeUserState(prev, {
        coin: Math.max(0, (prev.coin ?? 0) + delta),
      })
      saveUser(next)
      return next
    })
  }, [])

  const handleDeductCoins = useCallback(
    (amount) => {
      adjustCoins(-amount)
    },
    [adjustCoins]
  )

  const handleDeductDiamonds = useCallback((amount) => {
    let success = false
    setUser((prev) => {
      if (!prev || (prev.gold ?? 0) < amount) return prev
      success = true
      const next = mergeUserState(prev, { gold: (prev.gold ?? 0) - amount })
      saveUser(next)
      return next
    })
    return success
  }, [])

  const handleRefundDiamonds = useCallback(
    (amount) => {
      setUser((prev) => {
        if (!prev) return prev
        const next = mergeUserState(prev, {
          gold: (prev.gold ?? 0) + amount,
        })
        saveUser(next, { skipSync: true })
        return next
      })
      void flushEconomySync()
      addNotification(
        `파티 참가비 ${amount.toLocaleString()} 다이아가 환급되었습니다.`
      )
      return true
    },
    [addNotification]
  )

  const applyPendingRefunds = useCallback(
    (baseUser) => {
      if (!baseUser?._id) return { user: baseUser, refunded: 0 }

      const pending = consumePendingDiamondRefunds(baseUser._id)
      if (pending <= 0) return { user: baseUser, refunded: 0 }

      const userWithRefund = mergeUserState(baseUser, {
        gold: (baseUser.gold ?? 0) + pending,
      })

      return { user: userWithRefund, refunded: pending }
    },
    []
  )

  const notifyLevelMilestones = useCallback(
    (milestones) => {
      milestones.forEach((level) => {
        window.alert(
          `🎖️ 축하합니다! 레벨 ${level} 달성 보상으로 ${LEVEL_MILESTONE_COIN_REWARD} 코인을 획득했습니다!`
        )
        addNotification(
          `레벨 ${level} 달성 · +${LEVEL_MILESTONE_COIN_REWARD} 코인`
        )
      })
    },
    [addNotification]
  )

  useEffect(() => {
    let cancelled = false

    async function fetchDashboard() {
      try {
        const meRes = await api.getDashboardMe()
        if (cancelled) return
        const apiUser = mergeUserFromApi(meRes.data)
        const { user: mergedUser, refunded } = applyPendingRefunds(apiUser)

        setUser(mergedUser)

        if (refunded > 0) {
          saveUser(mergedUser)
          void flushEconomySync()
          addNotification(
            `파티 참가비 ${refunded.toLocaleString()} 다이아가 환급되었습니다.`
          )
        } else {
          saveUser(mergedUser, { skipSync: true })
        }
        setAcceptedQuests(
          syncQuestRewardsFromCatalog(loadAcceptedQuests(meRes.data._id))
        )
        setQuestManualState(loadQuestManualState(meRes.data._id))

        try {
          const adminRes = await getAdminAccess()
          if (!cancelled) {
            setIsAdmin(adminRes?.data?.isAdmin === true)
          }
        } catch {
          if (!cancelled) setIsAdmin(false)
        }
      } catch (err) {
        if (!cancelled) addNotification(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [addNotification, applyPendingRefunds])

  useEffect(() => {
    if (!user?._id || location.pathname !== '/dashboard') return
    setAcceptedQuests(
      syncQuestRewardsFromCatalog(loadAcceptedQuests(user._id))
    )
  }, [location.pathname, user?._id])

  const useQuestPagination =
    acceptedQuests.length >= QUEST_PAGINATION_THRESHOLD
  const questPageCount = useQuestPagination
    ? Math.ceil(acceptedQuests.length / QUESTS_PER_PAGE)
    : 1

  const displayedQuests = useMemo(() => {
    if (!useQuestPagination) return acceptedQuests
    const start = (questPage - 1) * QUESTS_PER_PAGE
    return acceptedQuests.slice(start, start + QUESTS_PER_PAGE)
  }, [acceptedQuests, questPage, useQuestPagination])

  useEffect(() => {
    if (questPage > questPageCount) {
      setQuestPage(Math.max(1, questPageCount))
    }
  }, [questPage, questPageCount])

  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('roadmap')
    }
  }, [activeTab, isAdmin])

  const handleLogout = async () => {
    await flushEconomySync()
    clearAuth()
    navigate('/')
  }

  const handleDrawComplete = useCallback(
    (updatedUser) => {
      const collectionComplete = isCollectionComplete()

      setUser((prev) => {
        if (!prev) return prev

        let nextUser = updatedUser
          ? mergeUserState(prev, updatedUser)
          : prev

        if (collectionComplete) {
          resetCollection()
          nextUser = mergeUserState(nextUser, {
            coin: (nextUser.coin ?? 0) + COLLECTION_COMPLETE_COIN_REWARD,
          })
        }

        saveUser(nextUser)
        return nextUser
      })

      if (collectionComplete) {
        window.alert(
          `🎉 진로 카드 도감을 완성했습니다! 보상으로 ${COLLECTION_COMPLETE_COIN_REWARD.toLocaleString()} 코인이 지급되며 도감이 초기화됩니다.`
        )
        addNotification(
          `진로 카드 도감 완성 · +${COLLECTION_COMPLETE_COIN_REWARD} 코인`
        )
      } else {
        addNotification('진로 카드 뽑기 완료! 도감을 확인하세요.')
      }

      setCollectionKey((k) => k + 1)
    },
    [addNotification]
  )

  const handleToggleNotifications = () => {
    setIsProfileOpen(false)
    setIsNotificationOpen((prev) => {
      const next = !prev
      if (next) {
        setNotifications((list) =>
          list.map((n) => ({ ...n, read: true }))
        )
      }
      return next
    })
  }

  const handleDismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleToggleProfile = () => {
    setIsNotificationOpen(false)
    setIsProfileOpen((prev) => !prev)
  }

  const clearQuestProof = (questId) => {
    setQuestProofStatus((prev) => {
      if (!prev[questId]) return prev
      const next = { ...prev }
      delete next[questId]
      return next
    })
  }

  const finalizeQuestComplete = useCallback(
    async (quest) => {
      if (isFinalizingQuestRef.current) return

      isFinalizingQuestRef.current = true
      setActionLoading(quest._id)
      try {
        const questCode = quest.questCode || quest._id
        const userId = user?._id

        if (isLocalQuestId(quest._id)) {
          const { user: updatedUser, milestones } = applyQuestRewardsToUser(
            user,
            quest
          )
          updateUserState(updatedUser)
          notifyLevelMilestones(milestones)
          setAcceptedQuests(removeAcceptedQuest(userId, quest._id))
          clearQuestProof(quest._id)

          if (isDailyStudyQuest(quest)) {
            incrementStudyCount(userId)
          } else if (isDailyExerciseQuest(quest)) {
            incrementExerciseCount(userId)
          }

          if (isWeeklyQuest(quest)) {
            setQuestManualState(markWeeklyQuestCompleted(userId, questCode))
          } else {
            setQuestManualState(markDailyQuestCompleted(userId, questCode))
          }

          addNotification(
            `${quest.title} 완료! +${quest.rewardExp} EXP, +${quest.rewardCoin} Coins, +1 명성치`
          )
          return
        }

        const res = await api.completeQuest(quest._id)
        updateUserState(res.data.user)
        if (res.data.levelMilestones?.length) {
          notifyLevelMilestones(res.data.levelMilestones)
        }
        addNotification(res.message)
        setAcceptedQuests(removeAcceptedQuest(userId, quest._id))
        clearQuestProof(quest._id)
      } finally {
        setActionLoading(null)
        isFinalizingQuestRef.current = false
      }
    },
    [user, updateUserState, addNotification, notifyLevelMilestones]
  )

  const handleWeeklyQuestComplete = async (quest) => {
    if (actionLoading || isFinalizingQuestRef.current) return
    if (!isWeeklyQuestReadyToClaim(quest, questManualState)) return

    fireQuestConfetti()
    await finalizeQuestComplete(quest)
  }

  const handleProofUpload = async (questId, file) => {
    if (!file) return
    if (geminiVerifyingRef.current) return

    if (!file.type.startsWith('image/')) {
      addNotification('인증 사진은 이미지 파일만 업로드할 수 있습니다.')
      return
    }

    const quest = acceptedQuests.find((q) => q._id === questId)
    if (!quest) return

    if (isWeeklyQuest(quest)) {
      addNotification(
        '주간 퀘스트는 일일 퀘스트 누적 후 완료하기 버튼으로 보상을 받을 수 있습니다.'
      )
      return
    }

    if (isDailyQuestDoneToday(quest, questManualState)) {
      addNotification('오늘은 이미 완료한 일일 퀘스트입니다.')
      return
    }

    if (isGeminiInCooldown()) {
      addNotification(
        'Gemini API 사용 한도에 도달했습니다. 1~2분 후에 다시 시도해 주세요.'
      )
      return
    }

    geminiVerifyingRef.current = true
    setGeminiLoadingQuestId(questId)
    setQuestProofStatus((prev) => ({ ...prev, [questId]: 'verifying' }))

    try {
      const base64Data = await fileToBase64(file)
      const mimeType = file.type || 'image/jpeg'
      const result = await verifyQuestImage(
        quest.title,
        base64Data,
        mimeType,
        quest.questCode || quest._id
      )

      if (result.status === 'SUCCESS') {
        fireQuestConfetti()
      }

      setVerdictModal({
        status: result.status,
        reason: result.reason,
        questTitle: quest.title,
        quest: result.status === 'SUCCESS' ? quest : null,
      })
    } catch (err) {
      addNotification(err.message || '증거품 검증에 실패했습니다.')
    } finally {
      geminiVerifyingRef.current = false
      setGeminiLoadingQuestId(null)
      setQuestProofStatus((prev) => ({ ...prev, [questId]: 'idle' }))
    }
  }

  const handleProofFileSelected = (questId, file) => {
    if (!file || geminiVerifyingRef.current) return
    handleProofUpload(questId, file)
  }

  const handleVerdictModalSuccess = async () => {
    if (!verdictModal?.quest || isFinalizingQuestRef.current || actionLoading) {
      return
    }

    await finalizeQuestComplete(verdictModal.quest)
    setVerdictModal(null)
  }

  const handleDebugAddCoins = () => {
    adjustCoins(1000)
    addNotification('디버그: +1000 코인')
  }

  const handleDebugAddLevel = () => {
    setUser((prev) => {
      if (!prev) return prev
      const next = mergeUserState(prev, {
        level: (prev.level ?? 1) + 1,
      })
      saveUser(next)
      return next
    })
    addNotification('디버그: 레벨 +1')
  }

  const handleDebugNewDay = () => {
    const userId = user?._id
    const resetState = resetDailyQuestManualState(userId)
    const weeklyQuests = clearDailyAcceptedQuests(userId)

    geminiVerifyingRef.current = false
    isFinalizingQuestRef.current = false
    currencyProcessingRef.current = false

    setQuestManualState(resetState)
    setAcceptedQuests(syncQuestRewardsFromCatalog(weeklyQuests))
    setQuestProofStatus({})
    setGeminiLoadingQuestId(null)
    setVerdictModal(null)
    setQuestPage(1)
    setActionLoading(null)
    setIsCurrencyProcessing(false)

    addNotification(
      '디버그: 새로운 하루가 시작되었습니다. 일일 퀘스트만 초기화되었습니다. (주간 퀘스트·진행도 유지)'
    )
  }

  const handleExchange = (inputCoins) => {
    if (currencyProcessingRef.current || !user) return false

    const coinBalance = user.coin ?? 0
    const result = calculateCoinExchange(inputCoins, coinBalance)

    if (!result.ok) {
      window.alert(EXCHANGE_ALERT_MESSAGE)
      return false
    }

    currencyProcessingRef.current = true
    setIsCurrencyProcessing(true)

    try {
      updateUserState({
        ...user,
        coin: coinBalance - result.exchangedCoins,
        gold: (user.gold ?? 0) + result.diamondsGained,
      })
      addNotification(
        `환전 완료! ${result.exchangedCoins} 코인 → ${result.diamondsGained} 다이아`
      )
      return true
    } finally {
      currencyProcessingRef.current = false
      setIsCurrencyProcessing(false)
    }
  }

  const handleExchangeDiaToCoin = (inputDiamonds) => {
    if (currencyProcessingRef.current || !user) return false

    const diamondBalance = user.gold ?? 0
    const result = calculateDiamondExchange(inputDiamonds, diamondBalance)

    if (!result.ok) {
      window.alert(DIAMOND_EXCHANGE_ALERT_MESSAGE)
      return false
    }

    currencyProcessingRef.current = true
    setIsCurrencyProcessing(true)

    try {
      updateUserState({
        ...user,
        gold: diamondBalance - result.exchangedDiamonds,
        coin: (user.coin ?? 0) + result.coinsGained,
      })
      addNotification(
        `환전 완료! ${result.exchangedDiamonds} 다이아 → ${result.coinsGained} 코인`
      )
      return true
    } finally {
      currencyProcessingRef.current = false
      setIsCurrencyProcessing(false)
    }
  }

  const handleChargeDia = async (pkg) => {
    if (currencyProcessingRef.current || !user) return

    currencyProcessingRef.current = true
    setIsCurrencyProcessing(true)

    try {
      const result = await requestDiaPackagePayment(pkg, user)

      if (result.success) {
        updateUserState({
          ...user,
          gold: (user.gold ?? 0) + pkg.diamonds,
        })
        window.alert(
          `${pkg.name} 패키지 결제가 완료되어 ${pkg.diamonds} 다이아가 충전되었습니다!`
        )
        addNotification(
          `${pkg.name} 결제 완료 · +${pkg.diamonds} 다이아 충전`
        )
        return
      }

      window.alert(`결제 실패: ${result.message}`)
    } finally {
      currencyProcessingRef.current = false
      setIsCurrencyProcessing(false)
    }
  }

  const handlePaybackComplete = (economyUser) => {
    if (!economyUser) return
    updateUserState(mergeUserFromApi({ ...user, ...economyUser }))
  }

  const handleVerdictModalClose = () => {
    setVerdictModal(null)
  }

  const openProofPicker = (questId) => {
    if (geminiVerifyingRef.current) return
    proofInputRefs.current[questId]?.click()
  }

  const handleDeleteQuest = (questId) => {
    const confirmed = window.confirm('정말로 삭제하시겠습니까?')
    if (!confirmed) return

    const quest = acceptedQuests.find((q) => q._id === questId)
    setAcceptedQuests(removeAcceptedQuest(user?._id, questId))
    clearQuestProof(questId)
    addNotification(
      quest ? `'${quest.title}' 퀘스트를 삭제했습니다.` : '퀘스트를 삭제했습니다.'
    )
  }

  const expPercent = user ? Math.min(100, (user.exp / EXP_CAP) * 100) : 0

  const openGacha = () => setIsGachaOpen(true)
  const closeGacha = () => setIsGachaOpen(false)

  if (loading) {
    return (
      <div className="dashboard dashboard-loading">
        <p>모험가 데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="landing-logo">
          <span className="landing-logo-icon" aria-hidden="true">
            🔮
          </span>
          <span>Interesthub</span>
        </div>

        <div className="dashboard-header-actions">
          <NotificationDropdown
            notifications={notifications}
            isOpen={isNotificationOpen}
            onToggle={handleToggleNotifications}
            onClose={() => setIsNotificationOpen(false)}
            onDismiss={handleDismissNotification}
            onMarkAllRead={handleMarkAllRead}
          />
          <ProfileDropdown
            user={user}
            isOpen={isProfileOpen}
            onToggle={handleToggleProfile}
            onClose={() => setIsProfileOpen(false)}
            onLogout={handleLogout}
          />
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="adventurer-panel">
          <div className="panel-tab">📜 모험가 상태창</div>

          <div className="adventurer-content">
            <div className="adventurer-avatar">🧙</div>
            <h2>{user?.nickname || '모험가'}</h2>
            <p className="adventurer-title">{user?.major}</p>
            <p className="adventurer-grade">{user?.grade}</p>

            <div className="level-box">
              <div className="level-header">
                <span>
                  Level {user?.level} / {EXP_CAP} EXP
                </span>
              </div>
              <div className="exp-bar">
                <div className="exp-fill" style={{ width: `${expPercent}%` }} />
              </div>
              <p className="exp-text">
                경험치: {user?.exp} / {EXP_CAP}
              </p>
            </div>

            <div className="goal-box">
              <p className="goal-label">목표 로드맵</p>
              <p className="goal-value">{user?.targetClass}</p>
            </div>

            <div className="stats-row">
              <div className="stat-item" title="다이아 (웹 재화)">
                <span>💎</span>
                <strong>{user?.gold ?? 0}</strong>
              </div>
              <div className="stat-item" title="코인 (현물성 재화)">
                <span>💰</span>
                <strong>{user?.coin ?? 0}</strong>
              </div>
              <div className="stat-item" title="명성치">
                <span>⭐</span>
                <strong>{user?.reputation ?? 0}</strong>
              </div>
            </div>
            <p className="stats-caption">다이아 · 코인 · 명성치</p>

            <div className="adventurer-actions">
              <button
                type="button"
                className="currency-shop-open-btn"
                onClick={() => setIsCurrencyShopOpen(true)}
              >
                💎 재화 · 환급 상점
              </button>
              <button
                type="button"
                className="inventory-btn"
                onClick={() => setActiveTab('tarot')}
              >
                [진로 카드 도감]
              </button>
              <button
                type="button"
                className="profile-btn"
                onClick={() => setActiveTab('portfolio')}
              >
                [프로필 / 이력서]
              </button>
            </div>
          </div>
        </aside>

        <main className="dashboard-main">
          <nav className="dashboard-tabs">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'roadmap' && (
            <>
              <section className="roadmap-section">
                <p className="roadmap-desc">
                  AI가 학과·진로에 맞는 학년별 교과과목을 추천합니다. 스킬
                  도감에서 + 버튼으로 마스터하고 학점 포인트(SP)를 쌓으세요.
                </p>
                <button
                  type="button"
                  className="skill-tree-open-btn"
                  onClick={() => setIsSkillTreeOpen(true)}
                >
                  📖 스킬트리
                </button>
              </section>

              <section className="quests-section">
                <div className="quests-section-header">
                  <h3>Active Quests</h3>
                  <button
                    type="button"
                    className="quest-receive-btn"
                    onClick={() => navigate('/quests')}
                  >
                    퀘스트 받기
                  </button>
                </div>

                {acceptedQuests.length === 0 ? (
                  <p className="quests-empty">받은 퀘스트가 없습니다.</p>
                ) : (
                  <>
                    <ul className="accepted-quests-list">
                      {displayedQuests.map((quest) => {
                        const proofStatus =
                          questProofStatus[quest._id] || 'idle'
                        const isGeminiLoading = geminiLoadingQuestId === quest._id
                        const isProofVerifying =
                          proofStatus === 'verifying' || isGeminiLoading
                        const isQuestBusy = actionLoading === quest._id
                        const isWeekly = isWeeklyQuest(quest)
                        const isDailyDoneToday =
                          !isWeekly && isDailyQuestDoneToday(quest, questManualState)
                        const weeklyProgressInfo = isWeekly
                          ? getWeeklyQuestProgressInfo(quest, questManualState)
                          : null
                        const canCompleteWeekly =
                          isWeekly &&
                          isWeeklyQuestReadyToClaim(quest, questManualState)
                        const isAnyGeminiBusy = Boolean(geminiLoadingQuestId)

                        return (
                          <li key={quest._id} className="accepted-quest-item">
                            <div className="accepted-quest-body">
                              <p className="accepted-quest-type">
                                {quest.typeLabel}
                              </p>
                              <p className="accepted-quest-title">
                                {quest.title}
                              </p>
                              <p className="accepted-quest-reward">
                                보상: {quest.rewardLabel}
                              </p>
                              {isWeekly && weeklyProgressInfo && (
                                <p
                                  className={`quest-weekly-progress ${
                                    canCompleteWeekly
                                      ? 'quest-weekly-progress-ready'
                                      : ''
                                  }`}
                                >
                                  진행도: {weeklyProgressInfo.current} /{' '}
                                  {weeklyProgressInfo.target} 회
                                  {!canCompleteWeekly && (
                                    <span className="quest-weekly-progress-hint">
                                      {' '}
                                      (일일 {weeklyProgressInfo.metricLabel}{' '}
                                      퀘스트 완료 시 +1)
                                    </span>
                                  )}
                                </p>
                              )}
                              {isDailyDoneToday && (
                                <p className="quest-daily-done-tag" role="status">
                                  오늘 완료함
                                </p>
                              )}
                              {!isWeekly && isProofVerifying && (
                                <p
                                  className="quest-proof-message"
                                  role="status"
                                >
                                  AI 길드장이 증거품을 감정 중입니다...
                                </p>
                              )}
                            </div>
                            <div className="accepted-quest-actions">
                              <button
                                type="button"
                                className="quest-delete-btn"
                                onClick={() => handleDeleteQuest(quest._id)}
                                disabled={isQuestBusy || isProofVerifying}
                              >
                                삭제
                              </button>

                              {!isWeekly && (
                                <>
                                  <input
                                    ref={(el) => {
                                      proofInputRefs.current[quest._id] = el
                                    }}
                                    type="file"
                                    accept="image/*"
                                    className="quest-proof-input-hidden"
                                    aria-hidden="true"
                                    tabIndex={-1}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        handleProofFileSelected(quest._id, file)
                                      }
                                      e.target.value = ''
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="quest-proof-btn-dot"
                                    onClick={() => openProofPicker(quest._id)}
                                    disabled={
                                      isProofVerifying ||
                                      isQuestBusy ||
                                      isDailyDoneToday ||
                                      isAnyGeminiBusy
                                    }
                                    title="인증 사진 업로드 (AI 검증 후 자동 완료)"
                                  >
                                    {isProofVerifying || isQuestBusy
                                      ? '감정 중...'
                                      : '증거 제출'}
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                className="quest-finish-btn"
                                disabled={
                                  isWeekly
                                    ? !canCompleteWeekly || isQuestBusy
                                    : true
                                }
                                onClick={
                                  isWeekly
                                    ? () => handleWeeklyQuestComplete(quest)
                                    : undefined
                                }
                                title={
                                  isWeekly
                                    ? canCompleteWeekly
                                      ? '주간 퀘스트 보상을 받습니다'
                                      : `일일 퀘스트를 ${weeklyProgressInfo?.target ?? 5}회 완료하면 활성화됩니다`
                                    : '증거 제출 후 AI 인증이 통과되면 자동으로 완료됩니다'
                                }
                              >
                                {isQuestBusy && isWeekly
                                  ? '처리 중...'
                                  : '완료하기'}
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>

                    {useQuestPagination && (
                      <nav
                        className="quests-pagination"
                        aria-label="받은 퀘스트 페이지"
                      >
                        <button
                          type="button"
                          className="quests-pagination-btn"
                          disabled={questPage <= 1}
                          onClick={() =>
                            setQuestPage((page) => Math.max(1, page - 1))
                          }
                        >
                          이전
                        </button>
                        <span className="quests-pagination-info">
                          {questPage} / {questPageCount}
                        </span>
                        <button
                          type="button"
                          className="quests-pagination-btn"
                          disabled={questPage >= questPageCount}
                          onClick={() =>
                            setQuestPage((page) =>
                              Math.min(questPageCount, page + 1)
                            )
                          }
                        >
                          다음
                        </button>
                      </nav>
                    )}
                  </>
                )}
              </section>
            </>
          )}

          {activeTab === 'tavern' && (
            <GuildTavern
              user={user}
              gold={user?.gold ?? 0}
              onDeductDiamonds={handleDeductDiamonds}
              onRefundDiamonds={handleRefundDiamonds}
            />
          )}

          {activeTab === 'portfolio' && <PortfolioSmithy user={user} />}

          {activeTab === 'tarot' && (
            <div key={collectionKey}>
              <div className="tarot-gacha-banner">
                <p>🎲 진로 카드 가챠로 직업을 탐색하고 컬렉션에 저장하세요.</p>
                <button type="button" className="gacha-draw-btn" onClick={openGacha}>
                  🃏 카드 5장 뽑기 (500 코인)
                </button>
              </div>
              <CareerCollection onSelectCard={setSelectedCard} />
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <AdminExchangePanel onNotify={addNotification} />
          )}
        </main>
      </div>

      {isSkillTreeOpen && (
        <MapleSkillWindow
          user={user}
          onClose={() => setIsSkillTreeOpen(false)}
        />
      )}

      {isGachaOpen && (
        <CareerGachaModal
          coins={user?.coin ?? 0}
          onDeductCoins={handleDeductCoins}
          onClose={closeGacha}
          onDrawComplete={handleDrawComplete}
        />
      )}

      {selectedCard && (
        <CareerCardDetail
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      <QuestVerdictModal
        isOpen={Boolean(verdictModal)}
        status={verdictModal?.status}
        reason={verdictModal?.reason}
        questTitle={verdictModal?.questTitle}
        isSubmitting={Boolean(
          verdictModal?.quest && actionLoading === verdictModal.quest._id
        )}
        onConfirmSuccess={handleVerdictModalSuccess}
        onClose={handleVerdictModalClose}
      />

      <CurrencyShopModal
        isOpen={isCurrencyShopOpen}
        coinBalance={user?.coin ?? 0}
        diamondBalance={user?.gold ?? 0}
        isProcessing={isCurrencyProcessing}
        onNotify={addNotification}
        onPaybackComplete={handlePaybackComplete}
        onClose={() => setIsCurrencyShopOpen(false)}
        onExchange={handleExchange}
        onExchangeDiaToCoin={handleExchangeDiaToCoin}
        onChargeDia={handleChargeDia}
      />

      {!import.meta.env.PROD && (
        <div className="quest-debug-actions">
          <button
            type="button"
            className="quest-debug-level-btn"
            onClick={handleDebugAddLevel}
            title="디버그: 레벨 +1 (EXP 유지)"
          >
            ⬆️ 레벨 +1
          </button>
          <button
            type="button"
            className="quest-debug-coin-btn"
            onClick={handleDebugAddCoins}
            title="디버그: 보유 코인 +1000"
          >
            💰 코인 +1000
          </button>
          <button
            type="button"
            className="quest-debug-new-day-btn"
            onClick={handleDebugNewDay}
            title="디버그: 퀘스트·누적 진행도를 수동 초기화합니다"
          >
            🌅 새로운 하루 시작 (디버그)
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
