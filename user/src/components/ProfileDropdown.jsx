import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function ProfileDropdown({ user, isOpen, onToggle, onClose, onLogout }) {
  const navigate = useNavigate()
  const wrapperRef = useRef(null)

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

  const handleMyPage = () => {
    onClose()
    navigate('/mypage')
  }

  const handleLogout = () => {
    onClose()
    onLogout()
  }

  const initial = user?.nickname?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="profile-dropdown-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="dashboard-avatar-btn"
        onClick={onToggle}
        aria-label="프로필 메뉴"
        aria-expanded={isOpen}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-header">
            <span className="profile-dropdown-avatar">{initial}</span>
            <div>
              <p className="profile-dropdown-name">{user?.nickname}</p>
              <p className="profile-dropdown-email">{user?.email}</p>
            </div>
          </div>
          <button type="button" className="profile-dropdown-item" onClick={handleMyPage}>
            마이페이지
          </button>
          <button
            type="button"
            className="profile-dropdown-item profile-dropdown-logout"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
