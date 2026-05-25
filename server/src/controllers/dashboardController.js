const User = require('../models/User');
const Course = require('../models/Course');
const UserCourse = require('../models/UserCourse');
const Quest = require('../models/Quest');
const { seedDatabase } = require('../data/seedData');

const EXP_PER_LEVEL = 4000;
const LEVEL_MILESTONE_COIN_REWARD = 500;
const GACHA_COST = 500;
const CREDITS_PER_COURSE = 3;

const YEAR_TAB_LABELS = {
  1: '1차 (1학년)',
  2: '2차 (2학년)',
  3: '3차 (3학년)',
  4: '4차 (4학년)',
};

const DEFAULT_YEAR_BY_TYPE = {
  FOUNDATION: 1,
  CORE: 2,
  SPECIALIZATION: 4,
};

const COURSE_YEAR_BY_CODE = {
  gen_chem: 1,
  basic_ecology: 1,
  circuit_1: 2,
  electro_1: 2,
  linear_algebra: 2,
  renewable_energy: 3,
  env_policy: 3,
  ecotoxicology: 4,
  green_tech: 4,
};

function resolveAcademicYear(course) {
  if (course.academicYear) return course.academicYear;
  if (course.courseCode && COURSE_YEAR_BY_CODE[course.courseCode]) {
    return COURSE_YEAR_BY_CODE[course.courseCode];
  }
  return DEFAULT_YEAR_BY_TYPE[course.courseType] || 1;
}

function getExpForNextLevel() {
  return EXP_PER_LEVEL;
}

function applyExpGain(user, expGain) {
  user.exp += expGain;
  let needed = getExpForNextLevel();
  const milestones = [];

  while (user.exp >= needed) {
    user.exp -= needed;
    user.level += 1;

    if (user.level % 5 === 0) {
      user.coin += LEVEL_MILESTONE_COIN_REWARD;
      milestones.push(user.level);
    }

    needed = getExpForNextLevel();
  }

  return milestones;
}

async function ensureSeedData() {
  await seedDatabase();
}

async function syncUserCourseProgress(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  if (!user.courseProgressMigrated) {
    await UserCourse.updateMany({ userId }, { $set: { status: 'AVAILABLE' } });
    user.courseProgressMigrated = true;
    await user.save();
  }

  const courses = await Course.find().sort({ academicYear: 1, courseCode: 1 });
  const progressList = await UserCourse.find({ userId });
  const existingIds = new Set(progressList.map((p) => p.courseId.toString()));

  if (progressList.length === 0) {
    const records = courses.map((course) => ({
      userId,
      courseId: course._id,
      status: 'AVAILABLE',
    }));
    await UserCourse.insertMany(records);
  } else {
    const missingCourses = courses.filter(
      (course) => !existingIds.has(course._id.toString())
    );

    if (missingCourses.length > 0) {
      const records = missingCourses.map((course) => ({
        userId,
        courseId: course._id,
        status: 'AVAILABLE',
      }));
      await UserCourse.insertMany(records);
    }
  }

  await refreshCourseAvailability(userId);
}

async function refreshCourseAvailability(userId) {
  const progressList = await UserCourse.find({ userId });

  for (const progress of progressList) {
    if (progress.status === 'LOCKED') {
      progress.status = 'AVAILABLE';
      await progress.save();
    }
  }
}

function toSafeUser(user) {
  const expToNext = getExpForNextLevel();
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
  };
}

