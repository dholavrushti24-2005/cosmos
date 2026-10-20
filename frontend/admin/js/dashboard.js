// js/dashboard.js — Dashboard: summary counts + recent orders, all live.

function recentOrderRow(order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
  const itemsSummary = (order.items || []).map(i => `${i.name} x${i.qty}`).join(', ');

  return `
    <tr>
      <td>#${(order.id || '').slice(-8)}<br><span style="color:var(--muted); font-size:0.78rem;">${date}</span></td>
      <td>${(order.shipping && order.shipping.name) || 'Customer'}</td>
      <td style="max-width:260px;">${itemsSummary}</td>
      <td>₹${order.total}</td>
      <td><span class="status-pill status-${order.status}">${order.status}</span></td>
    </tr>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAdminAuth()) return;
  renderAdminShell('Dashboard');

  try {
    const [{ products }, { users }, { orders }] = await Promise.all([
      adminApi.get('/products'),
      adminApi.get('/users'),
      adminApi.get('/orders'),
    ]);

    document.getElementById('statProducts').textContent = products.length;
    document.getElementById('statUsers').textContent = users.length;
    document.getElementById('statOrders').textContent = orders.length;

    const delivered = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
    const pending = orders.filter(o => !['delivered', 'cancelled', 'refunded'].includes((o.status || '').toLowerCase())).length;
    const breakdownEl = document.getElementById('orderBreakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = `<span style="color:#2ecc71;">Delivered: ${delivered}</span> | <span style="color:#f39c12;">Pending: ${pending}</span>`;
    }

    const tbody = document.getElementById('recentOrdersBody');
    const emptyState = document.getElementById('emptyState');

    if (orders.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      tbody.innerHTML = orders.slice(0, 5).map(recentOrderRow).join('');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});
