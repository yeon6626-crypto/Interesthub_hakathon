const User = require('../models/User');
const ExchangeHistory = require('../models/ExchangeHistory');
const { PAYBACK_SERVICE_NAMES } = require('../models/ExchangeHistory');
const { runInTransaction } = require('../utils/mongoTransaction');

const PAYBACK_DIA_MULTIPLIER = 1.3;
/** 원 → 다이아: round(amount × 1.3 ÷ 100) */
const PAYBACK_DIA_UNIT_DIVISOR = 100;
/** 환급 신청 최소 결제 금액 (원) */
const MIN_PAYBACK_AMOUNT_KRW = 20_000;
/** 결제 금액 입력 단위 (원) */
const PAYBACK_AMOUNT_STEP_KRW = 100;

class ExchangeServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ExchangeServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * @param {number} amount 원화 결제 금액 P
 * @returns {number} 필요 다이아 round(P × 1.3 ÷ 100)
 */
function assertValidPaybackAmount(amount) {
  const price = Math.floor(Number(amount));
  if (!Number.isFinite(price) || price < 1) {
    throw new ExchangeServiceError('환급 금액은 1원 이상의 숫자여야 합니다.');
  }
  if (price % PAYBACK_AMOUNT_STEP_KRW !== 0) {
    throw new ExchangeServiceError(
      `결제 금액은 ${PAYBACK_AMOUNT_STEP_KRW.toLocaleString()}원 단위로 입력해 주세요.`
    );
  }
  if (price < MIN_PAYBACK_AMOUNT_KRW) {
    throw new ExchangeServiceError(
      `환급 신청은 최소 ${MIN_PAYBACK_AMOUNT_KRW.toLocaleString()}원부터 가능합니다.`
    );
  }
  return price;
}

function calculateDiaCost(amount) {
  const price = assertValidPaybackAmount(amount);
  return Math.round(
    (price * PAYBACK_DIA_MULTIPLIER) / PAYBACK_DIA_UNIT_DIVISOR
  );
}

/**
 * @param {string} serviceName
 */
function normalizeServiceName(serviceName) {
  const raw = String(serviceName || '').trim();
  if (!raw) {
    throw new ExchangeServiceError('환급 대상 서비스를 선택해 주세요.');
  }

  const byExact = PAYBACK_SERVICE_NAMES.find(
    (name) => name.toLowerCase() === raw.toLowerCase()
  );
  if (byExact) return byExact;

  const aliases = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    fastcampus: 'Fastcampus',
    inflearn: 'Inflearn',
    '패스트캠퍼스': 'Fastcampus',
    인프런: 'Inflearn',
  };
  const aliasKey = raw.toLowerCase();
  if (aliases[aliasKey]) return aliases[aliasKey];

  throw new ExchangeServiceError(
    `지원하지 않는 서비스입니다. (${PAYBACK_SERVICE_NAMES.join(', ')})`
  );
}

function toEconomyUser(user) {
  return {
    _id: user._id,
    gold: user.gold,
    coin: user.coin,
    level: user.level,
    exp: user.exp,
    reputation: user.reputation,
  };
}

/**
 * 로컬 standalone MongoDB는 replica set이 아니면 트랜잭션 불가.
 * 다이아 차감은 조건부 findOneAndUpdate로 원자 처리한다.
 *
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {{ serviceName: string, amount: number, naverPayId?: string }} payload
 */
async function createPaybackRequest(userId, payload) {
  const serviceName = normalizeServiceName(payload.serviceName);
  const amount = assertValidPaybackAmount(payload.amount);
  const diaCost = calculateDiaCost(amount);
  const naverPayId = String(payload.naverPayId || '').trim();

  const user = await User.findOneAndUpdate(
    { _id: userId, gold: { $gte: diaCost } },
    { $inc: { gold: -diaCost } },
    { new: true }
  );

  if (!user) {
    const exists = await User.findById(userId).select('_id gold');
    if (!exists) {
      throw new ExchangeServiceError('사용자를 찾을 수 없습니다.', 404);
    }
    throw new ExchangeServiceError(
      `다이아가 부족합니다. 필요: ${diaCost.toLocaleString()}개 / 보유: ${exists.gold.toLocaleString()}개`,
      400
    );
  }

  try {
    const exchange = await ExchangeHistory.create({
      userId: user._id,
      serviceName,
      amount,
      diaCost,
      status: 'PENDING',
      naverPayId,
    });

    return {
      exchange,
      user: toEconomyUser(user),
      diaCost,
      rewardPoint: amount,
    };
  } catch (error) {
    await User.findByIdAndUpdate(userId, { $inc: { gold: diaCost } });
    throw error;
  }
}

