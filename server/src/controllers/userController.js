const User = require('../models/User');

const DUPLICATE_FIELD_MESSAGES = {
  email: '이미 존재하는 이메일입니다.',
  nickname: '이미 존재하는 모험가 이름입니다.',
  username: '이미 존재하는 모험가 이름입니다.',
};

function toSafeUser(user) {
  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
}

function handleUserError(error, res) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors)
        .map((err) => err.message)
        .join(', '),
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message:
        DUPLICATE_FIELD_MESSAGES[field] ||
        `이미 사용 중인 값입니다. (${field})`,
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid user id',
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message,
  });
}

async function getUsers(req, res) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    handleUserError(error, res);
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    handleUserError(error, res);
  }
}

async function createUser(req, res) {
  try {
    const { email, password, nickname, major, grade, targetClass } = req.body

    // 구버전 클라이언트가 username만 보낼 수 있어 nickname으로만 폴백
    const nicknameInput = nickname ?? req.body.username

    if (!email || !nicknameInput || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일, 모험가 이름, 비밀번호는 필수 입력 항목입니다.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedNickname = String(nicknameInput).trim()

    const existingEmailUser = await User.findOne({ email: normalizedEmail })
    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        message: DUPLICATE_FIELD_MESSAGES.email,
      })
    }

    const existingNicknameUser = await User.findOne({
      nickname: normalizedNickname,
    })
    if (existingNicknameUser) {
      return res.status(409).json({
        success: false,
        message: DUPLICATE_FIELD_MESSAGES.nickname,
      })
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      nickname: normalizedNickname,
      major,
      grade,
      targetClass,
      coin: 250,
      gold: 100,
    })

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: toSafeUser(user),
    })
  } catch (error) {
    handleUserError(error, res)
  }
}

async function updateUser(req, res) {
  try {
    const {
      email,
      password,
      nickname,
      username,
      major,
      grade,
      targetClass,
      level,
      exp,
      gold,
      coin,
      reputation,
    } = req.body;

    const updateData = {};

    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (username !== undefined && nickname === undefined) {
      updateData.nickname = username;
    }
    if (major !== undefined) updateData.major = major;
    if (grade !== undefined) updateData.grade = grade;
    if (targetClass !== undefined) updateData.targetClass = targetClass;
    if (level !== undefined) updateData.level = level;
    if (exp !== undefined) updateData.exp = exp;
    if (gold !== undefined) updateData.gold = gold;
    if (coin !== undefined) updateData.coin = coin;
    if (reputation !== undefined) updateData.reputation = reputation;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required to update',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    handleUserError(error, res);
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: user,
    });
  } catch (error) {
    handleUserError(error, res);
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
