import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import './Timetable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

const StudentTimetable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/timetable/student');
      setSchedule(response.data);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add polling effect
  useEffect(() => {
    fetchSchedule();
    
    // Set up polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchSchedule();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, []);

  const getSchedulesForDay = (day) => {
    return schedule
      .filter(s => s.day === day)
      .sort((a, b) => TIME_SLOTS.indexOf(a.startTime) - TIME_SLOTS.indexOf(b.startTime));
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDay(null);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="timetable-loading">
        <div className="loading-spinner"></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <button onClick={handleBack} className="back-btn">← Back</button>
        <h2>My Schedule</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="timetable-content">
        <div className="schedule-sections">
          <div className="schedule-section">
            <h4>Weekly Schedule</h4>
            <div className="days-grid">
              {DAYS.map((day) => (
                <div 
                  key={day} 
                  className={`day-column ${selectedDay === day ? 'selected' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="day-header">{day}</div>
                  {getSchedulesForDay(day).map(schedule => (
                    <div key={schedule._id} className="schedule-item">
                      <div className="schedule-info">
                        <h4>{schedule.subject}</h4>
                        <span className="time">{schedule.startTime} - {schedule.endTime}</span>
                        <span className="room">Room: {schedule.room}</span>
                        {schedule.description && (
                          <p className="description">{schedule.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {showDetails && selectedDay && (
          <div className="day-details">
            <div className="details-header">
              <h3>{selectedDay}'s Schedule</h3>
              <button className="close-btn" onClick={handleCloseDetails}>×</button>
            </div>
            <div className="details-content">
              {getSchedulesForDay(selectedDay).map(schedule => (
                <div key={schedule._id} className="detail-item">
                  <div className="detail-time">
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  <div className="detail-info">
                    <h4>{schedule.subject}</h4>
                    <p className="teacher">Teacher: {schedule.teacher.name}</p>
                    <p className="room">Room: {schedule.room}</p>
                    {schedule.description && (
                      <p className="description">{schedule.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {getSchedulesForDay(selectedDay).length === 0 && (
                <p className="no-classes">No classes scheduled for {selectedDay}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable; 