// Run this in your backend folder: node diagnose.js
// It will show you exactly what's in your DB and why login fails

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function diagnose() {
  console.log('\n🔍 FOODBRIDGE LOGIN DIAGNOSTICS\n');
  console.log('MONGO_URI:', process.env.MONGO_URI || '❌ NOT SET in .env');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected\n');
  } catch (err) {
    console.log('❌ MongoDB connection FAILED:', err.message);
    console.log('   Fix: make sure MongoDB is running (mongod) and MONGO_URI in .env is correct\n');
    process.exit(1);
  }

  const User = require('./models/User');

  // Find users with password included
  const users = await User.find({}).select('+password');
  console.log(`👥 Total users in database: ${users.length}`);

  if (users.length === 0) {
    console.log('\n❌ NO USERS FOUND — you need to run: npm run seed\n');
    process.exit(0);
  }

  console.log('\n📋 Checking each user\'s password:\n');

  const testPasswords = {
    'admin@foodwaste.com': 'admin123',
    'donor1@example.com': 'donor123',
    'donor2@example.com': 'donor123',
    'ngo1@example.com':   'ngo123',
    'ngo2@example.com':   'ngo123',
  };

  for (const user of users) {
    const expected = testPasswords[user.email];
    if (!expected) {
      console.log(`  ${user.email} (${user.role}) — unknown test password`);
      continue;
    }

    if (!user.password) {
      console.log(`  ❌ ${user.email} — NO PASSWORD STORED`);
      continue;
    }

    const works = await bcrypt.compare(expected, user.password);
    const hashLength = user.password.length;

    if (works) {
      console.log(`  ✅ ${user.email} (${user.role}) — password "${expected}" works`);
    } else {
      console.log(`  ❌ ${user.email} (${user.role}) — password "${expected}" FAILS`);
      console.log(`     Hash length: ${hashLength} chars (normal=60, double-hashed=60 but wrong)`);
      console.log(`     Hash prefix: ${user.password.slice(0, 10)}...`);
      console.log(`     → This user was seeded with the DOUBLE-HASH bug. Run: npm run seed`);
    }
  }

  console.log('\n─────────────────────────────────');

  const allWork = users.filter(u => testPasswords[u.email]).every(async u => {
    const pw = testPasswords[u.email];
    return pw ? bcrypt.compare(pw, u.password) : true;
  });

  console.log('\n📌 ACTION REQUIRED:');
  console.log('   Run the fixed seed: npm run seed');
  console.log('   Then try logging in again.\n');

  await mongoose.disconnect();
  process.exit(0);
}

diagnose().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
