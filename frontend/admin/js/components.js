/* ==========================================================================
   COSMOS — ADMIN SIDE SHARED COMPONENTS
   Sidebar + topbar injected into every admin page via
   <div id="app-shell-start"></div> ... <div id="app-shell-end"></div>
   wrapping the page's own <main id="pageContent"> content.
   ========================================================================== */

const ADMIN_NAV = [
  { href: 'dashboard.html', label: 'Dashboard', icon: '📊' },
  { href: 'products.html', label: 'Products', icon: '🛍️' },
  { href: 'users.html', label: 'Users', icon: '👥' },
  { href: 'orders.html', label: 'Orders', icon: '📦' },
];

function currentAdminPage() {
  const path = window.location.pathname.split('/').pop();
  return path === '' ? 'dashboard.html' : path;
}

function renderAdminShell(pageTitle) {
  const sidebarMount = document.getElementById('sidebarMount');
  const topbarMount = document.getElementById('topbarMount');
  if (!sidebarMount || !topbarMount) return;

  const active = currentAdminPage();
  const adminName = localStorage.getItem('cosmos_admin_name') || 'Admin';
  const initial = adminName.charAt(0).toUpperCase();

  sidebarMount.innerHTML = `
    <div class="sidebar-brand">
      <img src="../../assets/images/logo-white.svg" alt="Cosmos Logo" style="height:70px; width:auto; display:block;" />
      <div>
        <h2>Admin Panel</h2>
      </div>
    </div>

    <nav class="nav-list">
      ${ADMIN_NAV.map(item => `
        <a href="${item.href}" class="nav-link ${active === item.href ? 'active' : ''}">
          <span>${item.icon}</span> ${item.label}
        </a>
      `).join('')}
    </nav>

    <button class="logout-btn" id="adminLogoutBtn">↩ Logout</button>
  `;

  topbarMount.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.8rem;">
      <button class="sidebar-toggle" id="sidebarToggle">☰</button>
      <h1>${pageTitle}</h1>
    </div>
    <div class="topbar-actions">
      <div class="admin-chip">
        <span class="avatar">${initial}</span>
        ${adminName}
      </div>
    </div>
  `;

  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem('cosmos_admin_token');
    localStorage.removeItem('cosmos_admin_name');
    window.location.href = 'login.html';
  });

  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

/* ---------- Toast ---------- */
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

/* ---------- Simple auth guard for protected admin pages ---------- */
function requireAdminAuth() {
  const token = localStorage.getItem('cosmos_admin_token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

/* ---------- Shared modal (used by Products add-edit forms) ---------- */
function openModal(innerHTML) {
  closeModal(); // avoid stacking if one is already open

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'activeModalOverlay';
  overlay.addEventListener('click', closeModal);

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.id = 'activeModalBox';
  box.innerHTML = innerHTML;
  box.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(overlay);
  document.body.appendChild(box);

  const closeBtn = box.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
}

function closeModal() {
  const overlay = document.getElementById('activeModalOverlay');
  const box = document.getElementById('activeModalBox');
  if (overlay) overlay.remove();
  if (box) box.remove();
}

/* ---------- Shared delete confirmation ---------- */
function confirmDelete(message, onConfirm) {
  openModal(`
    <div class="modal-header">
      <h3>Confirm Delete</h3>
      <button class="modal-close">✕</button>
    </div>
    <p style="color:var(--muted); margin-bottom:1.4rem;">${message}</p>
    <div style="display:flex; gap:0.6rem; justify-content:flex-end;">
      <button class="ghost-btn" id="cancelDeleteBtn">Cancel</button>
      <button class="primary-btn" style="background:linear-gradient(135deg, var(--danger), #ff8fa3);" id="confirmDeleteBtn">Delete</button>
    </div>
  `);

  document.getElementById('cancelDeleteBtn').addEventListener('click', closeModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    await onConfirm();
    closeModal();
  });
}
