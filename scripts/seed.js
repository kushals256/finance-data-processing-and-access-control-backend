/**
 * Database Seed Script
 *
 * Creates sample users (admin, analyst, viewer) and 100+ financial records
 * across 8 categories spanning 6 months.
 *
 * Usage: npm run seed
 */

const mongoose = require('mongoose');
const config = require('../src/config/env');
const User = require('../src/models/User');
const FinancialRecord = require('../src/models/FinancialRecord');
const AuditLog = require('../src/models/AuditLog');

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Rental Income'],
  expense: ['Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Rent'],
};

const DESCRIPTIONS = {
  Salary: ['Monthly salary', 'Bi-weekly paycheck', 'Bonus payment', 'Year-end bonus'],
  Freelance: ['Web development project', 'Design consultation', 'Content writing', 'Mobile app project'],
  Investments: ['Stock dividends', 'Mutual fund returns', 'Crypto gains', 'Bond interest'],
  'Rental Income': ['Apartment rent', 'Office space rental', 'Parking space rental'],
  'Food & Dining': ['Grocery shopping', 'Restaurant dinner', 'Coffee shop', 'Food delivery', 'Lunch at work'],
  Transportation: ['Uber ride', 'Gas refill', 'Bus pass', 'Car maintenance', 'Parking fee'],
  Utilities: ['Electricity bill', 'Water bill', 'Internet bill', 'Phone bill', 'Gas bill'],
  Entertainment: ['Netflix subscription', 'Movie tickets', 'Concert tickets', 'Gaming subscription'],
  Healthcare: ['Doctor visit', 'Pharmacy', 'Dental checkup', 'Health insurance premium'],
  Shopping: ['Clothing', 'Electronics', 'Home decor', 'Personal care', 'Books'],
  Education: ['Online course', 'Workshop fee', 'Book purchase', 'Certification exam'],
  Rent: ['Monthly apartment rent', 'Office space rent'],
};

const randomAmount = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const randomDate = (monthsBack) => {
  const now = new Date();
  const date = new Date(now);
  date.setMonth(date.getMonth() - Math.floor(Math.random() * monthsBack));
  date.setDate(Math.floor(Math.random() * 28) + 1);
  return date;
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('📦 Connected to MongoDB\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      FinancialRecord.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data\n');

    // ─── Create Users ───────────────────────────────────────────────
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@finance.com',
        password: 'Admin@123',
        role: 'admin',
        status: 'active',
      },
      {
        name: 'Analyst User',
        email: 'analyst@finance.com',
        password: 'Analyst@123',
        role: 'analyst',
        status: 'active',
      },
      {
        name: 'Viewer User',
        email: 'viewer@finance.com',
        password: 'Viewer@123',
        role: 'viewer',
        status: 'active',
      },
    ]);

    console.log('👤 Users created:');
    users.forEach((u) => console.log(`   ${u.role}: ${u.email} / Password: ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}@123`));
    console.log('');

    const adminUser = users[0];

    // ─── Create Financial Records ───────────────────────────────────
    const records = [];

    // Generate income records
    for (let i = 0; i < 40; i++) {
      const category = randomElement(CATEGORIES.income);
      const descriptions = DESCRIPTIONS[category];

      records.push({
        amount: category === 'Salary' ? randomAmount(3000, 8000) : randomAmount(100, 5000),
        type: 'income',
        category,
        date: randomDate(6),
        description: randomElement(descriptions),
        notes: Math.random() > 0.5 ? `Note for ${category.toLowerCase()} record` : '',
        createdBy: adminUser._id,
        flags: [],
      });
    }

    // Generate expense records
    for (let i = 0; i < 60; i++) {
      const category = randomElement(CATEGORIES.expense);
      const descriptions = DESCRIPTIONS[category];
      const amount = category === 'Rent' ? randomAmount(1000, 3000) : randomAmount(10, 500);

      const flags = [];
      // Pre-flag some records for demo
      if (amount > config.anomaly.amountThreshold) {
        flags.push('EXCEEDS_THRESHOLD');
      }

      records.push({
        amount,
        type: 'expense',
        category,
        date: randomDate(6),
        description: randomElement(descriptions),
        notes: Math.random() > 0.6 ? `Note for ${category.toLowerCase()} record` : '',
        createdBy: adminUser._id,
        flags,
      });
    }

    // Add a few high-value flagged records for demo
    records.push(
      {
        amount: 75000,
        type: 'income',
        category: 'Investments',
        date: randomDate(2),
        description: 'Large stock sale — flagged by anomaly detection',
        notes: 'This record exceeds the threshold and should be flagged',
        createdBy: adminUser._id,
        flags: ['EXCEEDS_THRESHOLD', 'HIGH_AMOUNT_FOR_CATEGORY'],
      },
      {
        amount: 55000,
        type: 'expense',
        category: 'Shopping',
        date: randomDate(1),
        description: 'Luxury watch purchase — flagged as anomaly',
        notes: 'Unusually high expense in this category',
        createdBy: adminUser._id,
        flags: ['EXCEEDS_THRESHOLD', 'HIGH_AMOUNT_FOR_CATEGORY'],
      }
    );

    const createdRecords = await FinancialRecord.insertMany(records);
    console.log(`💰 Created ${createdRecords.length} financial records\n`);

    // ─── Summary ────────────────────────────────────────────────────
    const incomeTotal = records.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expenseTotal = records.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const flaggedCount = records.filter((r) => r.flags.length > 0).length;

    console.log('📊 Seed Summary:');
    console.log(`   Users:           ${users.length}`);
    console.log(`   Records:         ${createdRecords.length}`);
    console.log(`   Total Income:    $${incomeTotal.toFixed(2)}`);
    console.log(`   Total Expenses:  $${expenseTotal.toFixed(2)}`);
    console.log(`   Net Balance:     $${(incomeTotal - expenseTotal).toFixed(2)}`);
    console.log(`   Flagged Records: ${flaggedCount}`);
    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Admin:   admin@finance.com   / Admin@123');
    console.log('   Analyst: analyst@finance.com / Analyst@123');
    console.log('   Viewer:  viewer@finance.com  / Viewer@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
