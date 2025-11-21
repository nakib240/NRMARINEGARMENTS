/* script.js — simplified + drag-drop + modal
 - basic products list (Shirt, Jeans, Gabardine)
 - category filters
 - admin unlock (localStorage) verified via /auth
 - file upload to /upload (admin only)
 - drag & drop previews per product
 - simple lightbox modal for image viewing
*/

/* script.js — simplified + drag-drop + modal
 - basic products list (Shirt, Jeans, Gabardine)
 - category filters
 - admin unlock (localStorage) verified via /auth
 - file upload to /upload (admin only)
 - drag & drop previews per product
 - simple lightbox modal for image viewing
*/

const UPLOAD_SERVER = 'http://localhost:3000';
const productGrid = document.getElementById('productGrid');
const categoryFilters = document.getElementById('categoryFilters');
const yearSpan = document.getElementById('year');

let ADMIN_KEY_CLIENT = localStorage.getItem('nrm_admin_key') || null;
let SERVER_AVAILABLE = false;

let products = [
  { name: 'Oxford Shirt', category: 'Shirt', fabric: 'Oxford Cloth', sizes: 'S-XXL', priceBdt: 620, moq: 500, images: [] },
  { name: 'Classic Jeans', category: 'Jeans', fabric: 'Denim', sizes: '28-40', priceBdt: 1150, moq: 400, images: [] },
  { name: 'Gabardine Pant', category: 'Gabardine', fabric: 'Technical', sizes: 'S-XXL', priceBdt: 1250, moq: 200, images: [] }
];

// categories will be fetched from server when available
let categories = Array.from(new Set(products.map(p => p.category)));

async function checkUploadServer() {
  try {
    const res = await fetch(UPLOAD_SERVER + '/status');
    SERVER_AVAILABLE = res.ok;
  } catch (e) { SERVER_AVAILABLE = false; }
  const badge = document.getElementById('uploadServerBadge'); if (badge) badge.textContent = SERVER_AVAILABLE ? 'Upload server: online' : 'Upload server: offline';
  return SERVER_AVAILABLE;
}

async function loadProductsFromServer() {
  try {
    const res = await fetch(UPLOAD_SERVER + '/products');
    if (res.ok) { const data = await res.json(); if (Array.isArray(data)) { products = data; return true; } }
  } catch (e) {}
  return false;
}

async function loadCategoriesFromServer() {
  try {
    const res = await fetch(UPLOAD_SERVER + '/categories');
    if (res.ok) { const data = await res.json(); if (Array.isArray(data)) { categories = data; return true; } }
  } catch (e) {}
  // fallback: derive from products
  categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  return false;
}

async function saveProductsNow() {
  if (!ADMIN_KEY_CLIENT) return false;
  try {
    // Ensure categories include all product categories (auto-add)
    const prodCats = Array.from(new Set(products.map(p => (p.category || '').trim()).filter(Boolean)));
    let added = false;
    prodCats.forEach(pc => {
      const exists = categories.some(c => c && c.toLowerCase() === pc.toLowerCase());
      if (!exists) { categories.push(pc); added = true; }
    });
    if (added) {
      // attempt to persist categories first
      const okCats = await saveCategoriesNow();
      if (!okCats) {
        // revert added categories
        prodCats.forEach(pc => { categories = categories.filter(c => c && c.toLowerCase() !== pc.toLowerCase()); });
        return false;
      }
    }
    // attempt to save products even if SERVER_AVAILABLE was false previously
    try {
      const res = await fetch(UPLOAD_SERVER + '/products', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-api-key': ADMIN_KEY_CLIENT }, body: JSON.stringify(products) });
      SERVER_AVAILABLE = res.ok || SERVER_AVAILABLE;
      return res.ok;
    } catch (e) {
      SERVER_AVAILABLE = false;
      return false;
    }
  } catch (e) { return false; }
}

async function saveCategoriesNow() {
  if (!ADMIN_KEY_CLIENT) return false;
  try {
    const res = await fetch(UPLOAD_SERVER + '/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-api-key': ADMIN_KEY_CLIENT }, body: JSON.stringify(categories) });
    SERVER_AVAILABLE = res.ok || SERVER_AVAILABLE;
    return res.ok;
  } catch (e) { SERVER_AVAILABLE = false; return false; }
}

