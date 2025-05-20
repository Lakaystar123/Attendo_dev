const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

// POST /api/v1/attendance/mark - Mark attendance (protected route)
router.post('/mark', auth, async (req, res) => {
  try {
    const { student, date, present, className } = req.body;
    
    // Validate required fields
    if (!student || !date || !className) {
      return res.status(400).json({ message: 'Student, date, and class are required' });
    }

    // Check for existing attendance record
    const existingRecord = await Attendance.findOne({ 
      student, 
      date: new Date(date),
      className 
    });

    if (existingRecord) {
      // Update existing record
      existingRecord.present = present;
      existingRecord.recordedBy = req.user.id;
      await existingRecord.save();
      
      return res.status(200).json({ 
        message: 'Attendance updated successfully',
        attendance: existingRecord
      });
    }

    // Create new attendance record
    const attendance = new Attendance({ 
      student, 
      date: new Date(date),
      present,
      className,
      recordedBy: req.user.id
    });

    await attendance.save();
    res.status(201).json({ 
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error marking attendance', 
      error: err.message 
    });
  }
});

// GET /api/v1/attendance - Get all attendance records (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { date, className, student } = req.query;
    const filter = {};
    
    if (date) filter.date = new Date(date);
    if (className) filter.className = className;
    if (student) filter.student = student;

    const data = await Attendance.find(filter)
      .populate('student', 'name email profileEmoji')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching attendance', 
      error: err.message 
    });
  }
});

// GET /api/v1/attendance/student - Get student's attendance records by month
router.get('/student', auth, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required' });
    }

    // Parse the month string (format: YYYY-MM)
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const attendance = await Attendance.find({
      student: req.user.id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate({
      path: 'className',
      select: 'subject day startTime endTime room'
    })
    .sort({ date: 1 });

    // Transform the data to include subject details
    const formattedAttendance = attendance.map(record => ({
      _id: record._id,
      date: record.date,
      subject: record.className?.subject || 'Unknown',
      day: record.className?.day || 'Unknown',
      time: record.className ? `${record.className.startTime} - ${record.className.endTime}` : 'Unknown',
      room: record.className?.room || 'Unknown',
      status: record.present ? 'present' : 'absent'
    }));

    res.json(formattedAttendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching student attendance', 
      error: err.message 
    });
  }
});

module.exports = router;