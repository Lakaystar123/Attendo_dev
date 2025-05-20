import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import './Timetable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

const TeacherTimetable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    day: 'Monday',
    startTime: '',
    endTime: '',
    room: '',
    description: ''
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/timetable');
      setTimetable(response.data);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setError('Failed to load timetable. Please try again.');
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

  const validateTimeSlot = (startTime, endTime) => {
    const start = TIME_SLOTS.indexOf(startTime);
    const end = TIME_SLOTS.indexOf(endTime);
    return start < end;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (!validateTimeSlot(formData.startTime, formData.endTime)) {
        setError('End time must be after start time');
        return;
      }

      if (showEditForm) {
        await axios.put(`/timetable/${selectedClass._id}`, formData);
      } else {
        await axios.post('/timetable', formData);
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedClass(null);
      setFormData({
        subject: '',
        day: 'Monday',
        startTime: '',
        endTime: '',
        room: '',
        description: ''
      });
      fetchTimetable();
    } catch (err) {
      console.error('Error saving class:', err);
      setError(err.response?.data?.message || 'Failed to save class. Please try again.');
    }
  };

  const handleEdit = (classData) => {
    setSelectedClass(classData);
    setFormData({
      subject: classData.subject,
      day: classData.day,
      startTime: classData.startTime,
      endTime: classData.endTime,
      room: classData.room,
      description: classData.description || ''
    });
    setShowEditForm(true);
    setShowAddForm(true);
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      setError(null);
      await axios.delete(`/timetable/${classId}`);
      fetchTimetable();
    } catch (err) {
      console.error('Error deleting class:', err);
      setError('Failed to delete class. Please try again.');
    }
  };

  const getClassesForDay = (day) => {
    return timetable
      .filter(c => c.day === day)
      .sort((a, b) => TIME_SLOTS.indexOf(a.startTime) - TIME_SLOTS.indexOf(b.startTime));
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="timetable-loading">
        <div className="loading-spinner"></div>
        <p>Loading timetable...</p>
      </div>
    );
  }

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <button onClick={handleBack} className="back-btn">← Back</button>
        <h2>Manage Timetable</h2>
        <button 
          className="add-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setShowEditForm(false);
              setSelectedClass(null);
              setFormData({
                subject: '',
                day: 'Monday',
                startTime: '',
                endTime: '',
                room: '',
                description: ''
              });
            }
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Class'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="add-class-form">
          <h3>{showEditForm ? 'Edit Class' : 'Add New Class'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="day">Day:</label>
              <select
                id="day"
                name="day"
                value={formData.day}
                onChange={handleInputChange}
                required
              >
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time:</label>
              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              >
                <option value="">Select start time</option>
                {TIME_SLOTS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time:</label>
              <select
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              >
                <option value="">Select end time</option>
                {TIME_SLOTS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="room">Room:</label>
              <input
                type="text"
                id="room"
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional):</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <button type="submit" className="submit-btn">
              {showEditForm ? 'Update Class' : 'Add Class'}
            </button>
          </form>
        </div>
      )}

      <div className="timetable-content">
        <div className="schedule-sections">
          <div className="schedule-section">
            <h4>Weekly Schedule</h4>
            <div className="days-grid">
              {DAYS.map((day) => (
                <div key={day} className="day-column">
                  <div className="day-header">{day}</div>
                  {getClassesForDay(day).map(cls => (
                    <div key={cls._id} className="schedule-item">
                      <div className="schedule-info">
                        <h4>{cls.subject}</h4>
                        <span className="time">{cls.startTime} - {cls.endTime}</span>
                        <span className="room">Room: {cls.room}</span>
                        {cls.description && (
                          <p className="description">{cls.description}</p>
                        )}
                        <div className="schedule-actions">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(cls)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(cls._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTimetable; 