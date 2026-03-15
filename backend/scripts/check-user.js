const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Log current directory and env path
console.log('Current CWD:', process.cwd());
const envPath = path.resolve(__dirname, '../../.env');
console.log('Checking .env at:', envPath);
console.log('.env exists:', fs.existsSync(envPath));

require('dotenv').config({ path: envPath });

console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');

// Import models directly if possible
const User = require('../src/models/User');
const connectDB = require('../src/config/database');

async function checkUser() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    const user = await User.findOne({ email: 'learner@oplw.com' });
    if (user) {
      console.log('--- USER DATA IN DB ---');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Full Name:', user.fullName);
    } else {
      console.log('User learner@oplw.com not found in DB.');
      // Find one user just to see what's there
      const anyUser = await User.findOne();
      if (anyUser) {
        console.log('Found another user instead:', anyUser.email, anyUser.fullName);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during execution:', err);
    process.exit(1);
  }
}
checkUser();
