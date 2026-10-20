// js/users.js — Admin Users management: list, search, block/unblock, delete.

let allUsers = [];

function userRow(u) {
  const status = u.status || 'active';
  return `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.phone || '—'}</td>
      <td><span class="status-pill status-${status}">${status}</span></td>
      <td class="row-actions">
        ${status === 'active'
          ? `<button class="danger-btn" data-block="${u.id}">Block</button>`
          : `<button class="small-btn" data-unblock="${u.id}">Unblock</button>`
        }
        <button class="danger-btn" data-delete="${u.id}">Delete</button>
      </td>
    </tr>
  `;
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersBody');
  const emptyState = document.getElementById('emptyState');

  if (users.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    tbody.innerHTML = users.map(userRow).join('');
  }
}

async function loadUsers() {
  try {
    const { users } = await adminApi.get('/users');
    allUsers = users;
    renderUsersTable(allUsers);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function setUserStatus(id, status) {
  try {
    await adminApi.put(`/users/${id}/status`, { status });
    showToast(status === 'blocked' ? 'User blocked.' : 'User unblocked.');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdminAuth()) return;
  renderAdminShell('Users');
  loadUsers();

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = allUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    renderUsersTable(filtered);
  });

  document.getElementById('usersBody').addEventListener('click', (e) => {
    const blockId = e.target.dataset.block;
    const unblockId = e.target.dataset.unblock;
    const deleteId = e.target.dataset.delete;

    if (blockId) setUserStatus(blockId, 'blocked');
    if (unblockId) setUserStatus(unblockId, 'active');

    if (deleteId) {
      const user = allUsers.find(u => u.id === deleteId);
      confirmDelete(`Delete "${user.name}"'s account? This cannot be undone.`, async () => {
        try {
          await adminApi.del(`/users/${deleteId}`);
          showToast('User deleted.');
          loadUsers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });
});
