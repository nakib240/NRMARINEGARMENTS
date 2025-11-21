// script_final.js — cleaned, single implementation for catalog
const products = [
  { name: "Oxford Shirt", category: "Shirt", fabric: "Oxford Cloth, 140 GSM", sizes: "S-XXL", priceBdt: 620, moq: 500, images: [ 'images/shirt-1.jpg', 'images/shirt-2.jpg', 'https://images.unsplash.com/photo-1520975912074-323d7c9d5d5b?auto=format&fit=crop&w=900&q=80' ] },
  { name: "Classic Jeans", category: "Jeans", fabric: "Denim, 12 oz", sizes: "28-40", priceBdt: 1150, moq: 400, images: [ 'images/jeans-1.jpg', 'images/jeans-2.jpg', 'https://images.unsplash.com/photo-1556909210-95f8a7d9b6f0?auto=format&fit=crop&w=900&q=80' ] },
  { name: "Gabardine Pant", category: "Gabardine", fabric: "Technical woven, water-resistant", sizes: "S-XXL", priceBdt: 1250, moq: 200, images: [
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1581579181522-6a9f6b1b3c1a?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80'
  ] }
];

const productGrid = document.getElementById('productGrid');
const categoryFilters = document.getElementById('categoryFilters');
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

function buildFilters() {
  if (!categoryFilters) return;
  categoryFilters.innerHTML = '';
  const cats = [ 'All', ...new Set(products.map(p => p.category)) ];
  cats.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(cat === 'All' ? null : cat);
    });
    categoryFilters.appendChild(btn);
  });
}

function renderProducts(filterCategory = null) {
  if (!productGrid) return;
  productGrid.innerHTML = '';
  const list = filterCategory ? products.filter(p => p.category === filterCategory) : products;
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';
    const main = Array.isArray(p.images) && p.images.length ? p.images[0] : (p.image || '');
    card.innerHTML = `
      <div class="product-media">
        <img src="${main}" alt="${p.name}" loading="lazy" class="product-main-img" />
        <div class="product-tag">${p.category}</div>
      </div>
      <div class="product-body">
        <h3 class="product-title">${p.name}</h3>
        <div class="product-line"><strong>Fabric:</strong> ${p.fabric}</div>
        <div class="product-line"><strong>Sizes:</strong> ${p.sizes}</div>
        <div class="product-line"><strong>MOQ:</strong> ${p.moq ? p.moq.toLocaleString() : ''} pcs</div>
        <div class="product-price-row"><span class="price-bdt">FOB: ${typeof p.priceBdt === 'number' ? p.priceBdt.toLocaleString() : p.priceBdt} BDT / pc</span></div>
      </div>
    `;
    productGrid.appendChild(card);
    if (Array.isArray(p.images) && p.images.length > 1) {
      const thumbs = document.createElement('div'); thumbs.className = 'thumbs';
      p.images.forEach(src => {
        const t = document.createElement('img'); t.src = src; t.className = 'thumb'; t.loading = 'lazy';
        t.addEventListener('click', () => { const m = card.querySelector('.product-main-img'); if (m) m.src = src; });
        thumbs.appendChild(t);
      });
      card.querySelector('.product-media').appendChild(thumbs);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildFilters();
  renderProducts();
});
