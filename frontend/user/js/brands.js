// js/brands.js — Brands listing page: loads brands from the backend.

function brandCardHTML(b) {
  const logoOrEmoji = b.logo
    ? `<img src="${b.logo}" alt="${b.name}" onerror="this.style.display='none'">`
    : '';
  return `
    <div class="brand-card">
      ${logoOrEmoji}
      <h4>${b.name}</h4>
      <p>${b.description}</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('brandGrid');
  if (!grid) return;

  try {
    const { brands } = await api.get('/brands', { auth: false });
    grid.innerHTML = brands.map(brandCardHTML).join('');
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--muted);">Could not load brands right now.</p>`;
  }
});
