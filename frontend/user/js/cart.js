// js/cart.js — Cart page: renders cart items with qty controls, computes
// totals, and lets the user update quantity or remove an item.

function cartItemHTML(item) {
  const imgOrEmoji = item.image
    ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.outerHTML='<div class=&quot;cart-item-emoji&quot;>🛍️</div>'">`
    : `<div class="cart-item-emoji">🛍️</div>`;

  return `
    <div class="cart-item">
      ${imgOrEmoji}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.size ? `<span class="cart-item-size-badge">Size: ${item.size}</span>` : ''}
        <div class="cart-item-price">₹${item.price}</div>
      </div>
      <div class="cart-qty-controls">
        <button class="cart-qty-btn" data-qty-decrease="${item.id}" data-item-size="${item.size || ''}">−</button>
        <span class="cart-qty">${item.qty}</span>
        <button class="cart-qty-btn" data-qty-increase="${item.id}" data-item-size="${item.size || ''}">+</button>
      </div>
      <button class="cart-item-remove" data-cart-remove="${item.id}" data-item-size="${item.size || ''}" title="Remove">✕</button>
    </div>
  `;
}

let currentSubtotal = 0;

function getAppliedCoupon() {
  try { return JSON.parse(localStorage.getItem('cosmos_applied_coupon')) || null; }
  catch { return null; }
}

function setAppliedCoupon(coupon) {
  if (coupon) localStorage.setItem('cosmos_applied_coupon', JSON.stringify(coupon));
  else localStorage.removeItem('cosmos_applied_coupon');
}

function updateCartSummary(items) {
  currentSubtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.getElementById('cartSubtotal').textContent = `₹${currentSubtotal}`;

  const applied = getAppliedCoupon();
  const discountRow = document.getElementById('cartDiscountRow');
  const discountLabel = document.getElementById('discountCodeLabel');
  const discountVal = document.getElementById('cartDiscount');
  const couponInfo = document.getElementById('appliedCouponInfo');
  const couponMsg = document.getElementById('couponSuccessMsg');

  if (applied && currentSubtotal > 0) {
    let disc = 0;
    if (applied.code === 'COSMOS20') disc = Math.round(currentSubtotal * 0.20);
    else if (applied.code === 'WELCOME10') disc = Math.round(currentSubtotal * 0.10);
    else if (applied.code === 'FLAT100') disc = currentSubtotal >= 1500 ? 100 : 0;
    else if (applied.code === 'FLAT500') disc = currentSubtotal >= 3000 ? 500 : 0;

    if (disc > 0) {
      discountRow.classList.remove('hidden');
      discountLabel.textContent = applied.code;
      discountVal.textContent = `-₹${disc}`;
      couponInfo.classList.remove('hidden');
      couponMsg.textContent = `✓ ${applied.code} applied (-₹${disc})`;
      document.getElementById('cartTotal').textContent = `₹${Math.max(0, currentSubtotal - disc)}`;
      return;
    } else {
      setAppliedCoupon(null);
    }
  }

  discountRow.classList.add('hidden');
  couponInfo.classList.add('hidden');
  document.getElementById('cartTotal').textContent = `₹${currentSubtotal}`;
}

async function renderCartPage() {
  const list = document.getElementById('cartItemsList');
  const emptyState = document.getElementById('emptyState');
  const cart = getCart();

  if (cart.length === 0) {
    list.innerHTML = '';
    emptyState.classList.remove('hidden');
    updateCartSummary([]);
    return;
  }
  emptyState.classList.add('hidden');

  try {
    const { products } = await api.get('/products', { auth: false });
    const items = cart
      .map(ci => {
        const product = products.find(p => p.id === ci.id);
        return product ? { ...product, qty: ci.qty, size: ci.size || null } : null;
      })
      .filter(Boolean);

    if (items.length === 0) {
      list.innerHTML = '';
      emptyState.classList.remove('hidden');
      updateCartSummary([]);
      return;
    }

    list.innerHTML = items.map(cartItemHTML).join('');
    updateCartSummary(items);
  } catch (err) {
    list.innerHTML = `<p style="color:var(--muted);">Could not load your cart right now.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', renderCartPage);

document.addEventListener('click', (e) => {
  const inc = e.target.closest('[data-qty-increase]');
  const dec = e.target.closest('[data-qty-decrease]');
  const rem = e.target.closest('[data-cart-remove]');

  if (inc) {
    const id = inc.dataset.qtyIncrease;
    const size = inc.dataset.itemSize || null;
    const item = getCart().find(i => i.id === id && (i.size || null) === size);
    updateCartQty(id, (item ? item.qty : 0) + 1, size);
    renderCartPage();
  } else if (dec) {
    const id = dec.dataset.qtyDecrease;
    const size = dec.dataset.itemSize || null;
    const item = getCart().find(i => i.id === id && (i.size || null) === size);
    updateCartQty(id, (item ? item.qty : 1) - 1, size);
    renderCartPage();
  } else if (rem) {
    const id = rem.dataset.cartRemove;
    const size = rem.dataset.itemSize || null;
    removeFromCart(id, size);
    showToast('Removed from cart');
    renderCartPage();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const applyBtn = document.getElementById('applyCouponBtn');
  const removeBtn = document.getElementById('removeCouponBtn');
  const couponInput = document.getElementById('couponInput');
  const couponHint = document.getElementById('couponHint');

  if (couponHint && couponInput) {
    couponHint.addEventListener('click', () => {
      couponInput.value = 'COSMOS20';
      if (applyBtn) applyBtn.click();
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      const code = couponInput.value.trim();
      if (!code) {
        showToast('Please enter a coupon code', 'error');
        return;
      }
      applyBtn.disabled = true;
      applyBtn.textContent = '...';

      try {
        const res = await api.post('/orders/apply-coupon', { code, subtotal: currentSubtotal }, { auth: false });
        setAppliedCoupon({ code: res.code, discount: res.discount, description: res.description });
        showToast(res.description || 'Coupon applied successfully!');
        renderCartPage();
      } catch (err) {
        showToast(err.message || 'Invalid coupon code', 'error');
      } finally {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Apply';
      }
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      setAppliedCoupon(null);
      if (couponInput) couponInput.value = '';
      showToast('Coupon removed');
      renderCartPage();
    });
  }
});
