import mongoose from 'mongoose';

const attendanceCorrectionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }, // Optional: agar us din ka record pehle se ho
  date: { type: Date, required: true },
  requestedCheckIn: { type: Date },
  requestedCheckOut: { type: Date },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);