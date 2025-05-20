import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axios';
import './Attendance.css';

const TeacherAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('present');

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/classes');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all students
      const response = await axios.get('/students');
      setStudents(response.data);
      setSummary(prev => ({ ...prev, total: response.data.length }));
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/attendance', {
        params: { className: selectedClass, date }
      });
      const attendanceData = {};
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      response.data.forEach(record => {
        attendanceData[record.student._id] = record.status;
        if (record.status === 'present') presentCount++;
        else if (record.status === 'late') lateCount++;
        else absentCount++;
      });

      setAttendance(attendanceData);
      setSummary(prev => ({
        ...prev,
        present: presentCount,
        late: lateCount,
        absent: absentCount
      }));
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, date]);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [fetchClasses, fetchStudents]);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendance();
    }
  }, [selectedClass, date, fetchAttendance]);

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
    setAttendance({});
    setSummary({ present: 0, late: 0, absent: 0, total: students.length });
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      setError(null);
      await axios.post('/attendance/mark', {
        student: studentId,
        date,
        status,
        className: selectedClass
      });

      setAttendance(prev => ({
        ...prev,
        [studentId]: status
      }));

      setSummary(prev => {
        const newSummary = { ...prev };
        // Remove from previous status
        if (prev[attendance[studentId]]) {
          newSummary[attendance[studentId]]--;
        }
        // Add to new status
        newSummary[status]++;
        return newSummary;
      });
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError('Failed to mark attendance. Please try again.');
    }
  };

  const handleMarkAll = async () => {
    try {
      setIsMarkingAll(true);
      setError(null);
      
      const promises = students.map(student =>
        axios.post('/attendance/mark', {
          student: student._id,
          date,
          status: selectedStatus,
          className: selectedClass
        })
      );

      await Promise.all(promises);

      const newAttendance = {};
      students.forEach(student => {
        newAttendance[student._id] = selectedStatus;
      });

      setAttendance(newAttendance);
      setSummary(prev => ({
        ...prev,
        present: selectedStatus === 'present' ? prev.total : 0,
        late: selectedStatus === 'late' ? prev.total : 0,
        absent: selectedStatus === 'absent' ? prev.total : 0
      }));
    } catch (err) {
      console.error('Error marking all attendance:', err);
      setError('Failed to mark all attendance. Please try again.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (loading && !selectedClass) {
    return <div className="attendance-loading">Loading classes...</div>;
  }

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h2>Take Attendance</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <div className="attendance-content">
        <div className="class-selector">
          <h3>Select Class</h3>
          {classes.length === 0 ? (
            <div className="no-classes">
              <p>No classes found. Please add classes in the timetable management section.</p>
            </div>
          ) : (
            <div className="class-list">
              {classes.map(cls => (
                <button
                  key={cls._id}
                  className={`class-btn ${selectedClass === cls._id ? 'active' : ''}`}
                  onClick={() => handleClassSelect(cls._id)}
                >
                  {cls.subject}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedClass && (
          <div className="attendance-section">
            <div className="attendance-controls">
              <div className="date-selector">
                <label htmlFor="date">Date:</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                />
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

            <div className="bulk-marking-section">
              <h3>Bulk Marking</h3>
              <div className="bulk-marking-controls">
                <div className="bulk-status-selector">
                  <label htmlFor="status">Mark all as:</label>
                  <select
                    id="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <button
                  className="bulk-mark-btn"
                  onClick={handleMarkAll}
                  disabled={loading || isMarkingAll}
                >
                  {isMarkingAll ? 'Marking...' : `Mark All ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}`}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="attendance-loading">Loading students...</div>
            ) : (
              <div className="student-list">
                {students.map(student => (
                  <div key={student._id} className="student-item">
                    <div className="student-info">
                      <span className="student-emoji">{student.profileEmoji}</span>
                      <div className="student-details">
                        <span className="student-name">{student.name}</span>
                        <span className="student-username">@{student.username}</span>
                      </div>
                    </div>
                    <div className="attendance-actions">
                      <button
                        className={`attendance-btn present ${attendance[student._id] === 'present' ? 'active' : ''}`}
                        onClick={() => handleMarkAttendance(student._id, 'present')}
                        disabled={loading || isMarkingAll}
                      >
                        Present
                      </button>
                      <button
                        className={`attendance-btn late ${attendance[student._id] === 'late' ? 'active' : ''}`}
                        onClick={() => handleMarkAttendance(student._id, 'late')}
                        disabled={loading || isMarkingAll}
                      >
                        Late
                      </button>
                      <button
                        className={`attendance-btn absent ${attendance[student._id] === 'absent' ? 'active' : ''}`}
                        onClick={() => handleMarkAttendance(student._id, 'absent')}
                        disabled={loading || isMarkingAll}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance; 