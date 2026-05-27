const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');

const dashboardRoutes = require('./dashboardRoutes');
const exchangeRoutes = require('./exchangeRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/exchanges', exchangeRoutes);

module.exports = router;