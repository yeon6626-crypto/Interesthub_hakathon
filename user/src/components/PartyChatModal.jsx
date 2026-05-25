import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendPartyMessage,
  getPartyChatParticipants,
  loadPartyMessages,
} from '@/utils/partyChat'
import './PartyChatModal.css'

function formatChatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function PartyChatModal({ party, user, onClose }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const userId = user?._id
  const nickname = user?.nickname || '모험가'
  const participants = getPartyChatParticipants(party)

  const syncMessages = useCallback(() => {
    setMessages(loadPartyMessages(party.id))
  }, [party.id])

  useEffect(() => {
    syncMessages()

    const handleStorage = (event) => {
      if (event.key?.includes(party.id)) syncMessages()
    }

    window.addEventListener('storage', handleStorage)
    const interval = window.setInterval(syncMessages, 2000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.clearInterval(interval)
    }
  }, [party.id, syncMessages])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmed = draft.trim()
    if (!trimmed) return

    appendPartyMessage(party.id, {
      userId: String(userId),
      nickname,
      text: trimmed,
    })

    setDraft('')
    syncMessages()
  }

  return (
    <div className="party-chat-overlay" onClick={onClose}>
      <div
        className="party-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="party-chat-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="party-chat-close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <h3 id="party-chat-title" className="party-chat-title">
          💬 {party.title} 채팅방
        </h3>
        <p className="party-chat-participants">
          참여자: {participants.map((p) => p.nickname).join(', ')}
        </p>

        <div ref={listRef} className="party-chat-messages">
          {messages.length === 0 ? (
            <p className="party-chat-empty">첫 메시지를 남겨보세요!</p>
          ) : (
            messages.map((message) => {
              const isMine = String(message.userId) === String(userId)
              return (
                <div
                  key={message.id}
                  className={`party-chat-bubble${isMine ? ' mine' : ''}`}
                >
                  {!isMine && (
                    <span className="party-chat-author">{message.nickname}</span>
                  )}
                  <p className="party-chat-text">{message.text}</p>
                  <span className="party-chat-time">
                    {formatChatTime(message.createdAt)}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <form className="party-chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="party-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="메시지를 입력하세요..."
            maxLength={500}
          />
          <button type="submit" className="party-chat-send" disabled={!draft.trim()}>
            전송
          </button>
        </form>
      </div>
    </div>
  )
}

export default PartyChatModal
