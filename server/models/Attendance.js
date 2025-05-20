const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
    index: true  // Added index for better query performance
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true,
    validate: {
      validator: function(value) {
        return value <= new Date(); // Date shouldn't be in the future
      },
      message: 'Date cannot be in the future'
    }
  },
  present: {
    type: Boolean,
    default: false
  },
  className: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class reference is required']
  },
  recordedBy: {  // Added to track who marked the attendance
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ student: 1, date: 1, className: 1 }, { unique: true });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

module.exports = mongoose.model('Attendance', attendanceSchema);