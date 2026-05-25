const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getMe,
  updateMe,
  syncEconomy,
  getRoadmap,
  completeCourse,
  uncompleteCourse,
  getQuests,
  completeQuest,
  spendCoins,
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/economy', syncEconomy);
router.get('/roadmap', getRoadmap);
router.post('/courses/:courseId/complete', completeCourse);
router.post('/courses/:courseId/uncomplete', uncompleteCourse);
router.get('/quests', getQuests);
router.post('/quests/:questId/complete', completeQuest);
router.post('/spend-coins', spendCoins);

module.exports = router;
