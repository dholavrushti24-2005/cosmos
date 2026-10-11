// js/profile.js — Profile page: loads and updates the logged-in user's account.
// (requireUserAuth lives in components.js, shared across profile/checkout/orders)

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireUserAuth()) return;

  const form = document.getElementById('profileForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const avatarEl = document.getElementById('profileAvatar');
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');

  try {
    const { user } = await api.get('/users/me');
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
    nameEl.textContent = user.name;
    emailEl.textContent = user.email;

    form.name.value = user.name || '';
    form.email.value = user.email || '';
    form.phone.value = user.phone || '';
    form.city.value = user.city || '';
    form.pincode.value = user.pincode || '';
    form.address.value = user.address || '';
  } catch (err) {
    showToast(err.message, 'error');
    const msg = err.message.toLowerCase();
    if (msg.includes('session') || msg.includes('unauthorized') || msg.includes('token') || msg.includes('invalid') || msg.includes('authenticate') || msg.includes('expired')) {
      localStorage.removeItem('cosmos_token');
      localStorage.removeItem('cosmos_user_name');
      window.location.href = 'login.html';
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const { user } = await api.put('/users/me', {
          name: form.name.value.trim(),
          phone: form.phone.value.trim(),
          city: form.city.value.trim(),
          pincode: form.pincode.value.trim(),
          address: form.address.value.trim(),
        });
        localStorage.setItem('cosmos_user_name', user.name);
        nameEl.textContent = user.name;
        avatarEl.textContent = user.name.charAt(0).toUpperCase();
        showToast('Profile updated successfully.');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('cosmos_token');
      localStorage.removeItem('cosmos_user_name');
      window.location.href = 'login.html';
    });
  }
});
