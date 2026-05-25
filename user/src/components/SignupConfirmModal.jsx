import { useNavigate } from 'react-router-dom'

function SignupConfirmModal({ onClose }) {
  const navigate = useNavigate()

  const handleConfirm = () => {
    onClose()
    navigate('/signup')
  }

  return (
    <div className="alert-overlay">
      <div className="signup-alert" role="alertdialog" aria-modal="true">
        <p className="signup-alert-title">{window.location.host}의 메시지</p>
        <p className="signup-alert-message">
          회원가입 미션을 수락하시겠습니까?
        </p>
        <div className="signup-alert-actions">
          <button
            type="button"
            className="signup-alert-btn"
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignupConfirmModal
