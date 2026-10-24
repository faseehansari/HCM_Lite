import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  salaryStructure: {
    basic: { type: Number, required: true },
    gross: { type: Number, required: true },
    allowances: { type: Number, default: 0 }
  },
  biometricCredentials: [
  {
    credentialID: { type: String, required: true },
    credentialPublicKey: { type: String, required: true },
    counter: { type: Number, required: true },
    transports: [String]
  }
],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);