function setAdminKey(key) { if (!key) return; ADMIN_KEY_CLIENT = key; localStorage.setItem('nrm_admin_key', key); buildFilters(); renderProducts(); }
function clearAdminKey() { ADMIN_KEY_CLIENT = null; localStorage.removeItem('nrm_admin_key'); buildFilters(); renderProducts(); }

function buildFilters() {
  if (!categoryFilters) return;
  categoryFilters.innerHTML = '';
  const cats = ['All', ...new Set(categories || products.map(p => p.category))];
  cats.forEach((cat, i) => {
    const btn = document.createElement('button'); btn.className = 'filter-btn' + (i===0 ? ' active' : ''); btn.textContent = cat;
    btn.addEventListener('click', () => { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderProducts(cat==='All' ? null : cat); });
    categoryFilters.appendChild(btn);
    // admin delete control for categories (not for 'All')
    if (ADMIN_KEY_CLIENT && cat !== 'All') {
      const del = document.createElement('button'); del.className = 'cat-delete'; del.textContent = '✕'; del.title = 'Delete category';
      del.style.marginLeft = '6px'; del.style.fontSize = '11px'; del.style.padding = '2px 6px';
      del.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (!confirm('Delete category "' + cat + '"? This will not delete products.')) return;
        try {
          const res = await fetch(UPLOAD_SERVER + '/categories/' + encodeURIComponent(cat), { method: 'DELETE', headers: { 'x-api-key': ADMIN_KEY_CLIENT } });
          if (!res.ok) { const j = await res.json().catch(()=>null); showToast('Error', (j && j.error) || 'Delete failed', 'error'); return; }
          // remove locally
          categories = (categories || []).filter(c => !(c && c.toLowerCase() === cat.toLowerCase()));
          buildFilters();
          showToast('Deleted', 'Category removed');
        } catch (e) { showToast('Error', 'Delete failed: ' + (e && e.message), 'error'); }
      });
      categoryFilters.appendChild(del);
    }
  });
  const existing = document.getElementById('adminWrap'); if (existing) existing.remove();
  const wrap = document.createElement('span'); wrap.id = 'adminWrap'; wrap.style.marginLeft = '12px';
  const status = document.createElement('span'); status.textContent = ADMIN_KEY_CLIENT ? 'Admin: unlocked' : 'Admin: locked'; wrap.appendChild(status);
  if (ADMIN_KEY_CLIENT) {
    const lock = document.createElement('button'); lock.textContent = 'Lock'; lock.onclick = clearAdminKey; wrap.appendChild(lock);
    // add category input for admins
    const addInput = document.createElement('input'); addInput.type = 'text'; addInput.placeholder = 'New category'; addInput.style.marginLeft = '8px'; addInput.id = 'newCategoryInput';
    const addBtn = document.createElement('button'); addBtn.textContent = 'Add Category'; addBtn.style.marginLeft = '6px';
    addBtn.onclick = async () => {
      const v = (document.getElementById('newCategoryInput').value || '').trim();
      if (!v) return alert('Enter category name');
      const exists = categories.some(c => c && c.toLowerCase() === v.toLowerCase());
      if (exists) return alert('Category exists');
      categories.push(v);
      const ok = await saveCategoriesNow();
      if (!ok) {
        // revert local change
        categories = categories.filter(c => c !== v);
        return alert('Failed to save categories');
      }
      buildFilters();
    };
    wrap.appendChild(addInput); wrap.appendChild(addBtn);
    // Add product creator UI (admin)
    const prodName = document.createElement('input'); prodName.type = 'text'; prodName.placeholder = 'Product name'; prodName.style.marginLeft = '8px'; prodName.id = 'newProductName';
    const prodCat = document.createElement('input'); prodCat.type = 'text'; prodCat.placeholder = 'Category'; prodCat.style.marginLeft = '6px'; prodCat.id = 'newProductCategory';
    const prodBtn = document.createElement('button'); prodBtn.textContent = 'Create Product'; prodBtn.style.marginLeft = '6px';
    prodBtn.onclick = async () => {
      const name = (document.getElementById('newProductName').value || '').trim();
      const cat = (document.getElementById('newProductCategory').value || '').trim();
      if (!name) return alert('Enter product name');
      if (!cat) return alert('Enter category');
      // Normalize category: reuse existing casing if exists
      const found = categories.find(c => c && c.toLowerCase() === cat.toLowerCase());
      const finalCat = found || cat;
      // create minimal product
      const newProduct = { name: name, category: finalCat, fabric: '', sizes: '', priceBdt: 0, moq: 0, images: [] };
      products.push(newProduct);
      // If category is new, add and persist
      if (!found) {
        categories.push(finalCat);
        const okc = await saveCategoriesNow();
        if (!okc) { alert('Failed to save categories'); categories = categories.filter(c => c !== finalCat); }
      }
      const ok = await saveProductsNow();
      if (!ok) return alert('Failed to save product');
      renderProducts();
      // clear fields
      document.getElementById('newProductName').value = '';
      document.getElementById('newProductCategory').value = '';
    };
    wrap.appendChild(prodName); wrap.appendChild(prodCat); wrap.appendChild(prodBtn);
  } else {
    const btn = document.createElement('button'); btn.textContent = 'Unlock'; btn.onclick = async () => { const key = prompt('Enter admin key'); if (!key) return; try { const ok = await verifyAdminKey(key); if (ok) setAdminKey(key); else alert('Key rejected'); } catch (e) { alert('Verify failed: ' + e.message); } }; wrap.appendChild(btn);
  }
  categoryFilters.parentElement && categoryFilters.parentElement.appendChild(wrap);
}

