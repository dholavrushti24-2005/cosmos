// js/wishlist.js — Wishlist page: loads saved product IDs from localStorage,
// fetches matching products, and renders them as product cards.

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('wishlistGrid');
  const emptyState = document.getElementById('emptyState');
  const wishIds = getWishlist();

  if (wishIds.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  try {
    const { products } = await api.get('/products', { auth: false });
    const items = products.filter(p => wishIds.includes(p.id));

    if (items.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      renderProductGrid(grid, items);
    }
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--muted);">Could not load your wishlist right now.</p>`;
  }
});