async function getMe(req, res) {
  try {
    await ensureSeedData();
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await syncUserCourseProgress(user._id);

    res.json({ success: true, data: toSafeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getRoadmap(req, res) {
  try {
    await ensureSeedData();
    await syncUserCourseProgress(req.userId);

    const courses = await Course.find().sort({ academicYear: 1, courseCode: 1 });
    const progressList = await UserCourse.find({ userId: req.userId });
    const progressMap = new Map(
      progressList.map((p) => [p.courseId.toString(), p.status])
    );

    const courseByCode = new Map(courses.map((c) => [c.courseCode, c]));
    const grouped = {};

    courses.forEach((course) => {
      const status = progressMap.get(course._id.toString()) || 'AVAILABLE';
      const year = resolveAcademicYear(course);

      if (!grouped[year]) {
        grouped[year] = {
          year,
          title: YEAR_TAB_LABELS[year] || `${year}학년`,
          items: [],
        };
      }

      let prerequisiteLabel = null;
      if (course.prerequisiteCode) {
        const prereq = courseByCode.get(course.prerequisiteCode);
        const prereqName = prereq?.nameKo || prereq?.name || course.prerequisiteCode;
        prerequisiteLabel = `[${prereqName}] 마스터 필요`;
      }

      const displayName = course.nameKo
        ? `${course.name} (${course.nameKo})`
        : course.name;

      grouped[year].items.push({
        _id: course._id,
        courseCode: course.courseCode,
        name: course.name,
        nameKo: course.nameKo,
        displayName,
        icon: course.icon || '📘',
        status,
        rewardExp: course.rewardExp,
        rewardGold: course.rewardGold,
        isCompleted: status === 'COMPLETED',
        locked: status === 'LOCKED',
        available: status !== 'COMPLETED',
        prerequisiteLabel,
      });
    });

    const years = [1, 2, 3, 4].map((year) => {
      const yearData = grouped[year] || {
        year,
        title: YEAR_TAB_LABELS[year],
        items: [],
      };
      const total = yearData.items.length;
      const completed = yearData.items.filter(
        (item) => item.isCompleted || item.status === 'COMPLETED'
      ).length;

      return {
        ...yearData,
        mastered: total > 0 && completed === total,
        progress: { completed, total },
      };
    });

    res.json({
      success: true,
      data: years,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function completeCourse(req, res) {
  try {
    const { courseId } = req.params;
    const progress = await UserCourse.findOne({
      userId: req.userId,
      courseId,
    }).populate('courseId');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: '과목 진행 정보를 찾을 수 없습니다.',
      });
    }

    if (progress.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: '이미 이수 완료한 과목입니다.',
      });
    }

    if (progress.status === 'LOCKED') {
      progress.status = 'AVAILABLE';
    }

    const user = await User.findById(req.userId);
    const course = progress.courseId;

    progress.status = 'COMPLETED';
    await progress.save();

    applyExpGain(user, course.rewardExp);
    user.gold += course.rewardGold;
    user.reputation += 5;
    await user.save();

    await refreshCourseAvailability(req.userId);

    res.json({
      success: true,
      message: `${course.name} 이수 완료! +${CREDITS_PER_COURSE} SP, +${course.rewardExp} EXP, +${course.rewardGold} 다이아`,
      data: { user: toSafeUser(user), creditsAdded: CREDITS_PER_COURSE },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function uncompleteCourse(req, res) {
  try {
    const { courseId } = req.params;
    const progress = await UserCourse.findOne({
      userId: req.userId,
      courseId,
    }).populate('courseId');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: '과목 진행 정보를 찾을 수 없습니다.',
      });
    }

    if (progress.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: '아직 마스터하지 않은 과목입니다.',
      });
    }

    const course = progress.courseId;
    progress.status = 'AVAILABLE';
    await progress.save();

    const user = await User.findById(req.userId);

    res.json({
      success: true,
      message: `${course.name} 이수 취소! -${CREDITS_PER_COURSE} SP`,
      data: { user: toSafeUser(user), creditsRemoved: CREDITS_PER_COURSE },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getQuests(req, res) {
  try {
    await ensureSeedData();
    const user = await User.findById(req.userId);

    const quests = await Quest.find().sort({ questType: 1 });

    const filtered = quests.filter((quest) => {
      if (quest.targetClass === 'ALL') return true;
      if (user.targetClass === '정해지지 않음') return true;
      return quest.targetClass === user.targetClass;
    });

    res.json({
      success: true,
      data: filtered.map((q) => ({
        _id: q._id,
        questCode: q.questCode,
        questType: q.questType,
        title: q.title,
        targetClass: q.targetClass,
        rewardExp: q.rewardExp,
        rewardCoin: q.rewardCoin,
        typeLabel: q.questType === 'DAILY' ? 'Daily Quest' : 'Weekly Quest',
        rewardLabel: `${q.rewardExp} EXP / ${q.rewardCoin} Coins`,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function completeQuest(req, res) {
  try {
    const quest = await Quest.findById(req.params.questId);

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: '퀘스트를 찾을 수 없습니다.',
      });
    }

    const user = await User.findById(req.userId);

    const milestones = applyExpGain(user, quest.rewardExp);
    user.coin += quest.rewardCoin;
    user.reputation += 1;
    await user.save();

    let message = `퀘스트 완료! +${quest.rewardExp} EXP, +${quest.rewardCoin} Coin, +1 명성치`;
    if (milestones.length > 0) {
      const levels = milestones.join(', ');
      message += ` · Lv.${levels} 달성 보상 +${LEVEL_MILESTONE_COIN_REWARD * milestones.length} 코인`;
    }

    res.json({
      success: true,
      message,
      data: { user: toSafeUser(user), levelMilestones: milestones },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function spendCoins(req, res) {
  try {
    const { amount } = req.body;
    const spendAmount = amount || GACHA_COST;

    const user = await User.findById(req.userId);

    if (user.coin < spendAmount) {
      return res.status(400).json({
        success: false,
        message: `코인이 부족합니다. (필요: ${spendAmount}, 보유: ${user.coin})`,
      });
    }

    user.coin -= spendAmount;
    await user.save();

    res.json({
      success: true,
      message: `${spendAmount} 코인이 사용되었습니다.`,
      data: { user: toSafeUser(user) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function syncEconomy(req, res) {
  try {
    const { level, exp, gold, coin, reputation } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (level !== undefined) {
      user.level = Math.max(1, Number(level) || 1);
    }
    if (exp !== undefined) {
      user.exp = Math.max(0, Number(exp) || 0);
    }
    if (gold !== undefined) {
      user.gold = Math.max(0, Number(gold) || 0);
    }
    if (coin !== undefined) {
      user.coin = Math.max(0, Number(coin) || 0);
    }
    if (reputation !== undefined) {
      user.reputation = Math.max(0, Number(reputation) || 0);
    }

    await user.save();

    res.json({
      success: true,
      message: '재화가 저장되었습니다.',
      data: toSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateMe(req, res) {
  try {
    const { nickname, major, grade, targetClass, password } = req.body;
    const updateData = {};

    if (nickname !== undefined) updateData.nickname = nickname.trim();
    if (major !== undefined) updateData.major = major;
    if (grade !== undefined) updateData.grade = grade;
    if (targetClass !== undefined) updateData.targetClass = targetClass;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 항목을 입력해주세요.',
      });
    }

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: '프로필이 저장되었습니다.',
      data: toSafeUser(user),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(', '),
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getMe,
  updateMe,
  syncEconomy,
  getRoadmap,
  completeCourse,
  uncompleteCourse,
  getQuests,
  completeQuest,
  spendCoins,
  GACHA_COST,
};
