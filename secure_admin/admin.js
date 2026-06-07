/**
 * Admin Dashboard JavaScript (Secured)
 * Loaded only by authenticated sessions.
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
    toast.style.transition = 'opacity 0.4s, transform 0.4s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(60px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ─── State ────────────────────────────────────────────────────
let allBookings = [];
let pendingDeleteId = null;
let selectedBookingId = null;

// ─── Set Date ─────────────────────────────────────────────────
const topbarDate = document.getElementById('topbarDate');
if (topbarDate) {
  topbarDate.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── Auth Check ───────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch('/api/admin/check');
    const data = await res.json();
    if (data.loggedIn) {
      showDashboard();
    } else {
      // If session expired or invalid, redirect to /admin to re-authenticate
      window.location.href = '/adminnandufleet';
    }
  } catch (e) {
    console.error('Auth check failed:', e);
  }
}

function showDashboard() {
  const loginPage = document.getElementById('loginPage');
  if (loginPage) loginPage.style.display = 'none';
  
  const adminLayout = document.getElementById('adminLayout');
  if (adminLayout) adminLayout.classList.add('visible');
  
  loadStats();
  loadBookings();
}

// ─── Logout ───────────────────────────────────────────────────
document.getElementById('logoutBtn')?.addEventListener('click', async function () {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout request failed:', e);
  }
  window.location.href = '/adminnandufleet';
});

// ─── Navigation ───────────────────────────────────────────────
document.querySelectorAll('.sidebar-nav-item').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');

    const section = this.dataset.section;
    document.getElementById('sectionDashboard').style.display = section === 'dashboard' ? 'block' : 'none';
    document.getElementById('sectionApplications').style.display = section === 'applications' ? 'block' : 'none';
    document.getElementById('pageTitle').textContent =
      section === 'dashboard' ? 'Dashboard Overview' : 'All Applications';
  });
});

document.getElementById('viewAllBtn')?.addEventListener('click', function () {
  document.getElementById('navApplications').click();
});

// ─── Load Stats ───────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();

    if (data.success) {
      animateCount('statTotal', data.total);
      animateCount('statToday', data.today);
      animateCount('statWeek', data.thisWeek);
      renderChart(data.reasonCounts, data.total);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 40);
}

function renderChart(reasonCounts, total) {
  const chartBars = document.getElementById('chartBars');
  if (!chartBars) return;

  if (!total || Object.keys(reasonCounts).length === 0) {
    chartBars.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">No data yet. Chart will appear here.</div>
      </div>`;
    return;
  }

  const sorted = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  chartBars.innerHTML = sorted.map(([reason, count]) => {
    const pct = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="chart-bar-item">
        <div class="chart-bar-label">${escapeHtml(reason)}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width: 0%" data-width="${pct}%"></div>
        </div>
        <div class="chart-bar-count">${count}</div>
      </div>`;
  }).join('');

  // Animate bars
  setTimeout(() => {
    chartBars.querySelectorAll('.chart-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

// ─── Load Bookings ────────────────────────────────────────────
async function loadBookings(search = '', reason = 'all', sort = 'newest') {
  try {
    const params = new URLSearchParams({ search, reason, sort });
    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();

    if (data.success) {
      allBookings = data.bookings;
      renderTable(data.bookings, data.total);
      renderRecentTable(data.bookings.slice(0, 5));
    }
  } catch (e) {
    console.error('Failed to load bookings:', e);
    showToast('❌ Failed to load bookings.', 'error');
  }
}

// ─── Render Applications Table ────────────────────────────────
function renderTable(bookings, total) {
  const tbody = document.getElementById('applicationsTableBody');
  const tableCount = document.getElementById('tableCount');
  if (!tbody) return;

  if (tableCount) tableCount.textContent = `${bookings.length} record${bookings.length !== 1 ? 's' : ''}`;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">💌</div><div class="empty-state-text">No applications found.</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map((b, i) => `
    <tr>
      <td style="color:#8a5060; font-size:0.8rem;">${i + 1}</td>
      <td><div class="table-name">${escapeHtml(b.name)}</div></td>
      <td><div class="table-mobile">${escapeHtml(b.mobile)}</div></td>
      <td class="table-instagram"><a href="${escapeHtml(b.instagram)}" target="_blank" rel="noopener noreferrer">${truncate(b.instagram, 25)}</a></td>
      <td><span class="table-reason-badge">${escapeHtml(b.reason)}</span></td>
      <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem; color:#5a1a28;">${escapeHtml(truncate(b.message || '—', 40))}</td>
      <td class="table-date">${formatDate(b.createdAt)}</td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="viewDetails('${b.id}')" aria-label="View details for ${escapeHtml(b.name)}">👁️</button>
          <button class="delete-btn" onclick="confirmDelete('${b.id}')" aria-label="Delete booking for ${escapeHtml(b.name)}">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Render Recent Table ──────────────────────────────────────
function renderRecentTable(bookings) {
  const tbody = document.getElementById('recentTableBody');
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-state-icon">💌</div><div class="empty-state-text">No applications yet.</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><div class="table-name">${escapeHtml(b.name)}</div></td>
      <td><div class="table-mobile">${escapeHtml(b.mobile)}</div></td>
      <td><span class="table-reason-badge">${escapeHtml(b.reason)}</span></td>
      <td class="table-date">${formatDate(b.createdAt)}</td>
    </tr>
  `).join('');
}

// ─── View Details ─────────────────────────────────────────────
function viewDetails(id) {
  const b = allBookings.find(x => x.id === id);
  if (!b) return;
  selectedBookingId = id;

  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="detail-row">
      <div class="detail-key">Name</div>
      <div class="detail-val">${escapeHtml(b.name)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-key">Mobile</div>
      <div class="detail-val">${escapeHtml(b.mobile)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-key">Instagram</div>
      <div class="detail-val"><a href="${escapeHtml(b.instagram)}" target="_blank" rel="noopener" style="color:var(--rose-600);">${escapeHtml(b.instagram)}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-key">Reason</div>
      <div class="detail-val"><span class="table-reason-badge">${escapeHtml(b.reason)}</span></div>
    </div>
    ${b.customReason ? `<div class="detail-row"><div class="detail-key">Custom Reason</div><div class="detail-val">${escapeHtml(b.customReason)}</div></div>` : ''}
    <div class="detail-row">
      <div class="detail-key">Message</div>
      <div class="detail-val">${escapeHtml(b.message || '—')}</div>
    </div>
    <div class="detail-row">
      <div class="detail-key">Confirmed Female</div>
      <div class="detail-val">${b.isFemale ? '✅ Yes' : '❌ No'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-key">Date</div>
      <div class="detail-val">${formatDate(b.createdAt)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-key">ID</div>
      <div class="detail-val" style="font-size:0.78rem; font-family:monospace; color:#8a5060;">${b.id}</div>
    </div>
  `;

  document.getElementById('detailModal').classList.add('show');
}

// ─── Delete ───────────────────────────────────────────────────
function confirmDelete(id) {
  pendingDeleteId = id;
  document.getElementById('detailModal').classList.remove('show');
  document.getElementById('confirmModal').classList.add('show');
}

document.getElementById('confirmCancel')?.addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('show');
  pendingDeleteId = null;
});

document.getElementById('confirmDelete')?.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  try {
    const res = await fetch(`/api/admin/bookings/${pendingDeleteId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Application deleted successfully.', 'success');
      document.getElementById('confirmModal').classList.remove('show');
      pendingDeleteId = null;
      loadBookings(
        document.getElementById('searchInput')?.value || '',
        document.getElementById('reasonFilter')?.value || 'all',
        document.getElementById('sortFilter')?.value || 'newest'
      );
      loadStats();
    } else {
      showToast('❌ ' + (data.message || 'Delete failed.'), 'error');
    }
  } catch (e) {
    showToast('❌ Network error.', 'error');
  }
});

// Modal close
document.getElementById('modalClose')?.addEventListener('click', () => {
  document.getElementById('detailModal').classList.remove('show');
});
document.getElementById('modalDelete')?.addEventListener('click', () => {
  if (selectedBookingId) confirmDelete(selectedBookingId);
});

// Close modals on backdrop click
['detailModal', 'confirmModal'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('detailModal')?.classList.remove('show');
    document.getElementById('confirmModal')?.classList.remove('show');
  }
});

// ─── Search & Filter ──────────────────────────────────────────
let searchDebounce;
document.getElementById('searchInput')?.addEventListener('input', function () {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    loadBookings(this.value, document.getElementById('reasonFilter')?.value, document.getElementById('sortFilter')?.value);
  }, 400);
});

document.getElementById('reasonFilter')?.addEventListener('change', function () {
  loadBookings(document.getElementById('searchInput')?.value || '', this.value, document.getElementById('sortFilter')?.value);
});

document.getElementById('sortFilter')?.addEventListener('change', function () {
  loadBookings(document.getElementById('searchInput')?.value || '', document.getElementById('reasonFilter')?.value, this.value);
});

// ─── Export CSV ───────────────────────────────────────────────
document.getElementById('exportBtn')?.addEventListener('click', function () {
  window.open('/api/admin/export', '_blank');
  showToast('📥 Downloading CSV...', 'success');
});

// ─── Helpers ──────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Init ─────────────────────────────────────────────────────
checkAuth();
console.log('🔐 Rent a Boyfriend — Secure Admin Panel Loaded');
