import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // 'CREATE', 'UPDATE', 'APPROVE', 'FINALIZE', 'DELETE'
  module: { type: String, required: true }, // 'EMPLOYEE', 'LEAVE', 'PAYROLL', 'ATTENDANCE'
  description: { type: String, required: true },
  ipAddress: { type: String }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);