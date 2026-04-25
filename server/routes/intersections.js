// Intersection Routes - CRUD operations
// Demonstrates: express.Router, GET/POST/PUT/DELETE, RBAC, async/await

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Intersection = require('../models/Intersection');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/rbac');

// GET /api/intersections - list all (any authenticated user)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const intersections = await Intersection.find().sort({ name: 1 });
    res.json({ success: true, data: intersections });
  } catch (error) {
    next(error);
  }
});

// GET /api/intersections/:id - get one
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const intersection = await Intersection.findById(req.params.id);
    if (!intersection) {
      return res.status(404).json({ success: false, message: 'Intersection not found' });
    }
    res.json({ success: true, data: intersection });
  } catch (error) {
    next(error);
  }
});

// POST /api/intersections - create (admin only)
router.post('/', authMiddleware, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const intersection = await Intersection.create(req.body);
    res.status(201).json({ success: true, data: intersection });
  } catch (error) {
    next(error);
  }
});

// PUT /api/intersections/:id - update (operator+)
router.put('/:id', authMiddleware, authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const intersection = await Intersection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!intersection) {
      return res.status(404).json({ success: false, message: 'Intersection not found' });
    }
    res.json({ success: true, data: intersection });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/intersections/:id - delete (admin only)
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res, next) => {
  try {
    const intersection = await Intersection.findByIdAndDelete(req.params.id);
    if (!intersection) {
      return res.status(404).json({ success: false, message: 'Intersection not found' });
    }
    res.json({ success: true, message: 'Intersection deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
