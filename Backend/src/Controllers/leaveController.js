import Leave from '../Modules/Leave.js';
import Employee from '../Modules/Employee.js';
import { sendNotification } from '../../utils/notificationHelper.js'; // <-- Notification helper imported

// 1. Apply for Leave (Employee or HR)
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee profile not linked with this user account.' });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All leave fields are required.' });
    }

    const leave = new Leave({
      employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await leave.save();
    res.status(201).json({ success: true, message: 'Leave application submitted successfully', leave });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Leaves (Employee sees own, HR/Admin sees all)
export const getLeaves = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') {
      query.employeeId = req.user.employeeId;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name employeeCode department designation')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Update Leave Status (Approve/Reject by HR or Admin)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Approved or Rejected.' });
    }

    // Populate employeeId to get the user account reference (userId)
    const leave = await Leave.findById(leaveId).populate('employeeId');
    if (!leave) {
      return res.status(404).json({ error: 'Leave application not found.' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id || req.user.id;
    await leave.save();

    // Send In-App Notification to Employee
    if (leave.employeeId && leave.employeeId.userId) {
      await sendNotification(
        leave.employeeId.userId,
        'Leave Status Updated',
        `Your leave application (${leave.leaveType}) has been ${status.toLowerCase()}.`,
        'LEAVE'
      );
    }

    res.json({ success: true, message: `Leave application ${status.toLowerCase()} successfully`, leave });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};