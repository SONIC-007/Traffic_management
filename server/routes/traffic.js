// Traffic Data Routes - live and historical traffic data
const express = require('express');
const router = express.Router();
const TrafficLog = require('../models/TrafficLog');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/traffic/:intersectionId/live - current data
router.get('/:intersectionId/live', authMiddleware, async (req, res, next) => {
  try {
    const latestLog = await TrafficLog.findOne({ intersectionId: req.params.intersectionId })
      .sort({ timestamp: -1 });

    res.json({ success: true, data: latestLog });
  } catch (error) {
    next(error);
  }
});

// GET /api/traffic/:intersectionId/history - historical data
router.get('/:intersectionId/history', authMiddleware, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    const logs = await TrafficLog.find({ intersectionId: req.params.intersectionId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: logs.reverse() });
  } catch (error) {
    next(error);
  }
});

// GET /api/traffic/analytics/summary - aggregated analytics
router.get('/analytics/summary', authMiddleware, async (req, res, next) => {
  try {
    const stats = await TrafficLog.aggregate([
      {
        $group: {
          _id: '$intersectionId',
          avgVehicles: { $avg: '$totalVehicles' },
          maxVehicles: { $max: '$totalVehicles' },
          totalLogs: { $sum: 1 },
          lastUpdate: { $max: '$timestamp' }
        }
      }
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
