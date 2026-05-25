const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const EXP_CAP = 4000;

function toSafeUser(user) {
  const expToNext = EXP_CAP;
  return {
    _id: user._id,
    email: user.email,
    nickname: user.nickname,
    major: user.major,
    grade: user.grade,
    targetClass: user.targetClass,
    level: user.level,
    exp: user.exp,
    expToNext,
    gold: user.gold,
    coin: user.coin,
    reputation: user.reputation,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  login,
};
