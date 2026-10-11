// js/product.js — Product details page with Interactive Media Gallery (Images & Videos).

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const nameEl = document.getElementById('pdName');
  const categoryEl = document.getElementById('pdCategory');
  const priceEl = document.getElementById('pdPrice');
  const descEl = document.getElementById('pdDesc');
  const mainViewer = document.getElementById('pdMainViewer');
  const thumbsRow = document.getElementById('pdThumbsRow');
  const relatedGrid = document.getElementById('relatedGrid');
  const addToCartBtn = document.getElementById('pdAddToCart');
  const addToWishlistBtn = document.getElementById('pdAddToWishlist');

  if (!productId) {
    nameEl.textContent = 'Product not found';
    return;
  }

  try {
    const { product } = await api.get(`/products/${productId}`, { auth: false });

    document.title = `${product.name} — Cosmos`;
    categoryEl.textContent = product.category;
    nameEl.textContent = product.name;
    descEl.textContent = product.description;
    priceEl.innerHTML = `
      ${product.originalPrice ? `<span class="original">₹${product.originalPrice}</span>` : ''}
      ₹${product.price}
    `;

    // Construct media items array
    const mediaItems = [];

    // Add images
    if (product.images && product.images.length > 0) {
      product.images.forEach(url => {
        if (url) mediaItems.push({ type: 'image', url });
      });
    } else if (product.image) {
      mediaItems.push({ type: 'image', url: product.image });
    }

    // Add videos
    if (product.videos && product.videos.length > 0) {
      product.videos.forEach(url => {
        if (url) mediaItems.push({ type: 'video', url });
      });
    }

    let activeIndex = 0;

    function renderMainMedia(index) {
      if (mediaItems.length === 0) {
        mainViewer.innerHTML = `<span class="product-emoji-fallback">🛍️</span>`;
        return;
      }

      const item = mediaItems[index];
      if (item.type === 'video') {
        mainViewer.innerHTML = `
          <video src="${item.url}" controls autoplay loop muted playsinline></video>
        `;
      } else {
        mainViewer.innerHTML = `
          <img src="${item.url}" alt="${product.name}" onerror="this.parentElement.innerHTML='<span class=&quot;product-emoji-fallback&quot;>🛍️</span>'">
        `;
      }
    }

    function renderThumbnails() {
      if (mediaItems.length <= 1) {
        thumbsRow.style.display = 'none';
        return;
      }
      thumbsRow.style.display = 'flex';

      thumbsRow.innerHTML = mediaItems.map((item, idx) => {
        const isActive = idx === activeIndex;
        if (item.type === 'video') {
          return `
            <div class="pd-thumb ${isActive ? 'active' : ''}" data-index="${idx}">
              <video src="${item.url}" muted preload="metadata"></video>
              <div class="pd-thumb-video-badge">▶</div>
            </div>
          `;
        } else {
          return `
            <div class="pd-thumb ${isActive ? 'active' : ''}" data-index="${idx}">
              <img src="${item.url}" alt="${product.name}">
            </div>
          `;
        }
      }).join('');
    }

    renderMainMedia(activeIndex);
    renderThumbnails();

    thumbsRow.addEventListener('click', (e) => {
      const thumb = e.target.closest('.pd-thumb');
      if (thumb) {
        const idx = parseInt(thumb.dataset.index, 10);
        if (!isNaN(idx) && idx !== activeIndex) {
          activeIndex = idx;
          renderMainMedia(activeIndex);
          renderThumbnails();
        }
      }
    });

    // --- Size Selector Logic ---
    let selectedSize = null;
    const sizeWrap = document.getElementById('pdSizeWrap');
    const sizesListEl = document.getElementById('pdSizesList');
    const selectedSizeLabel = document.getElementById('pdSelectedSizeLabel');
    const sizeGuideBtn = document.getElementById('sizeGuideBtn');

    if (product.sizes && product.sizes.length > 0) {
      sizeWrap.classList.remove('hidden');
      selectedSize = product.sizes[0];
      selectedSizeLabel.textContent = selectedSize;

      sizesListEl.innerHTML = product.sizes.map((s, idx) => `
        <button type="button" class="size-chip ${idx === 0 ? 'selected' : ''}" data-size="${s}">
          ${s}
        </button>
      `).join('');

      sizesListEl.addEventListener('click', (e) => {
        const chip = e.target.closest('.size-chip');
        if (chip) {
          sizesListEl.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          selectedSize = chip.dataset.size;
          selectedSizeLabel.textContent = selectedSize;
          addToCartBtn.dataset.cartSize = selectedSize;
        }
      });

      if (sizeGuideBtn) {
        sizeGuideBtn.addEventListener('click', () => {
          showToast(`Standard size guide: S (36"), M (38"), L (40"), XL (42"). True to size!`);
        });
      }

      addToCartBtn.dataset.cartSize = selectedSize;
    } else {
      sizeWrap.classList.add('hidden');
      addToCartBtn.removeAttribute('data-cart-size');
    }

    addToCartBtn.dataset.cartId = product.id;
    addToWishlistBtn.dataset.wishlistId = product.id;
    if (getWishlist().includes(product.id)) {
      addToWishlistBtn.innerHTML = '♥ Wishlisted';
    }

    // Related products: same category, excluding this one
    const { products: sameCategory } = await api.get(`/products?category=${product.category}`, { auth: false });
    const related = sameCategory.filter(p => p.id !== product.id).slice(0, 4);
    renderProductGrid(relatedGrid, related);
    // --- Reviews Logic ---
    const reviewsGrid = document.getElementById('productReviewsGrid');
    const emptyState = document.getElementById('productReviewsEmpty');
    const writeBtn = document.getElementById('writeProductReviewBtn');
    const modal = document.getElementById('productReviewModal');
    const closeBtn = document.getElementById('closeProductReviewModal');
    const form = document.getElementById('productReviewForm');
    const statsEl = document.getElementById('productReviewStats');

    function renderStars(rating) {
      return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    }

    async function loadReviews() {
      try {
        const { reviews } = await api.get(`/reviews/product/${productId}`, { auth: false });
        
        if (reviews.length === 0) {
          reviewsGrid.innerHTML = '';
          emptyState.classList.remove('hidden');
          statsEl.textContent = 'Average Rating: — | Total Reviews: 0';
        } else {
          emptyState.classList.add('hidden');
          const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
          statsEl.textContent = `Average Rating: ${avgRating} / 5 | Total Reviews: ${reviews.length}`;
          
          reviewsGrid.innerHTML = reviews.map(r => `
            <div class="stat-card" style="text-align: left;">
              <div style="color: #fbbf24; font-size: 1.2rem; margin-bottom: 0.5rem;">${renderStars(r.rating)}</div>
              <p style="margin: 0 0 1rem; color: var(--muted); font-size: 0.95rem; line-height: 1.5;">"${r.comment}"</p>
              <div style="font-weight: 700; font-size: 0.9rem;">${r.userName}</div>
              <div style="font-size: 0.75rem; color: var(--muted); margin-top: 0.2rem;">${new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('');
        }
      } catch (err) {
        reviewsGrid.innerHTML = `<div class="stat-card" style="text-align: left; opacity: 0.7; color: var(--danger);">Failed to load reviews.</div>`;
      }
    }

    loadReviews();

    if (writeBtn) {
      writeBtn.addEventListener('click', () => {
        if (!localStorage.getItem('cosmos_token')) {
          showToast('Please login to leave a review.', 'error');
          window.location.href = 'login.html';
          return;
        }
        modal.classList.remove('hidden');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = new FormData(form);
        const rating = formData.get('rating');
        const comment = formData.get('comment');

        try {
          await api.post(`/reviews/product/${productId}`, { rating, comment });
          showToast('Review submitted successfully!');
          modal.classList.add('hidden');
          form.reset();
          loadReviews();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Review';
        }
      });
    }
  } catch (err) {
    nameEl.textContent = 'Product not found';
    descEl.textContent = err.message;
  }
});
