import AuditLog from '../src/Modules/AuditLog.js';

export const recordAuditLog = async (req, action, module, description) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return;

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';

    await AuditLog.create({
      userId,
      action,
      module,
      description,
      ipAddress
    });
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
};