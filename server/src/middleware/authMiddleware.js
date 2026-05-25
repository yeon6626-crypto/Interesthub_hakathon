const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '로그인이 필요합니다.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
    });
  }
}

module.exports = authMiddleware;
