// js/orders.js — Admin Orders management: list all orders, search, update status.

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

let allOrders = [];

function orderRow(o) {
  const date = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const itemsSummary = o.items.map(i => `${i.name}${i.size ? ` <span style="color:#c77dff; font-weight:700;">[${i.size}]</span>` : ''} x${i.qty}`).join(', ');
  const statusOptions = ORDER_STATUSES.map(s =>
    `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
  ).join('');

  return `
    <tr>
      <td>#${o.id.slice(-8)}<br><span style="color:var(--muted); font-size:0.78rem;">${date}</span></td>
      <td>${o.shipping.name}<br><span style="color:var(--muted); font-size:0.78rem;">${o.shipping.phone}</span></td>
      <td style="max-width:260px;">${itemsSummary}</td>
      <td>₹${o.total}</td>
      <td style="text-transform:uppercase; font-size:0.78rem; color:var(--muted);">${o.payment}</td>
      <td>
        <select class="status-select" data-order-id="${o.id}">
          ${statusOptions}
        </select>
      </td>
    </tr>
  `;
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersBody');
  const emptyState = document.getElementById('emptyState');

  if (orders.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    tbody.innerHTML = orders.map(orderRow).join('');
  }
}

async function loadOrders() {
  try {
    const { orders } = await adminApi.get('/orders');
    allOrders = orders;
    renderOrdersTable(allOrders);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  requireAdminAuth();
  renderAdminShell('Orders');
  loadOrders();

  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const status = statusFilter ? statusFilter.value.toLowerCase() : 'all';

    const filtered = allOrders.filter(o => {
      const matchesSearch = o.shipping.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || o.status.toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
    renderOrdersTable(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
  }

  document.getElementById('ordersBody').addEventListener('change', async (e) => {
    if (!e.target.classList.contains('status-select')) return;

    const orderId = e.target.dataset.orderId;
    const newStatus = e.target.value;

    try {
      await adminApi.put(`/orders/${orderId}/status`, { status: newStatus });
      showToast('Order status updated.');
      const order = allOrders.find(o => o.id === orderId);
      if (order) order.status = newStatus;
    } catch (err) {
      showToast(err.message, 'error');
      loadOrders(); // revert dropdown to real state
    }
  });
});
