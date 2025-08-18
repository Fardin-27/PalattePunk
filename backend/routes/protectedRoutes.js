const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware'); // default export

router.get('/profile', protect, (req, res) => {
  res.json({ message: 'You are authorized ✅', user: req.user });
});

module.exports = router;
