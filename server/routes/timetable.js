const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// GET /api/v1/timetable - Get all classes for the teacher
router.get('/', auth, async (req, res) => {
  try {
    let timetable;
    
    if (req.user.role === 'teacher') {
      // Teachers see only their classes
      timetable = await Timetable.find({ teacher: req.user.id })
        .sort({ day: 1, startTime: 1 });
    } else if (req.user.role === 'student') {
      // Students see all classes
      timetable = await Timetable.find()
        .populate('teacher', 'username')
        .sort({ day: 1, startTime: 1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching timetable', 
      error: err.message 
    });
  }
});

// GET /api/v1/timetable/student - Get student's schedule
router.get('/student', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all timetable entries
    const timetable = await Timetable.find()
      .populate('teacher', 'name')
      .populate('class', 'name subject')
      .sort({ day: 1, startTime: 1 });

    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching student schedule', 
      error: err.message 
    });
  }
});

// POST /api/v1/timetable - Create a new class
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create classes' });
    }

    const { subject, day, startTime, endTime, room, classId } = req.body;

    // Validate required fields
    if (!subject || !day || !startTime || !endTime || !room || !classId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:mm format' });
    }

    // Validate that end time is after start time
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check if class exists and belongs to the teacher
    const classDoc = await Class.findOne({
      _id: classId,
      teacher: req.user.id
    });

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found or you are not authorized' });
    }

    // Check for room conflicts
    const roomConflict = await Timetable.findOne({
      day,
      room,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (roomConflict) {
      return res.status(400).json({ 
        message: 'Room conflict: Another class is scheduled in this room during this time' 
      });
    }

    // Check for teacher conflicts
    const teacherConflict = await Timetable.findOne({
      day,
      teacher: req.user.id,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (teacherConflict) {
      return res.status(400).json({ 
        message: 'Schedule conflict: You already have a class scheduled during this time' 
      });
    }

    // Create timetable entry
    const timetableEntry = new Timetable({
      subject,
      day,
      startTime,
      endTime,
      room,
      teacher: req.user.id,
      class: classId
    });

    await timetableEntry.save();
    res.status(201).json(timetableEntry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error creating class', 
      error: err.message 
    });
  }
});

// DELETE /api/v1/timetable/:id - Delete a class
router.delete('/:id', auth, async (req, res) => {
  try {
    const classToDelete = await Timetable.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!classToDelete) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Delete both timetable entry and corresponding class record
    await Timetable.findByIdAndDelete(req.params.id);
    await Class.findOneAndDelete({
      subject: classToDelete.subject,
      day: classToDelete.day,
      startTime: classToDelete.startTime,
      endTime: classToDelete.endTime,
      room: classToDelete.room,
      teacher: req.user.id
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error deleting class', 
      error: err.message 
    });
  }
});

module.exports = router;