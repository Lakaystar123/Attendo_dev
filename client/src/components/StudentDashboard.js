import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendancePercentage: 0,
    todayClasses: 0,
    upcomingClasses: 0
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await axios.get('/students/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchDashboardStats();
  }, [fetchUserProfile, fetchDashboardStats]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={fetchUserProfile}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <span className="user-emoji">{user?.profileEmoji || '👤'}</span>
          <div className="user-details">
            <h2>Welcome, {user?.username}</h2>
            <p className="user-role">Student</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Total Classes</h3>
            <p>{stats.totalClasses}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <h3>Attendance</h3>
            <p>{stats.attendancePercentage}%</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Today's Classes</h3>
            <p>{stats.todayClasses}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>Upcoming Classes</h3>
            <p>{stats.upcomingClasses}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-options">
        <h3>Quick Actions</h3>
        <div className="dashboard-grid">
          <button onClick={() => navigate('/timetable')} className="action-btn timetable">
            <span className="action-icon">📅</span>
            <span className="action-text">View Timetable</span>
            <span className="action-desc">Check your class schedule</span>
          </button>
          <button onClick={() => navigate('/attendance')} className="action-btn attendance">
            <span className="action-icon">✓</span>
            <span className="action-text">View Attendance</span>
            <span className="action-desc">Check your attendance records</span>
          </button>
          <button onClick={() => navigate('/student/leave')} className="action-btn leave">
            <span className="action-icon">📝</span>
            <span className="action-text">Apply for Leave</span>
            <span className="action-desc">Submit leave applications</span>
          </button>
          <button onClick={() => navigate('/profile')} className="action-btn profile">
            <span className="action-icon">👤</span>
            <span className="action-text">Edit Profile</span>
            <span className="action-desc">Update your information</span>
          </button>
        </div>
      </div>

      <div className="dashboard-recent">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {stats.recentActivity?.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-details">
                  <p className="activity-text">{activity.text}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-activity">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 