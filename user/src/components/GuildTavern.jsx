import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PARTY_ENTRY_FEE,
  addParty,
  buildDebugFakeApplicant,
  canAccessPartyChat,
  createPartyId,
  hasUserApplied,
  isPartyMember,
  isUserRejectedFromParty,
  loadParties,
  removeParty,
  updateParty,
  withRejectedUser,
} from '@/utils/guildParties'
import {
  buildResumeProfile,
  buildSampleResumeProfile,
  formatResumeBlock,
} from '@/utils/resumeProfile'
import { clearPartyMessages } from '@/utils/partyChat'
import { queueDiamondRefund } from '@/utils/diamondRefunds'
import PartyChatModal from '@/components/PartyChatModal'
import './GuildTavern.css'

const EMPTY_CREATE_FORM = {
  title: '',
  roles: '',
  targetClass: '',
}

const CONTEST_SITE_LINKS = [
  {
    id: 'linkareer',
    label: '🏆 링커리어 (IT 특화)',
    href: 'https://linkareer.com/list/contest?filter_box=8',
  },
  {
    id: 'wevity',
    label: '위비티 (최다 정보)',
    href: 'https://www.wevity.com',
  },
  {
    id: 'campuspick',
    label: '캠퍼스픽 (대학생 커뮤니티)',
    href: 'https://www.campuspick.com/activity',
  },
]

function GuildTavern({ user, gold, onDeductDiamonds, onRefundDiamonds }) {
  const [parties, setParties] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM)
  const [applicantsPartyId, setApplicantsPartyId] = useState(null)
  const [membersPartyId, setMembersPartyId] = useState(null)
  const [chatPartyId, setChatPartyId] = useState(null)
  const [showSiteMenu, setShowSiteMenu] = useState(false)
  const contestDropdownRef = useRef(null)

  const diamondBalance = gold ?? 0
  const userId = user?._id
  const userNickname = user?.nickname || '모험가'

  const refreshParties = useCallback(() => {
    setParties(loadParties())
  }, [])

  useEffect(() => {
    refreshParties()
  }, [refreshParties])

  useEffect(() => {
    if (!showSiteMenu) return undefined

    const handleClickOutside = (event) => {
      if (
        contestDropdownRef.current &&
        !contestDropdownRef.current.contains(event.target)
      ) {
        setShowSiteMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSiteMenu])

  const canAffordFee = diamondBalance >= PARTY_ENTRY_FEE

  const refundToUser = useCallback(
    (targetUserId, amount = PARTY_ENTRY_FEE) => {
      if (!targetUserId) return

      if (String(targetUserId) === String(userId)) {
        onRefundDiamonds?.(amount)
        return
      }

      queueDiamondRefund(targetUserId, amount)
    },
    [userId, onRefundDiamonds]
  )

  const tryDeductFee = () => {
    if (diamondBalance < PARTY_ENTRY_FEE) {
      window.alert('다이아가 부족합니다.')
      return false
    }

    const success = onDeductDiamonds?.(PARTY_ENTRY_FEE)
    if (success === false) {
      window.alert('다이아가 부족합니다.')
      return false
    }

    return true
  }

  const handleOpenCreateModal = () => {
    const confirmed = window.confirm(
      '정말로 파티를 생성하시겠습니까? (100 다이아가 차감됩니다.)'
    )
    if (!confirmed) return

    if (!canAffordFee) {
      window.alert('다이아가 부족합니다.')
      return
    }

    setCreateForm(EMPTY_CREATE_FORM)
    setIsCreateModalOpen(true)
  }

  const handleCreateSubmit = (event) => {
    event.preventDefault()

    const title = createForm.title.trim()
    const roles = createForm.roles.trim()
    const targetClass = createForm.targetClass.trim()

    if (!title || !roles || !targetClass) {
      window.alert('공모전 이름, 모집 인원/포지션, 추천 직무를 모두 입력해 주세요.')
      return
    }

    if (!tryDeductFee()) return

    addParty({
      id: createPartyId(),
      title,
      roles,
      targetClass,
      hostId: String(userId),
      hostName: userNickname,
      fee: PARTY_ENTRY_FEE,
      applicants: [],
      members: [],
      rejectedUserIds: [],
      createdAt: new Date().toISOString(),
    })

    refreshParties()
    setIsCreateModalOpen(false)
    setCreateForm(EMPTY_CREATE_FORM)
  }

  const handleJoinParty = (party) => {
    if (String(party.hostId) === String(userId)) return

    if (isUserRejectedFromParty(party, userId)) {
      window.alert('신청불가한 파티입니다.')
      return
    }

    if (hasUserApplied(party, userId) || isPartyMember(party, userId)) {
      window.alert('이미 이 파티에 참가 신청했거나 멤버입니다.')
      return
    }

    const confirmed = window.confirm(
      '참가 신청하시겠습니까? 100 다이아가 참가비로 차감됩니다.'
    )
    if (!confirmed) return

    if (!tryDeductFee()) return

    const resume = buildResumeProfile(user)

    updateParty(party.id, (current) => ({
      ...current,
      applicants: [
        ...current.applicants,
        {
          userId: String(userId),
          nickname: userNickname,
          resume,
          appliedAt: new Date().toISOString(),
          status: 'pending',
        },
      ],
    }))

    refreshParties()
    window.alert('참가 신청이 완료되었습니다. 파티장의 수락을 기다려 주세요.')
  }

  const handleAcceptApplicant = (partyId, applicantUserId) => {
    updateParty(partyId, (current) => {
      const applicant = current.applicants.find(
        (item) =>
          String(item.userId) === String(applicantUserId) &&
          item.status === 'pending'
      )

      if (!applicant) return current

      return {
        ...current,
        applicants: current.applicants.filter(
          (item) => String(item.userId) !== String(applicantUserId)
        ),
        members: [
          ...current.members,
          {
            userId: applicant.userId,
            nickname: applicant.nickname,
            resume: applicant.resume,
            joinedAt: new Date().toISOString(),
          },
        ],
      }
    })

    refreshParties()
  }

  const handleRejectApplicant = (partyId, applicant) => {
    const confirmed = window.confirm(
      `${applicant.nickname}님의 참가 신청을 거절하시겠습니까?\n참가비 ${PARTY_ENTRY_FEE} 다이아가 환급됩니다.`
    )
    if (!confirmed) return

    updateParty(partyId, (current) => ({
      ...current,
      applicants: current.applicants.filter(
        (item) => String(item.userId) !== String(applicant.userId)
      ),
      rejectedUserIds: withRejectedUser(
        current.rejectedUserIds,
        applicant.userId
      ),
    }))

    refundToUser(applicant.userId, PARTY_ENTRY_FEE)
    refreshParties()
    window.alert(
      `${applicant.nickname}님의 신청을 거절했습니다. 참가비가 환급 처리되었습니다.`
    )
  }

  const handleExpelMember = (partyId, member) => {
    const confirmed = window.confirm(
      `${member.nickname}님을 파티에서 추방하시겠습니까?\n참가비 ${PARTY_ENTRY_FEE} 다이아가 환급됩니다.`
    )
    if (!confirmed) return

    updateParty(partyId, (current) => ({
      ...current,
      members: current.members.filter(
        (item) => String(item.userId) !== String(member.userId)
      ),
      rejectedUserIds: withRejectedUser(current.rejectedUserIds, member.userId),
    }))

    refundToUser(member.userId, PARTY_ENTRY_FEE)
    refreshParties()
    window.alert(
      `${member.nickname}님을 추방했습니다. 참가비가 환급 처리되었습니다.`
    )
  }

  const handleAddDebugApplicant = (partyId) => {
    const sampleResume = buildSampleResumeProfile()
    const fakeApplicant = buildDebugFakeApplicant(sampleResume)

    updateParty(partyId, (current) => ({
      ...current,
      applicants: [...current.applicants, fakeApplicant],
    }))

    refreshParties()
  }

  const handleCloseRecruitment = (party) => {
    const confirmed = window.confirm(
      '이 파티의 모집을 마감하고 목록에서 없애시겠습니까?'
    )
    if (!confirmed) return

    removeParty(party.id)
    clearPartyMessages(party.id)

    if (applicantsPartyId === party.id) setApplicantsPartyId(null)
    if (membersPartyId === party.id) setMembersPartyId(null)
    if (chatPartyId === party.id) setChatPartyId(null)

    refreshParties()
  }

  const applicantsParty = applicantsPartyId
    ? parties.find((party) => party.id === applicantsPartyId)
    : null

  const pendingApplicants =
    applicantsParty?.applicants.filter((item) => item.status === 'pending') ||
    []

  const chatParty = chatPartyId
    ? parties.find((party) => party.id === chatPartyId)
    : null

  const membersParty = membersPartyId
    ? parties.find((party) => party.id === membersPartyId)
    : null

  return (
    <section className="tavern-section">
      <div className="tavern-intro">
        <div className="tavern-intro-header">
          <h3>🤝 공모전 길드 매칭 룸</h3>
          <div className="tavern-contest-dropdown" ref={contestDropdownRef}>
            <button
              type="button"
              className={`tavern-contest-dropdown-trigger${
                showSiteMenu ? ' open' : ''
              }`}
              onClick={() => setShowSiteMenu((prev) => !prev)}
              aria-expanded={showSiteMenu}
              aria-haspopup="true"
              aria-controls="tavern-contest-dropdown-menu"
            >
              실시간 공모전 탐색하기 🌐
              <span className="tavern-contest-dropdown-caret" aria-hidden="true">
                ▾
              </span>
            </button>

            {showSiteMenu && (
              <div
                id="tavern-contest-dropdown-menu"
                className="tavern-contest-dropdown-menu"
                role="menu"
                aria-label="공모전 사이트 바로가기"
              >
                {CONTEST_SITE_LINKS.map((site) => (
                  <a
                    key={site.id}
                    href={site.href}
                    className="tavern-contest-dropdown-item"
                    role="menuitem"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowSiteMenu(false)}
                  >
                    {site.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <p>
          스펙이 검증된 모험가들과 파티를 맺으세요. 참가 시{' '}
          <strong>{PARTY_ENTRY_FEE} 다이아</strong>의 참가비가 소모됩니다.
        </p>
      </div>

      <div className="tavern-user-card">
        <p>
          내 프로필: <strong>{userNickname}</strong> · 관심 직무:{' '}
          {user?.targetClass}
        </p>
        <p>
          보유 다이아: <strong>{diamondBalance}</strong> 💎
          {canAffordFee
            ? ' (참가비 결제 가능)'
            : ' (참가비 결제에 다이아가 부족합니다)'}
        </p>
      </div>

      {parties.length === 0 ? (
        <p className="party-empty-state">파티를 생성해보세요!</p>
      ) : (
        <div className="party-list">
          {parties.map((party) => {
            const isOwner = String(party.hostId) === String(userId)
            const applied = hasUserApplied(party, userId)
            const joined = isPartyMember(party, userId)
            const rejected = isUserRejectedFromParty(party, userId)
            const canChat = canAccessPartyChat(party, userId)
            const pendingCount = party.applicants.filter(
              (item) => item.status === 'pending'
            ).length

            return (
              <article key={party.id} className="party-card">
                <div className="party-card-body">
                  <h4>{party.title}</h4>
                  <p className="party-host">개설: {party.hostName}</p>
                  <p className="party-roles">모집: {party.roles}</p>
                  <p className="party-target">추천 직무: {party.targetClass}</p>
                  <p className="party-fee">참가비: {party.fee} 다이아 💎</p>
                  <p className="party-members">
                    {party.members.length > 0
                      ? `멤버: ${party.members.map((m) => m.nickname).join(', ')}`
                      : '멤버: —'}
                  </p>
                </div>

                <div className="party-card-actions">
                  {isOwner ? (
                    <>
                      {party.members.length > 0 && (
                        <button
                          type="button"
                          className="party-members-btn"
                          onClick={() => setMembersPartyId(party.id)}
                        >
                          파티원 관리 ({party.members.length})
                        </button>
                      )}
                      <button
                        type="button"
                        className="party-status-btn"
                        onClick={() => setApplicantsPartyId(party.id)}
                      >
                        참가 신청 상태 확인
                        {pendingCount > 0 ? ` (${pendingCount})` : ''}
                      </button>
                      <button
                        type="button"
                        className="party-close-btn"
                        onClick={() => handleCloseRecruitment(party)}
                      >
                        🔒 모집 마감하기
                      </button>
                      <button
                        type="button"
                        className="party-debug-btn"
                        onClick={() => handleAddDebugApplicant(party.id)}
                      >
                        디버그: 가짜 신청자 넣기
                      </button>
                    </>
                  ) : joined ? (
                    <button type="button" className="party-join-btn" disabled>
                      파티 멤버
                    </button>
                  ) : applied ? (
                    <button type="button" className="party-join-btn" disabled>
                      신청 완료
                    </button>
                  ) : rejected ? (
                    <button
                      type="button"
                      className="party-join-btn party-join-btn-rejected"
                      onClick={() =>
                        window.alert('신청불가한 파티입니다.')
                      }
                    >
                      신청 불가
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="party-join-btn"
                      onClick={() => handleJoinParty(party)}
                    >
                      참가 신청
                    </button>
                  )}

                  {canChat && (
                    <button
                      type="button"
                      className="party-chat-btn"
                      onClick={() => setChatPartyId(party.id)}
                    >
                      💬 파티 채팅방 입장
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <button
        type="button"
        className="party-create-btn"
        onClick={handleOpenCreateModal}
      >
        + 새 파티 개설하기
      </button>

      {isCreateModalOpen && (
        <div
          className="tavern-modal-overlay"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="tavern-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-party-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="tavern-modal-close"
              onClick={() => setIsCreateModalOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>
            <h3 id="create-party-title" className="tavern-modal-title">
              새 파티 개설
            </h3>
            <p className="tavern-modal-desc">
              입력 완료 시 {PARTY_ENTRY_FEE} 다이아가 차감됩니다.
            </p>

            <form className="tavern-modal-form" onSubmit={handleCreateSubmit}>
              <label className="tavern-field">
                <span>개설(공모전 이름)</span>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="예: 2026 AI 해커톤"
                  required
                />
              </label>

              <label className="tavern-field">
                <span>모집 인원/포지션</span>
                <input
                  type="text"
                  value={createForm.roles}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      roles: event.target.value,
                    }))
                  }
                  placeholder="예: 백엔드 1, 프론트 1, PM 1"
                  required
                />
              </label>

              <label className="tavern-field">
                <span>추천 직무</span>
                <input
                  type="text"
                  value={createForm.targetClass}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      targetClass: event.target.value,
                    }))
                  }
                  placeholder="예: Full-stack Developer"
                  required
                />
              </label>

              <button type="submit" className="tavern-modal-submit">
                파티 생성 ({PARTY_ENTRY_FEE} 💎)
              </button>
            </form>
          </div>
        </div>
      )}

      {applicantsParty && (
        <div
          className="tavern-modal-overlay"
          onClick={() => setApplicantsPartyId(null)}
        >
          <div
            className="tavern-modal tavern-applicants-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicants-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="tavern-modal-close"
              onClick={() => setApplicantsPartyId(null)}
              aria-label="닫기"
            >
              ×
            </button>
            <h3 id="applicants-modal-title" className="tavern-modal-title">
              참가 신청 명단 — {applicantsParty.title}
            </h3>

            {pendingApplicants.length === 0 ? (
              <p className="tavern-modal-empty">대기 중인 신청자가 없습니다.</p>
            ) : (
              <ul className="tavern-applicant-list">
                {pendingApplicants.map((applicant) => (
                  <li key={applicant.userId} className="tavern-applicant-item">
                    <div className="tavern-applicant-header">
                      <strong>{applicant.nickname}</strong>
                      {applicant.isDebug && (
                        <span className="tavern-debug-badge">디버그</span>
                      )}
                      <div className="tavern-applicant-actions">
                        <button
                          type="button"
                          className="tavern-accept-btn"
                          onClick={() =>
                            handleAcceptApplicant(
                              applicantsParty.id,
                              applicant.userId
                            )
                          }
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          className="tavern-reject-btn"
                          onClick={() =>
                            handleRejectApplicant(applicantsParty.id, applicant)
                          }
                        >
                          거절
                        </button>
                      </div>
                    </div>
                    <pre className="tavern-resume-block">
                      {formatResumeBlock(applicant.resume)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {membersParty && (
        <div
          className="tavern-modal-overlay"
          onClick={() => setMembersPartyId(null)}
        >
          <div
            className="tavern-modal tavern-applicants-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="members-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="tavern-modal-close"
              onClick={() => setMembersPartyId(null)}
              aria-label="닫기"
            >
              ×
            </button>
            <h3 id="members-modal-title" className="tavern-modal-title">
              파티원 관리 — {membersParty.title}
            </h3>

            {membersParty.members.length === 0 ? (
              <p className="tavern-modal-empty">파티원이 없습니다.</p>
            ) : (
              <ul className="tavern-applicant-list">
                {membersParty.members.map((member) => (
                  <li key={member.userId} className="tavern-applicant-item">
                    <div className="tavern-applicant-header">
                      <strong>{member.nickname}</strong>
                      <button
                        type="button"
                        className="tavern-expel-btn"
                        onClick={() =>
                          handleExpelMember(membersParty.id, member)
                        }
                      >
                        추방
                      </button>
                    </div>
                    <pre className="tavern-resume-block">
                      {formatResumeBlock(member.resume)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {chatParty && (
        <PartyChatModal
          party={chatParty}
          user={user}
          onClose={() => setChatPartyId(null)}
        />
      )}
    </section>
  )
}

export default GuildTavern
