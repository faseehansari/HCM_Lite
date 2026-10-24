import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from './src/Config/DB.js';
import User from './src/Modules/User.js';

const seedAdmin = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || 'admin@hcm.com';
    const password = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123';

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists in the database.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = new User({
      name: 'System Admin',
      email: email,
      password: hashedPassword,
      role: 'admin',
      isTemporaryPassword: false
    });

    await adminUser.save();
    console.log(`Default Admin created successfully: ${email}`);
    process.exit(0);
  } catch (error) {
    console.log('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();