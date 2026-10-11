document.addEventListener('DOMContentLoaded', async () => {
  const reviewsGrid = document.getElementById('siteReviewsGrid');
  const emptyState = document.getElementById('siteReviewsEmpty');
  const writeBtn = document.getElementById('writeSiteReviewBtn');
  const modal = document.getElementById('siteReviewModal');
  const closeBtn = document.getElementById('closeSiteReviewModal');
  const form = document.getElementById('siteReviewForm');

  if (!reviewsGrid) return;

  function renderStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  async function loadReviews() {
    try {
      const { reviews } = await api.get('/reviews/site', { auth: false });
      
      if (reviews.length === 0) {
        reviewsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
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
        await api.post('/reviews/site', { rating, comment });
        showToast('Thank you for your review!');
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
});
