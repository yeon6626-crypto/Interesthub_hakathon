import { useCallback, useEffect, useState } from 'react'
import {
  approveExchange,
  getPendingExchanges,
  rejectExchange,
} from '@/api/client'
import './AdminExchangePanel.css'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AdminExchangePanel({ onNotify }) {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadPending = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const res = await getPendingExchanges({ limit: 100 })
      setRows(res?.data ?? [])
    } catch (err) {
      setRows([])
      setLoadError(err.message || '승인 대기 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPending()
  }, [loadPending])

  const handleApprove = async (row) => {
    if (processingId) return
    const confirmed = window.confirm(
      `${row.user?.nickname || '유저'} · ${row.serviceName} · ${row.amount?.toLocaleString()}원 신청을 승인할까요?`
    )
    if (!confirmed) return

    setProcessingId(row._id)
    try {
      const res = await approveExchange(row._id)
      window.alert(res.message || '승인되었습니다.')
      onNotify?.(
        `[관리자] ${row.serviceName} 환급 승인 · ${row.amount?.toLocaleString()}원`
      )
      await loadPending()
    } catch (err) {
      window.alert(err.message || '승인 처리에 실패했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (row) => {
    if (processingId) return
    setRejectTarget(row)
    setRejectReason('')
  }

  const closeRejectDialog = () => {
    setRejectTarget(null)
    setRejectReason('')
  }

  const handleRejectSubmit = async (event) => {
    event.preventDefault()
    if (!rejectTarget || processingId) return

    const reason = rejectReason.trim()
    if (!reason) {
      window.alert('거절 사유를 입력해 주세요.')
      return
    }

    setProcessingId(rejectTarget._id)
    try {
      const res = await rejectExchange(rejectTarget._id, reason)
      window.alert(res.message || '거절되었습니다. 다이아가 환불되었습니다.')
      onNotify?.(
        `[관리자] ${rejectTarget.serviceName} 환급 거절 · ${rejectTarget.amount?.toLocaleString()}원`
      )
      closeRejectDialog()
      await loadPending()
    } catch (err) {
      window.alert(err.message || '거절 처리에 실패했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="admin-exchange-panel">
      <header className="admin-exchange-header">
        <div>
          <h2>환급 신청 관리</h2>
          <p className="admin-exchange-desc">
            승인 대기 중인 네이버페이 포인트 환급 신청을 검토합니다. 거절 시
            차감된 다이아가 즉시 환불됩니다.
          </p>
        </div>
        <button
          type="button"
          className="admin-exchange-refresh-btn"
          onClick={loadPending}
          disabled={isLoading || Boolean(processingId)}
        >
          새로고침
        </button>
      </header>

      {isLoading ? (
        <p className="admin-exchange-status" role="status">
          승인 대기 목록을 불러오는 중...
        </p>
      ) : loadError ? (
        <p className="admin-exchange-error" role="alert">
          {loadError}
        </p>
      ) : rows.length === 0 ? (
        <p className="admin-exchange-status">승인 대기 중인 신청이 없습니다.</p>
      ) : (
        <div className="admin-exchange-table-wrap">
          <table className="admin-exchange-table">
            <thead>
              <tr>
                <th scope="col">신청일</th>
                <th scope="col">유저</th>
                <th scope="col">서비스</th>
                <th scope="col">금액</th>
                <th scope="col">다이아</th>
                <th scope="col">네이버페이 ID</th>
                <th scope="col">처리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isBusy = processingId === row._id
                return (
                  <tr key={row._id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <span className="admin-exchange-user-name">
                        {row.user?.nickname || '—'}
                      </span>
                      <span className="admin-exchange-user-email">
                        {row.user?.email || ''}
                      </span>
                    </td>
                    <td>{row.serviceName}</td>
                    <td className="admin-exchange-num">
                      {row.amount?.toLocaleString()}원
                    </td>
                    <td className="admin-exchange-num">
                      💎 {row.diaCost?.toLocaleString()}
                    </td>
                    <td>{row.naverPayId || '—'}</td>
                    <td>
                      <div className="admin-exchange-actions">
                        <button
                          type="button"
                          className="admin-exchange-btn admin-exchange-btn-approve"
                          onClick={() => handleApprove(row)}
                          disabled={Boolean(processingId)}
                        >
                          {isBusy ? '처리 중' : '승인'}
                        </button>
                        <button
                          type="button"
                          className="admin-exchange-btn admin-exchange-btn-reject"
                          onClick={() => openRejectDialog(row)}
                          disabled={Boolean(processingId)}
                        >
                          거절
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <div
          className="admin-exchange-reject-overlay"
          role="presentation"
          onClick={closeRejectDialog}
        >
          <div
            className="admin-exchange-reject-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reject-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-reject-title">환급 신청 거절</h3>
            <p className="admin-exchange-reject-summary">
              {rejectTarget.user?.nickname || '유저'} · {rejectTarget.serviceName}{' '}
              · {rejectTarget.amount?.toLocaleString()}원
            </p>
            <form onSubmit={handleRejectSubmit}>
              <label className="admin-exchange-reject-label" htmlFor="reject-reason">
                거절 사유
              </label>
              <textarea
                id="reject-reason"
                className="admin-exchange-reject-input"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="예: 영수증 정보 불일치, 중복 신청 등"
                disabled={Boolean(processingId)}
                autoFocus
              />
              <div className="admin-exchange-reject-actions">
                <button
                  type="button"
                  className="admin-exchange-btn admin-exchange-btn-muted"
                  onClick={closeRejectDialog}
                  disabled={Boolean(processingId)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="admin-exchange-btn admin-exchange-btn-reject"
                  disabled={Boolean(processingId)}
                >
                  {processingId ? '처리 중...' : '거절 확정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminExchangePanel
