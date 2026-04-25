// Signal Control Routes - manage traffic signal timings
const express = require('express');
const router = express.Router();
const Intersection = require('../models/Intersection');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/rbac');

// GET /api/signals/:intersectionId - get current signal config
router.get('/:intersectionId', authMiddleware, async (req, res, next) => {
  try {
    const intersection = await Intersection.findById(req.params.intersectionId);
    if (!intersection) {
      return res.status(404).json({ success: false, message: 'Intersection not found' });
    }

    res.json({
      success: true,
      data: {
        mode: intersection.mode,
        timings: intersection.currentTimings
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/signals/:intersectionId - manual override (admin only)
router.put('/:intersectionId', authMiddleware, authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const { timings, mode } = req.body;

    const update = {};
    if (timings) update.currentTimings = timings;
    if (mode) update.mode = mode;

    const intersection = await Intersection.findByIdAndUpdate(
      req.params.intersectionId,
      update,
      { new: true }
    );

    if (!intersection) {
      return res.status(404).json({ success: false, message: 'Intersection not found' });
    }

    res.json({ success: true, data: intersection });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
