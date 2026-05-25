import { useEffect, useRef, useState } from 'react'
import { verifyPortfolioSpec } from '@/services/geminiPortfolioVerify'
import { addVerifiedSpec, loadVerifiedSpecs } from '@/utils/verifiedSpecs'
import './PortfolioSmithy.css'

const REGISTER_TYPES = {
  project: {
    id: 'project',
    label: '프로젝트 경험 등록',
    placeholder:
      '예: React와 Node.js로 만든 팀 프로젝트, GitHub 링크 및 역할 설명 등',
    hint: '소스 코드, GitHub 커밋, 실행 화면, 아키텍처 다이어그램 등을 첨부하세요.',
  },
  certification: {
    id: 'certification',
    label: '자격증 등록',
    placeholder:
      '예: 정보처리기사 합격, TOEIC 900점, AWS Solutions Architect 수료 등',
    hint: '국가기술자격증, 어학 성적표, 공식 수료증 사진을 첨부하세요.',
  },
}

function PortfolioSmithy({ user }) {
  const [registerType, setRegisterType] = useState('project')
  const [description, setDescription] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [verifiedItems, setVerifiedItems] = useState([])
  const [isVerifying, setIsVerifying] = useState(false)
  const fileInputRef = useRef(null)
  const verifyingRef = useRef(false)

  const userId = user?._id
  const activeType = REGISTER_TYPES[registerType]

  useEffect(() => {
    setVerifiedItems(loadVerifiedSpecs(userId))
  }, [userId])

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview)
    }
  }, [proofPreview])

  const resetForm = () => {
    setDescription('')
    setProofFile(null)
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRegisterTypeChange = (typeId) => {
    if (isVerifying) return
    setRegisterType(typeId)
    resetForm()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      window.alert('증빙 파일은 이미지만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const handleVerifyRequest = async () => {
    if (verifyingRef.current || isVerifying) return

    const trimmed = description.trim()
    if (!trimmed) {
      window.alert('설명 텍스트를 입력해 주세요.')
      return
    }

    if (!proofFile) {
      window.alert('증빙 이미지를 첨부해 주세요.')
      return
    }

    verifyingRef.current = true
    setIsVerifying(true)

    try {
      const result = await verifyPortfolioSpec({
        submissionType: registerType,
        description: trimmed,
        file: proofFile,
      })

      if (result.result === 'success' && result.verifiedItem) {
        const nextItems = addVerifiedSpec(userId, result.verifiedItem)
        setVerifiedItems(nextItems)
        resetForm()
        window.alert(
          `✅ 스펙 인증 성공!\n"${result.verifiedItem}" 항목이 특이사항에 추가되었습니다.`
        )
        return
      }

      window.alert(
        result.message ||
          '스펙 인증에 실패했습니다. 설명과 증빙 이미지를 확인해 주세요.'
      )
    } catch (err) {
      window.alert(err.message || '스펙 인증 중 오류가 발생했습니다.')
    } finally {
      verifyingRef.current = false
      setIsVerifying(false)
    }
  }

  const specialNotesText =
    verifiedItems.length > 0 ? verifiedItems.join(', ') : '없음'

  return (
    <section className="portfolio-section">
      <h3>📜 포트폴리오 제련소 (이력서)</h3>
      <p className="portfolio-desc">
        길드 매칭 시 다른 모험가에게 공개되는 스펙창입니다. 프로젝트 경험,
        기술 스택, 자격증을 AI로 인증받아 신뢰도를 높이세요.
      </p>

      <div className="portfolio-card">
        <h4>{user?.nickname || '모험가'}의 스펙창</h4>
        <ul className="portfolio-list">
          <li>
            <strong>학과:</strong> {user?.major}
          </li>
          <li>
            <strong>학년:</strong> {user?.grade}
          </li>
          <li>
            <strong>목표 직무:</strong> {user?.targetClass}
          </li>
          <li>
            <strong>레벨:</strong> {user?.level ?? 1} · <strong>명성:</strong>{' '}
            {user?.reputation ?? 0}
          </li>
          <li className="portfolio-special-notes">
            <strong>특이사항:</strong> {specialNotesText}
          </li>
        </ul>
      </div>

      <div className="portfolio-register-panel">
        <div className="portfolio-register-tabs" role="tablist">
          {Object.values(REGISTER_TYPES).map((type) => (
            <button
              key={type.id}
              type="button"
              role="tab"
              aria-selected={registerType === type.id}
              className={`portfolio-register-tab${
                registerType === type.id ? ' active' : ''
              }`}
              onClick={() => handleRegisterTypeChange(type.id)}
              disabled={isVerifying}
            >
              [{type.label}]
            </button>
          ))}
        </div>

        <div className="portfolio-register-form">
          <label className="portfolio-field">
            <span className="portfolio-field-label">
              {activeType.label} 설명
            </span>
            <textarea
              className="portfolio-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={activeType.placeholder}
              disabled={isVerifying}
            />
          </label>

          <p className="portfolio-field-hint">{activeType.hint}</p>

          <div className="portfolio-upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="portfolio-file-input"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleFileChange}
              disabled={isVerifying}
            />
            <button
              type="button"
              className="portfolio-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isVerifying}
            >
              📎 증빙 이미지 첨부
            </button>
            {proofFile && (
              <span className="portfolio-file-name">{proofFile.name}</span>
            )}
          </div>

          {proofPreview && (
            <div className="portfolio-preview-wrap">
              <img
                src={proofPreview}
                alt="증빙 미리보기"
                className="portfolio-preview-img"
              />
            </div>
          )}

          <button
            type="button"
            className="portfolio-verify-btn"
            onClick={handleVerifyRequest}
            disabled={isVerifying}
          >
            {isVerifying ? '제련 중...' : '⚗️ 인증 요청'}
          </button>

          {isVerifying && (
            <div className="portfolio-smithy-loading" role="status">
              <span className="portfolio-smithy-spinner" aria-hidden="true" />
              AI가 제출하신 스펙의 진위 여부를 제련 중입니다...
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default PortfolioSmithy