async function verifyAdminKey(key) {
  try {
    const res = await fetch(UPLOAD_SERVER + '/auth', { method: 'GET', headers: { 'x-api-key': key } });
    return res.ok;
  } catch (e) { throw new Error('Cannot reach server'); }
}

function clearProductGrid() { if (productGrid) productGrid.innerHTML = ''; }

function renderProducts(filterCategory=null) {
  if (!productGrid) return;
  clearProductGrid();
  const list = filterCategory ? products.filter(p=>p.category===filterCategory) : products;
  list.forEach(p => {
    const card = document.createElement('article'); card.className = 'product-card';
    const imgSrc = (p.images && p.images[0]) ? p.images[0] : ('https://picsum.photos/seed/'+encodeURIComponent(p.name)+'/800/520');
    card.innerHTML = `<div class="product-media"><img src="${imgSrc}" alt="${p.name}" class="product-main-img"/></div><div class="product-body"><h3 class="product-title">${p.name}</h3><div class="product-line">${p.fabric}</div></div>`;

    const mainImg = card.querySelector('.product-main-img');
    if (mainImg) {
      mainImg.addEventListener('click', () => { if (p.images && p.images.length) openImageModal(p.images, 0); });
      applyImageFallback(mainImg);
    }

    if (Array.isArray(p.images) && p.images.length > 0) {
      const thumbs = document.createElement('div'); thumbs.className = 'thumbs';
      p.images.forEach((src, idx) => {
        const wrap = document.createElement('div'); wrap.className = 'thumb-wrap';
        const t = document.createElement('img'); t.className = 'thumb'; t.src = src; t.loading = 'lazy';
        applyImageFallback(t, 'https://via.placeholder.com/120x90?text=No');
        t.addEventListener('click', () => openImageModal(p.images, idx));

        const del = document.createElement('button'); del.className = 'thumb-delete'; del.title = 'Delete image'; del.innerHTML = '✕';
        del.style.display = ADMIN_KEY_CLIENT ? 'inline-flex' : 'none';
        del.addEventListener('click', async (ev) => { ev.stopPropagation(); await deleteImage(p, src); });

        wrap.appendChild(t);
        wrap.appendChild(del);
        thumbs.appendChild(wrap);
      });
      card.querySelector('.product-body').appendChild(thumbs);
    }

    const body = card.querySelector('.product-body');
    // Admin edit button
    if (ADMIN_KEY_CLIENT) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.style.marginLeft = '8px';
      editBtn.addEventListener('click', () => {
        const idx = products.indexOf(p);
        if (idx >= 0) openProductEditor(idx);
      });
      body.appendChild(editBtn);

      const delProdBtn = document.createElement('button');
      delProdBtn.textContent = 'Delete';
      delProdBtn.style.marginLeft = '6px';
      delProdBtn.style.background = '#c0392b';
      delProdBtn.style.color = '#fff';
      delProdBtn.addEventListener('click', async () => {
        if (!confirm('Delete product "' + p.name + '"? This cannot be undone.')) return;
        const idx = products.indexOf(p);
        if (idx < 0) return;
        const backupProducts = products.slice();
        products.splice(idx, 1);
        renderProducts();
        const ok = await saveProductsNow();
        if (!ok) {
          products = backupProducts;
          renderProducts();
          showToast('Error', 'Failed to delete product (save failed)', 'error');
        } else {
          showToast('Deleted', 'Product removed', 'success');
        }
      });
      body.appendChild(delProdBtn);
    }
    const uploadBtn = document.createElement('button'); uploadBtn.textContent = 'Upload image'; uploadBtn.style.marginTop = '8px';
    uploadBtn.onclick = () => {
      if (!ADMIN_KEY_CLIENT) return alert('Admin required');
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = async () => {
        if (!inp.files || !inp.files.length) return; const f = inp.files[0];
        if (!SERVER_AVAILABLE) return alert('Upload server offline');
        try {
          const urls = await uploadFilesToServer([f]);
          if (urls && urls.length) { p.images = [urls[0]].concat(p.images||[]); renderProducts(filterCategory); await saveProductsNow(); }
        } catch (e) { alert('Upload failed'); }
      }; inp.click();
    };
    body.appendChild(uploadBtn);

    // URL input to add remote image
    const urlWrap = document.createElement('div'); urlWrap.style.marginTop = '8px'; urlWrap.style.display = 'flex'; urlWrap.style.gap = '8px';
    const urlInput = document.createElement('input'); urlInput.type = 'url'; urlInput.placeholder = 'Paste image URL'; urlInput.style.flex = '1';
    const addUrlBtn = document.createElement('button'); addUrlBtn.textContent = 'Add URL';
    addUrlBtn.onclick = async () => {
      const url = (urlInput.value || '').trim(); if (!url) return alert('Enter image URL');
      const ok = await validateImageUrl(url);
      if (!ok) return alert('URL not reachable or not an image');
      p.images = [url].concat(p.images || []);
      renderProducts(filterCategory);
      if (ADMIN_KEY_CLIENT && SERVER_AVAILABLE) await saveProductsNow();
    };
    urlWrap.appendChild(urlInput); urlWrap.appendChild(addUrlBtn);
    body.appendChild(urlWrap);

    // main-image delete overlay (admin)
    const media = card.querySelector('.product-media');
    if (media) {
      const mainDel = document.createElement('button'); mainDel.className = 'main-delete'; mainDel.title = 'Delete main image'; mainDel.textContent = '✕';
      mainDel.style.display = (ADMIN_KEY_CLIENT && p.images && p.images.length) ? 'inline-flex' : 'none';
      mainDel.addEventListener('click', async (ev) => { ev.stopPropagation(); if (!(p.images && p.images.length)) return; await deleteImage(p, p.images[0]); });
      media.appendChild(mainDel);
    }

    enableDropZoneForProduct(card, p);

    productGrid.appendChild(card);
  });
}

