/* ==========================================================================
   COSMOS — USER SIDE SHARED COMPONENTS
   Single source of truth for navbar + footer, injected into every page
   via <div id="site-header"></div> and <div id="site-footer"></div>.
   ========================================================================== */

const NAV_LINKS = [
  { href: 'home.html', label: 'Home' },
  { href: 'clothes.html', label: 'Clothes' },
  { href: 'fashion.html', label: 'Fashion' },
  { href: 'jewellery.html', label: 'Jewellery' },
  { href: 'beauty.html', label: 'Beauty' },
];

// Pages that are part of the navbar but not top-level nav links
// (reached via icons, footer, or flow — not repeated in NAV_LINKS to avoid clutter)
// checkout.html, orders.html handled via icons/footer/flow, not primary nav.

function currentPage() {
  const path = window.location.pathname.split('/').pop();
  return path === '' ? 'index.html' : path;
}

// Redirects to login if there's no active session. Call at the top of
// any page that requires the user to be logged in (profile, checkout, orders).
function requireUserAuth() {
  if (!localStorage.getItem('cosmos_token')) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function showCosmosInfoModal() {
  let modal = document.getElementById('cosmosInfoModal');
  if (modal) {
    modal.classList.remove('hidden');
    return;
  }

  modal = document.createElement('div');
  modal.id = 'cosmosInfoModal';
  modal.className = 'checkout-modal';
  modal.innerHTML = `
    <div class="checkout-modal-box" style="max-width:540px; text-align:left; position:relative;">
      <button class="cart-close" id="closeCosmosInfoBtn" style="position:absolute; top:1.2rem; right:1.2rem;">✕</button>
      <div style="display:flex; align-items:center; gap:0.8rem; margin-bottom:1rem;">
        <img src="../../assets/images/logo.svg" alt="Cosmos Logo" style="height:70px; width:auto; display:block;" />
        <div>
          <h3 style="margin:0; font-size:1.4rem; color:var(--text);">COSMOS Store Details</h3>
          <p style="margin:0; font-size:0.8rem; color:var(--muted);">Everyday Luxury Clothes, Fashion & Beauty</p>
        </div>
      </div>

      <div style="border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:1rem 0; margin-bottom:1.2rem;">
        <h4 style="margin:0 0 0.4rem; font-size:0.95rem; color:var(--primary);">🌟 About Our Store</h4>
        <p style="font-size:0.85rem; color:var(--muted); line-height:1.6; margin:0 0 0.8rem;">
          Cosmos is an all-in-one e-commerce destination specially curated for young women. We bring together trending clothes, dresses, kurtis, skincare serums, and boutique beauty brands.
        </p>

        <h4 style="margin:0.8rem 0 0.4rem; font-size:0.95rem; color:var(--primary);">✨ Website Features & Delivery</h4>
        <ul style="font-size:0.83rem; color:var(--muted); line-height:1.7; padding-left:1.2rem; margin:0;">
          <li><b>100% Authentic Products:</b> Verified partner brands (Luna Threads, Glow & Co., Petal Studio, Bloom Beauty).</li>
          <li><b>Interactive Media Gallery:</b> Multi-image previews & HD Video Playback for products.</li>
          <li><b>Fast Delivery & COD:</b> Express nationwide shipping & Cash on Delivery options.</li>
          <li><b>Seamless Wishlist & Cart:</b> Instant sync across devices for registered users.</li>
        </ul>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem;">
        <div style="font-size:0.8rem; color:var(--muted);">
          <b>Admin Portal:</b> <a href="login.html" style="color:var(--primary); font-weight:600;">Admin Login</a>
        </div>
        <button class="primary-btn" id="gotItCosmosBtn" style="padding:0.5rem 1.4rem; font-size:0.85rem;">Browse Products</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = document.getElementById('closeCosmosInfoBtn');
  const gotItBtn = document.getElementById('gotItCosmosBtn');
  const close = () => modal.classList.add('hidden');
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (gotItBtn) gotItBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
}

function renderHeader() {
  const mount = document.getElementById('site-header');
  if (!mount) return;

  const active = currentPage();
  const isLoggedIn = !!localStorage.getItem('cosmos_token');
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  mount.innerHTML = `
    <div class="navbar">
      <a href="index.html" class="nav-logo" title="Cosmos — Home">
        <img src="../../assets/images/logo.svg" alt="Cosmos Logo" style="height:65px; width:auto; display:block;" />
      </a>

      <nav class="nav-links" id="navLinks">
        ${NAV_LINKS.map(link => `
          <a href="${link.href}" class="${active === link.href ? 'active' : ''}">${link.label}</a>
        `).join('')}
      </nav>

      <div class="nav-actions">
        <a href="wishlist.html" class="icon-btn" title="Wishlist">
          ♡
          ${wishlistCount > 0 ? `<span class="icon-badge">${wishlistCount}</span>` : ''}
        </a>
        <a href="cart.html" class="icon-btn" title="Cart">
          🛍
          ${cartCount > 0 ? `<span class="icon-badge">${cartCount}</span>` : ''}
        </a>
        ${isLoggedIn
          ? `<a href="profile.html" class="icon-btn" title="Profile">👤</a>`
          : `<a href="login.html" class="primary-btn" style="padding:0.6rem 1.1rem;font-size:0.85rem;">Login</a>`
        }
        <button class="nav-burger" id="navBurger" aria-label="Menu">☰</button>
      </div>
    </div>
  `;

  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', () => {
      links.classList.toggle('mobile-open');
      links.style.display = links.classList.contains('mobile-open') ? 'flex' : '';
      if (links.classList.contains('mobile-open')) {
        links.style.position = 'fixed';
        links.style.top = 'var(--header-h)';
        links.style.left = '0';
        links.style.right = '0';
        links.style.background = '#fff';
        links.style.flexDirection = 'column';
        links.style.padding = '1rem 5vw';
        links.style.borderBottom = '1px solid var(--line)';
      }
    });
  }
}

function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;

  mount.innerHTML = `
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="index.html" class="nav-logo">
          <img src="../../assets/images/logo.svg" alt="Cosmos Logo" style="height:65px; width:auto; display:block;" />
        </a>
        <p>Fashion and beauty essentials curated for you — discover new brands, build your wishlist, and shop with confidence.</p>
      </div>
      <div class="footer-col">
        <h4>Navigation</h4>
        <a href="index.html">Landing Page</a>
        <a href="home.html">Home Catalog</a>
        <a href="clothes.html">Clothes</a>
        <a href="fashion.html">Fashion</a>
        <a href="jewellery.html">Jewellery</a>
        <a href="beauty.html">Beauty</a>
      </div>
      <div class="footer-col">
        <h4>Account</h4>
        <a href="profile.html">My Profile</a>
        <a href="orders.html">My Orders</a>
        <a href="wishlist.html">Wishlist</a>
        <a href="cart.html">Cart</a>
      </div>
      <div class="footer-col">
        <h4>Support</h4>
        <a href="#">Help Center</a>
        <a href="#">Shipping Info</a>
        <a href="#">Returns</a>
      </div>
    </div>
    <div class="footer-bottom">
      &copy; ${new Date().getFullYear()} Cosmos. College internship project — for demo purposes only.
    </div>
  `;
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

/* ==========================================================================
   Cart & Wishlist
   Both are stored client-side in localStorage so they work for guests too.
   Logged-in users' carts are additionally synced to the backend (Phase 6)
   so they persist across devices; wishlist stays local for simplicity.
   ========================================================================== */

function getCart() {
  try { return JSON.parse(localStorage.getItem('cosmos_cart')) || []; }
  catch { return []; }
}
function setCart(cart) {
  localStorage.setItem('cosmos_cart', JSON.stringify(cart));
}
function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getWishlist() {
  try { return JSON.parse(localStorage.getItem('cosmos_wishlist')) || []; }
  catch { return []; }
}
function setWishlist(list) {
  localStorage.setItem('cosmos_wishlist', JSON.stringify(list));
}
function getWishlistCount() {
  return getWishlist().length;
}

// Fire-and-forget sync — if the user isn't logged in, this is a no-op.
async function syncCartToBackend(cart) {
  if (!localStorage.getItem('cosmos_token')) return;
  try { await api.put('/cart', { items: cart }); } catch { /* non-critical */ }
}

function addToCart(productId, qty = 1, size = null) {
  const cart = getCart();
  const existing = cart.find(i => i.id === productId && (i.size || null) === (size || null));
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty, size: size || null });
  }
  setCart(cart);
  syncCartToBackend(cart);
  renderHeader();
  return cart;
}

function updateCartQty(productId, qty, size = null) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(i => !(i.id === productId && (i.size || null) === (size || null)));
  } else {
    const item = cart.find(i => i.id === productId && (i.size || null) === (size || null));
    if (item) item.qty = qty;
  }
  setCart(cart);
  syncCartToBackend(cart);
  renderHeader();
  return cart;
}

function removeFromCart(productId, size = null) {
  return updateCartQty(productId, 0, size);
}

function toggleWishlist(productId) {
  let list = getWishlist();
  const nowWished = !list.includes(productId);
  list = nowWished ? [...list, productId] : list.filter(id => id !== productId);
  setWishlist(list);
  renderHeader();
  return nowWished;
}

// Loads the logged-in user's saved cart from the backend and adopts it
// if the local cart is currently empty (called right after login).
async function hydrateCartFromBackend() {
  try {
    const { cart } = await api.get('/cart');
    if (cart && cart.length > 0 && getCart().length === 0) {
      setCart(cart);
    }
  } catch { /* non-critical */ }
}

// ---------- Global delegated handlers for product-card buttons ----------
// Works anywhere a .add-to-cart-btn / .wishlist-toggle (or product-detail
// equivalents carrying the same data attributes) is rendered on the page.
document.addEventListener('click', (e) => {
  const cartBtn = e.target.closest('[data-cart-id]');
  if (cartBtn) {
    const size = cartBtn.dataset.cartSize || null;
    addToCart(cartBtn.dataset.cartId, 1, size);
    showToast(size ? `Added to cart (Size: ${size})` : 'Added to cart');
    const original = cartBtn.textContent;
    cartBtn.textContent = 'Added ✓';
    cartBtn.classList.add('in-cart');
    setTimeout(() => {
      cartBtn.textContent = original;
      cartBtn.classList.remove('in-cart');
    }, 1200);
    return;
  }

  const wishBtn = e.target.closest('[data-wishlist-id]');
  if (wishBtn) {
    const nowWished = toggleWishlist(wishBtn.dataset.wishlistId);
    showToast(nowWished ? 'Added to wishlist' : 'Removed from wishlist');

    if (wishBtn.classList.contains('wishlist-toggle')) {
      wishBtn.classList.toggle('active', nowWished);
      wishBtn.textContent = nowWished ? '♥' : '♡';
    } else {
      wishBtn.innerHTML = nowWished ? '♥ Wishlisted' : '♡ Wishlist';
    }

    // On the wishlist page, unwishing an item should remove its card.
    const wishlistGrid = document.getElementById('wishlistGrid');
    if (!nowWished && wishlistGrid) {
      const card = wishBtn.closest('.product-card');
      if (card) card.remove();
      const emptyState = document.getElementById('emptyState');
      if (emptyState && wishlistGrid.children.length === 0) {
        emptyState.classList.remove('hidden');
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
});
