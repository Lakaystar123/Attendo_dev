import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axios';
import './Attendance.css';
import { getUpcomingHolidays, formatHolidayMessage } from '../../utils/bhutaneseHolidays';
import BhutaneseCalendar from '../calendar/BhutaneseCalendar';

function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [dismissingNotifications, setDismissingNotifications] = useState(new Set());
  const [holidayNotifications, setHolidayNotifications] = useState([]);
  const [summary, setSummary] = useState({ present: 0, late: 0, absent: 0, total: 0 });

  const getAttendanceSummary = useCallback((attendanceData) => {
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      total: attendanceData.length
    };

    attendanceData.forEach(record => {
      summary[record.status]++;
    });

    return summary;
  }, []);

  // Function to check for upcoming holidays
  const checkUpcomingHolidays = useCallback(() => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const upcomingHolidays = getUpcomingHolidays(today, endOfMonth);
    
    const holidayMessages = upcomingHolidays
      .map(formatHolidayMessage)
      .filter(Boolean);
    
    setHolidayNotifications(holidayMessages);
  }, []);

  useEffect(() => {
    checkUpcomingHolidays();
  }, [checkUpcomingHolidays]);

  const generateNotifications = useCallback((attendanceData) => {
    const newNotifications = [];
    const summary = getAttendanceSummary(attendanceData);
    const totalClasses = summary.present + summary.absent + summary.late;
    const attendancePercentage = totalClasses > 0 ? (summary.present / totalClasses) * 100 : 0;
    const latePercentage = totalClasses > 0 ? (summary.late / totalClasses) * 100 : 0;

    // Add holiday notifications
    holidayNotifications.forEach(holiday => {
      newNotifications.push(holiday);
    });

    // General reminder
    newNotifications.push({
      type: 'reminder',
      message: "Don't forget to mark your attendance! Stay consistent and avoid falling below the required percentage.",
      icon: '📝'
    });

    // Low attendance alert
    if (attendancePercentage < 75) {
      newNotifications.push({
        type: 'warning',
        message: "Heads up! Your attendance has dropped below the safe limit. Consider attending more sessions to avoid penalties.",
        icon: '⚠️'
      });
    }

    // Late arrival warning
    if (latePercentage > 20) {
      newNotifications.push({
        type: 'alert',
        message: "You've checked in late frequently. Frequent late arrivals may affect your attendance score.",
        icon: '⏰'
      });
    }

    setNotifications(newNotifications);
  }, [getAttendanceSummary, holidayNotifications]);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/attendance/student?month=${selectedMonth}`);
      
      // Extract unique subjects from attendance data
      const uniqueSubjects = [...new Set(response.data.map(record => record.subject))];
      setSubjects(uniqueSubjects);
      
      // Filter attendance based on selected subject
      const filteredAttendance = selectedSubject
        ? response.data.filter(record => record.subject === selectedSubject)
        : response.data;
      
      setAttendance(filteredAttendance);
      setSummary(getAttendanceSummary(filteredAttendance));
      generateNotifications(filteredAttendance);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to fetch attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedSubject, getAttendanceSummary, generateNotifications]);

  // Add polling effect
  useEffect(() => {
    fetchAttendance();
    
    // Set up polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchAttendance();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [fetchAttendance]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'green';
      case 'absent':
        return 'red';
      case 'late':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const dismissNotification = (index) => {
    // Add the notification to the dismissing set
    setDismissingNotifications(prev => new Set([...prev, index]));
    
    // Wait for the animation to complete before removing the notification
    setTimeout(() => {
      setNotifications(prevNotifications => 
        prevNotifications.filter((_, i) => i !== index)
      );
      setDismissingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 300); // Match this with the CSS animation duration
  };

  if (loading) {
    return (
      <div className="attendance-container">
        <div className="attendance-loading">
          <div className="loading-spinner"></div>
          <p>Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-main">
        <div className="attendance-container">
          <div className="attendance-header">
            <h2>My Attendance</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Notifications Section */}
          {notifications.length > 0 && (
            <div className="notifications-container">
              {notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={`notification ${notification.type} ${
                    dismissingNotifications.has(index) ? 'dismissing' : ''
                  }`}
                >
                  <span className="notification-icon">{notification.icon}</span>
                  <p className="notification-message">{notification.message}</p>
                  <button 
                    className="notification-close"
                    onClick={() => dismissNotification(index)}
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="attendance-controls">
            <div className="date-selector">
              <label htmlFor="month">Month:</label>
              <input
                type="month"
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="subject-selector">
              <label htmlFor="subject">Subject:</label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="attendance-summary">
            <div className="summary-card">
              <h3>Present</h3>
              <p>{summary.present}</p>
            </div>
            <div className="summary-card">
              <h3>Late</h3>
              <p>{summary.late}</p>
            </div>
            <div className="summary-card">
              <h3>Absent</h3>
              <p>{summary.absent}</p>
            </div>
            <div className="summary-card">
              <h3>Total</h3>
              <p>{summary.total}</p>
            </div>
          </div>

          <div className="attendance-list">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(record => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.subject}</td>
                    <td>{record.day}</td>
                    <td>{record.time}</td>
                    <td>{record.room}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-records">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="attendance-sidebar">
        <BhutaneseCalendar />
      </div>
    </div>
  );
}

export default StudentAttendance; 