import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './Dashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingLeaves: 0,
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
      const response = await axios.get('/teachers/dashboard-stats');
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
            <p className="user-role">Teacher</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <p>{stats.totalStudents}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>Pending Leaves</h3>
            <p>{stats.pendingLeaves}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Today's Classes</h3>
            <p>{stats.todayClasses}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Upcoming Classes</h3>
            <p>{stats.upcomingClasses}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-options">
        <h3>Quick Actions</h3>
        <div className="dashboard-grid">
          <button onClick={() => navigate('/classes/manage')} className="action-btn classes">
            <span className="action-icon">📚</span>
            <span className="action-text">Manage Classes</span>
            <span className="action-desc">Create and manage your classes</span>
          </button>
          <button onClick={() => navigate('/timetable/manage')} className="action-btn timetable">
            <span className="action-icon">📅</span>
            <span className="action-text">Manage Timetable</span>
            <span className="action-desc">View and update class schedules</span>
          </button>
          <button onClick={() => navigate('/attendance/manage')} className="action-btn attendance">
            <span className="action-icon">✓</span>
            <span className="action-text">Take Attendance</span>
            <span className="action-desc">Mark student attendance</span>
          </button>
          <button onClick={() => navigate('/teacher/leave')} className="action-btn leave">
            <span className="action-icon">📝</span>
            <span className="action-text">Manage Leave Applications</span>
            <span className="action-desc">Review student leave requests</span>
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

export default TeacherDashboard; 