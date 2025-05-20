import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Timetable() {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/timetable', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTimetableData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch timetable');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading timetable...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="container">
      <h2>Class Timetable</h2>
      {timetableData.length === 0 ? (
        <p>No timetable available.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Subject</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>
            {timetableData.map((item) => (
              <tr key={item._id}>
                <td>{item.day}</td>
                <td>{item.time}</td>
                <td>{item.subject}</td>
                <td>{item.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Timetable;