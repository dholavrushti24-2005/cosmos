// js/home.js — Home page script: displays ALL products with real-time filtering & search.

let allProductsList = [];
let activeCategory = 'all';

function filterAndRenderHomeProducts() {
  const grid = document.getElementById('featuredGrid');
  const emptyState = document.getElementById('emptyState');
  const countBadge = document.getElementById('productCountBadge');
  const searchInput = document.getElementById('homeSearchInput');

  if (!grid) return;

  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let filtered = allProductsList;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery)
    );
  }

  if (countBadge) {
    countBadge.textContent = `Showing ${filtered.length} of ${allProductsList.length} products`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    renderProductGrid(grid, filtered);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  try {
    const { products } = await api.get('/products', { auth: false });
    allProductsList = products || [];

    // Initial render showing ALL products
    filterAndRenderHomeProducts();

    // Category filter tabs
    const filterButtons = document.querySelectorAll('.boutique-filter');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.filter || 'all';
        filterAndRenderHomeProducts();
      });
    });

    // Search input handler
    const searchInput = document.getElementById('homeSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        filterAndRenderHomeProducts();
      });
    }
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--muted);">Could not load products right now.</p>`;
  }
});
