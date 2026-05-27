const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  createPayback,
  getMyExchanges,
  getPaybackMeta,
  getAdminAccess,
  listPending,
  approve,
  reject,
} = require('../controllers/exchangeController');

const router = express.Router();

/** 모든 환급 API는 로그인 필요 */
router.use(authMiddleware);

/** 유저: 포인트 환급 신청 */
router.post('/payback', createPayback);

/** 유저: 내 환급 신청 내역 */
router.get('/me', getMyExchanges);

/** 유저: 지원 서비스·배율 메타 (프론트 폼용) */
router.get('/meta', getPaybackMeta);

/** 로그인 유저: 관리자 탭 노출 여부 (이메일 화이트리스트) */
router.get('/admin/access', getAdminAccess);

/**
 * 관리자 전용 — adminMiddleware 적용 서브 라우터
 * 추후 역할(role) 기반으로 확장 가능
 */
const adminRouter = express.Router();
adminRouter.use(adminMiddleware);
adminRouter.get('/pending', listPending);
adminRouter.patch('/:id/approve', approve);
adminRouter.patch('/:id/reject', reject);

router.use('/admin', adminRouter);

module.exports = router;
