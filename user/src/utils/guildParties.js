const PARTIES_KEY = 'interesthub-guild-parties'

export const PARTY_ENTRY_FEE = 100

/**
 * @typedef {object} ResumeProfile
 * @property {string} major
 * @property {string} grade
 * @property {string} targetClass
 * @property {number} level
 * @property {number} reputation
 * @property {string[]} specialNotes
 */

/**
 * @typedef {object} PartyApplicant
 * @property {string} userId
 * @property {string} nickname
 * @property {ResumeProfile} resume
 * @property {string} appliedAt
 * @property {'pending'|'accepted'} status
 * @property {boolean} [isDebug]
 */

/**
 * @typedef {object} PartyMember
 * @property {string} userId
 * @property {string} nickname
 * @property {ResumeProfile} resume
 * @property {string} joinedAt
 */

/**
 * @typedef {object} GuildParty
 * @property {string} id
 * @property {string} title
 * @property {string} roles
 * @property {string} targetClass
 * @property {string} hostId
 * @property {string} hostName
 * @property {number} fee
 * @property {PartyApplicant[]} applicants
 * @property {PartyMember[]} members
 * @property {string[]} rejectedUserIds
 * @property {string} createdAt
 */

/**
 * @returns {GuildParty[]}
 */
export function loadParties() {
  try {
    const raw = localStorage.getItem(PARTIES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * @param {GuildParty[]} parties
 */
export function saveParties(parties) {
  localStorage.setItem(PARTIES_KEY, JSON.stringify(parties))
}

/**
 * @param {GuildParty} party
 * @returns {GuildParty}
 */
export function addParty(party) {
  const parties = loadParties()
  const next = [party, ...parties]
  saveParties(next)
  return party
}

/**
 * @param {string} partyId
 * @param {(party: GuildParty) => GuildParty} updater
 * @returns {GuildParty | null}
 */
export function updateParty(partyId, updater) {
  const parties = loadParties()
  let updated = null

  const next = parties.map((party) => {
    if (party.id !== partyId) return party
    updated = updater(party)
    return updated
  })

  saveParties(next)
  return updated
}

/**
 * @param {string} partyId
 * @returns {GuildParty | undefined}
 */
export function getPartyById(partyId) {
  return loadParties().find((party) => party.id === partyId)
}

export function createPartyId() {
  return `party-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * @param {GuildParty} party
 * @param {string} userId
 */
export function canAccessPartyChat(party, userId) {
  if (!party || !userId) return false
  if (String(party.hostId) === String(userId)) return true
  return isPartyMember(party, userId)
}

/**
 * @param {string} partyId
 */
export function removeParty(partyId) {
  const parties = loadParties().filter((party) => party.id !== partyId)
  saveParties(parties)
}

/**
 * @param {GuildParty} party
 * @param {string} userId
 */
export function isUserRejectedFromParty(party, userId) {
  if (!party || !userId) return false
  const rejected = party.rejectedUserIds ?? []
  return rejected.some((id) => String(id) === String(userId))
}

/**
 * @param {string[]} rejectedUserIds
 * @param {string} userId
 */
export function withRejectedUser(rejectedUserIds, userId) {
  const list = rejectedUserIds ?? []
  const key = String(userId)
  if (list.some((id) => String(id) === key)) return list
  return [...list, key]
}

/**
 * @param {GuildParty} party
 * @param {string} userId
 */
export function hasUserApplied(party, userId) {
  if (!userId) return false
  return party.applicants.some(
    (applicant) =>
      String(applicant.userId) === String(userId) &&
      applicant.status === 'pending'
  )
}

/**
 * @param {GuildParty} party
 * @param {string} userId
 */
export function isPartyMember(party, userId) {
  if (!userId) return false
  return party.members.some(
    (member) => String(member.userId) === String(userId)
  )
}

/**
 * @param {ResumeProfile} resume
 */
export function buildDebugFakeApplicant(resume) {
  return {
    userId: `debug-fake-${Date.now()}`,
    nickname: '홍길동',
    resume: {
      major: resume.major || 'School of Electronics Engineering',
      grade: resume.grade || '2학년 2학기',
      targetClass: resume.targetClass || 'Frontend Developer',
      level: resume.level ?? 5,
      reputation: resume.reputation ?? 12,
      specialNotes:
        Array.isArray(resume.specialNotes) && resume.specialNotes.length > 0
          ? resume.specialNotes
          : ['React 웹 프로젝트 완성', '정보처리기사 자격증'],
    },
    appliedAt: new Date().toISOString(),
    status: 'pending',
    isDebug: true,
  }
}
