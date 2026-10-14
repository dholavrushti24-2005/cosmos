// js/auth.js — Admin login & Forgot Password handling, wired to the backend.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminLoginForm');

  // If already logged in, skip straight past login
  if (localStorage.getItem('cosmos_admin_token') && form) {
    window.location.href = 'dashboard.html';
    return;
  }

  // 1. Admin Login Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorBox = document.getElementById('loginError');
      errorBox.classList.add('hidden');

      const formData = new FormData(form);
      const email = formData.get('email').trim();
      const password = formData.get('password');

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      try {
        const data = await adminApi.post('/auth/admin-login', { email, password }, { auth: false });
        localStorage.setItem('cosmos_admin_token', data.token);
        localStorage.setItem('cosmos_admin_name', data.admin.name);
        window.location.href = 'dashboard.html';
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }

  // 2. Admin Forgot Password Flow
  const openAdminForgotModal = document.getElementById('openAdminForgotModal');
  const adminForgotModal = document.getElementById('adminForgotModal');
  const closeAdminForgotModal = document.getElementById('closeAdminForgotModal');
  const adminForgotStep1Form = document.getElementById('adminForgotStep1Form');
  const adminForgotStep2Form = document.getElementById('adminForgotStep2Form');
  const adminForgotEmailInput = document.getElementById('adminForgotEmailInput');
  const adminForgotStep1Error = document.getElementById('adminForgotStep1Error');
  const adminForgotStep2Error = document.getElementById('adminForgotStep2Error');
  const adminForgotOtpSentEmail = document.getElementById('adminForgotOtpSentEmail');

  let adminForgotEmailTarget = '';

  if (openAdminForgotModal && adminForgotModal) {
    openAdminForgotModal.addEventListener('click', (e) => {
      e.preventDefault();
      adminForgotStep1Form.classList.remove('hidden');
      adminForgotStep2Form.classList.add('hidden');
      adminForgotStep1Error.classList.add('hidden');
      adminForgotStep2Error.classList.add('hidden');
      adminForgotModal.classList.remove('hidden');
    });

    if (closeAdminForgotModal) {
      closeAdminForgotModal.addEventListener('click', () => {
        adminForgotModal.classList.add('hidden');
      });
    }

    // Step 1: Send OTP
    if (adminForgotStep1Form) {
      adminForgotStep1Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        adminForgotStep1Error.classList.add('hidden');

        adminForgotEmailTarget = adminForgotEmailInput.value.trim();
        const sendBtn = document.getElementById('adminSendOtpBtn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending OTP...';

        try {
          const res = await adminApi.post('/auth/forgot-password', {
            email: adminForgotEmailTarget,
            role: 'admin',
          }, { auth: false });

          if (adminForgotOtpSentEmail) adminForgotOtpSentEmail.textContent = adminForgotEmailTarget;
          adminForgotStep1Form.classList.add('hidden');
          adminForgotStep2Form.classList.remove('hidden');

          const adminForgotOtpDisplayBox = document.getElementById('adminForgotOtpDisplayBox');
          const adminDisplayedForgotOtpCode = document.getElementById('adminDisplayedForgotOtpCode');
          const adminForgotOtpInput = document.getElementById('adminForgotOtpInput');

          if (res && res.otp) {
            if (adminDisplayedForgotOtpCode) adminDisplayedForgotOtpCode.textContent = res.otp;
            if (adminForgotOtpDisplayBox) adminForgotOtpDisplayBox.classList.remove('hidden');
            if (adminForgotOtpInput) adminForgotOtpInput.value = res.otp;
          }
        } catch (err) {
          adminForgotStep1Error.textContent = err.message;
          adminForgotStep1Error.classList.remove('hidden');
        } finally {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send 6-Digit OTP';
        }
      });
    }

    // Step 2: Verify OTP & Set New Password
    if (adminForgotStep2Form) {
      adminForgotStep2Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        adminForgotStep2Error.classList.add('hidden');

        const otp = document.getElementById('adminForgotOtpInput').value.trim();
        const newPassword = document.getElementById('adminForgotNewPasswordInput').value;
        const resetBtn = document.getElementById('adminResetPasswordBtn');

        resetBtn.disabled = true;
        resetBtn.textContent = 'Resetting Password...';

        try {
          const res = await adminApi.post('/auth/reset-password', {
            email: adminForgotEmailTarget,
            otp,
            newPassword,
            role: 'admin',
          }, { auth: false });

          alert(res.message || 'Admin password reset successfully! Please log in.');
          adminForgotModal.classList.add('hidden');

          const loginEmail = document.querySelector('#adminLoginForm input[name="email"]');
          if (loginEmail) loginEmail.value = adminForgotEmailTarget;
        } catch (err) {
          adminForgotStep2Error.textContent = err.message;
          adminForgotStep2Error.classList.remove('hidden');
        } finally {
          resetBtn.disabled = false;
          resetBtn.textContent = 'Reset Admin Password';
        }
      });
    }
  }
});