function enableDropZoneForProduct(cardEl, product) {
  const dz = document.createElement('div'); dz.className = 'drop-zone'; dz.textContent = 'Drop images here (preview)';
  dz.style.cssText = 'border:1px dashed rgba(255,255,255,0.06);padding:8px;margin-top:8px;border-radius:6px;color:#ddd;font-size:13px;text-align:center;cursor:pointer;';
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.background = 'rgba(255,255,255,0.01)'; });
  dz.addEventListener('dragleave', () => { dz.style.background = 'transparent'; });
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.style.background = 'transparent';
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type && f.type.startsWith('image/'));
    if (!files.length) return;
    const previewUrls = files.map(f => URL.createObjectURL(f));
    product.images = previewUrls.concat(product.images || []);
    renderProducts();
  });
  dz.addEventListener('click', () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.addEventListener('change', () => {
      const files = Array.from(inp.files || []).filter(f => f.type && f.type.startsWith('image/'));
      if (!files.length) return;
      const previewUrls = files.map(f => URL.createObjectURL(f));
      product.images = previewUrls.concat(product.images || []);
      renderProducts();
    }); inp.click();
  });
  const body = cardEl.querySelector('.product-body'); if (body) body.appendChild(dz);
}

let _modalState = { images: [], index: 0 };
function createImageModal() {
  if (document.getElementById('imageModal')) return;
  const modal = document.createElement('div'); modal.id = 'imageModal'; modal.className = 'img-modal hidden';
  modal.innerHTML = `
    <button class="modal-close" aria-label="Close">×</button>
    <button class="modal-prev" aria-label="Previous">‹</button>
    <img class="modal-img" src="" alt="" />
    <button class="modal-next" aria-label="Next">›</button>
  `;
  document.body.appendChild(modal);
  const img = modal.querySelector('.modal-img');
  const closeBtn = modal.querySelector('.modal-close');
  const prev = modal.querySelector('.modal-prev');
  const next = modal.querySelector('.modal-next');
  closeBtn.addEventListener('click', closeImageModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeImageModal(); });
  prev.addEventListener('click', (e) => { e.stopPropagation(); showModalIndex(_modalState.index - 1); });
  next.addEventListener('click', (e) => { e.stopPropagation(); showModalIndex(_modalState.index + 1); });
  document.addEventListener('keydown', (ev) => {
    if (modal.classList.contains('hidden')) return;
    if (ev.key === 'Escape') closeImageModal();
    if (ev.key === 'ArrowLeft') showModalIndex(_modalState.index - 1);
    if (ev.key === 'ArrowRight') showModalIndex(_modalState.index + 1);
  });
}
function openImageModal(images, index) { createImageModal(); _modalState.images = images || []; showModalIndex(index || 0); }
function showModalIndex(i) { const modal = document.getElementById('imageModal'); if (!modal) return; if (!_modalState.images || !_modalState.images.length) return; const len = _modalState.images.length; let idx = ((i % len) + len) % len; _modalState.index = idx; const img = modal.querySelector('.modal-img'); img.src = _modalState.images[idx] || ''; modal.classList.remove('hidden'); }
function closeImageModal() { const modal = document.getElementById('imageModal'); if (!modal) return; modal.classList.add('hidden'); }

