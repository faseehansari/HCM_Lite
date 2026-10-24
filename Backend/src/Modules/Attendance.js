import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true }, // Normalized to midnight (YYYY-MM-DD)
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { 
    type: String, 
    enum: ['Present', 'Late', 'Absent'], 
    default: 'Present' 
  },
  totalHours: { type: Number, default: 0 } // In hours
}, { timestamps: true });

// Prevent duplicate attendance for the same employee on the same day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);