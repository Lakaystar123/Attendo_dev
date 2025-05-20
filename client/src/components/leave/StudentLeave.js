import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import './Leave.css';

const StudentLeave = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    type: 'sick',
    startDate: '',
    endDate: '',
    reason: '',
    classes: []
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get('/users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  }, [navigate]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/timetable');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes');
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchLeaves();
    fetchClasses();
  }, [fetchUserProfile]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/leaves/my-leaves');
      setLeaves(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch leave applications');
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClassSelection = (classId) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.includes(classId)
        ? prev.classes.filter(id => id !== classId)
        : [...prev.classes, classId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.reason || formData.classes.length === 0) {
      setError('All fields are required and at least one class must be selected');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (start > end) {
      setError('End date must be after start date');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      const requestData = {
        type: formData.type,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: formData.reason.trim(),
        classes: formData.classes
      };

      // Log the request payload
      console.log('Submitting leave application with data:', requestData);

      const response = await axios.post('/leaves/apply', requestData);
      
      console.log('Leave application response:', response.data);
      
      setSuccess(response.data.message || 'Leave application submitted successfully');
      setFormData({
        type: 'sick',
        startDate: '',
        endDate: '',
        reason: '',
        classes: []
      });
      setShowForm(false);
      fetchLeaves();
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: {
          type: formData.type,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason: formData.reason.trim(),
          classes: formData.classes
        }
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to submit leave application';
      setError(errorMessage);
    }
  };

  if (loading) {
    return <div className="leave-loading">Loading...</div>;
  }

  return (
    <div className="leave-container">
      <div className="leave-header">
        <h2>Leave Applications</h2>
        <button 
          className="apply-leave-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Apply for Leave'}
        </button>
      </div>

      {error && <div className="leave-error">{error}</div>}
      {success && <div className="leave-success">{success}</div>}

      {showForm && (
        <form className="leave-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Leave Type:</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start Date:</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date:</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Select Classes:</label>
            <div className="classes-grid">
              {classes.map(cls => (
                <div
                  key={cls._id}
                  className={`class-item ${formData.classes.includes(cls._id) ? 'selected' : ''}`}
                  onClick={() => handleClassSelection(cls._id)}
                >
                  <div className="class-info">
                    <h4>{cls.subject}</h4>
                    <p>{cls.day} - {cls.startTime} to {cls.endTime}</p>
                    <p>Room: {cls.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Reason:</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Please provide a detailed reason for your leave request..."
            />
          </div>

          <button type="submit" className="submit-btn">
            Submit Application
          </button>
        </form>
      )}

      <div className="leave-list">
        <h3>Your Leave Applications</h3>
        {leaves.length === 0 ? (
          <p className="no-leaves">No leave applications found</p>
        ) : (
          leaves.map(leave => (
            <div key={leave._id} className="leave-card">
              <div className="leave-card-header">
                <span className={`leave-status ${leave.status}`}>
                  {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                </span>
                <span className="leave-type">
                  {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                </span>
              </div>
              <div className="leave-dates">
                <p>From: {new Date(leave.startDate).toLocaleDateString()}</p>
                <p>To: {new Date(leave.endDate).toLocaleDateString()}</p>
              </div>
              <div className="leave-classes">
                <strong>Classes:</strong>
                <ul>
                  {leave.classes.map(classId => {
                    const cls = classes.find(c => c._id === classId);
                    return cls ? (
                      <li key={classId}>
                        {cls.subject} ({cls.day} - {cls.startTime} to {cls.endTime})
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
              <div className="leave-reason">
                <strong>Reason:</strong>
                <p>{leave.reason}</p>
              </div>
              {leave.teacherComment && (
                <div className="teacher-comment">
                  <strong>Teacher's Comment:</strong>
                  <p>{leave.teacherComment}</p>
                </div>
              )}
              <div className="leave-date">
                Applied on: {new Date(leave.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentLeave; 