async function uploadFilesToServer(files) {
  if (!files || !files.length) return [];
  const fd = new FormData(); files.forEach(f => fd.append('files', f));
  const headers = {}; if (ADMIN_KEY_CLIENT) headers['x-api-key'] = ADMIN_KEY_CLIENT;
  const res = await fetch(UPLOAD_SERVER + '/upload', { method: 'POST', body: fd, headers });
  if (!res.ok) throw new Error('upload failed');
  const j = await res.json();
  return (j.files || []).map(f => (typeof f === 'string' ? f : (f.url || f.filename || ''))).filter(Boolean);
}

// Delete an image from product locally and attempt server-side delete when applicable
async function deleteImage(product, src) {
  // remove locally first but keep a backup in case persistence fails
  const idx = product.images ? product.images.indexOf(src) : -1;
  if (idx < 0) return;
  const backup = product.images.slice();
  product.images.splice(idx, 1);
  renderProducts();

  let serverDeleted = false;
  try {
    const serverPrefix = UPLOAD_SERVER.replace(/\/$/, '') + '/uploads/';
    if (typeof src === 'string' && src.startsWith(serverPrefix) && ADMIN_KEY_CLIENT) {
      const filename = decodeURIComponent(src.slice(serverPrefix.length));
      const res = await fetch(UPLOAD_SERVER + '/upload/' + encodeURIComponent(filename), { method: 'DELETE', headers: { 'x-api-key': ADMIN_KEY_CLIENT } });
      serverDeleted = res.ok;
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        showToast('Error', (j && j.error) || 'Failed to delete file on server', 'error');
      }
    }
  } catch (e) {
    console.warn('Server delete failed', e && e.message);
    showToast('Warning', 'Server delete failed: ' + (e && e.message), 'error');
  }

  // attempt to persist product changes; if it fails, revert and inform the admin
  if (ADMIN_KEY_CLIENT) {
    const saved = await saveProductsNow();
    if (!saved) {
      // revert local change
      product.images = backup;
      renderProducts();
      showToast('Error', 'Failed to save product after delete — change reverted', 'error');
      return;
    }
  }

  showToast('Deleted', 'Image removed' + (serverDeleted ? '' : ' (server may still have file)'), 'success');
}

