import bcrypt from 'bcryptjs';
import CompanySettings from '../Modules/CompanySettings.js';
import Employee from '../Modules/Employee.js';
import User from '../Modules/User.js';

// 1. CREATE Company Settings (POST)
export const createCompanySettings = async (req, res) => {
  try {
    const existingSettings = await CompanySettings.findOne();
    if (existingSettings) {
      return res.status(400).json({ error: 'Company settings already exist. Use UPDATE instead.' });
    }
    const settings = new CompanySettings(req.body);
    await settings.save();
    res.status(201).json({ success: true, message: 'Company settings created successfully', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. READ Company Settings (GET)
export const getCompanySettings = async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'Company settings not found. Please create them first.' });
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. UPDATE Company Settings (PUT)
export const updateCompanySettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'Company settings not found. Please create them first.' });
    }
    settings = await CompanySettings.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Company settings updated successfully', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. DELETE Company Settings (DELETE)
export const deleteCompanySettings = async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'Company settings not found.' });
    }
    await CompanySettings.findByIdAndDelete(settings._id);
    res.json({ success: true, message: 'Company settings deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Register HR as an Employee (Only Admin can do this)
export const registerHR = async (req, res) => {
  try {
    const { employeeCode, name, email, password, department, designation, basic, phone, address } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required for the HR account.' });
    }

    // Check if employee/HR already exists
    const existingEmp = await Employee.findOne({ $or: [{ email }, { employeeCode }] });
    if (existingEmp) {
      return res.status(400).json({ error: 'HR with this email or employee code already exists.' });
    }

    const gross = basic * 1.5; // Rule: Gross = 1.5 * basic
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create User account with role 'hr'
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'hr',
      isTemporaryPassword: false
    });
    await newUser.save();

    // 2. Create Employee profile for HR
    const employee = new Employee({
      employeeCode,
      name,
      email,
      phone,
      address,
      department: department || 'Human Resources',
      designation: designation || 'HR Manager',
      salaryStructure: { basic, gross },
      userId: newUser._id
    });
    await employee.save();

    // 3. Link employeeId back to User
    newUser.employeeId = employee._id;
    await newUser.save();

    res.status(201).json({
      message: 'HR registered successfully as an employee',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      employeeProfile: employee
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Register Employee with Custom Password
export const registerEmployee = async (req, res) => {
  try {
    const { employeeCode, name, email, password, department, designation, basic, phone, address } = req.body;

    // Check if password is provided
    if (!password) {
      return res.status(400).json({ error: 'Password is required for the employee account.' });
    }

    const existingEmp = await Employee.findOne({ $or: [{ email }, { employeeCode }] });
    if (existingEmp) return res.status(400).json({ error: 'Employee with this email or code already exists.' });

    const gross = basic * 1.5; // Rule: Gross = 1.5 * basic
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      isTemporaryPassword: false
    });
    await newUser.save();

    const employee = new Employee({
      employeeCode,
      name,
      email,
      phone,
      address,
      department,
      designation,
      salaryStructure: { basic, gross },
      userId: newUser._id
    });
    await employee.save();

    newUser.employeeId = employee._id;
    await newUser.save();

    res.status(201).json({
      message: 'Employee registered successfully with custom password',
      employee
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};