const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/v1/classes - Get all classes for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher: req.user.id });
    } else {
      classes = await Class.find({ students: req.user.id });
    }
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching classes', 
      error: err.message 
    });
  }
});

// GET /api/v1/classes/:id/students - Get all students in a class
router.get('/:id/students', auth, async (req, res) => {
  try {
    const classId = req.params.id;
    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has permission to view students
    if (req.user.role !== 'teacher' && !classDoc.students.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this class' });
    }

    const students = await User.find({ _id: { $in: classDoc.students } })
      .select('name email profileEmoji');
    
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: err.message 
    });
  }
});

// POST /api/v1/classes - Create a new class (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create classes' });
    }

    const { name, subject, day, startTime, endTime, room } = req.body;
    
    // Validate required fields
    if (!name || !subject || !day || !startTime || !endTime || !room) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for time conflicts
    const existingClass = await Class.findOne({
      teacher: req.user.id,
      day,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (existingClass) {
      return res.status(400).json({ 
        message: 'Time conflict with existing class' 
      });
    }

    const newClass = new Class({
      name,
      subject,
      day,
      startTime,
      endTime,
      room,
      teacher: req.user.id,
      students: []
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error creating class', 
      error: err.message 
    });
  }
});

// DELETE /api/v1/classes/:id - Delete a class (teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete classes' });
    }

    const classId = req.params.id;
    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }

    await classDoc.remove();
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