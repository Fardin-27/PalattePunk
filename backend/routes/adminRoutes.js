const express = require('express');
const router = express.Router();
const { createAdmin } = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Route: Create new Admin (admin-only)
router.post('/create', protect, isAdmin, createAdmin);

module.exports = router;
