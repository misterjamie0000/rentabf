/**
 * Setup Admin Credentials
 * Run once: node setup-admin.js
 * This hashes the admin password and stores it in db.json
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) process.env[key.trim()] = val.join('=').trim();
  });
}

const DB_PATH = path.join(__dirname, 'db.json');
const SALT_ROUNDS = 12;

async function setup() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin@RentBF2024';

  console.log('🔐 Hashing admin password...');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let db = { bookings: [], admin: {} };
  if (fs.existsSync(DB_PATH)) {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  }

  db.admin = { username, passwordHash };
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

  console.log('✅ Admin credentials set up successfully!');
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log('   Password hash stored in db.json');
}

setup().catch(console.error);
