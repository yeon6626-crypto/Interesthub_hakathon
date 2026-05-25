const Course = require('../models/Course');
const Quest = require('../models/Quest');

const COURSES = [
  {
    courseCode: 'gen_chem',
    name: 'General Chemistry',
    nameKo: '일반화학',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'FOUNDATION',
    academicYear: 1,
    icon: '🧪',
    rewardExp: 80,
    rewardGold: 50,
  },
  {
    courseCode: 'basic_ecology',
    name: 'Basic Ecology',
    nameKo: '기초생태학',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'FOUNDATION',
    academicYear: 1,
    icon: '🌿',
    rewardExp: 80,
    rewardGold: 50,
  },
  {
    courseCode: 'circuit_1',
    name: 'Circuit Theory 1',
    nameKo: '회로이론 1',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'CORE',
    academicYear: 2,
    icon: '🔋',
    rewardExp: 120,
    rewardGold: 80,
  },
  {
    courseCode: 'electro_1',
    name: 'Electromagnetics 1',
    nameKo: '전자기학 1',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'CORE',
    academicYear: 2,
    icon: '🧲',
    rewardExp: 120,
    rewardGold: 80,
  },
  {
    courseCode: 'linear_algebra',
    name: 'Linear Algebra',
    nameKo: '선형대수학',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'CORE',
    academicYear: 2,
    icon: '📐',
    rewardExp: 100,
    rewardGold: 70,
  },
  {
    courseCode: 'renewable_energy',
    name: 'Renewable Energy Engineering',
    nameKo: '재생에너지공학',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'CORE',
    academicYear: 3,
    icon: '☀️',
    rewardExp: 150,
    rewardGold: 100,
  },
  {
    courseCode: 'env_policy',
    name: 'Environmental Policy',
    nameKo: '환경정책',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'CORE',
    academicYear: 3,
    icon: '📋',
    rewardExp: 160,
    rewardGold: 100,
  },
  {
    courseCode: 'ecotoxicology',
    name: 'Ecotoxicology',
    nameKo: '에코독성학',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'SPECIALIZATION',
    academicYear: 4,
    icon: '💉',
    prerequisiteCode: 'gen_chem',
    rewardExp: 180,
    rewardGold: 120,
  },
  {
    courseCode: 'green_tech',
    name: 'Green Technology',
    nameKo: '그린테크놀로지',
    majorCategory: 'School of Electronics Engineering',
    courseType: 'SPECIALIZATION',
    academicYear: 4,
    icon: '🌱',
    rewardExp: 200,
    rewardGold: 150,
  },
];

const QUESTS = [
  {
    questCode: 'daily_study',
    questType: 'DAILY',
    title: '2시간 공부하기',
    targetClass: 'ALL',
    rewardExp: 500,
    rewardCoin: 10,
  },
  {
    questCode: 'daily_exercise',
    questType: 'DAILY',
    title: '1시간 운동하기',
    targetClass: 'ALL',
    rewardExp: 400,
    rewardCoin: 10,
  },
  {
    questCode: 'weekly_study',
    questType: 'WEEKLY',
    title: '주 5회 공부',
    targetClass: 'ALL',
    rewardExp: 1500,
    rewardCoin: 30,
  },
  {
    questCode: 'weekly_exercise',
    questType: 'WEEKLY',
    title: '주 3~4회 운동',
    targetClass: 'ALL',
    rewardExp: 1200,
    rewardCoin: 25,
  },
];

const DEPRECATED_QUEST_CODES = [
  'daily_rlc',
  'weekly_solar',
  'daily_embedded',
  'weekly_backend',
];

async function seedDatabase() {
  for (const course of COURSES) {
    await Course.findOneAndUpdate({ courseCode: course.courseCode }, course, {
      upsert: true,
      new: true,
    });
  }

  for (const quest of QUESTS) {
    await Quest.findOneAndUpdate({ questCode: quest.questCode }, quest, {
      upsert: true,
      new: true,
    });
  }

  await Quest.deleteMany({ questCode: { $in: DEPRECATED_QUEST_CODES } });
}

module.exports = { seedDatabase, COURSES, QUESTS };
