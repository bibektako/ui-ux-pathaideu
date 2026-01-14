const mongoose = require('mongoose');
const User = require('../models/user.model');
const config = require('../config');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get admin details from command line arguments or use defaults
    const email = process.argv[2] || 'admin@pathaideu.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin User';
    const phone = process.argv[5] || '+977 9800000000';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('⚠️  Admin user already exists with this email');
        console.log(`   Email: ${email}`);
        console.log(`   You can login with this email and password`);
        await mongoose.disconnect();
        return;
      } else {
        // Update existing user to admin
        existingAdmin.role = 'admin';
        existingAdmin.verified = true;
        existingAdmin.password = password; // Will be hashed by pre-save hook
        await existingAdmin.save();
        console.log('✅ Existing user updated to admin');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        await mongoose.disconnect();
        return;
      }
    }

    // Create new admin user
    const admin = new User({
      email,
      password,
      name,
      phone,
      role: 'admin',
      verified: true // Admin is auto-verified
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${name}`);
    console.log(`   Phone: ${phone}`);
    console.log('\n📝 You can now login with these credentials');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();












