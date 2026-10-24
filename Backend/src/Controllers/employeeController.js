import Employee from '../Modules/Employee.js';
import { Parser } from 'json2csv';
import { sendNotification } from '../../utils/notificationHelper.js'; // <-- Notification helper imported

// 1. Get Employee Directory with Search & Filters
export const getEmployeeDirectory = async (req, res) => {
  try {
    const { search, department, designation } = req.query;
    let query = {};

    // Search by name, email, or employeeCode
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by department
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    // Filter by designation
    if (designation) {
      query.designation = { $regex: designation, $options: 'i' };
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Create Employee & Send Welcome Notification (Admin / HR)
export const createEmployee = async (req, res) => {
  try {
    const { name, email, employeeCode, department, designation, phone, userId, salaryStructure } = req.body;

    const employee = new Employee({
      name,
      email,
      employeeCode,
      department,
      designation,
      phone,
      userId,
      salaryStructure
    });

    await employee.save();

    // Send Welcome Notification to Employee if user account is linked
    if (userId) {
      await sendNotification(
        userId,
        'Welcome to the Company!',
        'Your employee profile has been successfully created. You can now access your dashboard.',
        'GENERAL'
      );
    }

    res.status(201).json({ success: true, message: 'Employee created successfully', employee });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Employee with this email or code already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// 3. Export Employees as CSV (HR / Admin only)
export const exportEmployeesCSV = async (req, res) => {
  try {
    const employees = await Employee.find({}).lean();

    if (!employees || employees.length === 0) {
      return res.status(404).json({ error: 'No employee records found to export.' });
    }

    // Format data for CSV
    const csvData = employees.map(emp => ({
      EmployeeCode: emp.employeeCode,
      Name: emp.name,
      Email: emp.email,
      Phone: emp.phone || 'N/A',
      Department: emp.department || 'N/A',
      Designation: emp.designation || 'N/A',
      BasicSalary: emp.salaryStructure?.basic || 0,
      GrossSalary: emp.salaryStructure?.gross || 0,
      JoinedDate: emp.createdAt ? emp.createdAt.toISOString().split('T')[0] : 'N/A'
    }));

    const fields = ['EmployeeCode', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'BasicSalary', 'GrossSalary', 'JoinedDate'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('employees_directory.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};