/**
 * @param {import('mongoose').Types.ObjectId|string} userId
 */
async function listExchangesByUser(userId, { limit = 20 } = {}) {
  return ExchangeHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 20, 100))
    .lean();
}

/**
 * @param {{ limit?: number, skip?: number }} options
 */
async function listPendingExchanges({ limit = 50, skip = 0 } = {}) {
  return ExchangeHistory.find({ status: 'PENDING' })
    .populate('userId', 'nickname email')
    .sort({ createdAt: 1 })
    .skip(Number(skip) || 0)
    .limit(Math.min(Number(limit) || 50, 100))
    .lean();
}

/**
 * @param {string} exchangeId
 * @param {string} processedBy
 * @param {string} [adminNote]
 */
async function approveExchange(exchangeId, processedBy, adminNote = '') {
  const exchange = await ExchangeHistory.findOneAndUpdate(
    { _id: exchangeId, status: 'PENDING' },
    {
      $set: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processedBy: String(processedBy || '').trim(),
        adminNote: String(adminNote || '').trim(),
      },
    },
    { new: true }
  );

  if (!exchange) {
    throw new ExchangeServiceError('환급 신청을 찾을 수 없거나 이미 처리되었습니다.', 404);
  }

  return exchange;
}

/**
 * 거절 시 REJECTED 처리 + 차감 다이아 환불.
 * Replica set이면 MongoDB 트랜잭션, standalone이면 조건부 업데이트 + 보상 롤백.
 *
 * @param {string} exchangeId
 * @param {string} processedBy
 * @param {string} [adminNote]
 */
async function rejectExchange(exchangeId, processedBy, adminNote = '') {
  const processedAt = new Date();
  const processedByValue = String(processedBy || '').trim();
  const adminNoteValue = String(adminNote || '').trim();

  const executeReject = async (session) => {
    const sessionOpts = session ? { session } : {};

    const exchange = await ExchangeHistory.findOneAndUpdate(
      { _id: exchangeId, status: 'PENDING' },
      {
        $set: {
          status: 'REJECTED',
          processedAt,
          processedBy: processedByValue,
          adminNote: adminNoteValue,
        },
      },
      { new: true, ...sessionOpts }
    );

    if (!exchange) {
      throw new ExchangeServiceError(
        '환급 신청을 찾을 수 없거나 이미 처리되었습니다.',
        404
      );
    }

    const user = await User.findByIdAndUpdate(
      exchange.userId,
      { $inc: { gold: exchange.diaCost } },
      { new: true, ...sessionOpts }
    );

    if (!user) {
      if (!session) {
        await ExchangeHistory.findOneAndUpdate(
          { _id: exchangeId, status: 'REJECTED' },
          {
            $set: {
              status: 'PENDING',
              processedAt: null,
              processedBy: '',
              adminNote: '',
            },
          }
        );
      }
      throw new ExchangeServiceError('사용자를 찾을 수 없습니다.', 404);
    }

    return { exchange, user: toEconomyUser(user) };
  };

  return runInTransaction(executeReject);
}

module.exports = {
  PAYBACK_DIA_MULTIPLIER,
  PAYBACK_DIA_UNIT_DIVISOR,
  MIN_PAYBACK_AMOUNT_KRW,
  PAYBACK_AMOUNT_STEP_KRW,
  ExchangeServiceError,
  calculateDiaCost,
  normalizeServiceName,
  createPaybackRequest,
  listExchangesByUser,
  listPendingExchanges,
  approveExchange,
  rejectExchange,
};
