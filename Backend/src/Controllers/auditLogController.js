import AuditLog from '../Modules/AuditLog.js';

// Get all audit logs (Admin only)
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100); // Latest 100 logs

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};