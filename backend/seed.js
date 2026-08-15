// FIXED seed.js
// ✅ Passwords are passed as plain text — the User model's pre-save hook hashes them
// ❌ Do NOT import bcrypt here — that caused double-hashing which broke all logins

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Food = require('./models/Food');
const Request = require('./models/Request');

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  await User.deleteMany({});
  await Food.deleteMany({});
  await Request.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // ✅ Plain text passwords — User model hashes them automatically on save
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@foodwaste.com',
    password: 'admin123',
    role: 'ADMIN',
    phone: '+1-555-000-0000',
    organization: 'Food Waste HQ',
  });

  const donor1 = await User.create({
    name: 'Green Valley Restaurant',
    email: 'donor1@example.com',
    password: 'donor123',
    role: 'DONOR',
    phone: '+1-555-100-1001',
    organization: 'Green Valley Restaurant',
  });

  const donor2 = await User.create({
    name: 'Sunrise Bakery',
    email: 'donor2@example.com',
    password: 'donor123',
    role: 'DONOR',
    phone: '+1-555-100-1002',
    organization: 'Sunrise Bakery',
  });

  const ngo1 = await User.create({
    name: 'Hope Foundation',
    email: 'ngo1@example.com',
    password: 'ngo123',
    role: 'NGO',
    phone: '+1-555-200-2001',
    organization: 'Hope Foundation',
  });

  const ngo2 = await User.create({
    name: 'City Food Bank',
    email: 'ngo2@example.com',
    password: 'ngo123',
    role: 'NGO',
    phone: '+1-555-200-2002',
    organization: 'City Food Bank',
  });

  console.log('👥 Created 5 users (1 admin, 2 donors, 2 NGOs)');

  const tomorrow  = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
  const twoDays   = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const food1 = await Food.create({
    title: 'Pasta Primavera - Large Batch',
    description: 'Freshly made pasta with seasonal vegetables. Prepared today for an event that was cancelled.',
    quantity: '50 servings',
    expiryTime: tomorrow,
    location: { address: '123 Main St, New York, NY', lat: 40.7128, lng: -74.006 },
    status: 'available',
    category: 'cooked',
    donor: donor1._id,
  });

  const food2 = await Food.create({
    title: 'Assorted Fresh Breads',
    description: 'Mix of whole wheat, sourdough, and multigrain loaves. Baked this morning.',
    quantity: '30 loaves',
    expiryTime: tomorrow,
    location: { address: '456 Baker St, New York, NY', lat: 40.7282, lng: -73.9942 },
    status: 'available',
    category: 'packaged',
    donor: donor2._id,
  });

  const food3 = await Food.create({
    title: 'Vegetable Curry & Rice',
    description: 'Vegetarian curry with basmati rice. No allergens except traces of nuts.',
    quantity: '40 servings',
    expiryTime: twoDays,
    location: { address: '789 Park Ave, New York, NY', lat: 40.7549, lng: -73.984 },
    status: 'available',
    category: 'cooked',
    donor: donor1._id,
  });

  const food4 = await Food.create({
    title: 'Packaged Juice Boxes',
    description: 'Apple and orange juice boxes, individually sealed.',
    quantity: '120 units',
    expiryTime: threeDays,
    location: { address: '321 West St, New York, NY', lat: 40.7411, lng: -74.0083 },
    status: 'requested',
    category: 'beverages',
    donor: donor2._id,
  });

  const food5 = await Food.create({
    title: 'Grilled Chicken & Salad',
    description: 'Grilled chicken breast with garden salad. Prepared for a corporate lunch.',
    quantity: '25 plates',
    expiryTime: tomorrow,
    location: { address: '654 5th Ave, New York, NY', lat: 40.758, lng: -73.9855 },
    status: 'completed',
    category: 'cooked',
    donor: donor1._id,
  });

  console.log('🍱 Created 5 food listings');

  await Request.create({
    food: food4._id,
    ngo: ngo1._id,
    donor: donor2._id,
    status: 'accepted',
    message: 'We serve 200 children daily and juice would be greatly appreciated.',
    pickupTime: tomorrow,
  });

  await Request.create({
    food: food5._id,
    ngo: ngo2._id,
    donor: donor1._id,
    status: 'completed',
    message: 'Our shelter has 30 residents who need meals tonight.',
    responseNote: 'Happy to help! Please come by at 6pm.',
    pickupTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });

  console.log('📋 Created 2 requests');
  console.log('\n✅ Seeding complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('📧 Test Accounts:');
  console.log('  ADMIN  → admin@foodwaste.com   / admin123');
  console.log('  DONOR1 → donor1@example.com    / donor123');
  console.log('  DONOR2 → donor2@example.com    / donor123');
  console.log('  NGO1   → ngo1@example.com      / ngo123');
  console.log('  NGO2   → ngo2@example.com      / ngo123');
  console.log('─────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
