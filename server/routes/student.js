// Get student dashboard statistics
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get total classes
    const totalClasses = await Class.countDocuments({
      _id: { $in: req.user.classes }
    });

    // Calculate attendance percentage
    const attendanceRecords = await Attendance.find({
      student: studentId
    }).populate('class');

    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const attendancePercentage = totalAttendance > 0 
      ? Math.round((presentCount / totalAttendance) * 100) 
      : 0;

    // Get today's classes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayClasses = await Class.countDocuments({
      _id: { $in: req.user.classes },
      schedule: {
        $elemMatch: {
          dayOfWeek: today.getDay(),
          startTime: { $lte: today.toISOString() },
          endTime: { $gte: today.toISOString() }
        }
      }
    });

    // Get upcoming classes (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingClasses = await Class.countDocuments({
      _id: { $in: req.user.classes },
      schedule: {
        $elemMatch: {
          startTime: { $gte: today.toISOString(), $lte: nextWeek.toISOString() }
        }
      }
    });

    // Get recent activity
    const recentActivity = await Promise.all([
      // Recent attendance records
      ...(await Attendance.find({ student: studentId })
        .sort({ date: -1 })
        .limit(3)
        .populate('class', 'name')
        .lean()
        .map(record => ({
          icon: '✓',
          text: `Attendance marked ${record.status} for ${record.class.name}`,
          time: new Date(record.date).toLocaleString()
        }))),
      // Recent leave applications
      ...(await Leave.find({ student: studentId })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('class', 'name')
        .lean()
        .map(leave => ({
          icon: '📝',
          text: `Leave application ${leave.status} for ${leave.class.name}`,
          time: new Date(leave.createdAt).toLocaleString()
        })))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    res.json({
      totalClasses,
      attendancePercentage,
      todayClasses,
      upcomingClasses,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching student dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
}); 