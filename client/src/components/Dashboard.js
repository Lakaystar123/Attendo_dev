import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    presentDays: 0,
    absentDays: 0,
    totalStudents: 0
  });
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/users/profile');
      setUserData(response.data);
      setRetryCount(0); // Reset retry count on success
      
      // Fetch stats based on user role
      if (response.data.role === 'student') {
        // Get current month's attendance
        const currentDate = new Date();
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const attendanceResponse = await axios.get(`/attendance/student?month=${month}`);
        
        // Calculate stats from attendance data
        const attendanceData = attendanceResponse.data;
        const presentCount = attendanceData.filter(record => record.status === 'present').length;
        const absentCount = attendanceData.filter(record => record.status === 'absent').length;
        
        setStats({
          totalClasses: attendanceData.length,
          presentDays: presentCount,
          absentDays: absentCount
        });
      } else if (response.data.role === 'teacher') {
        // Get classes for the teacher
        const classesResponse = await axios.get('/classes');
        const classes = classesResponse.data;
        
        // Get total students across all classes
        const studentsCount = classes.reduce((total, cls) => total + (cls.students?.length || 0), 0);
        
        setStats({
          totalClasses: classes.length,
          totalStudents: studentsCount
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      
      if (err.response?.status === 429) {
        const retryAfter = err.response.data?.retryAfter || 15 * 60;
        setError(`Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`);
      } else {
        setError('Failed to load user data. Please try again later.');
      }
      
      // Implement exponential backoff for retries
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchUserData();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          {retryCount < maxRetries && (
            <button onClick={fetchUserData} className="retry-btn">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userData?.name}</h1>
        <p>{userData?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}</p>
      </div>

      <div className="stats-container">
        {userData?.role === 'student' ? (
          <>
            <div className="stat-card">
              <h4>Total Classes</h4>
              <div className="stat-value">{stats.totalClasses}</div>
            </div>
            <div className="stat-card">
              <h4>Present Days</h4>
              <div className="stat-value">{stats.presentDays}</div>
            </div>
            <div className="stat-card">
              <h4>Absent Days</h4>
              <div className="stat-value">{stats.absentDays}</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <h4>Total Classes</h4>
              <div className="stat-value">{stats.totalClasses}</div>
            </div>
            <div className="stat-card">
              <h4>Total Students</h4>
              <div className="stat-value">{stats.totalStudents}</div>
            </div>
          </>
        )}
      </div>

      <div className="card-grid">
        {userData?.role === 'teacher' ? (
          <>
            <div className="dashboard-card monday">
              <div className="card-header">
                <h3>Manage Timetable</h3>
                <span className="day-badge">Monday</span>
              </div>
              <div className="card-content">
                <p>View and manage class schedules for the week.</p>
              </div>
              <div className="card-footer">
                <button className="action-button" onClick={() => navigate('/timetable/manage')}>
                  Manage Schedule
                </button>
              </div>
            </div>

            <div className="dashboard-card tuesday">
              <div className="card-header">
                <h3>Take Attendance</h3>
                <span className="day-badge">Tuesday</span>
              </div>
              <div className="card-content">
                <p>Mark attendance for your classes.</p>
              </div>
              <div className="card-footer">
                <button className="action-button" onClick={() => navigate('/attendance/manage')}>
                  Take Attendance
                </button>
              </div>
            </div>

            <div className="dashboard-card wednesday">
              <div className="card-header">
                <h3>Leave Management</h3>
                <span className="day-badge">Wednesday</span>
              </div>
              <div className="card-content">
                <p>Review and manage student leave applications.</p>
              </div>
              <div className="card-footer">
                <button className="action-button" onClick={() => navigate('/teacher/leave')}>
                  Manage Leaves
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="dashboard-card wednesday">
              <div className="card-header">
                <h3>View Timetable</h3>
                <span className="day-badge">Wednesday</span>
              </div>
              <div className="card-content">
                <p>Check your class schedule for the week.</p>
              </div>
              <div className="card-footer">
                <button className="action-button" onClick={() => navigate('/timetable')}>
                  View Schedule
                </button>
              </div>
            </div>

            <div className="dashboard-card thursday">
              <div className="card-header">
                <h3>Attendance Record</h3>
                <span className="day-badge">Thursday</span>
              </div>
              <div className="card-content">
                <p>View your attendance history and statistics.</p>
              </div>
              <div className="card-footer">
                <button className="action-button" onClick={() => navigate('/attendance')}>
                  View Attendance
                </button>
              </div>
            </div>

            <div className="dashboard-card friday">
              <div className="card-header">
                <h3>Leave Management</h3>
                <span className="day-badge">Friday</span>
              </div>
              <div className="card-content">
                <p>Apply for leave and track your leave applications.</p>
              </div>
              <div className="card-footer">
                <button className="action-button" onClick={() => navigate('/student/leave')}>
                  Apply for Leave
                </button>
              </div>
            </div>
          </>
        )}

        <div className="dashboard-card profile">
          <div className="card-header">
            <h3>Profile Settings</h3>
            <span className="day-badge">Settings</span>
          </div>
          <div className="card-content">
            <p>Update your profile information and preferences.</p>
          </div>
          <div className="card-footer">
            <button className="action-button" onClick={() => navigate('/profile')}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;