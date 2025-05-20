const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Class = require('../models/Class');
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

// Create a new class
router.post('/classes', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    // Create new class
    const newClass = new Class({
      name,
      description,
      teacher: req.user._id,
      students: []
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Error creating class' });
  }
});

// Get teacher's classes
router.get('/classes', auth, async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user._id })
      .populate('students', 'name email profileEmoji')
      .sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

// Get students in a class
router.get('/classes/:classId/students', auth, async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.classId,
      teacher: req.user._id
    }).populate('students', 'name email profileEmoji');

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classData.students);
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ message: 'Error fetching class students' });
  }
});

// Add student to class
router.post('/classes/:classId/students', auth, async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const classData = await Class.findOne({
      _id: req.params.classId,
      teacher: req.user._id
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if student exists
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student is already in the class
    if (classData.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already in this class' });
    }

    // Add student to class
    classData.students.push(studentId);
    await classData.save();

    res.json(classData);
  } catch (error) {
    console.error('Error adding student to class:', error);
    res.status(500).json({ message: 'Error adding student to class' });
  }
});

// Remove student from class
router.delete('/classes/:classId/students/:studentId', auth, async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.classId,
      teacher: req.user._id
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove student from class
    classData.students = classData.students.filter(
      student => student.toString() !== req.params.studentId
    );

    await classData.save();
    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error('Error removing student from class:', error);
    res.status(500).json({ message: 'Error removing student from class' });
  }
});

// Get class schedule
router.get('/classes/:classId/schedule', auth, async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.classId,
      teacher: req.user._id
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Separate static and dynamic schedules
    const staticSchedules = classData.schedule.filter(s => !s.isDynamic);
    const dynamicSchedules = classData.schedule.filter(s => s.isDynamic);

    res.json({
      static: staticSchedules,
      dynamic: dynamicSchedules
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Error fetching schedule' });
  }
});

// Add schedule
router.post('/classes/:classId/schedule', auth, async (req, res) => {
  try {
    const { dayOfWeek, date, startTime, endTime, room, isDynamic } = req.body;

    const classData = await Class.findOne({
      _id: req.params.classId,
      teacher: req.user._id
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Validate schedule data
    if (isDynamic && !date) {
      return res.status(400).json({ message: 'Date is required for dynamic schedules' });
    }

    if (!isDynamic && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
      return res.status(400).json({ message: 'Invalid day of week' });
    }

    // Check for schedule conflicts
    const scheduleDate = isDynamic ? new Date(date) : null;
    const hasConflict = classData.schedule.some(schedule => {
      if (isDynamic) {
        return schedule.isDynamic && 
               schedule.date.toDateString() === scheduleDate.toDateString() &&
               ((startTime >= schedule.startTime && startTime < schedule.endTime) ||
                (endTime > schedule.startTime && endTime <= schedule.endTime));
      } else {
        return !schedule.isDynamic &&
               schedule.dayOfWeek === dayOfWeek &&
               ((startTime >= schedule.startTime && startTime < schedule.endTime) ||
                (endTime > schedule.startTime && endTime <= schedule.endTime));
      }
    });

    if (hasConflict) {
      return res.status(400).json({ message: 'Schedule conflict detected' });
    }

    // Add new schedule
    classData.schedule.push({
      dayOfWeek,
      date: scheduleDate,
      startTime,
      endTime,
      room,
      isDynamic
    });

    await classData.save();
    res.json(classData);
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ message: 'Error adding schedule' });
  }
});

// Delete schedule
router.delete('/classes/:classId/schedule/:scheduleId', auth, async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.classId,
      teacher: req.user._id
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    classData.schedule = classData.schedule.filter(
      schedule => schedule._id.toString() !== req.params.scheduleId
    );

    await classData.save();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Error deleting schedule' });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    
    // Get today's classes
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayStr = today.toISOString().split('T')[0];
    
    const todayClasses = await Class.find({
      teacher: req.user._id,
      $or: [
        { 'schedule.dayOfWeek': dayOfWeek },
        { 'schedule.date': { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }
      ]
    });

    // Get upcoming classes (next 7 days)
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingClasses = await Class.find({
      teacher: req.user._id,
      $or: [
        { 'schedule.dayOfWeek': { $in: Array.from({ length: 7 }, (_, i) => (dayOfWeek + i) % 7) } },
        { 'schedule.date': { $gte: today, $lt: nextWeek } }
      ]
    });

    // Get recent activity
    const recentAttendance = await Attendance.find({ teacher: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name profileEmoji');

    const recentLeaves = await Leave.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name profileEmoji');

    const recentActivity = [
      ...recentAttendance.map(record => ({
        type: 'attendance',
        timestamp: record.createdAt,
        details: `${record.student.name} marked as ${record.status}`,
        emoji: record.student.profileEmoji
      })),
      ...recentLeaves.map(leave => ({
        type: 'leave',
        timestamp: leave.createdAt,
        details: `${leave.student.name} requested leave for ${leave.startDate} to ${leave.endDate}`,
        emoji: leave.student.profileEmoji
      }))
    ].sort((a, b) => b.timestamp - a.timestamp)
     .slice(0, 5);

    res.json({
      totalStudents,
      pendingLeaves,
      todayClasses: todayClasses.length,
      upcomingClasses: upcomingClasses.length,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Delete class
router.delete('/classes/:classId', auth, async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.classId,
      teacher: req.user._id
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Delete all attendance records for this class
    await Attendance.deleteMany({ className: req.params.classId });

    // Delete the class
    await classData.deleteOne();

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Error deleting class' });
  }
});

module.exports = router; 