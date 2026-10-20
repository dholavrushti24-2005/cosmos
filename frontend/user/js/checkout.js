// js/checkout.js — Checkout page with Mock Payment Gateway and Email notification support

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireUserAuth()) return;

  const form = document.getElementById('checkoutForm');
  const itemsList = document.getElementById('checkoutItemsList');
  const successModal = document.getElementById('successModal');
  const cart = getCart();

  // Payment Gateway Elements
  const pgOverlay = document.getElementById('pgOverlay');
  const pgCloseBtn = document.getElementById('pgCloseBtn');
  const pgConfirmPayBtn = document.getElementById('pgConfirmPayBtn');
  const pgPayBtnText = document.getElementById('pgPayBtnText');
  const pgPayableAmount = document.getElementById('pgPayableAmount');
  const pgNavItems = document.querySelectorAll('.pg-nav-item');
  const pgTabPanes = document.querySelectorAll('.pg-tab-pane');
  const autofillCardBtn = document.getElementById('autofillCardBtn');
  const bankBtns = document.querySelectorAll('.pg-bank-btn');
  const pgProcessingOverlay = document.getElementById('pgProcessingOverlay');
  const pgSpinner = document.getElementById('pgSpinner');
  const pgSuccessIcon = document.getElementById('pgSuccessIcon');
  const pgProcessingTitle = document.getElementById('pgProcessingTitle');
  const pgProcessingDesc = document.getElementById('pgProcessingDesc');

  // Success Modal Elements
  const successOrderId = document.getElementById('successOrderId');
  const successPaymentStatus = document.getElementById('successPaymentStatus');
  const successTxnId = document.getElementById('successTxnId');
  const successTxnRow = document.getElementById('successTxnRow');

  let currentTotal = 0;
  let activePaymentTab = 'upi'; // 'upi', 'card', 'netbanking', 'cod'
  let pendingShippingData = null;

  if (cart.length === 0) {
    showToast('Your cart is empty.', 'error');
    window.location.href = 'cart.html';
    return;
  }

  let cartItems = [];

  try {
    const { products } = await api.get('/products', { auth: false });
    cartItems = cart
      .map(ci => {
        const product = products.find(p => p.id === ci.id);
        return product ? { ...product, qty: ci.qty, size: ci.size || null } : null;
      })
      .filter(Boolean);

    itemsList.innerHTML = cartItems.map(item => `
      <div style="display:flex; justify-content:space-between; padding:0.5rem 0; font-size:0.9rem;">
        <span>
          ${item.name}
          ${item.size ? `<span class="cart-item-size-badge" style="font-size:0.75rem; padding:1px 6px; margin-left:4px;">Size: ${item.size}</span>` : ''}
          &times; ${item.qty}
        </span>
        <span>₹${item.price * item.qty}</span>
      </div>
    `).join('');

    let subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    let discount = 0;
    let appliedCoupon = null;

    try {
      appliedCoupon = JSON.parse(localStorage.getItem('cosmos_applied_coupon')) || null;
    } catch { appliedCoupon = null; }

    if (appliedCoupon && subtotal > 0) {
      if (appliedCoupon.code === 'COSMOS20') discount = Math.round(subtotal * 0.20);
      else if (appliedCoupon.code === 'WELCOME10') discount = Math.round(subtotal * 0.10);
      else if (appliedCoupon.code === 'FLAT100') discount = subtotal >= 1500 ? 100 : 0;
      else if (appliedCoupon.code === 'FLAT500') discount = subtotal >= 3000 ? 500 : 0;
    }

    currentTotal = Math.max(0, subtotal - discount);
    document.getElementById('checkoutSubtotal').textContent = `₹${subtotal}`;

    const discRow = document.getElementById('checkoutDiscountRow');
    const discLabel = document.getElementById('checkoutCouponLabel');
    const discVal = document.getElementById('checkoutDiscountVal');

    if (discount > 0 && discRow) {
      discRow.classList.remove('hidden');
      discLabel.textContent = appliedCoupon.code;
      discVal.textContent = `-₹${discount}`;
    } else if (discRow) {
      discRow.classList.add('hidden');
    }

    document.getElementById('checkoutTotal').textContent = `₹${currentTotal}`;
    if (pgPayableAmount) pgPayableAmount.textContent = `₹${currentTotal}`;
  } catch (err) {
    itemsList.innerHTML = `<p style="color:var(--muted);">Could not load your cart right now.</p>`;
  }

  // Pre-fill user details if available
  try {
    const { user } = await api.get('/users/me');
    if (form && user) {
      if (user.name) form.name.value = user.name;
      if (user.phone) form.phone.value = user.phone;
      if (user.address) form.address.value = user.address;
      if (user.city) form.city.value = user.city;
      if (user.pincode) form.pincode.value = user.pincode;
    }
  } catch (err) {
    console.error('Error fetching user profile for prefill', err);
  }

  // Gateway Tab Switching
  pgNavItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      activePaymentTab = targetTab;

      pgNavItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      pgTabPanes.forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(`pane-${targetTab}`);
      if (activePane) activePane.classList.add('active');

      if (targetTab === 'cod') {
        pgPayBtnText.textContent = 'Confirm Order (COD)';
      } else {
        pgPayBtnText.textContent = `Pay ₹${currentTotal} Now`;
      }
    });
  });

  // Auto-fill demo card button
  if (autofillCardBtn) {
    autofillCardBtn.addEventListener('click', () => {
      document.getElementById('cardNumInput').value = '4532 8821 9912 3456';
      document.getElementById('cardExpInput').value = '12/28';
      document.getElementById('cardCvvInput').value = '842';
      document.getElementById('cardNameInput').value = 'Demo Student';
      showToast('Demo Card auto-filled!', 'info');
    });
  }

  // Net banking selection
  bankBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bankBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Close Gateway Modal
  if (pgCloseBtn) {
    pgCloseBtn.addEventListener('click', () => {
      pgOverlay.classList.add('hidden');
    });
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      pendingShippingData = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        address: formData.get('address').trim(),
        city: formData.get('city').trim(),
        pincode: formData.get('pincode').trim(),
      };

      const selectedOption = formData.get('payment');

      if (selectedOption === 'cod') {
        // Direct COD Order
        await executeOrderPlacement({
          payment: 'cod',
          paymentStatus: 'pending',
          transactionId: null,
        });
      } else {
        // Open Cosmos Pay Gateway Modal
        pgPayBtnText.textContent = `Pay ₹${currentTotal} Now`;
        pgOverlay.classList.remove('hidden');
      }
    });
  }

  // Confirm Payment button inside Gateway Modal
  if (pgConfirmPayBtn) {
    pgConfirmPayBtn.addEventListener('click', async () => {
      if (activePaymentTab === 'cod') {
        pgOverlay.classList.add('hidden');
        await executeOrderPlacement({
          payment: 'cod',
          paymentStatus: 'pending',
          transactionId: null,
        });
        return;
      }

      // Show realistic processing animation
      pgProcessingOverlay.classList.remove('hidden');
      pgSpinner.style.display = 'block';
      pgSuccessIcon.style.display = 'none';
      pgProcessingTitle.textContent = 'Connecting with Bank...';
      pgProcessingDesc.textContent = 'Please do not refresh or press back.';

      setTimeout(() => {
        pgProcessingTitle.textContent = 'Verifying Payment Credentials...';
        pgProcessingDesc.textContent = '256-bit bank encryption handshake in progress.';
      }, 900);

      setTimeout(() => {
        pgSpinner.style.display = 'none';
        pgSuccessIcon.style.display = 'block';
        pgProcessingTitle.textContent = 'Payment Approved! 🎉';
        pgProcessingDesc.textContent = 'Generating order receipt and confirmation email...';
      }, 1800);

      setTimeout(async () => {
        pgProcessingOverlay.classList.add('hidden');
        pgOverlay.classList.add('hidden');

        const txnId = 'TXN_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
        await executeOrderPlacement({
          payment: activePaymentTab,
          paymentStatus: 'paid',
          transactionId: txnId,
        });
      }, 2500);
    });
  }

  // Common Order Placement Function
  async function executeOrderPlacement({ payment, paymentStatus, transactionId }) {
    const submitBtn = document.getElementById('placeOrderBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Finalizing order...';
    }

    try {
      let appliedCoupon = null;
      let orderDiscount = 0;
      try {
        appliedCoupon = JSON.parse(localStorage.getItem('cosmos_applied_coupon')) || null;
        if (appliedCoupon && currentTotal > 0) {
          const rawSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
          if (appliedCoupon.code === 'COSMOS20') orderDiscount = Math.round(rawSubtotal * 0.20);
          else if (appliedCoupon.code === 'WELCOME10') orderDiscount = Math.round(rawSubtotal * 0.10);
          else if (appliedCoupon.code === 'FLAT100') orderDiscount = rawSubtotal >= 1500 ? 100 : 0;
          else if (appliedCoupon.code === 'FLAT500') orderDiscount = rawSubtotal >= 3000 ? 500 : 0;
        }
      } catch { appliedCoupon = null; }

      const res = await api.post('/orders', {
        items: cart,
        shipping: pendingShippingData,
        payment,
        paymentStatus,
        transactionId,
        discount: orderDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
      });

      // Clear local and server cart and applied coupon
      setCart([]);
      localStorage.removeItem('cosmos_applied_coupon');
      renderHeader();

      // Populate Success Modal
      if (res.order) {
        if (successOrderId) successOrderId.textContent = res.order.id;
        if (successPaymentStatus) {
          if (res.order.paymentStatus === 'paid') {
            successPaymentStatus.textContent = 'PAID';
            successPaymentStatus.style.background = '#e6f9ed';
            successPaymentStatus.style.color = '#167a39';
          } else {
            successPaymentStatus.textContent = 'PENDING (COD)';
            successPaymentStatus.style.background = '#fff8e6';
            successPaymentStatus.style.color = '#9a6b00';
          }
        }
        if (successTxnId && res.order.transactionId) {
          successTxnId.textContent = res.order.transactionId;
          if (successTxnRow) successTxnRow.style.display = 'flex';
        } else if (successTxnRow) {
          successTxnRow.style.display = 'none';
        }
      }

      successModal.classList.remove('hidden');
      showToast('Order placed successfully! Check your email for details.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Proceed to Payment →';
      }
    }
  }
});
