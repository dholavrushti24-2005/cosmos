// js/products.js — Admin Products management: list, search, add, edit, delete + Media Gallery (Images & Videos).

let allProducts = [];
let currentMediaImages = [];
let currentMediaVideos = [];

const SUB_CATEGORIES = {
  clothes: ['jeans', 'top', 'pair', 'kurti', 'gown', 'choli', 'saree'],
  fashion: ['heels', 'sandals', 'shoes', 'goggles', 'bags', 'purse'],
  jewellery: ['necklaces', 'earrings', 'bracelets', 'rings'],
  beauty: ['serums', 'cosmetics', 'skincare', 'lipstick']
};

function productRow(p) {
  const thumb = p.image
    ? `<img class="table-thumb" src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">`
    : '';
  const imagesCount = (p.images && p.images.length) || (p.image ? 1 : 0);
  const videosCount = (p.videos && p.videos.length) || 0;
  
  return `
    <tr>
      <td style="display:flex; align-items:center; gap:0.7rem;">
        ${thumb}
        <div>
          <div style="font-weight:700;">${p.name}</div>
          <div style="color:var(--muted); font-size:0.78rem;">📷 ${imagesCount} | 🎥 ${videosCount}</div>
        </div>
      </td>
      <td>
        ${p.category}${p.subCategory ? `<br><span style="color:var(--muted); font-size:0.75rem;">&rarr; ${p.subCategory}</span>` : ''}
        ${p.sizes && p.sizes.length > 0 ? `<div style="font-size:0.75rem; color:#c77dff; font-weight:600; margin-top:3px;">📏 ${p.sizes.join(', ')}</div>` : ''}
      </td>
      <td>₹${p.price}</td>
      <td>${p.stock}</td>
      <td class="row-actions">
        <button class="small-btn" data-edit="${p.id}">Edit</button>
        <button class="danger-btn" data-delete="${p.id}">Delete</button>
      </td>
    </tr>
  `;
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsBody');
  const emptyState = document.getElementById('emptyState');

  if (products.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    tbody.innerHTML = products.map(productRow).join('');
  }
}

