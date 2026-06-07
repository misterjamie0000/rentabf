/**
 * Landing Page JavaScript
 * Floating hearts, scroll reveal, gallery with iOS-style mosaic, lightbox
 */

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.38s, transform 0.38s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ─── Floating Hearts ──────────────────────────────────────────
(function spawnHearts() {
  const container = document.getElementById('heartsContainer');
  if (!container) return;
  const colors = [
    'rgba(255,107,157,0.45)', 'rgba(255,51,102,0.38)',
    'rgba(255,179,198,0.5)',  'rgba(201,24,74,0.32)',
    'rgba(255,133,161,0.42)'
  ];
  function makeHeart() {
    const h = document.createElement('div');
    h.className = 'floating-heart';
    const sz  = Math.random() * 18 + 9;
    const dur = Math.random() * 13 + 9;
    const del = Math.random() * 6;
    h.style.cssText = `
      left:${Math.random()*100}%;
      font-size:${sz}px;
      color:${colors[Math.floor(Math.random()*colors.length)]};
      animation-name:floatUp;
      animation-duration:${dur}s;
      animation-delay:${del}s;
    `;
    container.appendChild(h);
    setTimeout(() => h.remove(), (dur + del) * 1000 + 200);
  }
  for (let i = 0; i < 8; i++) makeHeart();
  setInterval(makeHeart, 900);
})();

// ─── Scroll Reveal ────────────────────────────────────────────
(function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  function check() {
    const vph = window.innerHeight;
    els.forEach(el => {
      if (el.getBoundingClientRect().top < vph - 70) el.classList.add('visible');
    });
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();



// ─── Smooth Anchor Scroll ─────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ─── Parallax Subtle ──────────────────────────────────────────
window.addEventListener('scroll', function () {
  const hero = document.querySelector('.hero-image-wrap');
  if (!hero) return;
  const scrolled = window.pageYOffset;
  hero.style.transform = `translateY(${scrolled * 0.05}px)`;
}, { passive: true });

// ─── Smooth Scroll for Anchor Links ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Hero Profile Image Number Counter ────────────────────────
(function animateStats() {
  const statValues = document.querySelectorAll('.hero-stat-value');
  statValues.forEach(el => {
    const text = el.textContent.trim();
    // Skip non-numeric
    if (!text.match(/\d/)) return;
  });
})();

// ─── Set Current Date in Topbar ───────────────────────────────
const topbarDate = document.getElementById('topbarDate');
if (topbarDate) {
  topbarDate.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── Recent Activity Notification Rotation ────────────────────
(function initActivityRotation() {
  const card = document.getElementById('activityCard');
  if (!card) return;

  const applications = [
    { name: 'Priyanka S.', service: 'Event Companion', location: 'Mumbai', time: '5 mins ago', initial: 'P', color: '#ffd6e0', text: '#c9184a', msg: 'Need a perfect gentleman to accompany me to a family dinner. Looking forward to good vibes!' },
    { name: 'Sneha R.', service: 'Coffee Date', location: 'Bangalore', time: '24 mins ago', initial: 'S', color: '#fce7f3', text: '#c9184a', msg: 'Excited to have someone to chat with over coffee about art and literature. Truly looking forward to it.' },
    { name: 'Tanvi M.', service: 'Deep Talks', location: 'Pune', time: '1 hour ago', initial: 'T', color: '#fff0f3', text: '#c9184a', msg: 'Just need a warm, non-judgmental companion to listen and share some deep thoughts.' },
    { name: 'Shalini K.', service: 'Cultural Events', location: 'Delhi', time: '2 hours ago', initial: 'S', color: '#fdf4ff', text: '#7022b4', msg: 'Looking for a companion to visit the new art gallery exhibition this weekend. Excited!' },
    { name: 'Divya P.', service: 'Friendly Outing', location: 'Hyderabad', time: '3 hours ago', initial: 'D', color: '#ffe4e6', text: '#c9184a', msg: 'Visiting a new restaurant and wanted some great company to explore the food scene together.' }
  ];

  let idx = 0;

  function rotate() {
    card.classList.add('changing');
    setTimeout(() => {
      idx = (idx + 1) % applications.length;
      const app = applications[idx];
      
      const avatar = document.getElementById('activityAvatar');
      if (avatar) {
        avatar.textContent = app.initial;
        avatar.style.background = app.color;
        avatar.style.color = app.text;
      }
      
      const name = document.getElementById('activityName');
      if (name) name.textContent = app.name;
      
      const service = document.getElementById('activityService');
      if (service) service.textContent = `${app.service} • ${app.location}`;
      
      const time = document.getElementById('activityTime');
      if (time) time.textContent = app.time;
      
      const message = document.getElementById('activityMessage');
      if (message) message.textContent = `"${app.msg}"`;
      
      card.classList.remove('changing');
    }, 500);
  }

  setInterval(rotate, 5000); // Rotate every 5 seconds
})();

console.log('Rent a Boyfriend — Landing Page Loaded');