// Product editor modal
function createProductEditorModal() {
  if (document.getElementById('productEditor')) return;
  const modal = document.createElement('div'); modal.id = 'productEditor'; modal.className = 'img-modal hidden';
  modal.innerHTML = '\n    <div class="editor-card">\n      <h3>Edit Product</h3>\n      <label>Name</label><input id="pe_name" />\n      <label>Category</label><input id="pe_category" />\n      <label>Fabric</label><input id="pe_fabric" />\n      <label>Sizes</label><input id="pe_sizes" />\n      <label>Price (BDT)</label><input id="pe_price" type="number" />\n      <label>MOQ</label><input id="pe_moq" type="number" />\n      <div id="pe_images_wrap"></div>\n      <div style="margin-top:8px">\n        <input id="pe_upload_input" type="file" accept="image/*" multiple style="display:none" />\n        <button id="pe_add_image">Upload Images</button>\n        <button id="pe_save">Save</button>\n        <button id="pe_cancel">Cancel</button>\n      </div>\n    </div>';
  document.body.appendChild(modal);
  const saveBtn = modal.querySelector('#pe_save');
  const cancelBtn = modal.querySelector('#pe_cancel');
  const addImageBtn = modal.querySelector('#pe_add_image');
  const uploadInput = modal.querySelector('#pe_upload_input');
  saveBtn.addEventListener('click', async () => {
    const idx = modal.dataset.idx && Number(modal.dataset.idx);
    if (isNaN(idx)) return;
    const prod = products[idx];
    prod.name = document.getElementById('pe_name').value.trim();
    prod.category = document.getElementById('pe_category').value.trim();
    prod.fabric = document.getElementById('pe_fabric').value.trim();
    prod.sizes = document.getElementById('pe_sizes').value.trim();
    prod.priceBdt = Number(document.getElementById('pe_price').value) || 0;
    prod.moq = Number(document.getElementById('pe_moq').value) || 0;
    // images already updated via remove/upload handlers
    const ok = await saveProductsNow();
    if (ok) { showToast('Saved','Product saved'); renderProducts(); closeProductEditor(); }
    else showToast('Error','Failed to save product', 'error');
  });
  cancelBtn.addEventListener('click', () => closeProductEditor());
  addImageBtn.addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', async () => {
    const files = Array.from(uploadInput.files || []).filter(f => f.type && f.type.startsWith('image/'));
    if (!files.length) return;
    const modalIdx = Number(modal.dataset.idx);
    try {
      const urls = await uploadFilesToServer(files);
      if (urls && urls.length) {
        products[modalIdx].images = (products[modalIdx].images || []).concat(urls);
        renderProductEditorImages(modalIdx);
      }
    } catch (e) {
      showToast('Error','Upload failed', 'error');
    }
    uploadInput.value = '';
  });
}

function openProductEditor(index) {
  createProductEditorModal();
  const modal = document.getElementById('productEditor');
  modal.dataset.idx = String(index);
  const p = products[index];
  document.getElementById('pe_name').value = p.name || '';
  document.getElementById('pe_category').value = p.category || '';
  document.getElementById('pe_fabric').value = p.fabric || '';
  document.getElementById('pe_sizes').value = p.sizes || '';
  document.getElementById('pe_price').value = p.priceBdt || 0;
  document.getElementById('pe_moq').value = p.moq || 0;
  renderProductEditorImages(index);
  modal.classList.remove('hidden');
}

