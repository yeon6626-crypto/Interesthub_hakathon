const User = require('../models/User');
const {
  ExchangeServiceError,
  PAYBACK_DIA_MULTIPLIER,
  createPaybackRequest,
  listExchangesByUser,
  listPendingExchanges,
  approveExchange,
  rejectExchange,
} = require('../services/exchangeService');
const { PAYBACK_SERVICE_NAMES } = require('../models/ExchangeHistory');
const { getAdminEmailSet } = require('../utils/adminEmails');

function handleServiceError(res, error) {
  if (error instanceof ExchangeServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || '서버 오류가 발생했습니다.',
  });
}

function formatExchange(doc) {
  if (!doc) return null;

  const user = doc.userId;
  const isPopulatedUser = user && typeof user === 'object' && user._id;

  return {
    _id: doc._id,
    userId: isPopulatedUser ? user._id : doc.userId,
    user: isPopulatedUser
      ? { _id: user._id, nickname: user.nickname, email: user.email }
      : undefined,
    serviceName: doc.serviceName,
    amount: doc.amount,
    diaCost: doc.diaCost,
    status: doc.status,
    naverPayId: doc.naverPayId || '',
    adminNote: doc.adminNote || '',
    processedAt: doc.processedAt || null,
    processedBy: doc.processedBy || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function createPayback(req, res) {
  try {
    const { serviceName, amount, naverPayId } = req.body;

    const result = await createPaybackRequest(req.userId, {
      serviceName,
      amount,
      naverPayId,
    });

    res.status(201).json({
      success: true,
      message: `네이버페이 포인트 ${result.rewardPoint.toLocaleString()}원 환급 신청이 접수되었습니다. (다이아 ${result.diaCost.toLocaleString()}개 차감)`,
      data: {
        exchange: formatExchange(result.exchange),
        user: result.user,
        diaCost: result.diaCost,
        rewardPoint: result.rewardPoint,
        multiplier: PAYBACK_DIA_MULTIPLIER,
      },
    });
  } catch (error) {
    handleServiceError(res, error);
  }
}

async function getMyExchanges(req, res) {
  try {
    const limit = req.query.limit;
    const rows = await listExchangesByUser(req.userId, { limit });

    res.json({
      success: true,
      data: rows.map(formatExchange),
    });
  } catch (error) {
    handleServiceError(res, error);
  }
}

async function getPaybackMeta(req, res) {
  try {
    res.json({
      success: true,
      data: {
        services: PAYBACK_SERVICE_NAMES,
        diaMultiplier: PAYBACK_DIA_MULTIPLIER,
      },
    });
  } catch (error) {
    handleServiceError(res, error);
  }
}

async function getAdminAccess(req, res) {
  try {
    const adminEmails = getAdminEmailSet();
    const user = await User.findById(req.userId).select('email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    const isAdmin =
      adminEmails.size > 0 &&
      adminEmails.has(String(user.email).toLowerCase());

    res.json({
      success: true,
      data: { isAdmin },
    });
  } catch (error) {
    handleServiceError(res, error);
  }
}

async function listPending(req, res) {
  try {
    const { limit, skip } = req.query;
    const rows = await listPendingExchanges({ limit, skip });

    res.json({
      success: true,
      data: rows.map(formatExchange),
    });
  } catch (error) {
    handleServiceError(res, error);
  }
}

async function approve(req, res) {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const processedBy = req.adminEmail || req.userId;

    const exchange = await approveExchange(id, processedBy, adminNote);

    res.json({
      success: true,
      message: '환급 신청이 승인되었습니다.',
      data: formatExchange(exchange),
    });
  } catch (error) {
    handleServiceError(res, error);
  }
}

async function reject(req, res) {
  try {
    const { id } = req.params;
    const reason = req.body.reason ?? req.body.adminNote ?? '';
    const processedBy = req.adminEmail || req.userId;

    const { exchange, user } = await rejectExchange(
      id,
      processedBy,
      String(reason).trim()
    );

    res.json({
      success: true,
      message: '환급 신청이 거절되었습니다. 차감된 다이아가 환불되었습니다.',
      data: {
        exchange: formatExchange(exchange),
        user,
      },
    });
  } catch (error) {
    handleServiceError(res, error);
  }
}

module.exports = {
  createPayback,
  getMyExchanges,
  getPaybackMeta,
  getAdminAccess,
  listPending,
  approve,
  reject,
};
