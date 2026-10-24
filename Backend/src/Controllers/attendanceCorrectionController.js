import AttendanceCorrection from '../Modules/AttendanceCorrection.js';
import Attendance from '../Modules/Attendance.js';
import Employee from '../Modules/Employee.js';
import { sendNotification } from '../../utils/notificationHelper.js'; // <-- Notification helper imported

// 1. Request Attendance Correction (Employee / HR)
export const requestCorrection = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee profile not linked with this user account.' });
    }

    const { date, requestedCheckIn, requestedCheckOut, reason, attendanceId } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ error: 'Date and reason are required for correction request.' });
    }

    const correction = new AttendanceCorrection({
      employeeId,
      attendanceId,
      date: new Date(date),
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
      reason
    });

    await correction.save();
    res.status(201).json({ success: true, message: 'Attendance correction request submitted successfully', correction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Correction Requests (Employee sees own, HR/Admin sees all)
export const getCorrectionRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') {
      query.employeeId = req.user.employeeId;
    }

    const requests = await AttendanceCorrection.find(query)
      .populate('employeeId', 'name employeeCode department designation')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Approve or Reject Correction Request (HR / Admin only)
export const reviewCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Approved or Rejected.' });
    }

    // Populate employeeId to get access to the linked userId for notifications
    const correction = await AttendanceCorrection.findById(requestId).populate('employeeId');
    if (!correction) {
      return res.status(404).json({ error: 'Correction request not found.' });
    }

    if (correction.status !== 'Pending') {
      return res.status(400).json({ error: `This request has already been ${correction.status.toLowerCase()}.` });
    }

    correction.status = status;
    correction.reviewedBy = req.user._id || req.user.id;
    await correction.save();

    // If approved, update or create the actual Attendance record
    if (status === 'Approved') {
      const normalizedDate = new Date(correction.date);
      normalizedDate.setHours(0, 0, 0, 0);

      let attendance = await Attendance.findOne({ 
        employeeId: correction.employeeId._id, 
        date: normalizedDate 
      });

      if (attendance) {
        if (correction.requestedCheckIn) attendance.checkIn = correction.requestedCheckIn;
        if (correction.requestedCheckOut) {
          attendance.checkOut = correction.requestedCheckOut;
          const diffMs = new Date(attendance.checkOut) - new Date(attendance.checkIn);
          attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        }
        await attendance.save();
      } else {
        // Create new attendance record if it didn't exist
        const checkInTime = correction.requestedCheckIn || normalizedDate;
        const officeStartTime = new Date(normalizedDate);
        officeStartTime.setHours(9, 0, 0, 0);
        const attendanceStatus = checkInTime > officeStartTime ? 'Late' : 'Present';

        let totalHours = 0;
        if (correction.requestedCheckIn && correction.requestedCheckOut) {
          const diffMs = new Date(correction.requestedCheckOut) - new Date(correction.requestedCheckIn);
          totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        attendance = new Attendance({
          employeeId: correction.employeeId._id,
          date: normalizedDate,
          checkIn: correction.requestedCheckIn,
          checkOut: correction.requestedCheckOut,
          status: attendanceStatus,
          totalHours
        });
        await attendance.save();
      }
    }

    // Send In-App Notification to Employee
    if (correction.employeeId && correction.employeeId.userId) {
      const formattedDate = new Date(correction.date).toISOString().split('T')[0];
      await sendNotification(
        correction.employeeId.userId,
        'Attendance Correction Updated',
        `Your attendance correction request for date ${formattedDate} has been ${status.toLowerCase()}.`,
        'ATTENDANCE'
      );
    }

    res.json({ success: true, message: `Correction request ${status.toLowerCase()} successfully`, correction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};