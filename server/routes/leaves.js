const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const Class = require('../models/Class');
const auth = require('../middleware/auth');

// Apply for leave (Student only)
router.post('/apply', auth, async (req, res) => {
  try {
    const { type, startDate, endDate, reason, classes } = req.body;

    // Log the incoming request
    console.log('Leave application request:', {
      userId: req.user.id,
      type,
      startDate,
      endDate,
      reason,
      classes
    });

    // Basic validation
    if (!type || !startDate || !endDate || !reason || !classes || classes.length === 0) {
      return res.status(400).json({ 
        message: 'All fields are required: type, startDate, endDate, reason, and at least one class' 
      });
    }

    // Create leave object
    const leaveData = {
      student: req.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      classes,
      status: 'pending'
    };

    console.log('Creating leave with data:', leaveData);

    // Create and save leave
    const leave = new Leave(leaveData);
    const savedLeave = await leave.save();

    console.log('Leave saved successfully:', savedLeave._id);

    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave: savedLeave
    });
  } catch (error) {
    console.error('Leave application error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      userId: req.user?.id
    });

    // Send appropriate error response
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        error: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: 'Error submitting leave application',
      error: error.message 
    });
  }
});

// Get student's leave applications
router.get('/my-leaves', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const leaves = await Leave.find({ student: req.user.id })
      .populate('classes', 'name subject day startTime endTime room')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave applications' });
  }
});

// Get all leave applications (Teacher only)
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const leaves = await Leave.find()
      .populate('student', 'username email profileEmoji')
      .populate('classes', 'name subject day startTime endTime room')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave applications' });
  }
});

// Update leave status (Teacher only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave application not found' });
    }

    // Update leave status and comment
    leave.status = status;
    if (comment) {
      leave.teacherComment = comment;
    }

    await leave.save();

    // Populate details before sending response
    await leave.populate('student', 'username email profileEmoji');
    await leave.populate('classes', 'name subject day startTime endTime room');

    res.json({
      message: `Leave application ${status} successfully`,
      leave
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ 
      message: 'Error updating leave status',
      error: error.message 
    });
  }
});

module.exports = router; 