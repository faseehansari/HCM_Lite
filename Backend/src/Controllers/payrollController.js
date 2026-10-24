import Payroll from '../Modules/Payroll.js';
import Employee from '../Modules/Employee.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { recordAuditLog } from '../../utils/auditLogger.js';
import { sendNotification } from '../../utils/notificationHelper.js'; // <-- Notification helper imported

// 1. Generate Payroll
export const generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, deductions = 0 } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ error: 'Employee ID, month, and year are required.' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const basicSalary = employee.salaryStructure?.basic || 0;
    const grossSalary = employee.salaryStructure?.gross || (basicSalary * 1.5);
    const netSalary = grossSalary - deductions;

    const payroll = new Payroll({
      employeeId,
      month,
      year,
      basicSalary,
      grossSalary,
      deductions,
      netSalary
    });

    await payroll.save();

    // Audit log record for CREATE
    await recordAuditLog(req, 'CREATE', 'PAYROLL', `Generated payroll for employee ${employee.name} (${month} ${year})`);

    // Send In-App Notification to Employee if user account is linked
    if (employee.userId) {
      await sendNotification(
        employee.userId,
        'Payroll Generated',
        `Your payslip for ${month} ${year} has been generated successfully.`,
        'PAYROLL'
      );
    }

    res.status(201).json({ success: true, message: 'Payroll generated successfully', payroll });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Payroll for this employee for this month/year already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Payroll Records
export const getPayrolls = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') {
      query.employeeId = req.user.employeeId;
    }

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'name employeeCode department designation')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payrolls.length, payrolls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Mark as Paid
export const markAsPaid = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const payroll = await Payroll.findById(payrollId).populate('employeeId');
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found.' });
    }

    payroll.status = 'Paid';
    payroll.paymentDate = new Date();
    await payroll.save();

    // Audit log record for UPDATE
    await recordAuditLog(req, 'UPDATE', 'PAYROLL', `Marked payroll ID ${payrollId} as Paid`);

    // Send Notification for Payment
    if (payroll.employeeId && payroll.employeeId.userId) {
      await sendNotification(
        payroll.employeeId.userId,
        'Salary Paid',
        `Your salary for ${payroll.month} ${payroll.year} has been marked as Paid.`,
        'PAYROLL'
      );
    }

    res.json({ success: true, message: 'Payroll marked as paid successfully', payroll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Finalize Payroll (Locks the month - Admin Only)
export const finalizePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required to finalize payroll.' });
    }

    const result = await Payroll.updateMany(
      { month, year, status: { $ne: 'Paid' } },
      { $set: { status: 'Finalized' } }
    );

    // Audit log record for FINALIZE
    await recordAuditLog(req, 'FINALIZE', 'PAYROLL', `Finalized payroll for ${month} ${year}. Locked records: ${result.modifiedCount}`);

    res.json({ 
      success: true, 
      message: `Payroll finalized for ${month} ${year}. Locked records: ${result.modifiedCount}` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Download Payslip as PDF
export const downloadPayslipPDF = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await Payroll.findById(payrollId).populate('employeeId');
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found.' });
    }

    if (req.user.role === 'employee' && payroll.employeeId._id.toString() !== req.user.employeeId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to download this payslip.' });
    }

    const employee = payroll.employeeId;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${employee.employeeCode}_${payroll.month}_${payroll.year}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('TECH SOLUTIONS HCM SYSTEM', { align: 'center' });
    doc.fontSize(12).text('Official Monthly Payslip', { align: 'center' });
    doc.moveDown();

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(12).text(`Employee Name: ${employee.name}`);
    doc.text(`Employee Code: ${employee.employeeCode}`);
    doc.text(`Department: ${employee.department || 'N/A'} | Designation: ${employee.designation || 'N/A'}`);
    doc.text(`Pay Period: ${payroll.month} ${payroll.year}`);
    doc.text(`Status: ${payroll.status}`);
    doc.moveDown();

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(14).text('Salary Breakdown:', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Basic Salary: PKR ${payroll.basicSalary.toLocaleString()}`);
    doc.text(`Gross Salary: PKR ${payroll.grossSalary.toLocaleString()}`);
    doc.text(`Deductions: PKR ${payroll.deductions.toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('green').text(`Net Salary Payable: PKR ${payroll.netSalary.toLocaleString()}`, { bold: true });
    doc.fillColor('black');
    doc.moveDown(2);

    doc.fontSize(10).text('This is a system-generated computer document and requires no signature.', { align: 'center', color: 'grey' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};