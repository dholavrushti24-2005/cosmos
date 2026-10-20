// js/orders.js — Orders history page: Live Tracking Stepper, Tax Invoice, and Return/Cancellation.

let cachedOrders = [];

function renderTrackingStepper(status) {
  if (['cancelled', 'return_requested', 'refunded'].includes(status)) {
    return `
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 0.8rem 1rem; margin-top: 1rem; display: flex; align-items: center; gap: 0.6rem; color: var(--danger); font-size: 0.88rem; font-weight: 700;">
        <span>⚠️ Status Notice:</span> This order is marked as <strong>${status.replace('_', ' ').toUpperCase()}</strong>.
      </div>
    `;
  }

  const steps = [
    { key: 'pending', label: 'Order Confirmed', icon: '✓' },
    { key: 'processing', label: 'Packed & Ready', icon: '🎁' },
    { key: 'shipped', label: 'In Transit', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '📦' },
  ];

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;
  const progressPercent = activeIdx === 0 ? 10 : activeIdx === 1 ? 40 : activeIdx === 2 ? 72 : 100;

  return `
    <div class="order-tracking-section">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
        <span style="font-weight:700; color:var(--text);">Live Delivery Tracking:</span>
        <span style="color:var(--primary); font-weight:600;">
          ${activeIdx === 3 ? '🎉 Package Delivered!' : 'Estimated Delivery: 3-4 Business Days'}
        </span>
      </div>
      
      <div class="order-stepper">
        <div class="stepper-progress-bg">
          <div class="stepper-progress-bar" style="width: ${progressPercent}%;"></div>
        </div>
        ${steps.map((s, idx) => {
          let stateClass = '';
          if (idx < activeIdx) stateClass = 'completed';
          else if (idx === activeIdx) stateClass = activeIdx === 3 ? 'completed' : 'active';
          
          return `
            <div class="stepper-step ${stateClass}">
              <div class="stepper-circle">${idx < activeIdx || (idx === 3 && activeIdx === 3) ? '✓' : s.icon}</div>
              <span class="stepper-label">${s.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function orderCardHTML(order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const itemsSummary = order.items.map(i => `${i.name}${i.size ? ` <span style="color:var(--primary); font-weight:700;">[Size: ${i.size}]</span>` : ''} x${i.qty}`).join(', ');

  let actionBtn = '';
  if (order.status === 'pending' || order.status === 'processing') {
    actionBtn = `<button class="ghost-btn" style="padding:0.35rem 0.75rem; font-size:0.8rem;" onclick="cancelOrder('${order.id}')">Cancel Order</button>`;
  } else if (order.status === 'delivered') {
    actionBtn = `<button class="ghost-btn" style="padding:0.35rem 0.75rem; font-size:0.8rem;" onclick="returnOrder('${order.id}')">Return (7 Days)</button>`;
  } else if (order.status === 'return_requested') {
    actionBtn = `<span style="font-size:0.8rem; color:var(--muted);">Return processing...</span>`;
  }

  const invoiceBtn = `<button class="pill-btn" style="padding:0.35rem 0.8rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:4px; border:1px solid var(--line);" onclick="openInvoiceModal('${order.id}')">📄 Tax Invoice</button>`;

  return `
    <div class="panel order-card" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; width:100%;">
        <div>
          <div style="font-weight:800; font-size:1.05rem;">Order #${order.id.slice(-8).toUpperCase()}</div>
          <div class="meta" style="margin-top:2px;">${date} &middot; ${itemsSummary}</div>
          ${order.couponCode ? `<div style="font-size:0.78rem; color:var(--success); font-weight:700; margin-top:2px;">🎟️ Coupon Applied: ${order.couponCode} (-₹${order.discount})</div>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:0.8rem; flex-wrap:wrap;">
          ${invoiceBtn}
          ${actionBtn}
          <span class="status-pill status-${order.status}">${order.status.replace('_', ' ')}</span>
          <strong style="font-size:1.15rem; color:var(--primary-dark);">₹${order.total}</strong>
        </div>
      </div>

      <!-- Live Stepper Section -->
      ${renderTrackingStepper(order.status)}
    </div>
  `;
}

function openInvoiceModal(orderId) {
  const order = cachedOrders.find(o => o.id === orderId);
  if (!order) {
    showToast('Order details not found', 'error');
    return;
  }

  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const invoiceNum = 'INV-' + order.id.replace('order_', '');
  const subtotal = order.subtotal || order.total;
  const discount = order.discount || 0;
  const grandTotal = order.total;

  const modalHtml = `
    <div class="invoice-modal" id="invoiceModalOverlay">
      <div class="invoice-box">
        <button class="invoice-close" id="closeInvoiceBtn">✕</button>
        
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #e2e8f0; padding-bottom:1.2rem; margin-bottom:1.2rem;">
          <div>
            <h2 style="margin:0; font-size:1.6rem; color:#8d45ff; letter-spacing:1px;">COSMOS</h2>
            <p style="margin:2px 0 0 0; font-size:0.8rem; color:#64748b;">Cosmos Retail & Fashion Pvt. Ltd.<br>GSTIN: 24AAACC1206M1ZB | CIN: U51909GJ2026PTC09988<br>Email: moradiyazeel5@gmail.com</p>
          </div>
          <div style="text-align:right;">
            <span style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:800; text-transform:uppercase;">Original Tax Invoice</span>
            <div style="font-size:0.88rem; font-weight:700; margin-top:0.4rem;">${invoiceNum}</div>
            <div style="font-size:0.78rem; color:#64748b;">Date: ${date}</div>
          </div>
        </div>

        <!-- Billed to / Payment details -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem; font-size:0.85rem;">
          <div>
            <div style="font-weight:700; color:#334155; margin-bottom:0.2rem; text-transform:uppercase; font-size:0.75rem;">Customer Details & Shipping Address:</div>
            <div style="font-weight:700; color:#0f172a;">${(order.shipping && order.shipping.name) || 'Valued Customer'}</div>
            <div style="color:#64748b; line-height:1.4;">${(order.shipping && order.shipping.address) || ''}, ${(order.shipping && order.shipping.city) || ''} - ${(order.shipping && order.shipping.pincode) || ''}</div>
            <div style="color:#64748b;">Phone: ${(order.shipping && order.shipping.phone) || '—'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700; color:#334155; margin-bottom:0.2rem; text-transform:uppercase; font-size:0.75rem;">Payment Information:</div>
            <div style="color:#64748b;">Payment Method: <strong style="color:#0f172a; text-transform:uppercase;">${order.payment}</strong></div>
            <div style="color:#64748b;">Payment Status: <span style="color:#16a34a; font-weight:700;">${(order.paymentStatus || 'PAID').toUpperCase()}</span></div>
            ${order.transactionId ? `<div style="color:#64748b; font-size:0.78rem; margin-top:2px;">TXN: <code>${order.transactionId}</code></div>` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-bottom:1.2rem;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:1.5px solid #e2e8f0; text-align:left;">
              <th style="padding:8px 10px; color:#475569;">Item</th>
              <th style="padding:8px 10px; color:#475569; text-align:center;">Size</th>
              <th style="padding:8px 10px; color:#475569; text-align:center;">Qty</th>
              <th style="padding:8px 10px; color:#475569; text-align:right;">Unit Price</th>
              <th style="padding:8px 10px; color:#475569; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 10px; font-weight:600; color:#0f172a;">${item.name}</td>
                <td style="padding:8px 10px; text-align:center; color:#8d45ff; font-weight:700;">${item.size || 'Standard'}</td>
                <td style="padding:8px 10px; text-align:center;">${item.qty}</td>
                <td style="padding:8px 10px; text-align:right;">₹${item.price}</td>
                <td style="padding:8px 10px; text-align:right; font-weight:700;">₹${item.price * item.qty}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Calculations -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
          <div style="width:260px; font-size:0.85rem; line-height:1.6;">
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Subtotal:</span> <span>₹${subtotal}</span>
            </div>
            ${discount > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#16a34a; font-weight:700;">
                <span>Coupon Discount (${order.couponCode || 'PROMO'}):</span> <span>-₹${discount}</span>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>GST (Inclusive 5%):</span> <span>₹${Math.round(grandTotal * 0.05)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Shipping Fee:</span> <span style="color:#16a34a; font-weight:700;">FREE</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:2px solid #e2e8f0; padding-top:0.4rem; margin-top:0.4rem; font-size:1.05rem; font-weight:800; color:#0f172a;">
              <span>Grand Total:</span> <span>₹${grandTotal}</span>
            </div>
          </div>
        </div>

        <div style="border-top:1px solid #f1f5f9; padding-top:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem;">
          <div style="font-size:0.75rem; color:#94a3b8;">
            ✓ Computer generated invoice. Authorized by Cosmos Fashion.
          </div>
          <button type="button" class="invoice-print-btn" onclick="window.print()">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const old = document.getElementById('invoiceModalOverlay');
  if (old) old.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.getElementById('invoiceModalOverlay');
  const closeBtn = document.getElementById('closeInvoiceBtn');
  const closeModal = () => overlay.remove();

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

// Make openInvoiceModal global
window.openInvoiceModal = openInvoiceModal;

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  try {
    await api.put(`/orders/${orderId}/cancel`);
    showToast('Order cancelled successfully', 'success');
    loadOrders();
  } catch (err) {
    showToast(err.message || 'Error cancelling order', 'error');
  }
}

async function returnOrder(orderId) {
  if (!confirm('Are you sure you want to return this order? Refund will be processed within 5-7 working days.')) return;
  try {
    await api.put(`/orders/${orderId}/return`);
    showToast('Return initiated successfully', 'success');
    loadOrders();
  } catch (err) {
    showToast(err.message || 'Error returning order', 'error');
  }
}

window.cancelOrder = cancelOrder;
window.returnOrder = returnOrder;

async function loadOrders() {
  const list = document.getElementById('ordersList');
  const emptyState = document.getElementById('emptyState');
  try {
    const { orders } = await api.get('/orders');
    cachedOrders = orders || [];
    if (cachedOrders.length === 0) {
      emptyState.classList.remove('hidden');
      list.innerHTML = '';
    } else {
      emptyState.classList.add('hidden');
      list.innerHTML = cachedOrders.map(orderCardHTML).join('');
    }
  } catch (err) {
    list.innerHTML = `<p style="color:var(--muted);">Could not load your orders right now.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireUserAuth()) return;
  loadOrders();
});
