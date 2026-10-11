// js/shop.js — Shop / Catalog listing page with multi-filtering and sorting.
// Handles category filtering, size filtering, price/rating sorting, search, and rendering.

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const fixedCategory = grid.dataset.category || null;
  const emptyState = document.getElementById('emptyState');
  const filterButtons = document.querySelectorAll('.boutique-filter');
  const sizeChips = document.querySelectorAll('.size-filter-chip');
  const sortSelect = document.getElementById('sortSelect');
  const searchInput = document.getElementById('searchInput');

  let activeCategory = 'all';
  let activeSize = 'all';
  let activeSort = 'featured';
  let searchTerm = '';

  async function loadAndRender() {
    grid.innerHTML = `<p style="color:var(--muted);">Loading products...</p>`;

    const category = fixedCategory || (activeCategory !== 'all' ? activeCategory : undefined);
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (searchTerm) query.set('search', searchTerm);

    try {
      const { products } = await api.get(`/products?${query.toString()}`, { auth: false });
      let filtered = products || [];

      // 1. Filter by Size
      if (activeSize !== 'all') {
        filtered = filtered.filter(p => p.sizes && p.sizes.includes(activeSize));
      }

      // 2. Sort
      if (activeSort === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (activeSort === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (activeSort === 'rating_desc') {
        filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      }

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
        renderProductGrid(grid, filtered);
      }
    } catch (err) {
      grid.innerHTML = `<p style="color:var(--muted);">Could not load products right now.</p>`;
    }
  }

  // Category Filter Events
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter;
      loadAndRender();
    });
  });

  // Size Filter Events
  sizeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sizeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeSize = chip.dataset.size;
      loadAndRender();
    });
  });

  // Sort Dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      loadAndRender();
    });
  }

  // Search Input with Debounce
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchTerm = searchInput.value.trim();
        loadAndRender();
      }, 300);
    });
  }

  loadAndRender();
});
