/**
 * Booking Page JavaScript
 * Multi-step booking flow: Instagram → YouTube → Form → Success
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
  }, 4000);
}

// ─── Floating Hearts ──────────────────────────────────────────
(function spawnHearts() {
  const container = document.getElementById('heartsContainer');
  if (!container) return;
  const colors = ['rgba(244,63,94,0.35)', 'rgba(236,72,153,0.3)', 'rgba(251,113,133,0.35)'];
  function createHeart() {
    const h = document.createElement('div');
    h.className = 'floating-heart';
    const size = Math.random() * 15 + 8;
    h.style.cssText = `left:${Math.random()*100}%;font-size:${size}px;color:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*10+7}s;animation-delay:${Math.random()*4}s;`;
    container.appendChild(h);
    setTimeout(() => h.remove(), 18000);
  }
  for (let i = 0; i < 6; i++) createHeart();
  setInterval(createHeart, 1200);
})();

// ─── Step Management ──────────────────────────────────────────
let currentStep = 1;

function goToStep(stepNum) {
  // Hide all steps
  [1, 2, 3, 'Success'].forEach(s => {
    const el = document.getElementById(`step${s}`);
    if (el) el.classList.remove('active');
  });

  // Show target step
  const target = document.getElementById(`step${stepNum}`);
  if (target) target.classList.add('active');

  // Update dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (!dot) continue;
    dot.classList.remove('active', 'completed');
    if (i < stepNum) dot.classList.add('completed'), dot.textContent = '✓';
    else if (i === stepNum) dot.classList.add('active'), dot.textContent = i;
    else dot.textContent = i;
  }

  // Update lines
  for (let i = 1; i <= 2; i++) {
    const line = document.getElementById(`line${i}`);
    if (line) line.classList.toggle('filled', i < stepNum);
  }

  // Hide step indicator and notice on success
  if (stepNum === 'Success') {
    const ind = document.getElementById('stepIndicator');
    const notice = document.querySelector('.booking-notice');
    if (ind) ind.style.display = 'none';
    if (notice) notice.style.display = 'none';
  }

  currentStep = stepNum;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Step 1: Instagram ────────────────────────────────────────
const afterInstagramBtn = document.getElementById('afterInstagram');
const instagramBtn = document.getElementById('instagramBtn');

if (instagramBtn) {
  instagramBtn.addEventListener('click', function () {
    // Mark as clicked
    this.style.opacity = '0.7';
    showToast('✅ Instagram link opened! Please follow the account.', 'success');
  });
}

if (afterInstagramBtn) {
  afterInstagramBtn.addEventListener('click', function () {
    showToast('🎉 Awesome! Moving to step 2...', 'success');
    setTimeout(() => goToStep(2), 600);
  });
}

// ─── Step 2: YouTube ──────────────────────────────────────────
const afterYoutubeBtn = document.getElementById('afterYoutube');
const youtubeBtn = document.getElementById('youtubeBtn');

if (youtubeBtn) {
  youtubeBtn.addEventListener('click', function () {
    this.style.opacity = '0.7';
    showToast('✅ YouTube opened! Please subscribe.', 'success');
  });
}

if (afterYoutubeBtn) {
  afterYoutubeBtn.addEventListener('click', function () {
    showToast('🎉 Amazing! Now let\'s complete your booking...', 'success');
    setTimeout(() => goToStep(3), 600);
  });
}

// ─── Step 3: Booking Form ──────────────────────────────────────
const reasonSelect = document.getElementById('reason');
const customReasonGroup = document.getElementById('customReasonGroup');
const customReasonInput = document.getElementById('customReason');

if (reasonSelect) {
  reasonSelect.addEventListener('change', function () {
    if (this.value === 'Other') {
      customReasonGroup.style.display = 'flex';
      customReasonInput.setAttribute('required', 'required');
      customReasonInput.setAttribute('aria-required', 'true');
    } else {
      customReasonGroup.style.display = 'none';
      customReasonInput.removeAttribute('required');
      customReasonInput.setAttribute('aria-required', 'false');
    }
  });
}

// ─── Form Validation ──────────────────────────────────────────
function showFormError(msg) {
  const errEl = document.getElementById('formError');
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.style.display = 'block';
  errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFormError() {
  const errEl = document.getElementById('formError');
  if (errEl) errEl.style.display = 'none';
}

function validateForm() {
  const name = document.getElementById('fullName')?.value.trim();
  const mobile = document.getElementById('mobile')?.value.trim();
  const instagram = document.getElementById('instagram')?.value.trim();
  const reason = document.getElementById('reason')?.value;
  const isFemale = document.getElementById('isFemale')?.checked;
  const customReason = document.getElementById('customReason')?.value.trim();

  if (!name) { showFormError('Please enter your full name.'); return false; }
  if (name.length > 100) { showFormError('Name is too long.'); return false; }
  if (!mobile) { showFormError('Please enter your mobile number.'); return false; }
  if (!/^[0-9+\-\s]{7,20}$/.test(mobile)) {
    showFormError('Please enter a valid mobile number.');
    return false;
  }
  if (!instagram) { showFormError('Please enter your Instagram profile link.'); return false; }
  if (!reason) { showFormError('Please select a reason for booking.'); return false; }
  if (reason === 'Other' && !customReason) {
    showFormError('Please specify your reason.');
    return false;
  }
  if (!isFemale) {
    showFormError('⚠️ You must confirm that you are female to proceed. This service is for women only.');
    return false;
  }
  return true;
}

// ─── Form Submit ──────────────────────────────────────────────
const bookingForm = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const submitSpinner = document.getElementById('submitSpinner');

if (bookingForm) {
  bookingForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideFormError();

    if (!validateForm()) return;

    // Show loading state
    submitBtnText.textContent = 'Sending...';
    submitSpinner.style.display = 'inline-block';
    submitBtn.disabled = true;

    const formData = {
      name: document.getElementById('fullName').value.trim(),
      mobile: document.getElementById('mobile').value.trim(),
      instagram: document.getElementById('instagram').value.trim(),
      reason: document.getElementById('reason').value,
      customReason: document.getElementById('customReason')?.value.trim() || '',
      message: document.getElementById('message')?.value.trim() || '',
      isFemale: document.getElementById('isFemale').checked ? 'true' : 'false',
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Show success screen
        const successId = document.getElementById('successId');
        if (successId) successId.textContent = `Booking ID: ${data.id}`;
        goToStep('Success');
        showToast('💕 Booking submitted successfully!', 'success');
      } else {
        // Show errors
        let errorMsg = data.message || 'Something went wrong.';
        if (data.errors && data.errors.length > 0) {
          errorMsg = data.errors.map(e => e.msg).join(' · ');
        }
        showFormError(errorMsg);
        showToast('❌ ' + errorMsg, 'error');
      }
    } catch (err) {
      showFormError('Network error. Please check your connection and try again.');
      showToast('❌ Connection error. Please try again.', 'error');
    } finally {
      submitBtnText.textContent = '💌 Send My Booking Request';
      submitSpinner.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
}

// ─── Initialize ───────────────────────────────────────────────
goToStep(1);
console.log('💕 Rent a Boyfriend — Booking Page Loaded');
