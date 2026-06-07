/**
 * Rent a Boyfriend — Main Server
 * Production-ready Express backend with bcrypt auth, session management,
 * rate limiting, input validation, and JSON database.
 */

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// ─── Cryptography Helpers for Database Encryption ─────────────────────────────
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'RentABoyfriendUltraSecureKey2024!';

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return '';
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    const ivHex = parts[0];
    const encryptedHex = parts[1];
    if (ivHex.length !== 32) return text;
    
    // Check if parts are valid hex
    if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
      return text;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error, returning raw text:', err);
    return text;
  }
}

// ─── Database Helpers ─────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const init = { bookings: [], admin: { username: 'admin', passwordHash: '' } };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
    return init;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  
  if (db.bookings && Array.isArray(db.bookings)) {
    db.bookings = db.bookings.map(b => ({
      ...b,
      name: decrypt(b.name),
      mobile: decrypt(b.mobile),
      instagram: decrypt(b.instagram),
      reason: decrypt(b.reason),
      customReason: decrypt(b.customReason),
      message: decrypt(b.message)
    }));
  }
  return db;
}

function writeDB(data) {
  const secureData = JSON.parse(JSON.stringify(data));
  if (secureData.bookings && Array.isArray(secureData.bookings)) {
    secureData.bookings = secureData.bookings.map(b => ({
      ...b,
      name: encrypt(b.name),
      mobile: encrypt(b.mobile),
      instagram: encrypt(b.instagram),
      reason: encrypt(b.reason),
      customReason: encrypt(b.customReason),
      message: encrypt(b.message)
    }));
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(secureData, null, 2));
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for frontend
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set true in production with HTTPS
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many booking attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.adminLoggedIn) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
}

// ─── Sanitize String ─────────────────────────────────────────────────────────
function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// ─── Public Routes ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

// Protect the HTML dashboard route
app.get('/adminnandufleet', (req, res) => {
  if (req.session && req.session.adminLoggedIn) {
    res.sendFile(path.join(__dirname, 'secure_admin', 'dashboard.html'));
  } else {
    res.sendFile(path.join(__dirname, 'secure_admin', 'login.html'));
  }
});

// Protected routes for secure admin assets
app.get('/adminnandufleet/js/admin.js', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'secure_admin', 'admin.js'));
});

app.get('/adminnandufleet/css/admin.css', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'secure_admin', 'admin.css'));
});

// ─── Booking API ──────────────────────────────────────────────────────────────
app.post('/api/bookings',
  bookingLimiter,
  [
    body('name').notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
    body('mobile').notEmpty().withMessage('Mobile number is required').matches(/^[0-9+\-\s]{7,20}$/),
    body('instagram').notEmpty().withMessage('Instagram link is required').isLength({ max: 200 }),
    body('reason').notEmpty().withMessage('Please select a reason'),
    body('isFemale').equals('true').withMessage('You must confirm that you are female'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, mobile, instagram, reason, customReason, message, isFemale } = req.body;

    const booking = {
      id: uuidv4(),
      name: sanitize(name),
      mobile: sanitize(mobile),
      instagram: sanitize(instagram),
      reason: sanitize(reason),
      customReason: reason === 'Other' ? sanitize(customReason) : '',
      message: sanitize(message),
      isFemale: isFemale === 'true',
      createdAt: new Date().toISOString()
    };

    const db = readDB();
    db.bookings.push(booking);
    writeDB(db);

    res.json({ success: true, message: 'Booking submitted successfully! We will contact you soon. 💕', id: booking.id });
  }
);

// ─── Admin Auth API ───────────────────────────────────────────────────────────
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  const db = readDB();
  const admin = db.admin;

  if (!admin || !admin.passwordHash) {
    return res.status(500).json({ success: false, message: 'Admin not configured. Run: node setup-admin.js' });
  }

  if (username !== admin.username) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  req.session.adminLoggedIn = true;
  req.session.adminUsername = username;
  res.json({ success: true, message: 'Login successful!' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out.' });
});

app.get('/api/admin/check', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.adminLoggedIn) });
});

// ─── Admin Data API ───────────────────────────────────────────────────────────
app.get('/api/admin/bookings', requireAuth, (req, res) => {
  const db = readDB();
  const { search, reason, sort } = req.query;

  let bookings = [...db.bookings];

  if (search) {
    const q = search.toLowerCase();
    bookings = bookings.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.mobile.includes(q) ||
      b.instagram.toLowerCase().includes(q)
    );
  }

  if (reason && reason !== 'all') {
    bookings = bookings.filter(b => b.reason === reason);
  }

  if (sort === 'oldest') {
    bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json({
    success: true,
    total: db.bookings.length,
    count: bookings.length,
    bookings
  });
});

app.get('/api/admin/stats', requireAuth, (req, res) => {
  const db = readDB();
  const bookings = db.bookings;

  const reasonCounts = {};
  bookings.forEach(b => {
    reasonCounts[b.reason] = (reasonCounts[b.reason] || 0) + 1;
  });

  const today = new Date().toDateString();
  const todayCount = bookings.filter(b => new Date(b.createdAt).toDateString() === today).length;

  const thisWeek = bookings.filter(b => {
    const d = new Date(b.createdAt);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  res.json({
    success: true,
    total: bookings.length,
    today: todayCount,
    thisWeek,
    reasonCounts
  });
});

app.delete('/api/admin/bookings/:id', requireAuth, (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }
  db.bookings.splice(idx, 1);
  writeDB(db);
  res.json({ success: true, message: 'Booking deleted.' });
});

app.get('/api/admin/export', requireAuth, (req, res) => {
  const db = readDB();
  const bookings = db.bookings;

  const headers = ['ID', 'Name', 'Mobile', 'Instagram', 'Reason', 'Custom Reason', 'Message', 'Date'];
  const rows = bookings.map(b => [
    b.id,
    `"${b.name}"`,
    `"${b.mobile}"`,
    `"${b.instagram}"`,
    `"${b.reason}"`,
    `"${b.customReason || ''}"`,
    `"${(b.message || '').replace(/"/g, '""')}"`,
    new Date(b.createdAt).toLocaleString()
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
  res.send(csv);
});

// ─── SEO Files ────────────────────────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://localhost:${PORT}/</loc><priority>1.0</priority></url>
  <url><loc>http://localhost:${PORT}/booking</loc><priority>0.8</priority></url>
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /adminnandufleet\nSitemap: http://localhost:${PORT}/sitemap.xml`);
});

// ─── Start Server ─────────────────────────────────────────────
// Run database encryption migration for backward compatibility
try {
  console.log('🔒 Verifying database encryption...');
  const db = readDB();
  writeDB(db);
  console.log('✅ Database encryption verified and migrated.');
} catch (e) {
  console.error('❌ Database encryption migration failed:', e);
}

app.listen(PORT, () => {
  console.log(`\n💖 Rent a Boyfriend Server Running!`);
  console.log(`   🌐 Website: http://localhost:${PORT}`);
  console.log(`   🔐 Admin:   http://localhost:${PORT}/adminnandufleet`);
  console.log(`   📋 Booking: http://localhost:${PORT}/booking`);
  console.log(`\n   First time? Run: node setup-admin.js`);
});
