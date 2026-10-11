// js/product-card.js — Shared product card renderer with Amazon-style star rating display

function renderProductStars(rating) {
  const rounded = Math.round(Number(rating) * 2) / 2; // round to nearest 0.5
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      starsHtml += '<span class="star filled">★</span>';
    } else if (i - 0.5 === rounded) {
      starsHtml += '<span class="star half">★</span>';
    } else {
      starsHtml += '<span class="star empty">★</span>';
    }
  }
  return starsHtml;
}

function productCardHTML(p) {
  const isWished = getWishlist().includes(p.id);
  const imgOrEmoji = p.image
    ? `<img src="${p.image}" alt="${p.name}" onerror="this.parentElement.innerHTML='<span class=&quot;product-emoji-fallback&quot;>🛍️</span>'">`
    : `<span class="product-emoji-fallback">🛍️</span>`;

  const rating = Number(p.rating) || 0;
  const reviewCount = Number(p.reviewCount) || 0;

  const ratingHtml = reviewCount > 0 ? `
    <!-- Amazon-style Star Rating & Review Count (Only when real reviews exist) -->
    <div class="product-card-rating">
      <span class="product-stars" title="${rating.toFixed(1)} out of 5 stars">
        ${renderProductStars(rating)}
      </span>
      <span class="product-rating-val">${rating.toFixed(1)}</span>
      <a href="product.html?id=${p.id}#reviews" class="product-review-count">(${reviewCount.toLocaleString()})</a>
    </div>
  ` : '';

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <button class="wishlist-toggle ${isWished ? 'active' : ''}" data-wishlist-id="${p.id}" title="Wishlist">
          ${isWished ? '♥' : '♡'}
        </button>
        <a href="product.html?id=${p.id}">${imgOrEmoji}</a>
      </div>
      <div class="product-info">
        <span class="product-category-tag">${p.category}</span>
        <a href="product.html?id=${p.id}"><h4 class="product-name">${p.name}</h4></a>
        ${ratingHtml}

        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <div class="product-price">
            ${p.originalPrice ? `<span class="original">₹${p.originalPrice}</span>` : ''}
            ₹${p.price}
          </div>
          <button class="add-to-cart-btn" data-cart-id="${p.id}" ${p.sizes && p.sizes.length > 0 ? `data-cart-size="${p.sizes[0]}"` : ''}>Add</button>
        </div>
      </div>
    </div>
  `;
}

function renderProductGrid(container, products) {
  container.innerHTML = products.map(productCardHTML).join('');
}
