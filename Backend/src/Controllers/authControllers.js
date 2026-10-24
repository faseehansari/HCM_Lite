import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Modules/User.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user._id, role: user.role, employeeId: user.employeeId },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isTemporaryPassword: user.isTemporaryPassword
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};