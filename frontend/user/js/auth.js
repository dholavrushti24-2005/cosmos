// js/auth.js — Login & Register form handling with Email OTP verification & Forgot Password

function setSession(token, user) {
  localStorage.setItem('cosmos_token', token);
  localStorage.setItem('cosmos_user_name', user.name);
}

function showFormError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // If already logged in, skip straight past login/register
  if (localStorage.getItem('cosmos_token') && (loginForm || registerForm)) {
    window.location.href = 'index.html';
    return;
  }

  // --------------------------------------------------------------------------
  // 1. User Login Handler
  // --------------------------------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorBox = document.getElementById('loginError');
      errorBox.classList.add('hidden');

      const formData = new FormData(loginForm);
      const email = formData.get('email').trim();
      const password = formData.get('password');

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      try {
        const data = await api.post('/auth/login', { email, password }, { auth: false });
        setSession(data.token, data.user);
        if (typeof hydrateCartFromBackend === 'function') {
          await hydrateCartFromBackend();
        }
        showToast(`Welcome back, ${data.user.name}!`);
        window.location.href = 'index.html';
      } catch (err) {
        showFormError(errorBox, err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. User Registration with OTP Verification
  // --------------------------------------------------------------------------
  if (registerForm) {
    const otpModal = document.getElementById('otpModal');
    const closeOtpModal = document.getElementById('closeOtpModal');
    const verifyOtpForm = document.getElementById('verifyOtpForm');
    const otpEmailDisplay = document.getElementById('otpEmailDisplay');
    const otpError = document.getElementById('otpError');
    const resendOtpBtn = document.getElementById('resendOtpBtn');

    let pendingRegisterData = null;

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorBox = document.getElementById('registerError');
      errorBox.classList.add('hidden');

      const formData = new FormData(registerForm);
      pendingRegisterData = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        password: formData.get('password'),
        phone: formData.get('phone').trim(),
      };

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending Verification OTP...';

      try {
        // Send OTP to email
        const res = await api.post('/auth/send-register-otp', {
          email: pendingRegisterData.email,
          name: pendingRegisterData.name,
        }, { auth: false });

        // Show OTP Modal
        if (otpEmailDisplay) otpEmailDisplay.textContent = pendingRegisterData.email;
        if (otpError) otpError.classList.add('hidden');

        const otpDisplayBox = document.getElementById('otpDisplayBox');
        const displayedOtpCode = document.getElementById('displayedOtpCode');
        const otpInput = document.getElementById('otpInput');

        if (res && res.otp) {
          if (displayedOtpCode) displayedOtpCode.textContent = res.otp;
          if (otpDisplayBox) otpDisplayBox.classList.remove('hidden');
          if (otpInput) otpInput.value = res.otp;
          showToast(`Account Verification OTP: ${res.otp}`, 'info');
        } else {
          if (otpDisplayBox) otpDisplayBox.classList.add('hidden');
          if (otpInput) otpInput.value = '';
          showToast('Verification code sent to your email!', 'info');
        }

        otpModal.classList.remove('hidden');
      } catch (err) {
        showFormError(errorBox, err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });

    // Close OTP Modal
    if (closeOtpModal) {
      closeOtpModal.addEventListener('click', () => {
        otpModal.classList.add('hidden');
      });
    }

    // Submit OTP to complete registration
    if (verifyOtpForm) {
      verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        otpError.classList.add('hidden');

        const otp = document.getElementById('otpInput').value.trim();
        const verifyBtn = document.getElementById('verifyOtpBtn');
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';

        try {
          const payload = { ...pendingRegisterData, otp };
          const data = await api.post('/auth/verify-register-otp', payload, { auth: false });
          setSession(data.token, data.user);
          showToast(`Account verified! Welcome to Cosmos, ${data.user.name}!`, 'success');
          otpModal.classList.add('hidden');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 800);
        } catch (err) {
          showFormError(otpError, err.message);
          verifyBtn.disabled = false;
          verifyBtn.textContent = 'Verify & Complete Registration';
        }
      });
    }

    // Resend Registration OTP
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', async () => {
        if (!pendingRegisterData || !pendingRegisterData.email) return;
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = 'Sending...';

        try {
          const res = await api.post('/auth/send-register-otp', {
            email: pendingRegisterData.email,
            name: pendingRegisterData.name,
          }, { auth: false });

          const otpDisplayBox = document.getElementById('otpDisplayBox');
          const displayedOtpCode = document.getElementById('displayedOtpCode');
          const otpInput = document.getElementById('otpInput');

          if (res && res.otp) {
            if (displayedOtpCode) displayedOtpCode.textContent = res.otp;
            if (otpDisplayBox) otpDisplayBox.classList.remove('hidden');
            if (otpInput) otpInput.value = res.otp;
            showToast(`Account Verification OTP: ${res.otp}`, 'info');
          } else {
            showToast('New OTP sent to your email!', 'info');
          }
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          setTimeout(() => {
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = 'Resend OTP';
          }, 5000);
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. User Forgot Password Flow (with OTP)
  // --------------------------------------------------------------------------
  const openForgotModal = document.getElementById('openForgotModal');
  const forgotModal = document.getElementById('forgotModal');
  const closeForgotModal = document.getElementById('closeForgotModal');
  const forgotStep1Form = document.getElementById('forgotStep1Form');
  const forgotStep2Form = document.getElementById('forgotStep2Form');
  const forgotEmailInput = document.getElementById('forgotEmailInput');
  const forgotStep1Error = document.getElementById('forgotStep1Error');
  const forgotStep2Error = document.getElementById('forgotStep2Error');
  const forgotOtpSentEmail = document.getElementById('forgotOtpSentEmail');

  let forgotEmailTarget = '';

  if (openForgotModal && forgotModal) {
    openForgotModal.addEventListener('click', (e) => {
      e.preventDefault();
      forgotStep1Form.classList.remove('hidden');
      forgotStep2Form.classList.add('hidden');
      forgotStep1Error.classList.add('hidden');
      forgotStep2Error.classList.add('hidden');
      forgotModal.classList.remove('hidden');
    });

    if (closeForgotModal) {
      closeForgotModal.addEventListener('click', () => {
        forgotModal.classList.add('hidden');
      });
    }

    // Step 1: Send OTP
    if (forgotStep1Form) {
      forgotStep1Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        forgotStep1Error.classList.add('hidden');

        forgotEmailTarget = forgotEmailInput.value.trim();
        const sendBtn = document.getElementById('sendForgotOtpBtn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending OTP...';

        try {
          const res = await api.post('/auth/forgot-password', {
            email: forgotEmailTarget,
            role: 'user',
          }, { auth: false });

          if (forgotOtpSentEmail) forgotOtpSentEmail.textContent = forgotEmailTarget;
          forgotStep1Form.classList.add('hidden');
          forgotStep2Form.classList.remove('hidden');

          const forgotOtpDisplayBox = document.getElementById('forgotOtpDisplayBox');
          const displayedForgotOtpCode = document.getElementById('displayedForgotOtpCode');
          const forgotOtpInput = document.getElementById('forgotOtpInput');

          if (res && res.otp) {
            if (displayedForgotOtpCode) displayedForgotOtpCode.textContent = res.otp;
            if (forgotOtpDisplayBox) forgotOtpDisplayBox.classList.remove('hidden');
            if (forgotOtpInput) forgotOtpInput.value = res.otp;
            showToast(`Password Reset OTP: ${res.otp}`, 'info');
          } else {
            if (forgotOtpDisplayBox) forgotOtpDisplayBox.classList.add('hidden');
            showToast('Password reset OTP sent to your email!', 'info');
          }
        } catch (err) {
          showFormError(forgotStep1Error, err.message);
        } finally {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send 6-Digit OTP';
        }
      });
    }

    // Step 2: Verify OTP & Reset Password
    if (forgotStep2Form) {
      forgotStep2Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        forgotStep2Error.classList.add('hidden');

        const otp = document.getElementById('forgotOtpInput').value.trim();
        const newPassword = document.getElementById('forgotNewPasswordInput').value;
        const resetBtn = document.getElementById('resetPasswordBtn');

        resetBtn.disabled = true;
        resetBtn.textContent = 'Resetting Password...';

        try {
          const res = await api.post('/auth/reset-password', {
            email: forgotEmailTarget,
            otp,
            newPassword,
            role: 'user',
          }, { auth: false });

          showToast(res.message || 'Password reset successfully! Please log in.', 'success');
          forgotModal.classList.add('hidden');

          // Pre-fill email in login form
          const loginEmail = document.querySelector('#loginForm input[name="email"]');
          if (loginEmail) loginEmail.value = forgotEmailTarget;
        } catch (err) {
          showFormError(forgotStep2Error, err.message);
        } finally {
          resetBtn.disabled = false;
          resetBtn.textContent = 'Reset Password';
        }
      });
    }
  }
});
