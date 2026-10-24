import Attendance from '../Modules/Attendance.js';
import Employee from '../Modules/Employee.js';
import { sendNotification } from '../../utils/notificationHelper.js';

// Helper to get start of today (00:00:00)
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// 1. Employee Check-In
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee profile not linked with this user account.' });
    }

    const today = getTodayDate();

    const existingAttendance = await Attendance.findOne({ employeeId, date: today });
    if (existingAttendance) {
      return res.status(400).json({ error: 'You have already checked in today.' });
    }

    const now = new Date();
    const officeStartTime = new Date();
    officeStartTime.setHours(9, 0, 0, 0);

    const status = now > officeStartTime ? 'Late' : 'Present';

    const attendance = new Attendance({
      employeeId,
      date: today,
      checkIn: now,
      status
    });

    await attendance.save();

    // Fetch employee details to get userId for notification
    const employee = await Employee.findById(employeeId);
    if (employee && employee.userId) {
      await sendNotification(
        employee.userId,
        'Checked In Successfully',
        `Your attendance Check-In was recorded at ${now.toLocaleTimeString()}. Status: ${status}`,
        'ATTENDANCE'
      );
    }

    res.status(201).json({ success: true, message: 'Checked in successfully', attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Employee Check-Out
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee profile not linked with this user account.' });
    }

    const today = getTodayDate();

    const attendance = await Attendance.findOne({ employeeId, date: today });
    if (!attendance) {
      return res.status(404).json({ error: 'No check-in record found for today. Please check-in first.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'You have already checked out today.' });
    }

    const now = new Date();
    attendance.checkOut = now;

    const diffMs = now - new Date(attendance.checkIn);
    const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    attendance.totalHours = diffHours;

    await attendance.save();

    // Fetch employee details to get userId for notification
    const employee = await Employee.findById(employeeId);
    if (employee && employee.userId) {
      await sendNotification(
        employee.userId,
        'Checked Out Successfully',
        `Your attendance Check-Out was recorded at ${now.toLocaleTimeString()}. Total hours: ${diffHours}`,
        'ATTENDANCE'
      );
    }

    res.json({ success: true, message: 'Checked out successfully', attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Attendance Records
export const getAttendance = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') {
      query.employeeId = req.user.employeeId;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'name employeeCode department designation')
      .sort({ date: -1 });

    res.json({ success: true, count: attendanceRecords.length, attendanceRecords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};