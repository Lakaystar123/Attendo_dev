import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import EmojiPicker from 'emoji-picker-react';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    profileEmoji: '👤'
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/users/profile');
      setUser(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
        profileEmoji: response.data.profileEmoji || '👤'
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onEmojiClick = (emojiObject) => {
    setFormData(prev => ({
      ...prev,
      profileEmoji: emojiObject.emoji
    }));
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      await axios.put('/users/profile', formData);
      setSuccess('Profile updated successfully!');
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <span className="user-emoji">{user?.profileEmoji || '👤'}</span>
          <div className="user-details">
            <h2>Edit Profile</h2>
            <p className="user-role">{user?.role === 'teacher' ? 'Teacher' : 'Student'}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className="dashboard-options">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Profile Emoji</label>
            <div className="emoji-section">
              <div className="current-emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                <span className="selected-emoji">{formData.profileEmoji}</span>
                <button type="button" className="change-emoji-btn">
                  Change Emoji
                </button>
              </div>
              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width="100%"
                    height="400px"
                  />
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="action-btn">
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile; 