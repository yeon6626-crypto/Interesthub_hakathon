import { useEffect, useRef } from 'react'

function NotificationDropdown({
  notifications,
  isOpen,
  onToggle,
  onClose,
  onDismiss,
  onMarkAllRead,
}) {
  const wrapperRef = useRef(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="dashboard-icon-btn notification-btn"
        onClick={onToggle}
        aria-label="알림"
        aria-expanded={isOpen}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown-header">
            <h3>알림</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-read-all"
                onClick={onMarkAllRead}
              >
                모두 읽음
              </button>
            )}
          </div>

          <ul className="notification-list">
            {notifications.length === 0 ? (
              <li className="notification-empty">새 알림이 없습니다.</li>
            ) : (
              notifications.map((item) => (
                <li
                  key={item.id}
                  className={`notification-item ${item.read ? 'read' : 'unread'}`}
                >
                  <p>{item.message}</p>
                  <button
                    type="button"
                    className="notification-dismiss"
                    onClick={() => onDismiss(item.id)}
                    aria-label="알림 삭제"
                  >
                    ×
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
