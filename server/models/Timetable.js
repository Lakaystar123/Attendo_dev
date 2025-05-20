const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  room: {
    type: String,
    required: [true, 'Room is required'],
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class reference is required']
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate classes in the same room
timetableSchema.index({ day: 1, startTime: 1, room: 1 }, { unique: true });

// Compound index to prevent teacher scheduling conflicts
timetableSchema.index({ day: 1, teacher: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);