import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: String, required: true }, // e.g., "October"
  year: { type: Number, required: true },  // e.g., 2026
  basicSalary: { type: Number, required: true },
  grossSalary: { type: Number, required: true },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paymentDate: { type: Date }
}, { timestamps: true });

// Prevent duplicate payroll for the same employee in the same month & year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);