function renderProductEditorImages(index) {
  const wrap = document.getElementById('pe_images_wrap'); if (!wrap) return;
  wrap.innerHTML = '';
  const imgs = products[index].images || [];
  imgs.forEach((src, i) => {
    const d = document.createElement('div'); d.style.display='inline-block'; d.style.margin='4px';
    const im = document.createElement('img'); im.src = src; im.style.width='72px'; im.style.height='72px'; im.style.objectFit='cover';
    applyImageFallback(im, 'https://via.placeholder.com/72x72?text=No');
    const del = document.createElement('button'); del.textContent='✕'; del.style.display='block';
    del.addEventListener('click', async () => { await deleteImage(products[index], src); renderProductEditorImages(index); });
    d.appendChild(im); d.appendChild(del); wrap.appendChild(d);
  });
}

function closeProductEditor() { const modal = document.getElementById('productEditor'); if (!modal) return; modal.classList.add('hidden'); }

// Basic URL validator by attempting to load the image
function validateImageUrl(url, timeout = 7000) {
  return new Promise(resolve => {
    try {
      const img = new Image();
      let done = false;
      const onOk = () => { if (done) return; done = true; clear(); resolve(true); };
      const onErr = () => { if (done) return; done = true; clear(); resolve(false); };
      const clear = () => { img.onload = img.onerror = null; };
      img.onload = onOk; img.onerror = onErr; img.src = url;
      setTimeout(() => { if (done) return; done = true; clear(); resolve(false); }, timeout);
    } catch (e) { resolve(false); }
  });
}

function addImageTo(containerId, src, alt = '', opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  if (opts.loading) img.loading = opts.loading;
  if (opts.className) img.className = opts.className;
  container.appendChild(img);
  // apply fallback if the image fails to load
  applyImageFallback(img, opts.placeholder || 'https://via.placeholder.com/800x520?text=No+Image');
  return img;
}

function addPictureTo(containerId, sources = [], fallbackSrc, alt = '', opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const picture = document.createElement('picture');
  sources.forEach(s => {
    const source = document.createElement('source');
    if (s.srcset) source.srcset = s.srcset;
    if (s.type) source.type = s.type;
    if (s.media) source.media = s.media;
    picture.appendChild(source);
  });
  const img = document.createElement('img');
  img.src = fallbackSrc;
  img.alt = alt;
  if (opts.loading) img.loading = opts.loading;
  if (opts.className) img.className = opts.className;
  picture.appendChild(img);
  container.appendChild(picture);
  applyImageFallback(img, opts.placeholder || 'https://via.placeholder.com/800x520?text=No+Image');
  return picture;
}

// graceful image fallback handler: replace broken images with a placeholder
function applyImageFallback(imgEl, placeholder = 'https://via.placeholder.com/800x520?text=No+Image') {
  if (!imgEl) return;
  imgEl.addEventListener('error', () => {
    try { imgEl.src = placeholder; } catch (e) {}
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  await checkUploadServer();
  if (SERVER_AVAILABLE) {
    await loadProductsFromServer();
    await loadCategoriesFromServer();
  }
  buildFilters(); renderProducts();
  addImageTo('hero-visual', 'images/sample-local.jpg', 'Sample local image', { loading: 'lazy', className: 'dynamic-img' });
  addPictureTo('hero-visual', [ { srcset: 'images/hero.webp', type: 'image/webp' } ], 'images/hero.jpg', 'Hero picture', { loading: 'lazy' });
});

// --- Toast utilities ---
function createToastElement() {
  if (document.getElementById('nrmToast')) return document.getElementById('nrmToast');
  const t = document.createElement('div'); t.id = 'nrmToast'; t.className = 'nrm-toast';
  t.innerHTML = '<div class="title"></div><div class="msg"></div>';
  document.body.appendChild(t);
  return t;
}

let _toastTimer = null;
function showToast(title, message, type = 'success', timeout = 3500) {
  const el = createToastElement();
  el.querySelector('.title').textContent = title || '';
  el.querySelector('.msg').textContent = message || '';
  el.className = 'nrm-toast show ' + (type === 'error' ? 'error' : 'success');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'nrm-toast'; _toastTimer = null; }, timeout);
}
