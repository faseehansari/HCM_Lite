import 'dotenv/config';
import express from "express";
import cors from "cors";
import connectDB from "./src/Config/DB.js";
import authRoutes from "./src/Routes/authRoutes.js";
import orgRoutes from "./src/Routes/orgRoutes.js";
import attendanceRoutes from "./src/Routes/attendanceRoutes.js";
import leaveRoutes from './src/Routes/leaveRoutes.js';
import employeeRoutes from './src/Routes/employeeRoutes.js';
import attendanceCorrectionRoutes from './src/Routes/attendanceCorrectionRoutes.js';
import payrollRoutes from './src/Routes/payrollRoutes.js';
import auditLogRoutes from './src/Routes/auditLogRoutes.js';
import notificationRoutes from './src/Routes/notificationRoutes.js';
import biometricRoutes from './src/Routes/biometricRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/org", orgRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/employees', employeeRoutes);

app.use('/api/attendance-corrections', attendanceCorrectionRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.use('/api/payroll', payrollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/biometric', biometricRoutes);


app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Hackathon API is running",
    });
});

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});