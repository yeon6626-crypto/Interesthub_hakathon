const User = require('../models/User');
const { getAdminEmailSet } = require('../utils/adminEmails');

/**
 * JWT 인증(authMiddleware) 이후에 사용.
 * req.adminEmail 에 처리자 이메일을 설정한다.
 */
async function adminMiddleware(req, res, next) {
  try {
    const adminEmails = getAdminEmailSet();

    if (adminEmails.size === 0) {
      return res.status(503).json({
        success: false,
        message:
          '관리자 기능이 설정되지 않았습니다. 서버 .env에 ADMIN_EMAILS를 설정하세요.',
      });
    }

    const user = await User.findById(req.userId).select('email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    const email = user.email.toLowerCase();
    if (!adminEmails.has(email)) {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.',
      });
    }

    req.adminEmail = user.email;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '관리자 인증 중 오류가 발생했습니다.',
    });
  }
}

module.exports = adminMiddleware;