async function loadProducts() {
  try {
    const { products } = await adminApi.get('/products');
    allProducts = products;
    renderProductsTable(allProducts);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderMediaGrid() {
  const gridEl = document.getElementById('mediaItemsGrid');
  if (!gridEl) return;

  let html = '';

  // Render images
  currentMediaImages.forEach((imgUrl, idx) => {
    const isMain = idx === 0;
    html += `
      <div class="media-item-card ${isMain ? 'is-main' : ''}">
        <img src="${imgUrl}" alt="Product Image ${idx + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
        <span class="media-type-badge">📷 Image</span>
        ${isMain ? '<span class="media-main-badge">Cover</span>' : ''}
        <div class="media-card-actions">
          ${!isMain ? `<button type="button" class="media-action-btn" data-set-main-img="${idx}" title="Make Cover">★</button>` : ''}
          <button type="button" class="media-action-btn" data-remove-img="${idx}" title="Delete">✕</button>
        </div>
      </div>
    `;
  });

  // Render videos
  currentMediaVideos.forEach((vidUrl, idx) => {
    html += `
      <div class="media-item-card">
        <video src="${vidUrl}" muted loop preload="metadata"></video>
        <span class="media-type-badge">🎥 Video</span>
        <div class="media-card-actions">
          <button type="button" class="media-action-btn" data-remove-vid="${idx}" title="Delete">✕</button>
        </div>
      </div>
    `;
  });

  if (currentMediaImages.length === 0 && currentMediaVideos.length === 0) {
    html = `<p style="color:var(--muted); font-size:0.8rem; grid-column: 1/-1;">No images or videos added yet. Upload files or paste links above.</p>`;
  }

  gridEl.innerHTML = html;
}

function compressImageForDatabase(file, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
          } else {
            const optimized = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(optimized);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function uploadMediaFiles(files) {
  const formData = new FormData();
  for (let file of files) {
    const processed = await compressImageForDatabase(file);
    formData.append('files', processed);
  }

  const token = localStorage.getItem('cosmos_admin_token');
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed.');
  return data.files;
}

function productFormHTML(product) {
  const isEdit = !!product;

  return `
    <div class="modal-header">
      <h3>${isEdit ? 'Edit Product' : 'Add Product'}</h3>
      <button class="modal-close">✕</button>
    </div>
    <form id="productForm" class="stack">
      <label>Name
        <input type="text" name="name" value="${product ? product.name : ''}" required />
      </label>
      <label>Description
        <textarea name="description" required>${product ? product.description : ''}</textarea>
      </label>
      <div class="form-grid">
        <label>Price (₹)
          <input type="number" name="price" min="0" value="${product ? product.price : ''}" required />
        </label>
        <label>Original Price (₹, optional)
          <input type="number" name="originalPrice" min="0" value="${product && product.originalPrice ? product.originalPrice : ''}" />
        </label>
        <label>Category
          <select name="category" id="formCategory" required>
            <option value="clothes" ${product && product.category === 'clothes' ? 'selected' : ''}>👗 Clothes & Apparel</option>
            <option value="fashion" ${product && product.category === 'fashion' ? 'selected' : ''}>👠 Fashion & Shoes (Purses, Heels, Sandals)</option>
            <option value="jewellery" ${product && product.category === 'jewellery' ? 'selected' : ''}>💎 Jewellery (Necklaces, Earrings, Bracelets, Rings)</option>
            <option value="beauty" ${product && product.category === 'beauty' ? 'selected' : ''}>💄 Beauty & Skincare</option>
          </select>
        </label>
        <label>Sub-Type
          <select name="subCategory" id="formSubCategory" required></select>
        </label>
        <label>Stock
          <input type="number" name="stock" min="0" value="${product ? product.stock : 0}" required />
        </label>
        <label>Badge (optional)
          <input type="text" name="badge" value="${product && product.badge ? product.badge : ''}" placeholder="New, Sale..." />
        </label>
      </div>

      <!-- Available Sizes / Variants -->
      <div style="margin-top:0.4rem; padding:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--panel-border); border-radius:10px;">
        <label style="font-weight:700; margin-bottom:0.3rem; display:block;">
          Available Sizes
          <span style="font-weight:normal; font-size:0.75rem; color:var(--muted);"> (Comma-separated for clothes, shoes, rings, etc.)</span>
        </label>
        <input type="text" id="sizesInput" name="sizes" value="${product && product.sizes && product.sizes.length > 0 ? product.sizes.join(', ') : ''}" placeholder="e.g. XS, S, M, L, XL or UK 6, UK 7, UK 8..." style="width:100%;" />
        
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.5rem; align-items:center;">
          <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">Presets:</span>
          <button type="button" class="pill-btn" style="padding:0.25rem 0.6rem; font-size:0.75rem;" id="presetClothesBtn">👗 Clothes (XS to XXL)</button>
          <button type="button" class="pill-btn" style="padding:0.25rem 0.6rem; font-size:0.75rem;" id="presetShoesBtn">👠 Shoes (UK 5-9)</button>
          <button type="button" class="pill-btn" style="padding:0.25rem 0.6rem; font-size:0.75rem;" id="presetRingsBtn">💍 Rings (6, 7, 8)</button>
          <button type="button" class="pill-btn" style="padding:0.25rem 0.6rem; font-size:0.75rem;" id="presetFreeBtn">✨ Free Size</button>
          <button type="button" class="pill-btn" style="padding:0.25rem 0.6rem; font-size:0.75rem; color:#ff6b6b;" id="clearSizesBtn">✕ Clear</button>
        </div>
      </div>

      <!-- Product Media (Images & Videos) Management -->
      <div style="margin-top:0.5rem;">
        <label style="font-weight:700; margin-bottom:0.4rem; display:block;">Product Images & Videos</label>
        <div class="media-manager-box">
          <div class="media-upload-bar">
            <input type="file" id="mediaFileInput" class="media-file-input" accept="image/*,video/*" multiple />
            <label for="mediaFileInput" class="upload-file-btn">
              <span>📁</span> Upload Image / Video Files
            </label>

            <div class="media-url-input-group">
              <input type="url" id="mediaUrlInput" placeholder="Paste Image or Video URL..." />
              <button type="button" class="small-btn" id="addUrlBtn">Add Link</button>
            </div>
          </div>
          <div id="uploadStatusText" style="font-size:0.78rem; color:var(--primary); margin-bottom:0.4rem; display:none;">Uploading files...</div>
          <div class="media-items-grid" id="mediaItemsGrid"></div>
        </div>
      </div>

      <div id="formError" class="form-error hidden"></div>
      <button type="submit" class="primary-btn">${isEdit ? 'Save Changes' : 'Add Product'}</button>
    </form>
  `;
}

function openProductForm(product = null) {
  // Initialize media arrays
  if (product) {
    currentMediaImages = product.images && product.images.length > 0 
      ? [...product.images] 
      : (product.image ? [product.image] : []);
    currentMediaVideos = product.videos && product.videos.length > 0 
      ? [...product.videos] 
      : [];
  } else {
    currentMediaImages = [];
    currentMediaVideos = [];
  }

  openModal(productFormHTML(product));
  renderMediaGrid();

  const fileInput = document.getElementById('mediaFileInput');
  const formCat = document.getElementById('formCategory');
  const formSubCat = document.getElementById('formSubCategory');
  
  function updateFormSubCategories() {
    const subs = SUB_CATEGORIES[formCat.value] || [];
    formSubCat.innerHTML = subs.map(s => 
      `<option value="${s}" ${product && product.subCategory === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
    ).join('');
  }
  formCat.addEventListener('change', updateFormSubCategories);
  updateFormSubCategories();

  const uploadStatusText = document.getElementById('uploadStatusText');
  const mediaUrlInput = document.getElementById('mediaUrlInput');
  const addUrlBtn = document.getElementById('addUrlBtn');
  const mediaGrid = document.getElementById('mediaItemsGrid');

  // File Upload Event
  fileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    uploadStatusText.style.display = 'block';
    uploadStatusText.textContent = `Uploading ${files.length} file(s)...`;

    try {
      const uploadedFiles = await uploadMediaFiles(files);
      uploadedFiles.forEach(f => {
        if (f.type === 'video') {
          currentMediaVideos.push(f.url);
        } else {
          currentMediaImages.push(f.url);
        }
      });
      uploadStatusText.style.display = 'none';
      fileInput.value = '';
      renderMediaGrid();
      showToast('Files uploaded successfully.');
    } catch (err) {
      uploadStatusText.style.display = 'none';
      showToast(err.message, 'error');
    }
  });

  // Add URL Event
  addUrlBtn.addEventListener('click', () => {
    const url = mediaUrlInput.value.trim();
    if (!url) return;

    const lower = url.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.includes('video')) {
      currentMediaVideos.push(url);
    } else {
      currentMediaImages.push(url);
    }
    mediaUrlInput.value = '';
    renderMediaGrid();
  });

  // Media Grid Actions (Remove / Set Cover)
  mediaGrid.addEventListener('click', (e) => {
    const removeImgIdx = e.target.dataset.removeImg;
    const removeVidIdx = e.target.dataset.removeVid;
    const setMainImgIdx = e.target.dataset.setMainImg;

    if (removeImgIdx !== undefined) {
      currentMediaImages.splice(parseInt(removeImgIdx, 10), 1);
      renderMediaGrid();
    } else if (removeVidIdx !== undefined) {
      currentMediaVideos.splice(parseInt(removeVidIdx, 10), 1);
      renderMediaGrid();
    } else if (setMainImgIdx !== undefined) {
      const idx = parseInt(setMainImgIdx, 10);
      const [chosen] = currentMediaImages.splice(idx, 1);
      currentMediaImages.unshift(chosen);
      renderMediaGrid();
    }
  });

  // Preset Buttons for Sizes
  const sizesInput = document.getElementById('sizesInput');
  const presetClothesBtn = document.getElementById('presetClothesBtn');
  const presetShoesBtn = document.getElementById('presetShoesBtn');
  const presetRingsBtn = document.getElementById('presetRingsBtn');
  const presetFreeBtn = document.getElementById('presetFreeBtn');
  const clearSizesBtn = document.getElementById('clearSizesBtn');

  if (presetClothesBtn) presetClothesBtn.addEventListener('click', () => sizesInput.value = 'XS, S, M, L, XL, XXL');
  if (presetShoesBtn) presetShoesBtn.addEventListener('click', () => sizesInput.value = 'UK 5, UK 6, UK 7, UK 8, UK 9');
  if (presetRingsBtn) presetRingsBtn.addEventListener('click', () => sizesInput.value = 'Size 6, Size 7, Size 8');
  if (presetFreeBtn) presetFreeBtn.addEventListener('click', () => sizesInput.value = 'Free Size');
  if (clearSizesBtn) clearSizesBtn.addEventListener('click', () => sizesInput.value = '');

  // Submit Form
  const form = document.getElementById('productForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('formError');
    errorBox.classList.add('hidden');

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name').trim(),
      description: formData.get('description').trim(),
      price: formData.get('price'),
      originalPrice: formData.get('originalPrice') || null,
      category: formData.get('category'),
      subCategory: formData.get('subCategory'),
      stock: formData.get('stock'),
      badge: formData.get('badge').trim() || null,
      sizes: formData.get('sizes') ? formData.get('sizes').trim() : '',
      image: currentMediaImages.length > 0 ? currentMediaImages[0] : '',
      images: currentMediaImages,
      videos: currentMediaVideos,
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (product) {
        await adminApi.put(`/products/${product.id}`, payload);
        showToast('Product updated.');
      } else {
        await adminApi.post('/products', payload);
        showToast('Product added.');
      }
      closeModal();
      loadProducts();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdminAuth()) return;
  renderAdminShell('Products');
  loadProducts();

  const topbarTitleGroup = document.querySelector('#topbarMount > div');
  const categoryTabs = document.getElementById('categoryTabs');
  if (topbarTitleGroup && categoryTabs) {
    categoryTabs.classList.remove('hidden');
    topbarTitleGroup.appendChild(categoryTabs);
  }

  document.getElementById('addProductBtn').addEventListener('click', () => openProductForm());

  const searchInput = document.getElementById('searchInput');
  const subCategoryFilter = document.getElementById('subCategoryFilter');
  let currentCategory = 'all';

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const subCat = subCategoryFilter.value;

    const filtered = allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(q);
      const matchesCategory = currentCategory === 'all' || p.category.toLowerCase() === currentCategory;
      const matchesSubCategory = subCat === 'ALL' || !p.subCategory || p.subCategory === subCat;
      return matchesSearch && matchesCategory && matchesSubCategory;
    });
    renderProductsTable(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  subCategoryFilter.addEventListener('change', applyFilters);

  const categoryBtns = document.querySelectorAll('#categoryTabs .pill-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.filter;

      if (currentCategory === 'all') {
        subCategoryFilter.style.display = 'none';
        subCategoryFilter.innerHTML = '<option value="ALL">All Types</option>';
      } else {
        const subs = SUB_CATEGORIES[currentCategory] || [];
        subCategoryFilter.innerHTML = '<option value="ALL">All Types</option>' + 
          subs.map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('');
        subCategoryFilter.style.display = 'inline-block';
      }

      applyFilters();
    });
  });

  document.getElementById('productsBody').addEventListener('click', (e) => {
    const editId = e.target.dataset.edit;
    const deleteId = e.target.dataset.delete;

    if (editId) {
      const product = allProducts.find(p => p.id === editId);
      openProductForm(product);
    }

    if (deleteId) {
      const product = allProducts.find(p => p.id === deleteId);
      confirmDelete(`Delete "${product.name}"? This cannot be undone.`, async () => {
        try {
          await adminApi.del(`/products/${deleteId}`);
          showToast('Product deleted.');
          loadProducts();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });
});
