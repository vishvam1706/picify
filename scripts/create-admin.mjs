/**
 * create-admin.mjs
 * Run once to create an admin user for Picify:
 *   node scripts/create-admin.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set in .env.local'); process.exit(1); }

// ── Admin credentials — change these before running ──
const ADMIN = {
  email:       'admin@picify.com',
  username:    'picifyadmin',
  displayName: 'Picify Admin',
  password:    'Admin@12345',   // change this after first login!
};

const UserSchema = new mongoose.Schema({
  email:       { type: String, unique: true, sparse: true, lowercase: true },
  password:    String,
  username:    { type: String, unique: true, required: true },
  displayName: String,
  role:        { type: String, default: 'user' },
  isVerified:  { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
  isCreator:   { type: Boolean, default: true },
  privacy:     { isPublic: { type: Boolean, default: true } },
  accountType: { type: String, default: 'email' },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
}, { timestamps: true });

async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // Check if admin already exists
  const existing = await User.findOne({ $or: [{ email: ADMIN.email }, { username: ADMIN.username }] });
  if (existing) {
    if (existing.role !== 'admin') {
      // Promote existing user to admin
      existing.role = 'admin';
      existing.isVerified = true;
      existing.emailVerified = true;
      await existing.save();
      console.log(`✅ Existing user @${existing.username} promoted to admin!`);
    } else {
      console.log(`ℹ️  Admin @${existing.username} already exists.`);
    }
    await mongoose.disconnect();
    return;
  }

  // Hash password
  const hash = await bcrypt.hash(ADMIN.password, 12);

  // Create admin user
  const admin = await User.create({
    email:        ADMIN.email,
    username:     ADMIN.username,
    displayName:  ADMIN.displayName,
    password:     hash,
    role:         'admin',
    isVerified:   true,
    emailVerified: true,
    isActive:     true,
    isCreator:    true,
    accountType:  'email',
  });

  console.log('🎉 Admin user created successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Email    : ${ADMIN.email}`);
  console.log(`  Username : @${ADMIN.username}`);
  console.log(`  Password : ${ADMIN.password}`);
  console.log(`  Role     : ${admin.role}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  Change the password after first login!');
  console.log('🌐 Admin Panel: http://localhost:3000/admin\n');

  await mongoose.disconnect();
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
