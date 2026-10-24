import mongoose from 'mongoose';

const companySettingsSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  officeStart: { type: String, default: "09:00" },
  graceTimeMinutes: { type: Number, default: 15 },
  halfDayHours: { type: Number, default: 5 },
  weekendDays: { type: [String], default: ["Sat", "Sun"] },
  officeLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    radiusMeters: { type: Number, default: 150 }
  },
  departments: [{ type: String }],
  designations: [{ type: String }],
  leaveQuotas: {
    annual: { type: Number, default: 14 },
    sick: { type: Number, default: 8 },
    casual: { type: Number, default: 10 }
  }
}, { timestamps: true });

export default mongoose.model('CompanySettings', companySettingsSchema);