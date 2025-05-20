import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentAttendance from './components/attendance/StudentAttendance';
import TeacherAttendance from './components/attendance/TeacherAttendance';
import StudentTimetable from './components/timetable/StudentTimetable';
import TeacherTimetable from './components/timetable/TeacherTimetable';
import StudentLeave from './components/leave/StudentLeave';
import TeacherLeave from './components/leave/TeacherLeave';
import Profile from './components/Profile';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        
        {/* Attendance Routes */}
        <Route path="/attendance" element={<StudentAttendance />} />
        <Route path="/attendance/manage" element={<TeacherAttendance />} />
        
        {/* Timetable Routes */}
        <Route path="/timetable" element={<StudentTimetable />} />
        <Route path="/timetable/manage" element={<TeacherTimetable />} />
        
        {/* Leave Management Routes */}
        <Route path="/student/leave" element={<StudentLeave />} />
        <Route path="/teacher/leave" element={<TeacherLeave />} />
        
        {/* Profile Route */}
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
