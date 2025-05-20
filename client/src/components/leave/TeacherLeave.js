import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import './Leave.css';

const TeacherLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [comment, setComment] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/leaves/all');
      setLeaves(response.data);
    } catch (error) {
      setError('Failed to fetch leave applications');
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleStatusUpdate = async (leaveId, status) => {
    try {
      setError(null);
      setSuccess(null);
      await axios.put(`/leaves/${leaveId}/status`, {
        status,
        comment: comment.trim()
      });
      setSuccess(`Leave application ${status} successfully`);
      setComment('');
      setSelectedLeave(null);
      fetchLeaves();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update leave status');
      console.error('Error updating leave:', error);
    }
  };

  if (loading) {
    return <div className="leave-loading">Loading...</div>;
  }

  return (
    <div className="leave-container">
      <div className="leave-header">
        <h2>Leave Applications</h2>
      </div>

      {error && <div className="leave-error">{error}</div>}
      {success && <div className="leave-success">{success}</div>}

      <div className="leave-list">
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
              <div className="student-info">
                <span className="student-emoji">{leave.student.profileEmoji || '👤'}</span>
                <span className="student-name">{leave.student.username}</span>
              </div>
              <div className="leave-dates">
                <p>From: {new Date(leave.startDate).toLocaleDateString()}</p>
                <p>To: {new Date(leave.endDate).toLocaleDateString()}</p>
              </div>
              <div className="leave-classes">
                <strong>Classes:</strong>
                <ul>
                  {leave.classes.map(cls => (
                    <li key={cls._id}>
                      {cls.subject} ({cls.day} - {cls.startTime} to {cls.endTime})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="leave-reason">
                <strong>Reason:</strong>
                <p>{leave.reason}</p>
              </div>
              {leave.teacherComment && (
                <div className="teacher-comment">
                  <strong>Your Comment:</strong>
                  <p>{leave.teacherComment}</p>
                </div>
              )}
              {leave.status === 'pending' && (
                <div className="leave-actions">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment (optional)"
                    rows="3"
                  />
                  <div className="action-buttons">
                    <button
                      className="approve-btn"
                      onClick={() => handleStatusUpdate(leave._id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
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

export default TeacherLeave; 