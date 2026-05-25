const CHAT_PREFIX = 'interesthub-party-chat-'

function chatKey(partyId) {
  return `${CHAT_PREFIX}${partyId}`
}

/**
 * @typedef {object} PartyChatMessage
 * @property {string} id
 * @property {string} userId
 * @property {string} nickname
 * @property {string} text
 * @property {string} createdAt
 */

/**
 * @param {string} partyId
 * @returns {PartyChatMessage[]}
 */
export function loadPartyMessages(partyId) {
  if (!partyId) return []

  try {
    const raw = localStorage.getItem(chatKey(partyId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * @param {string} partyId
 * @param {PartyChatMessage[]} messages
 */
export function savePartyMessages(partyId, messages) {
  if (!partyId) return
  localStorage.setItem(chatKey(partyId), JSON.stringify(messages))
}

/**
 * @param {string} partyId
 * @param {Omit<PartyChatMessage, 'id'|'createdAt'> & { text: string }} message
 * @returns {PartyChatMessage}
 */
export function appendPartyMessage(partyId, message) {
  const trimmed = String(message.text || '').trim()
  if (!trimmed) return null

  const entry = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: message.userId,
    nickname: message.nickname,
    text: trimmed,
    createdAt: new Date().toISOString(),
  }

  const next = [...loadPartyMessages(partyId), entry]
  savePartyMessages(partyId, next)
  return entry
}

/**
 * @param {string} partyId
 */
export function clearPartyMessages(partyId) {
  if (!partyId) return
  localStorage.removeItem(chatKey(partyId))
}

/**
 * @param {import('@/utils/guildParties').GuildParty} party
 */
export function getPartyChatParticipants(party) {
  const participants = [{ userId: party.hostId, nickname: party.hostName }]

  party.members.forEach((member) => {
    if (
      !participants.some(
        (item) => String(item.userId) === String(member.userId)
      )
    ) {
      participants.push({
        userId: member.userId,
        nickname: member.nickname,
      })
    }
  })

  return participants
}
