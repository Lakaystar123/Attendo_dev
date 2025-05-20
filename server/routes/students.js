const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/v1/students - Get all students
router.get('/', auth, async (req, res) => {
  try {
    // Only teachers can access this route
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ username: 1 });

    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: err.message 
    });
  }
});

module.exports = router; 