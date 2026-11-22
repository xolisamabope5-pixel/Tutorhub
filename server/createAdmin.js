require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
    }
    if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = await Admin.findOne({ username: email });
    if (existing) throw new Error('An admin with this email already exists.');
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await Admin.create({ username: email, passwordHash });
    console.log(`Admin created: ${email}`);
  } catch (error) {
    console.error('Could not create admin:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
createAdmin();
