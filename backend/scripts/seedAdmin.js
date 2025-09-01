import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@socialmedia.com' 
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      fullName: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@socialmedia.com',
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      bio: 'System Administrator - Full access to platform management',
      role: 'admin',
      isVerified: true,
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Username:', adminUser.username);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedAdmin();
